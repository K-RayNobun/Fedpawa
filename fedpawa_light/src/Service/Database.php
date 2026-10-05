<?php
namespace App\Service;

use PDO;
use PDOException;

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            // Utilisation de SQLite pour la simplicité et la compatibilité mutualisée
            $dbPath = __DIR__ . '/../../storage/fedpawa.sqlite';
            $dsn = "sqlite:" . $dbPath;

            try {
                self::$pdo = new PDO($dsn, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
                // Activer les clés étrangères pour SQLite
                self::$pdo->exec('PRAGMA foreign_keys = ON');
            } catch (PDOException $e) {
                throw new \Exception("Connexion BDD SQLite échouée: " . $e->getMessage());
            }
        }
        return self::$pdo;
    }
}
