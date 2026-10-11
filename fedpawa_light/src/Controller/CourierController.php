<?php
namespace App\Controller;

use App\Service\CourierService;

class CourierController extends Controller {
    public function upload() {
        if (!isset($_SESSION['client_id']) && !isset($_SESSION['admin_logged_in'])) {
            $this->json(['error' => 'Non autorisé'], 403);
            return;
        }

        $clientId = $_POST['client_id'] ?? $_SESSION['client_id'];
        $files = $_FILES['documents'] ?? null;

        if (!$files || empty($files['tmp_name'][0])) {
            $this->json(['error' => 'Aucun fichier'], 400);
            return;
        }

        $service = new CourierService();
        $path = $service->uploadMultiple((int)$clientId, $files);
        
        $this->json(['message' => 'Upload et conversion multi-pages réussis', 'path' => $path]);
    }
}
