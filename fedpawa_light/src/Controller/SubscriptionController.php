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
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 1. Initialiser Souscription
        $sub = $this->subService->store($input);
        
        // 2. Initier Paiement Campay
        $payment = $this->campay->collect($input['prix'], $input['telephone'], 'SUB_' . $sub['subscription_id']);
        
        // 3. Générer OTP pour signature
        $otp = OtpService::generate($sub['client_id']);
        
        $this->json(['status' => 'payment_pending', 'transaction_id' => $payment['transaction_id']]);
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
