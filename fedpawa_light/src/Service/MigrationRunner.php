<?php
namespace App\Service;

class MigrationRunner {
    public static function migrate(): void {
        $db = Database::getConnection();
        $schemaPath = __DIR__ . '/../schema_sqlite.sql';
        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);
            try {
                $db->exec($sql);
            } catch (\PDOException $e) {
                error_log("Migration error: " . $e->getMessage());
            }
        }

        // ---- Migrations incrémentales (idempotentes) ----
        $migrations = [
            // Lane #4 — rôles: 'client' (défaut) | 'admin'
            ['clients', 'role', "ALTER TABLE clients ADD COLUMN role TEXT DEFAULT 'client'"]
        ];
        foreach ($migrations as [$table, $column, $ddl]) {
            try {
                $cols = $db->query("PRAGMA table_info({$table})")->fetchAll(\PDO::FETCH_ASSOC);
                $exists = false;
                foreach ($cols as $c) { if ($c['name'] === $column) { $exists = true; break; } }
                if (!$exists) $db->exec($ddl);
            } catch (\PDOException $e) {
                error_log("Migration '{$column}' error: " . $e->getMessage());
            }
        }
    }
}
