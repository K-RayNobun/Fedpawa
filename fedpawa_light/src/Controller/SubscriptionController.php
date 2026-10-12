<?php
namespace App\Controller;

use App\Service\SubscriptionService;
use App\Service\PdfService;
use App\Service\OtpService;
use App\Service\CampayService;
use App\Service\NotificationService;
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
        header('Content-Type: application/json');

        // 0. Vérification CSRF : refuser toute requête sans token valide
        if (!$this->validateCsrf()) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Requête refusée (jeton CSRF invalide).']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Requête invalide.']);
            return;
        }

        try {
            // 1. Enregistrer la souscription (client + abonnement en attente)
            $sub = $this->subService->store($input);
            $subId = $sub['subscription_id'] ?? $sub['client_id'];

            // 2. Paiement : désactivé tant que les clés Campay de production ne sont pas configurées
            if (getenv('CAMPAY_ENABLED') !== '1') {
                $this->json(['status' => 'payment_disabled', 'message' => 'Paiement non activé sur cet environnement.', 'subscription_ref' => 'SUB_' . $subId]);
                return;
            }

            $payment = $this->campay->collect((float)$input['prix'], (string)$input['telephone'], 'SUB_' . $subId);
            $this->json(['status' => 'payment_pending', 'transaction_id' => $payment['transaction_id'] ?? null]);
        } catch (\Throwable $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Données de souscription invalides.']);
        }
    }

    public function finalize() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (OtpService::verify($input['client_id'], $input['otp'])) {
            // Finaliser : Générer PDF, marquer actif, notifier
            $pdf = $this->pdfService->generateContract(['client_name' => $input['name']]);
            $path = __DIR__ . '/../../storage/documents/contrat_' . $input['sub_id'] . '.pdf';
            file_put_contents($path, $pdf);
            
            $this->notifier->sendWelcomeEmail($input['email'], $input['name'], $path);
            $this->json(['message' => 'Souscription finalisée']);
        } else {
            $this->json(['error' => 'Signature invalide'], 400);
        }
    }
}
