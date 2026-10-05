<?php
namespace App\Controller;

use App\Service\Database;

class FactureController extends Controller {
    public function index() {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM factures WHERE client_id = ?");
        $stmt->execute([$_SESSION['client_id']]);
        $this->json(['data' => $stmt->fetchAll()]);
    }
}
