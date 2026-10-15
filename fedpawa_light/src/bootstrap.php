<?php


// Lane contrat : lecture d'environnement robuste (getenv peut ne pas voir
// les variables docker run -e selon le SAPI ; on complète avec $_SERVER/$_ENV)
if (!function_exists('fedpawa_env')) {
    function fedpawa_env(string $name, string $default = ''): string {
        $v = getenv($name);
        if ($v !== false && $v !== '') return $v;
        if (!empty($_SERVER[$name])) return (string)$_SERVER[$name];
        if (!empty($_ENV[$name])) return (string)$_ENV[$name];
        return $default;
    }
}
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// ==========================================================
// GlobalErrorHandler : aucune trace technique exposée à l'utilisateur
// ==========================================================
$APP_DEBUG = getenv('APP_DEBUG') === 'true';

ini_set('display_errors', '0');
error_reporting(E_ALL);

function fedpawa_log_error(string $message): void {
    $dir = __DIR__ . '/../storage/logs';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dir . '/php_errors.log', date('[Y-m-d H:i:s] ') . $message . PHP_EOL, FILE_APPEND);
}

function fedpawa_error_response(string $safeMessage = 'Erreur interne du serveur'): void {
    global $APP_DEBUG;
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (!headers_sent() && preg_match('#^/api(/|$)#', $uri ?? '')) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $safeMessage]);
    } else {
        http_response_code(500);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Erreur</title></head>'
           . '<body style="font-family:sans-serif;text-align:center;padding:80px 20px;">'
           . '<h1>Une erreur est survenue</h1>'
           . '<p style="color:#777;">Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.</p>'
           . '<p><a href="/" style="color:#15294D;">Retour à l\'accueil</a></p>'
           . ($APP_DEBUG ? '<pre style="text-align:left;background:#f5f5f5;padding:15px;max-width:900px;margin:30px auto;">' . htmlspecialchars(fedpawa_last_error()) . '</pre>' : '')
           . '</body></html>';
    }
    exit;
}

function fedpawa_last_error(): string {
    global $fedpawa_last_error;
    return $fedpawa_last_error ?? 'n/a';
}

set_exception_handler(function (\Throwable $e) {
    global $fedpawa_last_error, $APP_DEBUG;
    $fedpawa_last_error = get_class($e) . ' : ' . $e->getMessage() . "\n" . $e->getTraceAsString();
    fedpawa_log_error('UNCAUGHT EXCEPTION: ' . $fedpawa_last_error);
    fedpawa_error_response();
});

set_error_handler(function (int $severity, string $message, string $file = '', int $line = 0): bool {
    // Les erreurs supprimées par @ sont ignorées
    if (!(error_reporting() & $severity)) return false;
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        global $fedpawa_last_error;
        $fedpawa_last_error = 'FATAL: ' . $error['message'] . ' in ' . $error['file'] . ':' . $error['line'];
        fedpawa_log_error('SHUTDOWN FATAL: ' . $fedpawa_last_error);
        fedpawa_error_response();
    }
});

// ==========================================================
// Session Security Hardening
// ==========================================================
// Durée de session : l'utilisateur reste connecté jusqu'à 3 jours (259 200 s)
// d'inactivité, ou jusqu'à sa déconnexion explicite. Le cookie de session vit
// aussi 3 jours pour que le navigateur le conserve entre les visites.
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    // Site et API same-origin (api.fedpawa.com) : Lax suffit et fonctionne aussi
    // en local http (SameSite=None; Secure cassait la session sur le conteneur
    // de test http://127.0.0.1:18081)
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_lifetime', '259200');
    ini_set('session.gc_maxlifetime', '259200');
    // Secure uniquement si la requête est servie en https (prod) — pas en local http.
    if (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
        ini_set('session.cookie_secure', '1');
    }
    ini_set('session.use_strict_mode', '1');
    session_start();
}

// Expiration forcée après 3 jours d'inactivité (259 200 s)
define('SESSION_TIMEOUT', 259200);
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT)) {
    session_unset();
    session_destroy();
    session_start();
    $_SESSION['session_expired'] = true;
}
$_SESSION['last_activity'] = time();

// Automatic Database Migration / Schema Setup
\App\Service\MigrationRunner::migrate();
