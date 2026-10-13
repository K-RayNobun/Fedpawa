<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;
use App\Service\MailService;

class InternalMailController extends Controller {
    public function send() {
        try {
            if (!isset($_SESSION['client_id'])) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty(trim($input['content'] ?? ''))) {
                $this->json(['error' => 'Message vide'], 400);
                return;
            }

            $service = new MailService();
            $service->send($_SESSION['client_id'], 'client', null, 'admin', trim($input['content']));

            AuditLogger::log('MAIL_SENT', $_SESSION['client_id'], 'client', 'To admin');
            $this->json(['message' => 'Message envoyé']);
        } catch (\Exception $e) {
            error_log('Mail send error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    public function reply() {
        try {
            if (!(isset($_SESSION['admin_logged_in']) || (!empty($_SESSION['client_id']) && ($_SESSION['role'] ?? 'client') === 'admin'))) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input) || empty($input['client_id']) || empty(trim($input['content'] ?? ''))) {
                $this->json(['error' => 'Champs manquants'], 400);
                return;
            }

            // Vérifier que le client existe
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT id FROM clients WHERE id = ?");
            $stmt->execute([(int)$input['client_id']]);
            if (!$stmt->fetch()) {
                $this->json(['error' => 'Client introuvable'], 404);
                return;
            }

            $service = new MailService();
            $service->send($_SESSION['admin_id'] ?? null, 'admin', (int)$input['client_id'], 'client', trim($input['content']));

            AuditLogger::log('MAIL_REPLIED', (int)$input['client_id'], 'admin', 'Reply sent');
            $this->json(['message' => 'Réponse envoyée']);
        } catch (\Exception $e) {
            error_log('Mail reply error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }

    // Fil de discussion visible par le client dans son Espace Client
    public function thread() {
        try {
            if (!isset($_SESSION['client_id'])) {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            $service = new MailService();
            $this->json(['data' => $service->getThread((int)$_SESSION['client_id'])]);
        } catch (\Exception $e) {
            error_log('Mail thread error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
