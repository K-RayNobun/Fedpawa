<?php
namespace App\Controller;

use App\Service\Database;

class DashboardController extends Controller {
    public function index() {
        if (!isset($_SESSION['client_id'])) {
            $this->json(['error' => 'Non autorisé'], 401);
            return;
        }

        $db = Database::getConnection();

        // 1. Client Profile
        $stmtClient = $db->prepare("SELECT id, civilité, nom, entreprise, forme_juridique, email, telephone, adresse FROM clients WHERE id = ?");
        $stmtClient->execute([$_SESSION['client_id']]);
        $client = $stmtClient->fetch();

        // 2. Active Subscription
        $stmtSub = $db->prepare("SELECT * FROM abonnements WHERE client_id = ? ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$_SESSION['client_id']]);
        $subscription = $stmtSub->fetch();

        // 3. Invoices
        $stmtFactures = $db->prepare("SELECT * FROM factures WHERE client_id = ? ORDER BY id DESC");
        $stmtFactures->execute([$_SESSION['client_id']]);
        $factures = $stmtFactures->fetchAll();

        // 4. Contracts
        $stmtContrats = $db->prepare("SELECT * FROM contrats WHERE client_id = ? ORDER BY id DESC");
        $stmtContrats->execute([$_SESSION['client_id']]);
        $contrats = $stmtContrats->fetchAll();

        // 5. Mail items (courriers)
        $stmtCourriers = $db->prepare("SELECT * FROM courriers WHERE client_id = ? ORDER BY id DESC");
        $stmtCourriers->execute([$_SESSION['client_id']]);
        $courriers = $stmtCourriers->fetchAll();

        // 6. KYC status
        $stmtKyc = $db->prepare("SELECT * FROM kyc WHERE client_id = ? ORDER BY id DESC LIMIT 1");
        $stmtKyc->execute([$_SESSION['client_id']]);
        $kyc = $stmtKyc->fetch();

        $this->json([
            'client' => $client,
            'subscription' => $subscription ?: null,
            'factures' => $factures,
            'contrats' => $contrats,
            'courriers' => $courriers,
            'kyc' => $kyc ?: ['statuts' => 'en_attente']
        ]);
    }
}
