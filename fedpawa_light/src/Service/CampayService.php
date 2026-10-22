<?php
namespace App\Service;

class CampayService {
    private string $baseUrl;
    private string $username;
    private string $password;
    private ?string $permanentToken;

    public function __construct() {
        // L023 : mode piloté par env — demo (sandbox) ou live (prod www.campay.net)
        $mode = fedpawa_env('CAMPAY_MODE', 'demo');
        $this->baseUrl = ($mode === 'live')
            ? 'https://www.campay.net'
            : 'https://demo.campay.net';
        $this->username = fedpawa_env('CAMPAY_USER', 'test_user');
        $this->password = fedpawa_env('CAMPAY_PASSWORD', 'test_pass');
        // L023 : token permanent (APP KEYS du dashboard Campay) — prioritaire sur username/password
        $tok = fedpawa_env('CAMPAY_TOKEN', '');
        $this->permanentToken = $tok !== '' ? $tok : null;
    }

    private function log(string $message) {
        if (!is_dir(__DIR__ . '/../../storage/logs')) mkdir(__DIR__ . '/../../storage/logs', 0755, true);
        file_put_contents(__DIR__ . '/../../storage/logs/campay.log', date('[Y-m-d H:i:s] ') . $message . PHP_EOL, FILE_APPEND);
    }

    private function curl(string $endpoint, string $method = 'GET', array $data = [], string $token = ''): array {
        // Ensure trailing slash for 301 redirects
        $url = $this->baseUrl . $endpoint . '/';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        
        $headers = ['Content-Type: application/json'];
        if ($token) $headers[] = 'Authorization: Token ' . $token;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if (!empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        unset($ch);

        if ($error) throw new \Exception("Curl Error: " . $error);

        $result = json_decode($response, true) ?? [];
        if ($httpCode >= 400) {
            $this->log("Error [$httpCode] at $url: " . ($result['detail'] ?? $response));
            throw new \Exception("Campay API Error [$httpCode]: " . ($result['detail'] ?? 'Unknown'));
        }
        return $result;
    }

    public function getToken(): string {
        // L023 : token permanent fourni (APP KEYS) → pas d'appel /api/token nécessaire
        if ($this->permanentToken !== null) return $this->permanentToken;
        $data = $this->curl('/api/token', 'POST', [
            'username' => $this->username,
            'password' => $this->password
        ]);
        return $data['token'] ?? '';
    }

    public function collect(float $amount, string $phone, string $reference) {
        $token = $this->getToken();
        // L023 : conforme doc Campay — amount en entier (string), currency XAF, from = msisdn client
        $response = $this->curl('/api/collect', 'POST', [
            'amount' => (string)(int)round($amount),
            'currency' => 'XAF',
            'from' => $phone,
            'description' => 'Paiement ' . $reference,
            'external_reference' => $reference
        ], $token);
        
        $this->log("Collecte initiée: " . json_encode($response));
        return $response;
    }

    public function checkStatus(string $transactionId) {
        $token = $this->getToken();
        return $this->curl('/api/transaction/' . $transactionId, 'GET', [], $token);
    }

    // L023 : numéros marchands de réception (config env, exposition future — jamais codés en dur)
    public static function merchantNumbers(): array {
        return [
            'orange' => fedpawa_env('CAMPAY_ORANGE', '237691704802'),
            'mtn' => fedpawa_env('CAMPAY_MTN', '237650863195'),
        ];
    }
}
