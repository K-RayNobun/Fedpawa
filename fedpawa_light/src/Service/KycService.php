<?php
namespace App\Service;

use App\Service\Database;

class KycService {
    public function submit(int $clientId, array $files) {
        $db = Database::getConnection();
        $uploader = new FileUploader();

        $paths = [];
        foreach ($files as $key => $file) {
            $paths[$key] = $uploader->upload($file, 'client_' . $clientId);
        }

        $stmt = $db->prepare("INSERT INTO kyc (client_id, piece_identite, justificatif_domicile, statuts) VALUES (?, ?, ?, 'en_cours')");
        $stmt->execute([$clientId, $paths['piece_identite'], $paths['justificatif_domicile']]);
        
        return true;
    }
}
