<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// Session Security Hardening
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    // API cross-site (GitHub Pages -> api.fedpawa.com) : cookie SameSite=None; Secure, sinon le navigateur ne renvoie pas la session
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure', '1');
    ini_set('session.use_strict_mode', '1');
    session_start();
}

// Automatic Database Migration / Schema Setup
\App\Service\MigrationRunner::migrate();
