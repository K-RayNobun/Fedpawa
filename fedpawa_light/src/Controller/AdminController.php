<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;
use App\Service\LoginThrottler;

class AdminController extends Controller {
    public function __construct() {
        if (!isset($_SESSION['admin_logged_in'])) {
            $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
            if (preg_match('#^/api(/|$)#', $uri)) {
                $this->json(['error' => 'Non autorisé'], 403);
                exit;
            }
            header('Location: /login');
            exit;
        }
    }

    public function dashboard() {
        $db = Database::getConnection();
        $template = $db->query("SELECT content FROM contract_templates WHERE name = 'contract'")->fetch();
        $messages = $db->query("SELECT * FROM internal_messages ORDER BY created_at DESC")->fetchAll();

        echo '<html><body><h1>Admin Dashboard</h1>
              <a href="/admin/settings">Paramètres</a>
              <h2>Template Contrat</h2>
              <form action="/admin/template/update" method="POST">
                  <textarea name="content" style="width:100%; height:200px;">' . htmlspecialchars($template['content'] ?? '') . '</textarea>
                  <button type="submit">Update Template</button>
              </form>
              <h2>Upload Courier (Scan)</h2>
              <form action="/courier/upload" method="POST" enctype="multipart/form-data">
                  <input type="number" name="client_id" placeholder="Client ID" required>
                  <input type="file" name="documents[]" multiple accept="image/*,application/pdf" capture="environment">
                  <button type="submit">Upload Multi-page Scan</button>
              </form>
              <h2>Boîte de réception client</h2>';
        foreach ($messages as $m) {
            echo '<p><b>' . $m['sender_type'] . '</b>: ' . htmlspecialchars($m['content']) . '</p>';
        }
        echo '</body></html>';
    }

    // Vue JSON pour le dashboard admin (statistiques + communications)
    public function overview() {
        try {
            $db = Database::getConnection();

            $stats = [
                'clients'      => (int)$db->query("SELECT COUNT(*) FROM clients")->fetchColumn(),
                'abonnements'  => (int)$db->query("SELECT COUNT(*) FROM abonnements")->fetchColumn(),
                'paiements'    => (int)$db->query("SELECT COUNT(*) FROM paiements")->fetchColumn(),
                'courriers'    => (int)$db->query("SELECT COUNT(*) FROM courriers")->fetchColumn(),
                'kyc_en_cours' => (int)$db->query("SELECT COUNT(*) FROM kyc WHERE statuts = 'en_cours'")->fetchColumn(),
                'tickets_open' => (int)$db->query("SELECT COUNT(*) FROM tickets_support WHERE statut = 'open'")->fetchColumn(),
            ];

            $messages = $db->query("SELECT * FROM internal_messages ORDER BY created_at DESC LIMIT 50")->fetchAll();
            $tickets = $db->query("SELECT t.*, c.nom AS client_nom FROM tickets_support t JOIN clients c ON c.id = t.client_id ORDER BY t.created_at DESC LIMIT 50")->fetchAll();
            $throttled = LoginThrottler::listLocked();

            $this->json(['stats' => $stats, 'messages' => $messages, 'tickets' => $tickets, 'throttled' => $throttled]);
        } catch (\Exception $e) {
            error_log('Admin overview error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function settings() {
        echo '<html><body><h1>Settings</h1>
              <form action="/admin/password/update" method="POST">
                  <input type="password" name="old_password" placeholder="Old Password" required>
                  <input type="password" name="new_password" placeholder="New Password" required>
                  <button type="submit">Update Password</button>
              </form></body></html>';
    }

    // Lever le délai de déblocage d'un compte verrouillé par le throttler
    public function clearThrottle() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty($input['identifier']) || empty($input['user_type'])) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            $userType = in_array($input['user_type'], ['client', 'admin'], true) ? $input['user_type'] : null;
            if ($userType === null) {
                $this->json(['error' => 'Type d\'utilisateur invalide'], 400);
                return;
            }

            // On valide l'existence du VERROU (pas du compte : un email
            // inexistant peut aussi être verrouillé par un attaquant).
            $identifier = (string)$input['identifier'];
            $cleared = LoginThrottler::clearLock($identifier, $userType);
            if (!$cleared) {
                $this->json(['error' => 'Aucun verrou actif pour ce compte'], 404);
                return;
            }

            AuditLogger::log('THROTTLE_CLEARED', $_SESSION['admin_id'] ?? null, 'admin', "Délai levé pour $identifier ($userType)");
            $this->json(['message' => 'Délai de déblocage levé pour ' . $identifier]);
        } catch (\Exception $e) {
            error_log('Clear throttle error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function updateTemplate() {
        try {
            // Supporte à la fois un POST de formulaire HTML et un appel API JSON
            $content = $_POST['content'] ?? null;
            $isApi = empty($content);
            if ($isApi) {
                $input = json_decode(file_get_contents('php://input'), true);
                $content = $input['content'] ?? '';
            }

            if (!is_string($content) || strlen(trim($content)) < 50) {
                if ($isApi) { $this->json(['error' => 'Contenu de template invalide'], 400); return; }
                http_response_code(400);
                echo 'Contenu de template invalide';
                return;
            }

            $db = Database::getConnection();
            $current = $db->query("SELECT id, content FROM contract_templates WHERE name = 'contract'")->fetch();

            $stmt = $db->prepare("UPDATE contract_templates SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE name = 'contract'");
            $stmt->execute([$content]);

            $db->prepare("INSERT INTO contract_history (template_id, old_content) VALUES (?, ?)")->execute([$current['id'], $current['content']]);

            AuditLogger::log('UPDATE_CONTRACT_TEMPLATE', $_SESSION['admin_id'] ?? null, 'admin', 'Template ID: ' . $current['id']);

            if ($isApi) {
                $this->json(['message' => 'Template mis à jour']);
                return;
            }
            header('Location: /admin');
        } catch (\Exception $e) {
            error_log('Update template error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
