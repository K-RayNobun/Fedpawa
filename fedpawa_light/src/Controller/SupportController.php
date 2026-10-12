<?php
namespace App\Controller;

use App\Service\Database;

class SupportController extends Controller {
    public function store() {
        try {
            if (!isset($_SESSION['client_id'])) {
                $this->json(['error' => 'Non autorisé'], 401);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty(trim($input['sujet'] ?? '')) || empty(trim($input['message'] ?? ''))) {
                $this->json(['error' => 'Champs requis'], 400);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("INSERT INTO tickets_support (client_id, sujet, message, statut) VALUES (?, ?, ?, 'open')");
            $stmt->execute([
                $_SESSION['client_id'],
                htmlspecialchars(trim($input['sujet'])),
                htmlspecialchars(trim($input['message']))
            ]);

            $this->json(['message' => 'Ticket de support envoyé']);
        } catch (\Exception $e) {
            error_log('Support store error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
