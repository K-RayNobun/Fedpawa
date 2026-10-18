<?php
namespace App\Service;

// L012 : OTP par "scope" — clients (otp_<id>.txt, inchangé) vs admins
// (otp_admin_<id>.txt). Le préfixe distinct évite toute collision entre un
// client_id et un admin_id qui seraient numériquement identiques.
class OtpService {
    private const SCOPES = ['client', 'admin'];

    private static function path(int $id, string $scope = 'client'): string {
        if (!in_array($scope, self::SCOPES, true)) {
            $scope = 'client';
        }
        $prefix = ($scope === 'admin') ? 'otp_admin_' : 'otp_';
        return __DIR__ . '/../../storage/' . $prefix . $id . '.txt';
    }

    // Signature historique conservée : generate(clientId) = scope client.
    public static function generate(int $clientId, string $scope = 'client'): string {
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        file_put_contents(self::path($clientId, $scope), password_hash($otp, PASSWORD_DEFAULT));
        return $otp;
    }

    public static function verify(int $clientId, string $otp, string $scope = 'client'): bool {
        $path = self::path($clientId, $scope);
        if (!file_exists($path)) return false;
        $hash = file_get_contents($path);
        if (!is_string($hash) || $hash === '') return false;
        return password_verify($otp, $hash);
    }

    public static function clear(int $clientId, string $scope = 'client'): void {
        $path = self::path($clientId, $scope);
        if (file_exists($path)) unlink($path);
    }
}
