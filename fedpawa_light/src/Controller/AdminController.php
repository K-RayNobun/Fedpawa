<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;
use App\Service\LoginThrottler;
use App\Service\OtpService;
use App\Service\NotificationService;

class AdminController extends Controller {
    public function ticketReply() {
        // W-13: l'admin répond à un ticket support — visible côté client
        if (!isset($_SESSION['admin_logged_in'])) {
            $this->json(['error' => 'Non autorisé'], 403);
            return;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input) || empty((int)($input['ticket_id'] ?? 0)) || empty(trim($input['reponse'] ?? ''))) {
            $this->json(['error' => 'Champs requis'], 400);
            return;
        }
        if (mb_strlen($input['reponse']) > 5000) {
            $this->json(['error' => 'Réponse trop longue (max 5000)'], 400);
            return;
        }
        $db = \App\Service\Database::getConnection();
        $stmt = $db->prepare("UPDATE tickets_support SET reponse = ?, reponse_at = ?, statut = 'répondu' WHERE id = ?");
        $stmt->execute([trim($input['reponse']), date('Y-m-d H:i:s'), (int)$input['ticket_id']]);
        if ($stmt->rowCount() === 0) {
            $this->json(['error' => 'Ticket introuvable'], 404);
            return;
        }
        $this->json(['message' => 'Réponse enregistrée']);
    }

    public function __construct() {
        $isAdmin = isset($_SESSION['admin_logged_in'])
            || (!empty($_SESSION['client_id']) && ($_SESSION['role'] ?? 'client') === 'admin'); // Lane #4 : rôle admin
        if (!$isAdmin) {
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
            // L012 — sécurité réelle : la mise à jour du modèle de contrat exige
            // une session OTP déverrouillée il y a MOINS de 10 minutes. Même en
            // appelant l'API directement (sans passer par le front), sans OTP
            // vérifié la modification est refusée.
            $unlockedAt = (int)($_SESSION['template_edit_unlocked'] ?? 0);
            if ($unlockedAt <= 0 || (time() - $unlockedAt) > 600) {
                AuditLogger::log('TEMPLATE_UPDATE_BLOCKED', $_SESSION['admin_id'] ?? null, 'admin', 'Tentative sans OTP valide');
                $this->json(['error' => 'OTP requis'], 403);
                return;
            }

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
                // L012 : après succès, on referme la porte — l'OTP a été consommé.
                OtpService::clear((int)($_SESSION['admin_id'] ?? 0), 'admin');
                unset($_SESSION['template_edit_unlocked']);
                $this->json(['message' => 'Template mis à jour']);
                return;
            }
            OtpService::clear((int)($_SESSION['admin_id'] ?? 0), 'admin');
            unset($_SESSION['template_edit_unlocked']);
            header('Location: /admin');
        } catch (\Exception $e) {
            error_log('Update template error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    // =========================================================
    // L012 — Éditeur du modèle de contrat avec vérification OTP admin
    // =========================================================

    // GET /api/admin/template — contenu HTML du modèle (admin uniquement,
    // garantit par le constructeur : 403 si pas de session admin).
    public function getTemplate() {
        try {
            $db = Database::getConnection();
            $tpl = $db->query("SELECT id, name, content, updated_at FROM contract_templates WHERE name = 'contract'")->fetch();
            if (!$tpl) {
                $this->json(['error' => 'Modèle de contrat introuvable'], 404);
                return;
            }
            $this->json([
                'id' => (int)$tpl['id'],
                'name' => $tpl['name'],
                'content' => (string)$tpl['content'],
                'updated_at' => $tpl['updated_at'],
                'unlocked' => isset($_SESSION['template_edit_unlocked'])
                    && (time() - (int)$_SESSION['template_edit_unlocked']) <= 600
            ]);
        } catch (\Exception $e) {
            error_log('Get template error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    // POST /api/admin/template/otp-request — génère un OTP 6 chiffres pour
    // l'admin connecté et l'envoie à SON email ($_SESSION['admin_email']).
    // Le code ne JAMAIS apparaître dans la réponse API : en local sans SMTP,
    // fallback error_log '[OTP-ADMIN-DEV]' (pattern AuthController L187-197).
    public function templateOtpRequest() {
        try {
            $adminId = (int)($_SESSION['admin_id'] ?? 0);
            $adminEmail = (string)($_SESSION['admin_email'] ?? '');
            if ($adminId <= 0 || $adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
                $this->json(['error' => 'Session admin invalide'], 403);
                return;
            }

            $otp = OtpService::generate($adminId, 'admin');

            $sent = false;
            try {
                $sent = (new NotificationService())->sendOtpAdmin($adminEmail, $otp);
            } catch (\Exception $mailEx) {
                error_log('OTP admin mail envoi échoué: ' . $mailEx->getMessage());
            }
            if (!$sent) {
                // SMTP non configuré (local) : le code reste côté serveur, dans
                // les logs PHP du conteneur — consultable pour l'E2E, jamais
                // exposé dans la réponse HTTP.
                error_log('[OTP-ADMIN-DEV] code pour ' . $adminEmail . ' : ' . $otp);
            }

            AuditLogger::log('TEMPLATE_OTP_SENT', $adminId, 'admin', 'Email: ' . $adminEmail . ($sent ? ' (SMTP)' : ' (fallback log)'));

            // Email masqué a***@domain.tld — jamais l'email complet ni le code.
            $masked = preg_replace('/^(.).*(@.*)$/', '$1***$2', $adminEmail);
            $this->json(['sent' => true, 'email' => $masked]);
        } catch (\Exception $e) {
            error_log('Template OTP request error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    // POST /api/admin/template/otp-verify — vérifie l'OTP (scope admin,
    // rate-limit 5 tentatives puis clear) ; si OK pose
    // $_SESSION['template_edit_unlocked'] = time() (validité 10 min).
    public function templateOtpVerify() {
        try {
            $adminId = (int)($_SESSION['admin_id'] ?? 0);
            if ($adminId <= 0) {
                $this->json(['error' => 'Session admin invalide'], 403);
                return;
            }
            $input = json_decode(file_get_contents('php://input'), true);
            $otp = isset($input['otp']) ? preg_replace('/\D/', '', (string)$input['otp']) : '';
            if (strlen($otp) !== 6) {
                $this->json(['error' => 'Code à 6 chiffres requis'], 400);
                return;
            }

            // Rate-limit : 5 mauvaises tentatives max, au-delà le code est purgé
            // (pattern login_throttle ; il faut re-demander un nouvel OTP).
            $_SESSION['template_otp_attempts'] = (int)($_SESSION['template_otp_attempts'] ?? 0);
            if ($_SESSION['template_otp_attempts'] >= 5) {
                OtpService::clear($adminId, 'admin');
                unset($_SESSION['template_otp_attempts']);
                AuditLogger::log('TEMPLATE_OTP_LOCKED', $adminId, 'admin', '5 tentatives invalides');
                $this->json(['error' => 'Trop de tentatives. Demandez un nouveau code.'], 429);
                return;
            }

            if (!OtpService::verify($adminId, $otp, 'admin')) {
                $_SESSION['template_otp_attempts']++;
                AuditLogger::log('TEMPLATE_OTP_FAILED', $adminId, 'admin', 'Tentative ' . $_SESSION['template_otp_attempts'] . '/5');
                $remaining = 5 - (int)$_SESSION['template_otp_attempts'];
                $this->json(['error' => 'Code invalide', 'attempts_remaining' => max(0, $remaining)], 400);
                return;
            }

            // Succès : déverrouillage 10 minutes + reset du compteur.
            $_SESSION['template_edit_unlocked'] = time();
            unset($_SESSION['template_otp_attempts']);
            OtpService::clear($adminId, 'admin');
            AuditLogger::log('TEMPLATE_OTP_VERIFIED', $adminId, 'admin', 'Édition modèle déverrouillée 10 min');
            $this->json(['unlocked' => true, 'expires_in' => 600]);
        } catch (\Exception $e) {
            error_log('Template OTP verify error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    // Lane audit: listes complètes pour le dashboard admin (uniquement depuis la DB)
    public function lists() {
        try {
            $db = Database::getConnection();

            $clients = $db->query("SELECT id, nom, entreprise, email, telephone, date_inscription FROM clients ORDER BY id DESC LIMIT 200")->fetchAll();
            $abonnements = $db->query("SELECT a.id, a.client_id, c.nom AS client_nom, c.entreprise, a.pack, a.prix, a.date_debut, a.date_fin, a.statut FROM abonnements a JOIN clients c ON c.id = a.client_id ORDER BY a.id DESC LIMIT 200")->fetchAll();
            $paiements = $db->query("SELECT p.id, p.client_id, c.nom AS client_nom, c.entreprise, p.montant, p.mode_paiement, p.transaction_id, p.date, p.statut FROM paiements p LEFT JOIN clients c ON c.id = p.client_id ORDER BY p.id DESC LIMIT 200")->fetchAll();
            $courriers = $db->query("SELECT co.id, co.client_id, c.nom AS client_nom, c.entreprise, co.date_reception, co.scan, co.statut FROM courriers co LEFT JOIN clients c ON c.id = co.client_id ORDER BY co.id DESC LIMIT 200")->fetchAll();
            $contrats = $db->query("SELECT ct.id, ct.client_id, c.nom AS client_nom, c.entreprise, ct.type, ct.fichier, ct.date_signature FROM contrats ct LEFT JOIN clients c ON c.id = ct.client_id ORDER BY ct.id DESC LIMIT 200")->fetchAll();
            $kyc = $db->query("SELECT k.id, k.client_id, c.nom AS client_nom, c.entreprise, k.piece_identite, k.justificatif_domicile, k.statuts, k.date_soumission FROM kyc k JOIN clients c ON c.id = k.client_id ORDER BY k.id DESC LIMIT 200")->fetchAll();
            $tickets = $db->query("SELECT t.*, c.nom AS client_nom FROM tickets_support t JOIN clients c ON c.id = t.client_id ORDER BY t.created_at DESC LIMIT 100")->fetchAll();
            $messages = $db->query("SELECT m.id, m.sender_id, m.sender_type, m.receiver_id, m.content, m.is_read, m.created_at, c.nom AS client_nom, c.entreprise FROM internal_messages m LEFT JOIN clients c ON c.id = m.sender_id ORDER BY m.created_at DESC LIMIT 100")->fetchAll();

            // L011 — Cohérence d'état : doc_exists = le fichier existe RÉELLEMENT
            // sur le disque. L'UI n'affiche « Consulter/Voir » que si true (le clic
            // re-vérifie via /api/admin/document-info, race-proof).
            // Contrats : storage/documents/ ; courriers + KYC : storage/uploads/.
            $base = realpath(__DIR__ . '/../../storage');
            $uploadsBase = $base !== false ? $base . DIRECTORY_SEPARATOR . 'uploads' : '';
            $fileExists = function ($relPath, $uploadsFirst) use ($base, $uploadsBase) {
                if ($base === false || !is_string($relPath) || $relPath === '' || strpos($relPath, '..') !== false) return false;
                $candidates = $uploadsFirst ? [$uploadsBase, $base] : [$base, $uploadsBase];
                foreach ($candidates as $cb) {
                    if ($cb === '') continue;
                    $resolved = realpath($cb . DIRECTORY_SEPARATOR . $relPath);
                    if ($resolved !== false && strpos($resolved, $base . DIRECTORY_SEPARATOR) === 0 && is_file($resolved)) return true;
                }
                return false;
            };
            foreach ($courriers as &$co) {
                $co['doc_exists'] = !empty($co['scan']) && $fileExists($co['scan'], true);
            }
            unset($co);
            foreach ($contrats as &$ct) {
                $ct['doc_exists'] = !empty($ct['fichier']) && $fileExists($ct['fichier'], false);
            }
            unset($ct);
            foreach ($kyc as &$k) {
                $k['doc_exists_identite'] = !empty($k['piece_identite']) && $fileExists($k['piece_identite'], true);
                $k['doc_exists_justificatif'] = !empty($k['justificatif_domicile']) && $fileExists($k['justificatif_domicile'], true);
                $k['doc_exists'] = $k['doc_exists_identite'] || $k['doc_exists_justificatif'];
            }
            unset($k);

            $this->json([
                'clients' => $clients,
                'abonnements' => $abonnements,
                'paiements' => $paiements,
                'courriers' => $courriers,
                'contrats' => $contrats,
                'kyc' => $kyc,
                'tickets' => $tickets,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            error_log('Admin lists error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
