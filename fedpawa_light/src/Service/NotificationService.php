<?php
namespace App\Service;

class NotificationService {
    // ... méthode existante ...

    public function sendRenewalReminder(string $email, string $clientName) {
        mail($email, "Rappel: Votre abonnement", "Bonjour $clientName, votre abonnement expire bientôt.");
    }
}
