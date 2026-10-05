<?php
namespace App\Controller;

use App\Service\Database;

class AuthController extends Controller {
    public function register() {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!$input || !isset($input['email'], $input['mot_de_passe'], $input['nom'], $input['entreprise'])) {
            $this->json(['error' => 'Champs manquants'], 400);
            return;
        }

        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $this->json(['error' => 'Adresse e-mail invalide'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            $this->json(['error' => 'Email déjà utilisé'], 409);
            return;
        }

        $stmt = $db->prepare("INSERT INTO clients (nom, entreprise, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            htmlspecialchars($input['nom']),
            htmlspecialchars($input['entreprise']),
            $input['email'],
            $input['telephone'] ?? '',
            password_hash($input['mot_de_passe'], PASSWORD_ARGON2ID)
        ]);

        $this->json(['message' => 'Compte créé avec succès']);
    }

    public function login() {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!$input || !isset($input['email'], $input['mot_de_passe'])) {
            $this->json(['error' => 'Champs manquants'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM clients WHERE email = ?");
        $stmt->execute([$input['email']]);
        $client = $stmt->fetch();

        if (!$client || !password_verify($input['mot_de_passe'], $client['mot_de_passe'])) {
            $this->json(['error' => 'Identifiants invalides'], 401);
            return;
        }

        $_SESSION['client_id'] = $client['id'];
        $_SESSION['client_name'] = $client['nom'];

        $this->json(['message' => 'Connexion réussie', 'redirect' => 'espace_client.html']);
    }

    public function requestPasswordReset() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['email'])) {
            $this->json(['error' => 'Email requis'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmt->execute([$input['email']]);
        $client = $stmt->fetch();

        if (!$client) {
            $this->json(['message' => 'Si cet e-mail existe, un code de réinitialisation a été envoyé.']);
            return;
        }

        $token = sprintf("%06d", mt_rand(1, 999999));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        $stmtReset = $db->prepare("INSERT INTO password_resets (client_id, token_hash, expires_at) VALUES (?, ?, ?)");
        $stmtReset->execute([$client['id'], password_hash($token, PASSWORD_DEFAULT), $expiresAt]);

        $_SESSION['reset_email'] = $input['email'];

        $this->json(['message' => 'Code OTP envoyé avec succès', 'debug_otp' => $token]);
    }

    public function verifyOtp() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['otp'], $_SESSION['reset_email'])) {
            $this->json(['error' => 'Données invalides'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmtClient = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmtClient->execute([$_SESSION['reset_email']]);
        $client = $stmtClient->fetch();

        if (!$client) {
            $this->json(['error' => 'Client introuvable'], 404);
            return;
        }

        $stmt = $db->prepare("SELECT * FROM password_resets WHERE client_id = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1");
        $stmt->execute([$client['id']]);
        $reset = $stmt->fetch();

        if (!$reset || !password_verify($input['otp'], $reset['token_hash'])) {
            $this->json(['error' => 'Code OTP invalide ou expiré'], 400);
            return;
        }

        $_SESSION['otp_verified'] = true;
        $this->json(['message' => 'OTP vérifié avec succès']);
    }

    public function resetPassword() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($_SESSION['otp_verified'], $_SESSION['reset_email']) || !$_SESSION['otp_verified']) {
            $this->json(['error' => 'Session de réinitialisation non autorisée'], 403);
            return;
        }

        if (!$input || !isset($input['mot_de_passe'])) {
            $this->json(['error' => 'Nouveau mot de passe requis'], 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE clients SET mot_de_passe = ? WHERE email = ?");
        $stmt->execute([
            password_hash($input['mot_de_passe'], PASSWORD_ARGON2ID),
            $_SESSION['reset_email']
        ]);

        $stmtClient = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmtClient->execute([$_SESSION['reset_email']]);
        $client = $stmtClient->fetch();
        if ($client) {
            $db->prepare("UPDATE password_resets SET used = 1 WHERE client_id = ?")->execute([$client['id']]);
        }

        unset($_SESSION['reset_email'], $_SESSION['otp_verified']);
        $this->json(['message' => 'Mot de passe mis à jour avec succès']);
    }
}
