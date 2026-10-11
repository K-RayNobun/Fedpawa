<?php
namespace App\Controller;

use App\Service\Database;

class AuthController extends Controller {
    public function adminLogin() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['email'], $input['mot_de_passe'])) {
            $this->json(['error' => 'Champs manquants'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM admins WHERE email = ?");
        $stmt->execute([$input['email']]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($input['mot_de_passe'], $admin['mot_de_passe'])) {
            $this->json(['error' => 'Identifiants invalides'], 401);
            return;
        }

        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $admin['id'];
        $this->json(['message' => 'Connexion réussie', 'redirect' => '/admin']);
    }

    public function updateAdminPassword() {
        if (!isset($_SESSION['admin_logged_in'])) {
            $this->json(['error' => 'Non autorisé'], 403);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['old_password'], $input['new_password'])) {
            $this->json(['error' => 'Champs manquants'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT mot_de_passe FROM admins WHERE id = ?");
        $stmt->execute([$_SESSION['admin_id']]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($input['old_password'], $admin['mot_de_passe'])) {
            $this->json(['error' => 'Ancien mot de passe incorrect'], 401);
            return;
        }

        $stmt = $db->prepare("UPDATE admins SET mot_de_passe = ? WHERE id = ?");
        $stmt->execute([password_hash($input['new_password'], PASSWORD_ARGON2ID), $_SESSION['admin_id']]);

        $this->json(['message' => 'Mot de passe mis à jour']);
    }

    // ... (keep existing register/login/etc methods)
}
