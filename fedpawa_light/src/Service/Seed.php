<?php
namespace App\Service;

class Database {
    private static ?\PDO $instance = null;

    public static function getConnection(): \PDO {
        if (self::$instance === null) {
            self::$instance = new \PDO('sqlite:' . __DIR__ . '/../../storage/database.sqlite');
            self::$instance->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        }
        return self::$instance;
    }
}

// Initial seed
$db = Database::getConnection();
$db->exec("INSERT OR IGNORE INTO contract_templates (name, content) VALUES ('contract', '" . addslashes(file_get_contents(__DIR__ . '/../../templates/contract.html.twig')) . "')");
