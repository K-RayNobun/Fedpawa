<?php
namespace App\Controller;

use App\Service\KycService;
use App\Service\Database;

class KycController extends Controller {
    private KycService $service;

    public function __construct() {
        $this->service = new KycService();
    }

    public function approve(string $id) {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE kyc SET statuts = 'approuvé' WHERE id = ?");
        $stmt->execute([$id]);
        $this->json(['message' => 'Dossier KYC approuvé']);
    }

    public function reject(string $id) {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE kyc SET statuts = 'rejeté' WHERE id = ?");
        $stmt->execute([$id]);
        $this->json(['message' => 'Dossier KYC rejeté']);
    }
}
