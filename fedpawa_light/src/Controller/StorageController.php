<?php
namespace App\Controller;

use App\Service\Database;
use App\Service\AuditLogger;

class StorageController extends Controller {
    private const STORAGE_DIR = __DIR__ . '/../../storage';

    public function serve() {
        try {
            $type = $_GET['type'] ?? '';
            $id = (int)($_GET['id'] ?? 0);
            $file = $_GET['file'] ?? ''; // kyc : piece_identite | justificatif_domicile

            if ($id <= 0) {
                $this->json(['error' => 'ID invalide'], 400);
                return;
            }

            $db = Database::getConnection();

            switch ($type) {
                case 'courrier':
                    $stmt = $db->prepare("SELECT client_id, scan FROM courriers WHERE id = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    $relPath = $row['scan'] ?? '';
                    $filename = 'courrier_' . $id . '.pdf';
                    break;

                case 'kyc':
                    $stmt = $db->prepare("SELECT client_id, piece_identite, justificatif_domicile FROM kyc WHERE id = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    $relPath = $row[$file] ?? '';
                    $filename = 'kyc_' . $id . '_' . $file . '.pdf';
                    break;

                case 'contrat':
                    $stmt = $db->prepare("SELECT client_id, fichier FROM contrats WHERE id = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    $relPath = $row['fichier'] ?? '';
                    $filename = 'contrat_' . $id . '.pdf';
                    break;

                default:
                    $this->json(['error' => 'Type de document invalide'], 400);
                    return;
            }

            if (!$row) {
                $this->json(['error' => 'Document introuvable'], 404);
                return;
            }

            // Ownership : le client connecté ne peut voir que SES documents ; l'admin voit tout
            if (isset($_SESSION['admin_logged_in'])) {
                $viewerId = 'admin';
            } elseif (isset($_SESSION['client_id']) && (int)$_SESSION['client_id'] === (int)$row['client_id']) {
                $viewerId = (int)$_SESSION['client_id'];
            } else {
                $this->json(['error' => 'Non autorisé'], 403);
                return;
            }

            if ($relPath === '') {
                $this->json(['error' => 'Fichier indisponible'], 404);
                return;
            }

            // Anti path-traversal : le chemin résolu doit rester sous storage/
            // (les courriers/KYC sont stockés relativement à storage/uploads/,
            //  les contrats relativement à storage/)
            $base = realpath(self::STORAGE_DIR);
            $uploadsBase = $base . DIRECTORY_SEPARATOR . 'uploads';
            $full = false;
            foreach ([$uploadsBase, $base] as $candidateBase) {
                $resolved = realpath($candidateBase . DIRECTORY_SEPARATOR . $relPath);
                if ($resolved !== false && strpos($resolved, $base . DIRECTORY_SEPARATOR) === 0 && is_file($resolved)) {
                    $full = $resolved;
                    break;
                }
            }
            if ($full === false) {
                $this->json(['error' => 'Accès au fichier refusé'], 403);
                return;
            }

            AuditLogger::log('DOCUMENT_VIEWED', is_int($viewerId) ? $viewerId : null, is_string($viewerId) ? 'admin' : 'client', "$type #$id");

            header('Content-Type: application/pdf');
            header('Content-Disposition: inline; filename="' . $filename . '"');
            header('Content-Length: ' . filesize($full));
            header('Cache-Control: private, max-age=0, must-revalidate');
            readfile($full);
        } catch (\Exception $e) {
            error_log('Storage serve error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
