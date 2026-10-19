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
    $router->post('/api/paiement/verifier', 'SubscriptionController@verifyPayment');
    // L018 — aperçu HTML intégral du contrat (client propriétaire ou admin)
    $router->get('/api/contract/preview', 'SubscriptionController@preview');
    // L022 — téléchargement du contrat PDF avant signature (même garde que preview)
    $router->get('/api/contract/download', 'SubscriptionController@download');
    $router->post('/api/login', 'AuthController@login');
    $router->post('/api/logout', 'AuthController@logout');
    $router->post('/api/register', 'AuthController@register');
    $router->post('/api/contact', 'ContactController@store');
    $router->post('/api/password/request', 'AuthController@requestPasswordReset');
    $router->post('/api/password/verify', 'AuthController@verifyOtp');
    $router->post('/api/password/reset', 'AuthController@resetPassword');
    $router->get('/api/dashboard', 'DashboardController@index');
    $router->post('/api/profil/update', 'DashboardController@updateProfile');
    // Lane #4 : état de session (rôle) pour les gardes d'accès côté navigateur
    $router->get('/api/me', function() {
        header('Content-Type: application/json');
        \App\Controller\Controller::getCsrfToken(); // s'assure qu'une session existe
        if (isset($_SESSION['admin_logged_in'])) {
            // Session du portail admin (table admins) : admin authentifié
            echo json_encode(['authenticated' => true, 'role' => 'admin', 'name' => 'Administration', 'email' => $_SESSION['admin_email'] ?? '']);
        } elseif (!isset($_SESSION['client_id'])) {
            echo json_encode(['authenticated' => false]);
        } else {
            // kyc_status : dernier dossier KYC du client (null si jamais soumis)
            // — permet au tunnel de sauter l'étape KYC si déjà fait dans l'espace client
            try {
                $kycDb = \App\Service\Database::getConnection();
                $kycStmt = $kycDb->prepare("SELECT statuts FROM kyc WHERE client_id = ? ORDER BY id DESC LIMIT 1");
                $kycStmt->execute([$_SESSION['client_id']]);
                $kycStatus = $kycStmt->fetchColumn() ?: null;
            } catch (\Throwable $kycErr) {
                $kycStatus = null; // dégradation gracieuse : on affiche l'étape KYC
            }
            echo json_encode([
                'authenticated' => true,
                'role' => $_SESSION['role'] ?? 'client',
                'name' => $_SESSION['client_name'] ?? '',
                'email' => $_SESSION['client_email'] ?? '',
                'kyc_status' => $kycStatus
            ]);
        }
    });
    $router->get('/api/courriers', 'CourrierController@index');
    $router->post('/api/courrier/upload', 'CourierController@upload');
    $router->get('/api/factures', 'FactureController@index');
    $router->post('/api/support', 'SupportController@store');
    $router->get('/api/support/tickets', 'SupportController@myTickets');
    $router->post('/api/kyc/submit', 'KycController@submit');
    $router->get('/api/mail/thread', 'InternalMailController@thread');
    $router->post('/api/mail/send', 'InternalMailController@send');
    $router->post('/api/mail/reply', 'InternalMailController@reply');
    $router->get('/api/document', 'StorageController@serve');

    // Admin
    $router->post('/api/admin/login', 'AuthController@adminLogin');
    $router->post('/api/admin/password', 'AuthController@updateAdminPassword');
    $router->get('/api/admin/overview', 'AdminController@overview');
    $router->get('/api/admin/lists', 'AdminController@lists');
    // L011 : métadonnées d'un document (existe, taille, mime, client, date) — admin uniquement
    $router->get('/api/admin/document-info', 'StorageController@documentInfo');
    $router->post('/api/admin/kyc/approve', 'KycController@approve');
    $router->post('/api/admin/kyc/reject', 'KycController@reject');
    $router->post('/api/admin/ticket/reply', 'AdminController@ticketReply');
    // L012 : éditeur du modèle de contrat — lecture + flux OTP admin
    $router->get('/api/admin/template', 'AdminController@getTemplate');
    $router->post('/api/admin/template/otp-request', 'AdminController@templateOtpRequest');
    $router->post('/api/admin/template/otp-verify', 'AdminController@templateOtpVerify');
    $router->post('/api/admin/template/update', 'AdminController@updateTemplate');
    $router->post('/api/admin/courrier/add', 'CourrierController@add');
    $router->post('/api/admin/throttle/clear', 'AdminController@clearThrottle');

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
// W-2 : /en (et /en/) doit servir l'accueil anglais, pas un 404
if ($uri === '/en' || $uri === '/en/') {
    header('Location: /en/index.php', true, 301);
    return;
}

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
