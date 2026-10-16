<?php
namespace App\Service;

use App\Service\Database;

class FactureService {
    /**
     * W-10 : crée la facture d'un paiement reçu et active l'abonnement en attente.
     * Idempotent : une seule facture par transaction.
     * @return int|null id de la facture créée, null si rien à faire
     */
    public static function createForPayment(int $clientId, float $montant, string $transactionId = ''): ?int {
        $db = Database::getConnection();

        // Idempotence : transaction déjà facturée ?
        if ($transactionId !== '') {
            $chk = $db->prepare("SELECT id FROM factures WHERE numero = ?");
            $chk->execute(['FAC-' . $transactionId]);
            if ($chk->fetch()) return null;
        }

        $numero = 'FAC-' . ($transactionId !== '' ? $transactionId : ('PMT-' . $clientId . '-' . time()));

        $stmt = $db->prepare("INSERT INTO factures (client_id, numero, montant, date, lien_pdf) VALUES (?, ?, ?, ?, NULL)");
        $stmt->execute([$clientId, $numero, $montant, date('Y-m-d H:i:s')]);
        $factureId = (int)$db->lastInsertId();

        // Activer l'abonnement en attente le plus récent du client (cohérence W-9)
        $upd = $db->prepare("UPDATE abonnements SET statut = 'actif', date_debut = COALESCE(date_debut, ?),
                             date_fin = CASE WHEN date_fin IS NOT NULL AND date_fin != '' THEN date_fin
                                             ELSE datetime(?, CASE WHEN engagement IS NOT NULL AND engagement != ''
                                             THEN '+' || (CAST(replace(engagement, 'mois', '') AS INTEGER) || ' months')
                                             ELSE '+1 month' END) END
                             WHERE client_id = ? AND statut = 'en_attente'
                             AND id = (SELECT id FROM abonnements WHERE client_id = ? AND statut = 'en_attente' ORDER BY id DESC LIMIT 1)");
        $upd->execute([date('Y-m-d H:i:s'), date('Y-m-d H:i:s'), $clientId, $clientId]);

        return $factureId;
    }
}
