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
        error_log('LANE-DEBUG process() v3 campayEnabled=' . var_export(fedpawa_env('CAMPAY_ENABLED', '1') === '1', true));
        if (!$this->requireClient()) return; // Lane #4 : souscription réservée aux connectés
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                $this->json(['error' => 'Requête invalide'], 400);
                return;
            }

            // Lane #4 : le client connecté prime — on rattache la souscription à sa session
            if (!empty($_SESSION['client_id'])) {
                $db = \App\Service\Database::getConnection();
                $me = $db->prepare("SELECT email, nom FROM clients WHERE id = ?");
                $me->execute([(int)$_SESSION['client_id']]);
                if ($row = $me->fetch()) {
                    $input['email'] = $row['email'];
                    $input['nom'] = $input['nom'] ?? $row['nom'];
                }
            }

            // 1. Initialiser la souscription
            $sub = $this->subService->store($input);

            // 2. Initier le paiement Campay (ou mode démo si CAMPAY_ENABLED=0)
            $campayEnabled = fedpawa_env('CAMPAY_ENABLED', '1') === '1';
            $transactionId = null;
            if ($campayEnabled) {
                try {
                    $payment = $this->campay->collect((float)$input['prix'], $input['telephone'] ?? '', 'SUB_' . $sub['subscription_id']);
                    $transactionId = $payment['reference'] ?? $payment['transaction_id'] ?? null;
                } catch (\Exception $e) {
                    error_log('Campay collect failed: ' . $e->getMessage());
                    $this->json(['status' => 'payment_init_failed', 'error' => 'Impossible d\'initier le paiement. Réessayez.'], 502);
                    return;
                }
            } else {
                // Mode démo : référence simulée, le « Vérifier Mon Paiement » la confirmera
                $transactionId = 'DEMO-SUB-' . $sub['subscription_id'];
            }

            // 3. Enregistrer le paiement en attente (rapprochement webhook ou vérification manuelle)
            $db = Database::getConnection();
            if ($transactionId) {
                $db->prepare("INSERT INTO paiements (client_id, montant, mode_paiement, transaction_id, date, statut) VALUES (?, ?, 'campay', ?, ?, 'en_attente')")
                   ->execute([$sub['client_id'], (float)$input['prix'], $transactionId, date('Y-m-d H:i:s')]);
            } else {
                // Campay n'a pas renvoyé de référence (mode démo) : trace quand même la tentative
                $db->prepare("INSERT INTO paiements (client_id, montant, mode_paiement, transaction_id, date, statut) VALUES (?, ?, 'campay', '', ?, 'en_attente')")
                   ->execute([$sub['client_id'], (float)$input['prix'], date('Y-m-d H:i:s')]);
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
        if (!$this->requireClient()) return;
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


            // Lane contrat : signature possible uniquement si le paiement est reçu
            $stmt = $db->prepare("SELECT id, statut FROM paiements WHERE client_id = ? ORDER BY id DESC LIMIT 1");
            $stmt->execute([$clientId]);
            $pay = $stmt->fetch();
            $campayEnabled = fedpawa_env('CAMPAY_ENABLED', '1') === '1';
            if ($campayEnabled && (!$pay || $pay['statut'] !== 'recu')) {
                $this->json(['error' => 'Paiement non confirmé. Utilisez « Vérifier Mon Paiement » avant de signer.'], 402);
                return;
            }
            // L'OTP est le facteur d'authentification de la signature
            if (!OtpService::verify($clientId, (string)$input['otp'])) {
                $this->json(['error' => 'Signature invalide'], 400);
                return;
            }

            // Lane#1 : le contrat PDF + signature ne concernent QUE la domiciliation.
            // Les packs domiciliation sont préfixés 'national-' ou 'international-'.
            $isDomiciliation = (
                strpos($sub['pack'], 'national-') === 0 ||
                strpos($sub['pack'], 'international-') === 0
            );

            if ($isDomiciliation) {
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
                $stmtC = $db->prepare("INSERT INTO contrats (client_id, type, fichier, date_signature) VALUES (?, 'domiciliation', ?, ?)");
                $stmtC->execute([$clientId, 'documents/contrat_' . $sub['id'] . '.pdf', date('Y-m-d H:i:s')]);
                $contratId = (int)$db->lastInsertId();

                $this->notifier->sendWelcomeEmail($sub['email'], $sub['nom']);

                OtpService::clear($clientId);
                AuditLogger::log('SUBSCRIPTION_FINALIZED', $clientId, 'client', 'Sub ID: ' . $sub['id'] . ' (contrat domiciliation)');
                $this->json([
                    'message' => 'Souscription finalisée',
                    'contrat_url' => '/api/document?type=contrat&id=' . $contratId
                ]);
            }

            // Autres services : finalisation SANS contrat (dossier en traitement)
            $db->prepare("UPDATE abonnements SET statut = 'actif' WHERE id = ?")->execute([$sub['id']]);
            $this->notifier->sendWelcomeEmail($sub['email'], $sub['nom']);
            OtpService::clear($clientId);
            AuditLogger::log('SUBSCRIPTION_FINALIZED', $clientId, 'client', 'Sub ID: ' . $sub['id'] . ' (sans contrat — service non domiciliation)');
            $this->json([
                'message' => 'Paiement confirmé — votre dossier est en traitement. Un juriste FEDPAWA vous recontacte sous 24 heures ouvrées.'
            ]);
        } catch (\Exception $e) {
            error_log('Finalize error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne lors de la finalisation'], 500);
        }
    }
    public function verifyPayment() {
        if (!$this->requireClient()) return;
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $subId = (int)($input['sub_id'] ?? 0);
            $clientId = (int)$_SESSION['client_id'];

            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT id, prix, statut FROM abonnements WHERE id = ? AND client_id = ?");
            $stmt->execute([$subId, $clientId]);
            $sub = $stmt->fetch();
            if (!$sub) {
                $this->json(['error' => 'Souscription introuvable'], 404);
                return;
            }

            // Dernier paiement de ce client (rattachement par client, le plus recent)
            $stmt = $db->prepare("SELECT id, transaction_id, statut, montant FROM paiements WHERE client_id = ? ORDER BY id DESC LIMIT 1");
            $stmt->execute([$clientId]);
            $pay = $stmt->fetch();

            $campayEnabled = fedpawa_env('CAMPAY_ENABLED', '1') === '1';
            $statut = 'en_attente';
            $transactionId = $pay['transaction_id'] ?? '';

            if ($campayEnabled && $transactionId) {
                // Production : statut reel cote Campay
                $status = $this->campay->checkStatus($transactionId);
                $statut = (($status['status'] ?? '') === 'SUCCESSFUL') ? 'recu' : 'en_attente';
                if ($pay) {
                    $db->prepare("UPDATE paiements SET statut = ? WHERE id = ?")->execute([$statut, (int)$pay['id']]);
                }
            } elseif (!$campayEnabled) {
                // Mode demo : le paiement est considere comme recu des la demande de verification
                if ($pay) {
                    $statut = 'recu';
                    $db->prepare("UPDATE paiements SET statut = ? WHERE id = ?")->execute([$statut, (int)$pay['id']]);
                }
            }

            // W-10 : paiement recu -> facture + activation de l'abonnement en attente
            if ($statut === 'recu') {
                try {
                    \App\Service\FactureService::createForPayment((int)$clientId, (float)$sub['prix'], (string)($transactionId ?? ''));
                } catch (\Exception $fe) {
                    error_log('FactureService error: ' . $fe->getMessage());
                }
            }

            $this->json([
                'status' => ($statut === 'recu') ? 'paid' : 'pending',
                'sub_id' => $subId,
                'client_id' => $clientId,
                'prix' => (float)$sub['prix'],
                'transaction_id' => $transactionId
            ]);
        } catch (\Exception $e) {
            error_log('VerifyPayment error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la vérification du paiement'], 500);
        }
    }
}
