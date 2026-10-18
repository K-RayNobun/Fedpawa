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

    // =========================================================
    // L011 — Métadonnées de document (admin uniquement) pour la
    // page de visionneuse admin_document.html : existence RÉELLE
    // du fichier (le lien « Voir » n'est jamais proposé pour un
    // document absent), infos client/date/type/taille + URL de
    // téléchargement vers /api/document.
    // =========================================================
    public function documentInfo() {
        // Auth stricte : session admin (portail admins OU rôle admin)
        $isAdmin = isset($_SESSION['admin_logged_in'])
            || (!empty($_SESSION['client_id']) && ($_SESSION['role'] ?? 'client') === 'admin');
        if (!$isAdmin) {
            $this->json(['error' => 'Non autorisé'], 403);
            return;
        }
        try {
            $type = $_GET['type'] ?? '';
            $id = (int)($_GET['id'] ?? 0);
            $file = $_GET['file'] ?? '';
            if ($id <= 0) {
                $this->json(['error' => 'ID invalide'], 400);
                return;
            }
            $db = Database::getConnection();
            switch ($type) {
                case 'contrat':
                    $stmt = $db->prepare("SELECT ct.fichier, ct.type, ct.date_signature, c.nom AS client_nom, c.entreprise FROM contrats ct LEFT JOIN clients c ON c.id = ct.client_id WHERE ct.id = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    if (!$row) { $this->json(['error' => 'Document introuvable'], 404); return; }
                    $relPath = (string)($row['fichier'] ?? '');
                    $filename = 'contrat_' . $id . '.pdf';
                    $date = $row['date_signature'] ?? null;
                    $typeLabel = 'Contrat ' . ($row['type'] ?? '');
                    break;
                case 'courrier':
                    $stmt = $db->prepare("SELECT co.scan, co.date_reception, c.nom AS client_nom, c.entreprise FROM courriers co LEFT JOIN clients c ON c.id = co.client_id WHERE co.id = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    if (!$row) { $this->json(['error' => 'Document introuvable'], 404); return; }
                    $relPath = (string)($row['scan'] ?? '');
                    $filename = 'courrier_' . $id . '.pdf';
                    $date = $row['date_reception'] ?? null;
                    $typeLabel = 'Courrier (scan)';
                    break;
                case 'kyc':
                    if (!in_array($file, ['piece_identite', 'justificatif_domicile'], true)) {
                        $this->json(['error' => 'Fichier invalide'], 400);
                        return;
                    }
                    $stmt = $db->prepare("SELECT k.$file AS rel, k.date_soumission, c.nom AS client_nom, c.entreprise FROM kyc k JOIN clients c ON c.id = k.client_id WHERE k.id = ?");
                    $stmt->execute([$id]);
                    $row = $stmt->fetch();
                    if (!$row) { $this->json(['error' => 'Document introuvable'], 404); return; }
                    $relPath = (string)($row['rel'] ?? '');
                    $filename = $relPath !== '' ? basename($relPath) : ('kyc_' . $id . '_' . $file . '.pdf');
                    $date = $row['date_soumission'] ?? null;
                    $typeLabel = $file === 'piece_identite' ? 'KYC — Pièce d\'identité' : 'KYC — Justificatif de domicile';
                    break;
                default:
                    $this->json(['error' => 'Type de document invalide'], 400);
                    return;
            }

            // Résolution physique : mêmes règles que serve() (uploads/ puis storage/)
            // mais SANS exception : un chemin vide ou un fichier manquant = exists:false.
            $exists = false;
            $full = false;
            $base = realpath(self::STORAGE_DIR);
            if ($base !== false && $relPath !== '' && strpos($relPath, '..') === false) {
                $uploadsBase = $base . DIRECTORY_SEPARATOR . 'uploads';
                foreach ([$uploadsBase, $base] as $candidateBase) {
                    $resolved = realpath($candidateBase . DIRECTORY_SEPARATOR . $relPath);
                    if ($resolved !== false && strpos($resolved, $base . DIRECTORY_SEPARATOR) === 0 && is_file($resolved)) {
                        $full = $resolved;
                        $exists = true;
                        break;
                    }
                }
            }

            $this->json([
                'exists'       => $exists,
                'filename'     => $exists ? basename($full) : $filename,
                'size'         => $exists ? filesize($full) : null,
                'mime'         => $exists ? (mime_content_type($full) ?: 'application/octet-stream') : null,
                'date'         => $date,
                'client_nom'   => $row['client_nom'] ?? null,
                'entreprise'   => $row['entreprise'] ?? null,
                'type_label'   => $typeLabel,
                'download_url' => $exists ? '/api/document?type=' . urlencode($type) . '&id=' . $id . ($type === 'kyc' ? '&file=' . urlencode($file) : '') : null,
            ]);
        } catch (\Exception $e) {
            error_log('Storage documentInfo error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur interne'], 500);
        }
    }
}
