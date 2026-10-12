<?php
namespace App\Service;

class MigrationRunner {
    public static function migrate(): void {
        $db = Database::getConnection();
        $schemaPath = __DIR__ . '/../../schema_sqlite.sql';
        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);

            // Passe 1 : création des tables + seed éventuel
            try {
                $db->exec($sql);
            } catch (\PDOException $e) {
                error_log("Migration error: " . $e->getMessage());
            }

            // Migrations incrémentales de colonnes (SQLite ne supporte pas IF NOT EXISTS sur ADD COLUMN)
            try {
                $db->exec("ALTER TABLE paiements ADD COLUMN transaction_id TEXT");
            } catch (\PDOException $e) {
                // Colonne déjà existante : ignorer
            }

            // Passe 2 : re-exécution pour créer les index dépendant des colonnes ajoutées
            try {
                $db->exec($sql);
            } catch (\PDOException $e) {
                error_log("Migration error (pass 2): " . $e->getMessage());
            }
        }

        // Seed initial : template de contrat depuis le système de fichiers
        try {
            $tpl = $db->query("SELECT content FROM contract_templates WHERE name = 'contract'")->fetch();
            if (!$tpl || strlen($tpl['content']) < 100) {
                $file = __DIR__ . '/../../templates/contract.html.twig';
                if (file_exists($file)) {
                    $content = file_get_contents($file);
                    $db->prepare("INSERT OR REPLACE INTO contract_templates (name, content, updated_at) VALUES ('contract', ?, CURRENT_TIMESTAMP)")
                       ->execute([$content]);
                }
            }
        } catch (\PDOException $e) {
            error_log("Template seed error: " . $e->getMessage());
        }
    }
}
