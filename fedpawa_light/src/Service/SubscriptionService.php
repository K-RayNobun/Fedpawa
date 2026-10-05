<?php
namespace App\Service;

use App\Service\Database;
use Exception;

class SubscriptionService {
    public function store(array $data) {
        $db = Database::getConnection();
        
        // 1. Validation de base des données obligatoires
        if (empty($data['email']) || empty($data['pack']) || empty($data['nom'])) {
            throw new Exception("Données de souscription incomplètes.");
        }

        // 2. Début de transaction pour assurer l'intégrité (Workflow 1)
        $db->beginTransaction();
        try {
            // Création/récupération du client
            $stmt = $db->prepare("INSERT INTO clients (nom, entreprise, email, mot_de_passe) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['nom'], $data['entreprise'], $data['email'], password_hash('temporary_pass', PASSWORD_DEFAULT)]);
            $clientId = $db->lastInsertId();

            // Création de l'abonnement
            $stmt = $db->prepare("INSERT INTO abonnements (client_id, pack, prix, date_debut, statut) VALUES (?, ?, ?, ?, 'en_attente')");
            $stmt->execute([$clientId, $data['pack'], $data['prix'] ?? 0, date('Y-m-d H:i:s')]);
            
            $db->commit();
            return ['status' => 'success', 'client_id' => $clientId];
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}
