<?php
namespace App\Controller;

use App\Service\Database;

class CourrierController extends Controller {
    public function index() {
        try {
            if (!isset($_SESSION['client_id'])) {
                $this->json(['error' => 'Non autorisé'], 401);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT * FROM courriers WHERE client_id = ? ORDER BY date_reception DESC");
            $stmt->execute([$_SESSION['client_id']]);
            $this->json(['data' => $stmt->fetchAll()]);
        } catch (\Exception $e) {
            error_log('Courrier index error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function add() {
        try {
            if (!(isset($_SESSION['admin_logged_in']) || (!empty($_SESSION['client_id']) && ($_SESSION['role'] ?? 'client') === 'admin'))) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty($input['client_id']) || empty($input['scan_path'])) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("INSERT INTO courriers (client_id, date_reception, scan, statut) VALUES (?, ?, ?, 'non_lu')");
            $stmt->execute([(int)$input['client_id'], date('Y-m-d H:i:s'), $input['scan_path']]);
            $this->json(['message' => 'Courrier ajouté']);
        } catch (\Exception $e) {
            error_log('Courrier add error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
