<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;

class AdminController extends Controller {
    public function __construct() {
        if (!isset($_SESSION['admin_logged_in'])) {
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
              <h2>Boîte de réception client</h2>';
        foreach ($messages as $m) {
            echo '<p><b>' . $m['sender_type'] . '</b>: ' . htmlspecialchars($m['content']) . '</p>';
        }
        echo '</body></html>';
    }

    public function settings() {
        echo '<html><body><h1>Settings</h1>
              <form action="/admin/password/update" method="POST">
                  <input type="password" name="old_password" placeholder="Old Password" required>
                  <input type="password" name="new_password" placeholder="New Password" required>
                  <button type="submit">Update Password</button>
              </form></body></html>';
    }

    public function updateTemplate() {
        $content = $_POST['content'] ?? '';
        $db = Database::getConnection();
        
        $current = $db->query("SELECT id, content FROM contract_templates WHERE name = 'contract'")->fetch();
        
        $stmt = $db->prepare("UPDATE contract_templates SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE name = 'contract'");
        $stmt->execute([$content]);
        
        $db->prepare("INSERT INTO contract_history (template_id, old_content) VALUES (?, ?)")->execute([$current['id'], $current['content']]);
        
        AuditLogger::log('UPDATE_CONTRACT_TEMPLATE', $_SESSION['admin_id'], 'admin', 'Template ID: ' . $current['id']);
        
        header('Location: /admin');
    }
}
