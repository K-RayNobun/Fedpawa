<?php
namespace App\Service;

class OtpService {
    public static function generate(int $clientId): string {
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        // Stocker en BDD ou session
        file_put_contents(__DIR__ . '/../../storage/otp_' . $clientId . '.txt', $otp);
        return $otp;
    }

    public static function verify(int $clientId, string $otp): bool {
        $storedOtp = file_get_contents(__DIR__ . '/../../storage/otp_' . $clientId . '.txt');
        return $otp === $storedOtp;
    }
}
