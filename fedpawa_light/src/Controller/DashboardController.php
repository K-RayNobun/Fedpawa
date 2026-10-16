<?php
namespace App\Controller;

use App\Service\Database;

class DashboardController extends Controller {
    public function index() {
        if (!$this->requireClient()) return;

        $db = Database::getConnection();

        // 1. Client Profile
        $stmtClient = $db->prepare("SELECT id, civilité, nom, entreprise, forme_juridique, email, telephone, adresse FROM clients WHERE id = ?");
        $stmtClient->execute([$_SESSION['client_id']]);
        $client = $stmtClient->fetch();

        // 2. Active Subscription — W-9: préférer l'abonnement ACTIF le plus récent,
        // sinon le plus récent toutes catégories (statut affiché honnêtement partout)
        $stmtSub = $db->prepare("SELECT * FROM abonnements WHERE client_id = ? AND statut = 'actif' ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$_SESSION['client_id']]);
        $subscription = $stmtSub->fetch();
        if (!$subscription) {
            $stmtSub = $db->prepare("SELECT * FROM abonnements WHERE client_id = ? ORDER BY id DESC LIMIT 1");
            $stmtSub->execute([$_SESSION['client_id']]);
            $subscription = $stmtSub->fetch();
        }

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

    // Lane audit: mise à jour du profil client (données réelles)
    public function updateProfile() {
        if (!$this->requireClient()) return;
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty(trim($input['nom'] ?? '')) || empty(trim($input['email'] ?? ''))) {
                $this->json(['error' => 'Nom et e-mail requis'], 400);
                return;
            }
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                $this->json(['error' => 'E-mail invalide'], 400);
                return;
            }
            $db = Database::getConnection();
            // l'email ne doit pas appartenir à un autre client
            $chk = $db->prepare("SELECT id FROM clients WHERE email = ? AND id != ?");
            $chk->execute([trim($input['email']), (int)$_SESSION['client_id']]);
            if ($chk->fetch()) {
                $this->json(['error' => 'Cet e-mail est d\u00e9j\u00e0 utilis\u00e9'], 409);
                return;
            }
            $stmt = $db->prepare("UPDATE clients SET nom = ?, entreprise = ?, email = ?, telephone = ?, adresse = ? WHERE id = ?");
            $stmt->execute([
                htmlspecialchars(trim($input['nom'])),
                htmlspecialchars(trim($input['entreprise'] ?? '')),
                trim($input['email']),
                htmlspecialchars(trim($input['telephone'] ?? '')),
                htmlspecialchars(trim($input['adresse'] ?? '')),
                (int)$_SESSION['client_id']
            ]);
            $this->json(['message' => 'Profil mis à jour']);
        } catch (\Exception $e) {
            error_log('Update profile error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
