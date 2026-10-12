<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// Session Security Hardening
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.use_strict_mode', '1');
    session_start();
}

// Expiration forcée après 1h30 d'inactivité (5400 s)
define('SESSION_TIMEOUT', 5400);
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT)) {
    session_unset();
    session_destroy();
    session_start();
    $_SESSION['session_expired'] = true;
}
$_SESSION['last_activity'] = time();

// Automatic Database Migration / Schema Setup
\App\Service\MigrationRunner::migrate();
