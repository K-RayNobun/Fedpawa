<?php
namespace App\Controller;

use App\Service\MailService;

class InternalMailController extends Controller {
    public function send() {
        if (!isset($_SESSION['client_id'])) {
            $this->json(['error' => 'Non autorisé'], 403);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $service = new MailService();
        $service->send($_SESSION['client_id'], 'client', null, 'admin', $input['content']);
        $this->json(['message' => 'Message envoyé']);
    }

    public function reply() {
        if (!isset($_SESSION['admin_logged_in'])) {
            $this->json(['error' => 'Non autorisé'], 403);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $service = new MailService();
        $service->send($_SESSION['admin_id'], 'admin', $input['client_id'], 'client', $input['content']);
        $this->json(['message' => 'Réponse envoyée']);
    }
}
