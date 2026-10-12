<?php
namespace App\Service;

use App\Service\Database;
use Exception;

class SubscriptionService {
    public function store(array $data): array {
        $db = Database::getConnection();

        if (empty($data['email']) || empty($data['pack']) || empty($data['nom'])) {
            throw new Exception("Données de souscription incomplètes.");
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Adresse e-mail invalide.");
        }
        if (!isset($data['prix']) || !is_numeric($data['prix']) || (float)$data['prix'] <= 0) {
            throw new Exception("Prix invalide.");
        }

        $db->beginTransaction();
        try {
            // Réutiliser le client existant s'il existe déjà, sinon le créer
            $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
            $stmt->execute([$data['email']]);
            $existing = $stmt->fetch();

            if ($existing) {
                $clientId = (int)$existing['id'];
            } else {
                $stmt = $db->prepare("INSERT INTO clients (nom, entreprise, email, mot_de_passe) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    htmlspecialchars($data['nom']),
                    htmlspecialchars($data['entreprise'] ?? ''),
                    $data['email'],
                    password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT)
                ]);
                $clientId = (int)$db->lastInsertId();
            }

            $stmt = $db->prepare("INSERT INTO abonnements (client_id, pack, prix, date_debut, statut) VALUES (?, ?, ?, ?, 'en_attente')");
            $stmt->execute([$clientId, htmlspecialchars($data['pack']), (float)$data['prix'], date('Y-m-d H:i:s')]);
            $subscriptionId = (int)$db->lastInsertId();

            $db->commit();
            return ['status' => 'success', 'client_id' => $clientId, 'subscription_id' => $subscriptionId];
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}
