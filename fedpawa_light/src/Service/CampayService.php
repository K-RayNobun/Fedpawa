<?php
namespace App\Service;

class CampayService {
    private string $baseUrl;
    private string $username;
    private string $password;

    public function __construct() {
        $this->baseUrl = 'https://api.campay.net';
        $this->username = getenv('CAMPAY_USER') ?: 'test_user';
        $this->password = getenv('CAMPAY_PASSWORD') ?: 'test_pass';
    }

    private function log(string $message) {
        file_put_contents(__DIR__ . '/../../storage/logs/campay.log', date('[Y-m-d H:i:s] ') . $message . PHP_EOL, FILE_APPEND);
    }

    public function getToken(): string {
        // En prod : Appel curl vers /api/get_token
        // Pour l'instant, on simule pour permettre le développement
        return "mock_token_" . time();
    }

    public function collect(float $amount, string $phone, string $reference) {
        $this->log("Tentative collecte: $amount XAF, Phone: $phone, Ref: $reference");
        
        // Simuler l'appel API
        return [
            'status' => 'PENDING',
            'reference' => $reference,
            'transaction_id' => uniqid('cp_')
        ];
    }

    public function checkStatus(string $transactionId) {
        $this->log("Vérification statut transaction: $transactionId");
        
        // Simuler l'appel à l'API de vérification
        return [
            'status' => 'SUCCESSFUL',
            'transaction_id' => $transactionId
        ];
    }
}
