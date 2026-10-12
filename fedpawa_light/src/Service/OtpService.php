<?php
namespace App\Service;

class OtpService {
    private static function path(int $clientId): string {
        return __DIR__ . '/../../storage/otp_' . $clientId . '.txt';
    }

    public static function generate(int $clientId): string {
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        file_put_contents(self::path($clientId), password_hash($otp, PASSWORD_DEFAULT));
        return $otp;
    }

    public static function verify(int $clientId, string $otp): bool {
        $path = self::path($clientId);
        if (!file_exists($path)) return false;
        $hash = file_get_contents($path);
        if (!is_string($hash) || $hash === '') return false;
        return password_verify($otp, $hash);
    }

    public static function clear(int $clientId): void {
        $path = self::path($clientId);
        if (file_exists($path)) unlink($path);
    }
}
