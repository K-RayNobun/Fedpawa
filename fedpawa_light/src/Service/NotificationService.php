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

    private function send(string $email, string $subject, string $htmlBody) {
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
}
