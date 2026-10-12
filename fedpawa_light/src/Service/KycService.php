<?php
namespace App\Service;

use App\Service\Database;
use Exception;

class KycService {
    public function submit(int $clientId, array $files): bool {
        if (empty($files['piece_identite']) || empty($files['justificatif_domicile'])) {
            throw new Exception("Pièce d'identité et justificatif de domicile requis.");
        }

        $db = Database::getConnection();
        $uploader = new FileUploader();

        $db->beginTransaction();
        try {
            $paths = [];
            foreach (['piece_identite', 'justificatif_domicile'] as $key) {
                $paths[$key] = $uploader->upload($files[$key], 'client_' . $clientId);
            }

            $stmt = $db->prepare("INSERT INTO kyc (client_id, piece_identite, justificatif_domicile, statuts) VALUES (?, ?, ?, 'en_cours')");
            $stmt->execute([$clientId, $paths['piece_identite'], $paths['justificatif_domicile']]);

            $db->commit();
            AuditLogger::log('KYC_SUBMITTED', $clientId, 'client', 'Files: ' . implode(', ', $paths));
            return true;
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}
