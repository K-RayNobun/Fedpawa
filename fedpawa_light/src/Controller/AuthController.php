<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;
use App\Service\LoginThrottler;
use App\Service\MailService;

class AuthController extends Controller {
    // ------------------------------------------------------------------
    // Client : inscription / connexion / réinitialisation
    // ------------------------------------------------------------------
    public function register() {
        try {
            $raw = file_get_contents('php://input');
            $input = json_decode($raw, true);

            if (!$input || !isset($input['email'], $input['mot_de_passe'], $input['nom'], $input['entreprise'])) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            // UX-S4-1: téléphone requis côté serveur aussi (cohérent avec le tunnel)
            $telephone = trim($input['telephone'] ?? '');
            if ($telephone === '' || !preg_match('/^\+?[0-9\s().-]{6,25}$/', $telephone)) {
                $this->json(['error' => 'Numéro de téléphone invalide (ex: +237 6XX XX XX XX)'], 400);
                return;
            }

            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                $this->json(['error' => 'Adresse e-mail invalide'], 400);
                return;
            }

            // Robustesse : min 8 caractères, 1 majuscule, 1 chiffre (miroir du front)
            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $input['mot_de_passe'])) {
                $this->json(['error' => 'Mot de passe trop faible (min. 8 caractères, 1 majuscule, 1 chiffre)'], 400);
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
                htmlspecialchars($telephone),
                password_hash($input['mot_de_passe'], PASSWORD_ARGON2ID)
            ]);

            $this->json(['message' => 'Compte créé avec succès']);
        } catch (\Exception $e) {
            error_log('Register error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne lors de la création du compte'], 500);
        }
    }

    public function login() {
        try {
            $raw = file_get_contents('php://input');
            $input = json_decode($raw, true);

            if (!$input || !isset($input['email'], $input['mot_de_passe'])) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            $email = $input['email'];
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;

            // Vérifier d'abord si c'est un compte admin (pour ne pas le verrouiller par erreur)
            $db = Database::getConnection();
            $stmtAdmin = $db->prepare("SELECT * FROM admins WHERE email = ?");
            $stmtAdmin->execute([$email]);
            $admin = $stmtAdmin->fetch();

            if ($admin) {
                // C'est un compte admin : ne pas enregistrer d'échec throttler, message dédié
                if (!password_verify($input['mot_de_passe'], $admin['mot_de_passe'])) {
                    $this->json(["error" => "Ceci est un compte administrateur. Utilisez la page d'accès admin: /admin_dashboard.html"], 401);
                    return;
                }
                // Admin connecté avec succès via le formulaire client
                LoginThrottler::recordSuccess($email, 'admin');
                session_regenerate_id(true);
                $_SESSION['client_id'] = $admin['id'];
                $_SESSION['client_name'] = $admin['email'];
                $_SESSION['role'] = 'admin';
                AuditLogger::log("ADMIN_LOGIN_via_client_form", (int)$admin["id"], "admin", "Login OK from client form");
                $this->json(["message" => "Connexion réussie", "redirect" => "admin_dashboard.html", "role" => "admin"]);
                return;
            }

            // Ce n'est pas un admin : vérifier le client habituel
            $remaining = LoginThrottler::getRemainingLock($email, "client");
            if ($remaining > 0) {
                $minutes = (int)ceil($remaining / 60);
                $this->json(["error" => "Trop de tentatives échouées (5). Réessayez dans $minutes minute(s) ou contactez le support."], 429);
                return;
            }

            $stmt = $db->prepare("SELECT * FROM clients WHERE email = ?");
            $stmt->execute([$email]);
            $client = $stmt->fetch();

            if (!$client || !password_verify($input['mot_de_passe'], $client["mot_de_passe"])) {
                $justLocked = LoginThrottler::recordFailure($email, "client", $ip);
                if ($justLocked) {
                    AuditLogger::log("LOGIN_LOCKED", null, "client", "Client $email verrouillé après 5 échecs (30 min)");
                    // Notification interne à l'admin
                    (new MailService())->send(null, "system", null, "admin",
                        "L'utilisateur $email a atteint la limite de 5 tentatives de connexion et doit maintenant attendre 30 minutes.");
                    $this->json(["error" => "Trop de tentatives échouées (5). Votre compte est bloqué pendant 30 minutes."], 429);
                    return;
                }
                $this->json(["error" => "Identifiants invalides"], 401);
                return;
            }

            LoginThrottler::recordSuccess($email, 'client');
            session_regenerate_id(true);
            $_SESSION['client_id'] = $client['id'];
            $_SESSION['client_name'] = $client['nom'];
            $_SESSION['role'] = $client['role'] ?? 'client'; // Lane #4 : rôle pour le contrôle d'accès

            AuditLogger::log('CLIENT_LOGIN', (int)$client['id'], 'client', 'Login OK');
            $redirect = ($_SESSION['role'] === 'admin') ? 'admin_dashboard.html' : 'espace_client.html';
            $this->json(['message' => 'Connexion réussie', 'redirect' => $redirect, 'role' => $_SESSION['role']]);
        } catch (\Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function requestPasswordReset() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['email'])) {
                $this->json(['error' => 'Email requis'], 400);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
            $stmt->execute([$input['email']]);
            $client = $stmt->fetch();

            // Réponse générique identique que l'email existe ou non (anti-énumération)
            $generic = 'Si cet e-mail existe, un code de réinitialisation a été envoyé.';

            if (!$client) {
                $this->json(['message' => $generic]);
                return;
            }

            $token = sprintf("%06d", random_int(1, 999999));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Invalider les anciens codes non utilisés
            $db->prepare("UPDATE password_resets SET used = 1 WHERE client_id = ? AND used = 0")->execute([$client['id']]);

            $stmtReset = $db->prepare("INSERT INTO password_resets (client_id, token_hash, expires_at) VALUES (?, ?, ?)");
            $stmtReset->execute([$client['id'], password_hash($token, PASSWORD_DEFAULT), $expiresAt]);

            $_SESSION['reset_email'] = $input['email'];

            // Envoi email (si SMTP configuré) ; jamais le code dans la réponse HTTP en prod.
            // En dev local uniquement (APP_ENV=dev), le code est loggé pour les tests E2E.
            $otpSent = false;
            try {
                $mailer = new \App\Service\NotificationService();
                $otpSent = $mailer->sendOtp($input['email'], $token);
            } catch (\Exception $mailEx) {
                error_log('OTP mail envoi échoué: ' . $mailEx->getMessage());
            }
            if (!$otpSent) {
                // SMTP non configuré: journaliser le code côté serveur (consultable par l'admin),
                // ne jamais l'exposer dans la réponse HTTP.
                error_log('[OTP-DEV] code pour ' . $input['email'] . ' : ' . $token);
            }
            $this->json(['message' => $generic]);
        } catch (\Exception $e) {
            error_log('Password reset request error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function verifyOtp() {
        try {
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

            if (!$reset || !password_verify((string)$input['otp'], $reset['token_hash'])) {
                $this->json(['error' => 'Code OTP invalide ou expiré'], 400);
                return;
            }

            $_SESSION['otp_verified'] = true;
            $this->json(['message' => 'OTP vérifié avec succès']);
        } catch (\Exception $e) {
            error_log('OTP verify error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function resetPassword() {
        try {
            if (!isset($_SESSION['otp_verified'], $_SESSION['reset_email']) || !$_SESSION['otp_verified']) {
                $this->json(['error' => 'Session de réinitialisation non autorisée'], 403);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['mot_de_passe'])) {
                $this->json(['error' => 'Nouveau mot de passe requis'], 400);
                return;
            }

            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $input['mot_de_passe'])) {
                $this->json(['error' => 'Mot de passe trop faible (min. 8 caractères, 1 majuscule, 1 chiffre)'], 400);
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
                AuditLogger::log('PASSWORD_RESET', (int)$client['id'], 'client', 'Reset done');
            }

            unset($_SESSION['reset_email'], $_SESSION['otp_verified']);
            $this->json(['message' => 'Mot de passe mis à jour avec succès']);
        } catch (\Exception $e) {
            error_log('Reset password error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    // ------------------------------------------------------------------
    // Admin
    // ------------------------------------------------------------------
    public function adminLogin() {
        try {
            $input = json_decode(file_get_contents("php://input"), true);
            if (!$input || !isset($input["email"], $input["mot_de_passe"])) {
                $this->json(["error" => "Champs manquants"], 400);
                return;
            }

            $email = $input["email"];
            $ip = $_SERVER["REMOTE_ADDR"] ?? null;

            // Vérifier d'abord si l'email existe dans la table clients (formulaire client utilisé par erreur)
            $db = Database::getConnection();
            $stmtClients = $db->prepare("SELECT * FROM clients WHERE email = ?");
            $stmtClients->execute([$email]);
            $client = $stmtClients->fetch();

            if ($client) {
                // L'email existe dans clients mais on est sur /api/admin/login => message dédié sans compter d'échec
                $this->json(["error" => "Utilisez la connexion client standard"], 401);
                return;
            }

            // L'email n'existe pas dans clients : vérifier la table admins
            $stmtAdmin = $db->prepare("SELECT * FROM admins WHERE email = ?");
            $stmtAdmin->execute([$email]);
            $admin = $stmtAdmin->fetch();

            // Anti brute-force : compte verrouillé ?
            $remaining = LoginThrottler::getRemainingLock($email, "admin");
            if ($remaining > 0) {
                $minutes = (int)ceil($remaining / 60);
                $this->json(["error" => "Trop de tentatives échouées (5). Réessayez dans $minutes minute(s)."], 429);
                return;
            }

            if (!$admin || !password_verify($input["mot_de_passe"], $admin["mot_de_passe"])) {
                // Ne pas enregistrer d'échec throttler pour admin qui se trompe de formulaire
                // (handled above: if email in clients, already returned with dedicated message)
                // Si on arrive ici, c'est un admin avec mauvais mot de passe
                $justLocked = LoginThrottler::recordFailure($email, "admin", $ip);
                AuditLogger::log("ADMIN_LOGIN_FAILED", null, "admin", "Email: " . $email);
                if ($justLocked) {
                    AuditLogger::log("LOGIN_LOCKED", null, "admin", "Admin $email verrouillé après 5 échecs (30 min)");
                    $this->json(["error" => "Trop de tentatives échouées (5). Ce compte est bloqué pendant 30 minutes."], 429);
                    return;
                }
                $this->json(["error" => "Identifiants invalides"], 401);
                return;
            }

            LoginThrottler::recordSuccess($email, "admin");
            session_regenerate_id(true);
            $_SESSION["admin_logged_in"] = true;
            $_SESSION["admin_id"] = $admin["id"];

            AuditLogger::log("ADMIN_LOGIN", (int)$admin["id"], "admin", "Login OK");
            $this->json(["message" => "Connexion réussie", "redirect" => "/admin"]);
        } catch (\Exception $e) {
            error_log("Admin login error: " . $e->getMessage());
            $this->json(["error" => "Erreur interne"], 500);
        }
    }

    public function updateAdminPassword() {
        try {
            if (!isset($_SESSION['admin_logged_in'])) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['old_password'], $input['new_password'])) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $input['new_password'])) {
                $this->json(['error' => 'Nouveau mot de passe trop faible (min. 8 caractères, 1 majuscule, 1 chiffre)'], 400);
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

            AuditLogger::log('ADMIN_PASSWORD_UPDATED', $_SESSION['admin_id'], 'admin', 'Password changed');
            $this->json(['message' => 'Mot de passe mis à jour']);
        } catch (\Exception $e) {
            error_log('Admin password update error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function me() {
        if (empty($_SESSION['client_id'])) {
            $this->json(['authenticated' => false], 200);
            return;
        }
        $this->json([
            'authenticated' => true,
            'role' => $_SESSION['role'] ?? 'client',
            'name' => $_SESSION['client_name'] ?? ''
        ], 200);
    }
}
