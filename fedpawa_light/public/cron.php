<?php
// /public/cron.php
// Script à appeler par le serveur (cron job)
require_once __DIR__ . '/../src/autoload.php';

use App\Service\Database;
use App\Service\NotificationService;

$db = Database::getConnection();
$notifier = new NotificationService();

// Détection des abonnements expirant dans 15 jours
$stmt = $db->query("SELECT * FROM abonnements WHERE date_fin <= DATE('now', '+15 days') AND statut = 'actif'");
$expirants = $stmt->fetchAll();

foreach ($expirants as $sub) {
    // Récupérer email client
    $stmt = $db->prepare("SELECT email, nom FROM clients WHERE id = ?");
    $stmt->execute([$sub['client_id']]);
    $client = $stmt->fetch();
    
    // Notification
    $notifier->sendRenewalReminder($client['email'], $client['nom']);
    echo "Rappel envoyé à " . $client['email'] . "\n";
}
