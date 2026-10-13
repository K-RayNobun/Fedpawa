#!/bin/bash
# Fedpawa — nettoyage pre-production de la base de test
# Usage: ./clean-test-data.sh <conteneur>   (défaut: fedpawa-api-test)
# Supprime TOUTES les donnees de test/e2e, garde les comptes reels et l'admin reel.
set -euo pipefail
CT="${1:-fedpawa-api-test}"

echo "=== Nettoyage pre-production (conteneur: $CT) ==="
docker exec "$CT" php -r '
$pdo = new PDO("sqlite:/app/storage/fedpawa.sqlite");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->beginTransaction();

// 1. Emails de test/e2e (prefixes utilises par les suites)
$pat = ["%@test-fedpawa.cm", "%test@fedpawa.com", "%audit-e2e%", "%@fedpawa-test.com", "%curl-test%"];
$ids = [];
foreach ($pat as $p) {
    foreach ($pdo->query("SELECT id FROM clients WHERE email LIKE " . $pdo->quote($p))->fetchAll() as $r) $ids[] = (int)$r["id"];
}
// clients issus des anciens tests (live_, hdr_, rst_, cases_, dbg-, pay-, dompay-)
foreach ($pdo->query("SELECT id, email FROM clients")->fetchAll() as $c) {
    if (preg_match("/^(live_|hdr_|rst_|cases_|dbg-|pay-|dompay-)/", $c["email"])) $ids[] = (int)$c["id"];
}
$ids = array_values(array_unique($ids));

// admin de test E2E (le vrai admin mme.law@ est conserve)
$pdo->prepare("DELETE FROM admins WHERE email = ?")->execute(["audit-e2e@fedpawa.com"]);

if ($ids) {
    $in = implode(",", $ids);
    foreach (["abonnements", "paiements", "factures", "contrats", "courriers", "kyc", "tickets_support", "internal_messages", "password_resets", "audit_log"] as $t) {
        $n = $pdo->exec("DELETE FROM $t WHERE client_id IN ($in)");
        echo "$t: $n supprimes\n";
    }
    $n = $pdo->exec("DELETE FROM clients WHERE id IN ($in)");
    echo "clients: $n supprimes\n";
} else {
    echo "clients: aucun a supprimer\n";
}

$pdo->commit();
echo "Restants: clients=" . $pdo->query("SELECT COUNT(*) FROM clients")->fetchColumn()
    . " abonnements=" . $pdo->query("SELECT COUNT(*) FROM abonnements")->fetchColumn()
    . " paiements=" . $pdo->query("SELECT COUNT(*) FROM paiements")->fetchColumn()
    . " contrats=" . $pdo->query("SELECT COUNT(*) FROM contrats")->fetchColumn()
    . " admins=" . $pdo->query("SELECT COUNT(*) FROM admins")->fetchColumn() . "\n";
'
echo "=== Fait. Verifiez les compteurs ci-dessus avant le go-production. ==="
