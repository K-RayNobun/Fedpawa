<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;

class WebhookController extends Controller {
    public function handleCampay() {
        try {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);

            if (!is_array($data)) {
                $this->json(['error' => 'Payload invalide'], 400);
                return;
            }

            // TODO: Vérifier la signature Campay ici pour la sécurité

            if (isset($data['transaction_id']) && ($data['status'] === 'SUCCESSFUL' || $data['status'] === 'FAILED')) {
                $db = Database::getConnection();
                $statut = $data['status'] === 'SUCCESSFUL' ? 'réussi' : 'échoué';
                $stmt = $db->prepare("UPDATE paiements SET statut = ? WHERE transaction_id = ?");
                $stmt->execute([$statut, $data['transaction_id']]);

                AuditLogger::log('CAMPAY_WEBHOOK', null, 'system', 'Tx: ' . $data['transaction_id'] . ' -> ' . $statut);
                $this->json(['message' => 'Paiement mis à jour']);
            } else {
                $this->json(['error' => 'Paiement non confirmé'], 400);
            }
        } catch (\Exception $e) {
            error_log('Campay webhook error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
