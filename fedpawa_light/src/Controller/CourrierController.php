<?php
namespace App\Controller;

use App\Service\Database;

class CourrierController extends Controller {
    public function index() {
        if (!isset($_SESSION['client_id'])) {
            $this->json(['error' => 'Non autorisé'], 401);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM courriers WHERE client_id = ?");
        $stmt->execute([$_SESSION['client_id']]);
        $this->json(['data' => $stmt->fetchAll()]);
    }

    public function add() {
        // Logique admin pour ajouter un courrier
        $input = json_decode(file_get_contents('php://input'), true);
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO courriers (client_id, date_reception, scan, statut) VALUES (?, ?, ?, 'non_lu')");
        $stmt->execute([$input['client_id'], date('Y-m-d H:i:s'), $input['scan_path']]);
        $this->json(['message' => 'Courrier ajouté']);
    }
}
