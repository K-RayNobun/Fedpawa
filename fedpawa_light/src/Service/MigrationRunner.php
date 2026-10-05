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
    }
}
