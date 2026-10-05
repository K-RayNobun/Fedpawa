<?php
namespace App\Controller;

use App\Service\Database;

class WebhookController extends Controller {
    public function handleCampay() {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        // TODO: Vérifier la signature Campay ici pour la sécurité

        if (isset($data['transaction_id']) && $data['status'] === 'SUCCESSFUL') {
            $db = Database::getConnection();
            $stmt = $db->prepare("UPDATE paiements SET statut = 'réussi' WHERE transaction_id = ?");
            $stmt->execute([$data['transaction_id']]);
            $this->json(['message' => 'Paiement confirmé']);
        } else {
            $this->json(['error' => 'Paiement non confirmé'], 400);
        }
    }
}
