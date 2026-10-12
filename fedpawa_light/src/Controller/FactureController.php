<?php
namespace App\Controller;

use App\Service\Database;

class FactureController extends Controller {
    public function index() {
        try {
            if (!isset($_SESSION['client_id'])) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT id, numero, montant, date, lien_pdf FROM factures WHERE client_id = ? ORDER BY date DESC");
            $stmt->execute([$_SESSION['client_id']]);
            $this->json(['data' => $stmt->fetchAll()]);
        } catch (\Exception $e) {
            error_log('FactureController error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la récupération des factures'], 500);
        }
    }
}
