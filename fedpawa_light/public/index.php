<?php
require_once __DIR__ . '/../src/bootstrap.php';

$uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// ---- 1. Contrôleur frontal API ------------------------------------------
if (preg_match('#^/api(/|$)#', $uri)) {
    $router = new \App\Router();

    $router->get('/api/csrf-token', function() {
        header('Content-Type: application/json');
        echo json_encode(['csrf_token' => \App\Controller\Controller::getCsrfToken()]);
    });

    $router->post('/api/souscription', 'SubscriptionController@process');
    $router->post('/api/signature', 'SubscriptionController@finalize');
    $router->post('/api/login', 'AuthController@login');
    $router->post('/api/register', 'AuthController@register');
    $router->post('/api/password/request', 'AuthController@requestPasswordReset');
    $router->post('/api/password/verify', 'AuthController@verifyOtp');
    $router->post('/api/password/reset', 'AuthController@resetPassword');
    $router->get('/api/dashboard', 'DashboardController@index');
    $router->get('/api/courriers', 'CourrierController@index');
    $router->get('/api/factures', 'FactureController@index');
    $router->post('/api/support', 'SupportController@store');

    $router->get('/api/admin/overview', 'AdminController@overview');
    $router->post('/api/admin/kyc/approve', 'AdminController@approveKyc');
    $router->post('/api/admin/kyc/reject', 'AdminController@rejectKyc');

    $router->post('/api/webhooks/campay', 'WebhookController@handleCampay');

    $router->dispatch($uri, $method);
    return;
}

// ---- 2. Serveur PHP intégré : laisser servir les fichiers réels ----------
// (assets, autres pages .php). En production Apache, c'est .htaccess qui gère.
if (PHP_SAPI === 'cli-server' && $uri !== '/' && $uri !== '/index.php') {
    $file = realpath(__DIR__ . $uri);
    if ($file !== false && $file !== __FILE__ && is_file($file)) {
        return false;
    }
}

// ---- 3. Page d'accueil / 404 -----------------------------------------------
if ($uri !== '/' && $uri !== '/index.php') {
    http_response_code(404);
    $title = 'Page introuvable | FEDPAWA CORPORATE SOLUTIONS';
    $active = '';
    include __DIR__ . '/../templates/partials/site-header.php';
    ?>
    <section class="section-padding">
      <div class="container" style="text-align:center; padding: 80px 0;">
        <h1 style="font-size: 3rem; margin-bottom: 12px;">404</h1>
        <p style="color: var(--color-text-muted); margin-bottom: 24px;">La page demandée n'existe pas ou a été déplacée.</p>
        <a class="btn btn-primary" href="index.php">Retour à l'accueil</a>
      </div>
    </section>
    <?php
    include __DIR__ . '/../templates/partials/site-footer.php';
    return;
}

$active = 'index';
include __DIR__ . '/../templates/partials/site-header.php';
include __DIR__ . '/../templates/pages/home.php';
include __DIR__ . '/../templates/partials/site-footer.php';
