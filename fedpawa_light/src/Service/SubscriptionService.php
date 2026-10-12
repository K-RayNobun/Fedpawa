<?php
namespace App\Service;

use App\Service\Database;
use Exception;

class SubscriptionService {
    public function store(array $data) {
        $db = Database::getConnection();
        
        // 1. Validation de base — Lane #2: pour un utilisateur connecté, nom/email
        // manquants au formulaire sont comblés depuis son compte en session.
        if (isset($_SESSION['client_id']) && (empty($data['email']) || empty($data['nom']))) {
            $stmt = $db->prepare("SELECT nom, email FROM clients WHERE id = ?");
            $stmt->execute([$_SESSION['client_id']]);
            if ($c = $stmt->fetch()) {
                $data['nom'] = $data['nom'] ?: $c['nom'];
                $data['email'] = $data['email'] ?: $c['email'];
            }
        }
        if (empty($data['email']) || empty($data['pack']) || empty($data['nom'])) {
            throw new Exception("Données de souscription incomplètes.");
        }

        // 2. Début de transaction pour assurer l'intégrité (Workflow 1)
        $db->beginTransaction();
        try {
            // Lane #2 : client connecté -> rattacher l'abonnement à son compte existant
            // (sinon création d'un doublon avec mot de passe temporaire)
            $clientId = null;
            if (isset($_SESSION['client_id'])) {
                $stmt = $db->prepare("SELECT id FROM clients WHERE id = ?");
                $stmt->execute([$_SESSION['client_id']]);
                if ($stmt->fetch()) $clientId = $_SESSION['client_id'];
            }
            if (!$clientId) {
                // Anonyme: retrouver par email, sinon créer (ancien comportement)
                $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
                $stmt->execute([$data['email']]);
                $existing = $stmt->fetch();
                if ($existing) {
                    $clientId = $existing['id'];
                } else {
                    $stmt = $db->prepare("INSERT INTO clients (nom, entreprise, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$data['nom'], $data['entreprise'] ?? '', $data['email'], $data['telephone'] ?? '', password_hash('temporary_pass', PASSWORD_DEFAULT)]);
                    $clientId = $db->lastInsertId();
                }
            }

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
