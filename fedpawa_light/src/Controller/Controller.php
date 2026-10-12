<?php
namespace App\Controller;

abstract class Controller {
    protected function json(array $data, int $code = 200) {
        header('Content-Type: application/json; charset=utf-8');
        header("X-Content-Type-Options: nosniff");
        header("X-Frame-Options: SAMEORIGIN");
        header("X-XSS-Protection: 1; mode=block");
        header("Referrer-Policy: strict-origin-when-cross-origin");
        http_response_code($code);
        echo json_encode($data);
    }

    public static function getCsrfToken(): string {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    protected function validateCsrf(): bool {
        return self::validateCsrfStatic();
    }

    // Appelé par le Router avant toute action POST (hors routes exemptées)
    public static function enforceCsrf(): void {
        if (!self::validateCsrfStatic()) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Jeton CSRF invalide ou manquant']);
            exit;
        }
    }

    private static function validateCsrfStatic(): bool {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
        if ($token === '' && function_exists('getallheaders')) {
            $headers = array_change_key_case(getallheaders(), CASE_LOWER);
            $token = $headers['x-csrf-token'] ?? '';
        }
        return !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
}
