<?php
namespace App\Controller;

use App\Service\SubscriptionService;
use App\Service\PdfService;
use App\Service\OtpService;
use App\Service\CampayService;
use App\Service\NotificationService;
use App\Service\AuditLogger;
use App\Service\Database;

class SubscriptionController extends Controller {
    private SubscriptionService $subService;
    private PdfService $pdfService;
    private CampayService $campay;
    private NotificationService $notifier;

    public function __construct() {
        $this->subService = new SubscriptionService();
        $this->pdfService = new PdfService();
        $this->campay = new CampayService();
        $this->notifier = new NotificationService();
    }

    public function process() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                $this->json(['error' => 'Requête invalide'], 400);
                return;
            }

            // 1. Initialiser la souscription
            $sub = $this->subService->store($input);

            // 2. Initier le paiement Campay
            try {
                $payment = $this->campay->collect((float)$input['prix'], $input['telephone'] ?? '', 'SUB_' . $sub['subscription_id']);
            } catch (\Exception $e) {
                error_log('Campay collect failed: ' . $e->getMessage());
                $this->json(['status' => 'payment_init_failed', 'error' => 'Impossible d\'initier le paiement. Réessayez.'], 502);
                return;
            }

            $transactionId = $payment['reference'] ?? $payment['transaction_id'] ?? null;

            // 3. Enregistrer le paiement en attente (rapprochement webhook)
            if ($transactionId) {
                $db = Database::getConnection();
                $db->prepare("INSERT INTO paiements (client_id, montant, mode_paiement, transaction_id, date, statut) VALUES (?, ?, 'campay', ?, ?, 'en_attente')")
                   ->execute([$sub['client_id'], (float)$input['prix'], $transactionId, date('Y-m-d H:i:s')]);
            }

            // 4. Générer l'OTP pour la signature.
            // NOTE (démo) : aucun SMS/e-mail n'est configuré, l'OTP est donc
            // renvoyé dans la réponse pour permettre de tester le flux de signature.
            $otp = OtpService::generate($sub['client_id']);

            AuditLogger::log('SUBSCRIPTION_INIT', $sub['client_id'], 'client', 'Sub ID: ' . $sub['subscription_id']);

            $this->json([
                'status' => 'payment_pending',
                'transaction_id' => $transactionId,
                'subscription_id' => $sub['subscription_id'],
                'client_id' => $sub['client_id'],
                'signature_otp' => $otp
            ]);
        } catch (\Exception $e) {
            $this->json(['error' => $e->getMessage()], 400);
        }
    }

    public function finalize() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty($input['otp']) || empty($input['sub_id']) || empty($input['client_id'])) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            $clientId = (int)$input['client_id'];

            // Vérifier que l'abonnement appartient bien à ce client
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT a.*, c.nom, c.email FROM abonnements a JOIN clients c ON c.id = a.client_id WHERE a.id = ? AND a.client_id = ?");
            $stmt->execute([(int)$input['sub_id'], $clientId]);
            $sub = $stmt->fetch();
            if (!$sub) {
                $this->json(['error' => 'Souscription introuvable'], 404);
                return;
            }

            // L'OTP est le facteur d'authentification de la signature
            if (!OtpService::verify($clientId, (string)$input['otp'])) {
                $this->json(['error' => 'Signature invalide'], 400);
                return;
            }

            // Finaliser : générer le PDF, marquer actif, notifier
            $pdf = $this->pdfService->generateContract([
                'client_name' => $sub['nom'],
                'price' => $sub['prix']
            ]);
            $dir = __DIR__ . '/../../storage/documents';
            if (!is_dir($dir)) mkdir($dir, 0755, true);
            $path = $dir . '/contrat_' . $sub['id'] . '.pdf';
            file_put_contents($path, $pdf);

            $db->prepare("UPDATE abonnements SET statut = 'actif' WHERE id = ?")->execute([$sub['id']]);
            $db->prepare("INSERT INTO contrats (client_id, type, fichier, date_signature) VALUES (?, 'domiciliation', ?, ?)")
               ->execute([$clientId, 'documents/contrat_' . $sub['id'] . '.pdf', date('Y-m-d H:i:s')]);

            $this->notifier->sendWelcomeEmail($sub['email'], $sub['nom']);

            OtpService::clear($clientId);
            AuditLogger::log('SUBSCRIPTION_FINALIZED', $clientId, 'client', 'Sub ID: ' . $sub['id']);

            $this->json(['message' => 'Souscription finalisée']);
        } catch (\Exception $e) {
            error_log('Finalize error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne lors de la finalisation'], 500);
        }
    }
}
