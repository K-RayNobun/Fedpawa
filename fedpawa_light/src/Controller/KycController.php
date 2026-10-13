<?php
namespace App\Controller;

use App\Service\KycService;
use App\Service\Database;
use App\Service\AuditLogger;

class KycController extends Controller {
    private KycService $service;

    public function __construct() {
        $this->service = new KycService();
    }

    protected function requireAdmin(): bool {
        if (!(isset($_SESSION['admin_logged_in']) || (!empty($_SESSION['client_id']) && ($_SESSION['role'] ?? 'client') === 'admin'))) {
            $this->json(['error' => 'Non autorisé'], 403);
            return false;
        }
        return true;
    }

    // Soumission client (documents pièce d'identité + justificatif de domicile)
    public function submit() {
        try {
            if (!isset($_SESSION['client_id'])) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }
            if (empty($_FILES['piece_identite']) || empty($_FILES['justificatif_domicile'])) {
                $this->json(['error' => 'Pièce d\'identité et justificatif de domicile requis'], 400);
                return;
            }

            $this->service->submit((int)$_SESSION['client_id'], [
                'piece_identite' => $_FILES['piece_identite'],
                'justificatif_domicile' => $_FILES['justificatif_domicile']
            ]);
            $this->json(['message' => 'Dossier KYC soumis']);
        } catch (\Exception $e) {
            error_log('KYC submit error: ' . $e->getMessage());
            $this->json(['error' => $e->getMessage()], 400);
        }
    }

    public function approve() {
        if (!$this->requireAdmin()) return;
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                $this->json(['error' => 'ID invalide'], 400);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("UPDATE kyc SET statuts = 'approuvé' WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->json(['error' => 'Dossier KYC introuvable'], 404);
                return;
            }

            AuditLogger::log('KYC_APPROVED', $id, 'admin', 'KYC ID: ' . $id);
            $this->json(['message' => 'Dossier KYC approuvé']);
        } catch (\Exception $e) {
            error_log('KYC approve error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function reject() {
        if (!$this->requireAdmin()) return;
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                $this->json(['error' => 'ID invalide'], 400);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("UPDATE kyc SET statuts = 'rejeté' WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                $this->json(['error' => 'Dossier KYC introuvable'], 404);
                return;
            }

            AuditLogger::log('KYC_REJECTED', $id, 'admin', 'KYC ID: ' . $id);
            $this->json(['message' => 'Dossier KYC rejeté']);
        } catch (\Exception $e) {
            error_log('KYC reject error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
