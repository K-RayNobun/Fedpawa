<?php
/**
 * Export statique du site pour hébergement sans PHP (GitHub Pages).
 *
 * Usage : php build_static.php
 * Crée dist/ contenant les pages vitrine pré-rendues en HTML statique.
 *
 * NB : les fonctionnalités serveur (connexion, souscription, paiements,
 * espace client) ne sont pas fonctionnelles dans cet export — aperçu uniquement.
 */

$root    = __DIR__;
$public  = $root . '/public';
$dist    = $root . '/dist';

const DEMO_BANNER = '<div style="position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(28,28,28,.88);color:#fff;padding:9px 18px;border-radius:999px;font:600 12px/1 \'Open Sans\',Arial,sans-serif;letter-spacing:.03em;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35);">Aperçu démo statique — inscriptions et paiements désactivés</div>';

function rewrite_links(string $html): string {
    $html = preg_replace('#href="([a-z_-]+)\.php"#',            'href="$1.html"',           $html);
    $html = preg_replace('#href="([a-z_-]+)\.php\?([^"]*)"#',    'href="$1.html?$2"',        $html);
    $html = preg_replace('~href="([a-z_-]+)\.php(#[^"]*)"~', 'href="$1.html$2"', $html);
    $html = preg_replace('#action="([a-z_-]+)\.php"#',          'action="$1.html"',         $html);
    return $html;
}

function add_banner(string $html): string {
    return str_replace('</body>', DEMO_BANNER . '</body>', $html);
}

function rcopy(string $src, string $dst): void {
    @mkdir($dst, 0777, true);
    foreach (scandir($src) ?: [] as $f) {
        if ($f === '.' || $f === '..' || $f === '.DS_Store') continue;
        $s = "$src/$f"; $d = "$dst/$f";
        is_dir($s) ? rcopy($s, $d) : copy($s, $d);
    }
}

// --- Nettoyage ----------------------------------------------------------------
if (is_dir($dist)) {
    foreach (scandir($dist) ?: [] as $f) {
        if ($f === '.' || $f === '..') continue;
        is_dir("$dist/$f") ? system("rm -rf " . escapeshellarg("$dist/$f")) : unlink("$dist/$f");
    }
}
if (!is_dir($dist)) {
    mkdir($dist, 0777, true);
}

// --- 1. Pages PHP rendues en HTML ---------------------------------------------
$pages = [
    'index.html'               => null, // accueil : rendu direct via partiels
    'domiciliation.html'       => 'domiciliation.php',
    'creation_entreprise.html' => 'creation_entreprise.php',
    'fiscalite.html'           => 'fiscalite.php',
    'oapi.html'                => 'oapi.php',
    'contrats.html'            => 'contrats.php',
    'contact.html'             => 'contact.php',
    'qui-sommes-nous.html'     => 'qui-sommes-nous.php',
    'tunnel_souscription.html' => 'tunnel_souscription.php',
];

foreach ($pages as $out => $src) {
    ob_start();
    if ($src === null) {
        $active = 'index';
        include $root . '/templates/partials/site-header.php';
        include $root . '/templates/pages/home.php';
        include $root . '/templates/partials/site-footer.php';
    } else {
        include $public . '/' . $src;
    }
    $html = add_banner(rewrite_links((string) ob_get_clean()));
    file_put_contents($dist . '/' . $out, $html);
    echo "  ✓ $out\n";
}

// --- 2. Pages déjà statiques (copie + réécriture des liens .php) -------------
foreach (['authentification.html', 'mot_de_passe_oublie.html', 'espace_client.html', 'admin_dashboard.html'] as $f) {
    $html = file_get_contents($public . '/' . $f);
    if ($html === false) continue;
    file_put_contents($dist . '/' . $f, add_banner(rewrite_links($html)));
    echo "  ✓ $f (copie)\n";
}

// --- 3. Assets -----------------------------------------------------------------
rcopy($public . '/assets', $dist . '/assets');
echo "  ✓ assets/ (css, js, images)\n";

echo "\nExport statique terminé : " . realpath($dist) . "\n";
