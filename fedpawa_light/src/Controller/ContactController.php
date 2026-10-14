<?php
// Contact public (anonyme) — stocke le message + notifie l'admin
namespace App\Controller;

use App\Service\Database;

class ContactController extends Controller {
    public function store() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $nom = trim($input['nom'] ?? '');
            $email = trim($input['email'] ?? '');
            $telephone = trim($input['telephone'] ?? '');
            $sujet = trim($input['sujet'] ?? '');
            $message = trim($input['message'] ?? '');

            // Validation stricte
            if ($nom === '' || mb_strlen($nom) > 120) { $this->json(['error' => 'Nom invalide'], 400); return; }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) { $this->json(['error' => 'E-mail invalide'], 400); return; }
            if ($telephone !== '' && !preg_match('/^[+0-9\s().-]{6,25}$/', $telephone)) { $this->json(['error' => 'Téléphone invalide'], 400); return; }
            if ($sujet === '' || mb_strlen($sujet) > 150) { $this->json(['error' => 'Sujet requis'], 400); return; }
            if ($message === '' || mb_strlen($message) > 5000) { $this->json(['error' => 'Message requis (5000 caractères max)'], 400); return; }
            // anti-spam basique: honeypot champ caché "site" — les bots le remplissent
            if (!empty($input['site'])) { $this->json(['message' => 'Merci ! Votre message a bien été envoyé.']); return; }

            $db = Database::getConnection();
            $db->prepare("INSERT INTO contact_messages (nom, email, telephone, sujet, message, statut, date_reception)
                          VALUES (?, ?, ?, ?, ?, 'nouveau', datetime('now'))")
               ->execute([$nom, $email, $telephone, $sujet, $message]);

            // Notification admin (best effort)
            try {
                $mailer = new \App\Service\NotificationService();
                $mailer->sendContactNotification('contact@fedpawa.com', $sujet, $nom, $email, $telephone, $message);
            } catch (\Exception $mailEx) {
                error_log('Contact mail échoué: ' . $mailEx->getMessage());
            }

            $this->json(['message' => 'Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 24h ouvrées.']);
        } catch (\Exception $e) {
            error_log('Contact error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
