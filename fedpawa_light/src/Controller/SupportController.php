<?php
namespace App\Controller;

use App\Service\Database;

class SupportController extends Controller {
    public function myTickets() {
        // F7: le client doit voir ses demandes passées et leur statut
        if (!isset($_SESSION['client_id'])) {
            $this->json(['error' => 'Non autorisé'], 401);
            return;
        }
        $db = \App\Service\Database::getConnection();
        $stmt = $db->prepare("SELECT id, sujet, message, statut, created_at, reponse, reponse_at FROM tickets_support WHERE client_id = ? ORDER BY id DESC LIMIT 50");
        $stmt->execute([$_SESSION['client_id']]);
        $this->json(['tickets' => $stmt->fetchAll()]);
    }

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
            // F10: limites de longueur (miroir des maxlength côté UI)
            if (mb_strlen(trim($input['sujet'])) > 150 || mb_strlen(trim($input['message'])) > 5000) {
                $this->json(['error' => 'Sujet (150 max) ou message (5000 max) trop long'], 400);
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
