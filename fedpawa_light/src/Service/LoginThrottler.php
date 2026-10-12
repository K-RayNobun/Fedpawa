<?php
namespace App\Service;

class LoginThrottler {
    private const MAX_ATTEMPTS = 5;
    private const LOCK_MINUTES = 30;

    public static function getRemainingLock(string $identifier, string $type): int {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT locked_until FROM login_throttle WHERE identifier = ? AND user_type = ?");
        $stmt->execute([$identifier, $type]);
        $row = $stmt->fetch();

        if (!$row || empty($row['locked_until'])) return 0;

        $remaining = strtotime($row['locked_until']) - time();
        return max(0, $remaining);
    }

    // Retourne true si ce failure vient de poser le verrou (5e échec)
    public static function recordFailure(string $identifier, string $type, ?string $ip = null): bool {
        $db = Database::getConnection();

        // Purge des entrées inactives depuis plus de 24h
        $db->exec("DELETE FROM login_throttle WHERE last_attempt_at < datetime('now', '-1 day')");

        $stmt = $db->prepare("SELECT id, attempts FROM login_throttle WHERE identifier = ? AND user_type = ?");
        $stmt->execute([$identifier, $type]);
        $row = $stmt->fetch();

        $attempts = ($row ? (int)$row['attempts'] : 0) + 1;
        $justLocked = false;

        if ($attempts >= self::MAX_ATTEMPTS) {
            $lockedUntil = date('Y-m-d H:i:s', strtotime('+' . self::LOCK_MINUTES . ' minutes'));
            $justLocked = true;
        } else {
            $lockedUntil = null;
        }

        if ($row) {
            $db->prepare("UPDATE login_throttle SET attempts = ?, ip = ?, locked_until = COALESCE(?, locked_until), last_attempt_at = CURRENT_TIMESTAMP WHERE id = ?")
               ->execute([$attempts, $ip, $lockedUntil, $row['id']]);
        } else {
            $db->prepare("INSERT INTO login_throttle (identifier, user_type, ip, attempts, locked_until) VALUES (?, ?, ?, ?, ?)")
               ->execute([$identifier, $type, $ip, $attempts, $lockedUntil]);
        }

        return $justLocked;
    }

    public static function recordSuccess(string $identifier, string $type): void {
        $db = Database::getConnection();
        $db->prepare("UPDATE login_throttle SET attempts = 0, locked_until = NULL WHERE identifier = ? AND user_type = ?")
           ->execute([$identifier, $type]);
    }

    public static function clearLock(string $identifier, string $type): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE login_throttle SET attempts = 0, locked_until = NULL WHERE identifier = ? AND user_type = ?");
        $stmt->execute([$identifier, $type]);
        return $stmt->rowCount() > 0;
    }

    // Liste des comptes actuellement verrouillés (pour le dashboard admin)
    public static function listLocked(): array {
        $db = Database::getConnection();
        $rows = $db->query("SELECT identifier, user_type, ip, attempts, locked_until FROM login_throttle WHERE locked_until IS NOT NULL AND locked_until > datetime('now') ORDER BY locked_until DESC")->fetchAll();
        foreach ($rows as &$r) {
            $r['minutes_remaining'] = (int)ceil((strtotime($r['locked_until']) - time()) / 60);
        }
        return $rows;
    }
}
