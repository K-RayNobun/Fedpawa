<?php
require_once __DIR__ . '/../src/bootstrap.php';

// Simuler une requête POST
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/souscription';

// Simuler le corps de la requête
$json = json_encode([
    'nom' => 'Test Client',
    'entreprise' => 'FedPawa Test',
    'email' => 'test@fedpawa.test',
    'pack' => 'Business'
]);
file_put_contents('php://input', $json);

$router = new App\Router();
$router->post('/api/souscription', 'SubscriptionController@process');
$router->dispatch($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD']);
