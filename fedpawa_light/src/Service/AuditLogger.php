<?php
namespace App\Service;

class AuditLogger {
    public static function log(string $action, ?int $userId, string $userType, string $details = '') {
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO audit_log (action, user_id, user_type, details) VALUES (?, ?, ?, ?)");
        $stmt->execute([$action, $userId, $userType, $details]);
    }
}
