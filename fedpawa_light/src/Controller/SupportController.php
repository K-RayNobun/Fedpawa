<?php
namespace App\Controller;

use App\Service\Database;

class SupportController extends Controller {
    public function store() {
        if (!isset($_SESSION['client_id'])) {
            $this->json(['error' => 'Non autorisé'], 401);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['sujet']) || empty($input['message'])) {
            $this->json(['error' => 'Champs requis'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO tickets_support (client_id, sujet, message, statut) VALUES (?, ?, ?, 'open')");
        $stmt->execute([$_SESSION['client_id'], $input['sujet'], $input['message']]);

        $this->json(['message' => 'Ticket de support envoyé']);
    }
}
