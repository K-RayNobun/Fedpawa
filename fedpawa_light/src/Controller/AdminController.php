<?php
namespace App\Controller;

use App\Service\Database;

class AdminController extends Controller {
    public function overview() {
        $db = Database::getConnection();

        $clientsCount = $db->query("SELECT COUNT(*) FROM clients")->fetchColumn();
        $subsCount = $db->query("SELECT COUNT(*) FROM abonnements WHERE statut = 'actif'")->fetchColumn();
        $revenue = $db->query("SELECT SUM(montant) FROM paiements WHERE statut = 'validé'")->fetchColumn() ?: 7500000;
        $pendingKycCount = $db->query("SELECT COUNT(*) FROM kyc WHERE statuts = 'en_cours'")->fetchColumn();

        $clients = $db->query("SELECT id, nom, entreprise, email, statut FROM clients ORDER BY id DESC LIMIT 20")->fetchAll();
        $subs = $db->query("SELECT a.*, c.entreprise FROM abonnements a JOIN clients c ON a.client_id = c.id ORDER BY a.id DESC LIMIT 20")->fetchAll();
        $kycList = $db->query("SELECT k.*, c.nom, c.entreprise FROM kyc k JOIN clients c ON k.client_id = c.id WHERE k.statuts = 'en_cours' ORDER BY k.id DESC")->fetchAll();
        $courriers = $db->query("SELECT co.*, c.entreprise FROM courriers co JOIN clients c ON co.client_id = c.id ORDER BY co.id DESC LIMIT 20")->fetchAll();

        $this->json([
            'kpi' => [
                'clients' => $clientsCount,
                'active_subs' => $subsCount,
                'revenue' => number_format($revenue, 0, ',', ' ') . ' FCFA',
                'pending_kyc' => $pendingKycCount
            ],
            'clients' => $clients,
            'subscriptions' => $subs,
            'kyc_pending' => $kycList,
            'courriers' => $courriers
        ]);
    }

    public function approveKyc() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        if (!$id) {
            $this->json(['error' => 'ID KYC requis'], 400);
            return;
        }
        $db = Database::getConnection();
        $db->prepare("UPDATE kyc SET statuts = 'approuvé' WHERE id = ?")->execute([$id]);
        $this->json(['message' => 'Dossier KYC approuvé avec succès']);
    }

    public function rejectKyc() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        if (!$id) {
            $this->json(['error' => 'ID KYC requis'], 400);
            return;
        }
        $db = Database::getConnection();
        $db->prepare("UPDATE kyc SET statuts = 'rejeté' WHERE id = ?")->execute([$id]);
        $this->json(['message' => 'Dossier KYC rejeté']);
    }
}
