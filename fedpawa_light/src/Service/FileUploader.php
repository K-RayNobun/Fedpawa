<?php
namespace App\Service;

class FileUploader {
    private string $uploadDir = __DIR__ . '/../../storage/uploads/';

    public function upload(array $file, string $clientFolder): string {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \Exception("Erreur lors de l'upload du fichier.");
        }

        // Vérification MIME type simple
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        if (!in_array($mime, ['application/pdf', 'image/jpeg', 'image/png'])) {
            throw new \Exception("Format de fichier non autorisé.");
        }

        $targetDir = $this->uploadDir . $clientFolder . '/';
        if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);

        $filename = uniqid('doc_') . '_' . basename($file['name']);
        if (move_uploaded_file($file['tmp_name'], $targetDir . $filename)) {
            return $clientFolder . '/' . $filename;
        }

        throw new \Exception("Erreur lors de l'enregistrement du fichier.");
    }
}
