<?php
namespace App\Service;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

class NotificationService {
    private function getMailer(): PHPMailer {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.example.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('SMTP_USER') ?: 'user@example.com';
        $mail->Password   = getenv('SMTP_PASS') ?: 'password';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = getenv('SMTP_PORT') ?: 587;
        $mail->setFrom(getenv('MAIL_FROM') ?: 'no-reply@fedpawa.com', 'FEDPAWA');
        return $mail;
    }

    private function isConfigured(): bool {
        $host = getenv('SMTP_HOST');
        return $host !== false && $host !== '' && !str_contains($host, 'example.com');
    }

    private function send(string $email, string $subject, string $htmlBody) {
        // Audit: sans SMTP configuré, on n'essaie pas la connexion (évite un timeout
        // de plusieurs secondes à chaque signature/finalisation). Les notifications
        // reprendront dès que SMTP_HOST/USER/PASS seront définis dans l'environnement.
        if (!$this->isConfigured()) {
            error_log('NotificationService: SMTP non configuré (SMTP_HOST absent ou placeholder) — e-mail non envoyé à ' . $email);
            return false;
        }
        $mail = null;
        try {
            $mail = $this->getMailer();
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->send();
            return true;
        } catch (PHPMailerException $e) {
            $info = $mail ? $mail->ErrorInfo : 'mailer init failed';
            error_log("Message could not be sent. Mailer Error: {$info}");
            return false;
        }
    }

    public function sendRenewalReminder(string $email, string $clientName) {
        return $this->send(
            $email,
            'Rappel: Votre abonnement',
            "Bonjour <strong>" . htmlspecialchars($clientName) . "</strong>,<br>Votre abonnement expire bientôt."
        );
    }

    public function sendWelcomeEmail(string $email, string $clientName) {
        return $this->send(
            $email,
            'Bienvenue chez FEDPAWA',
            "Bonjour <strong>" . htmlspecialchars($clientName) . "</strong>,<br>Bienvenue chez FEDPAWA Corporate Solutions. Votre souscription est en cours de finalisation."
        );
    }

    public function sendOtp(string $email, string $code) {
        return $this->send(
            $email,
            'Votre code de réinitialisation FEDPAWA',
            "Votre code de réinitialisation est : <strong>" . htmlspecialchars($code) . "</strong><br>Il expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
        );
    }

    // L012 : OTP de vérification admin (édition du modèle de contrat).
    // Même canal SMTP ; le fallback error_log [OTP-ADMIN-DEV] est géré par
    // l'appelant (AdminController) quand SMTP n'est pas configuré (retour false).
    public function sendOtpAdmin(string $email, string $code) {
        return $this->send(
            $email,
            'FEDPAWA — Code de vérification admin',
            "Votre code de vérification pour la modification du modèle de contrat est : <strong>" . htmlspecialchars($code) . "</strong><br>Il expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement le support."
        );
    }

    public function sendContactNotification(string $dest, string $sujet, string $nom, string $email, string $telephone, string $message) {
        return $this->send(
            $dest,
            'Nouveau message de contact — ' . $sujet,
            "Nom : " . htmlspecialchars($nom) . "<br>E-mail : " . htmlspecialchars($email) .
            "<br>Téléphone : " . htmlspecialchars($telephone) .
            "<br><br>" . nl2br(htmlspecialchars($message))
        );
    }
}
