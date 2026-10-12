<?php
// /public/cron.php
// Script à appeler par le serveur (cron job) :
//   - CLI  : php public/cron.php            (aucun secret requis)
//   - HTTP : wget -qO- 'https://site/cron.php?key=CRON_SECRET'  (CRON_SECRET défini dans .env)
require_once __DIR__ . '/../src/bootstrap.php';

use App\Service\Database;
use App\Service\NotificationService;
use App\Service\AuditLogger;

// Protection anti-appel externe : le secret est requis en HTTP, bypassé en CLI
if (php_sapi_name() !== 'cli') {
    $secret = getenv('CRON_SECRET') ?: '';
    $provided = $_GET['key'] ?? '';
    if ($secret === '' || !hash_equals($secret, $provided)) {
        AuditLogger::log('CRON_BLOCKED', null, 'system', 'Appel HTTP non autorisé sur cron.php');
        http_response_code(403);
        exit('Accès refusé');
    }
}

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

    if (!$client) continue;

    // Notification
    $notifier->sendRenewalReminder($client['email'], $client['nom']);
    echo "Rappel envoyé à " . $client['email'] . "\n";
}

echo "Cron terminé : " . count($expirants) . " rappel(s) traité(s).\n";
