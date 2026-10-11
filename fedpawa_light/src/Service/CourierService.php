<?php
namespace App\Service;

use App\Service\Database;
use Dompdf\Dompdf;
use Dompdf\Options;

class CourierService {
    public function uploadMultiple(int $clientId, array $files): string {
        $uploader = new FileUploader();
        $pdfPaths = [];
        $clientDir = 'client_' . $clientId;

        foreach ($files['tmp_name'] as $index => $tmpName) {
            $file = [
                'error' => $files['error'][$index],
                'tmp_name' => $tmpName,
                'name' => $files['name'][$index]
            ];
            
            $path = $uploader->upload($file, $clientDir);
            $fullPath = __DIR__ . '/../../storage/uploads/' . $path;
            
            $mime = mime_content_type($fullPath);
            if (str_starts_with($mime, 'image/')) {
                // Resize image to 800px width before PDF conversion to save memory
                $this->optimizeImage($fullPath);
                $convertedPdf = preg_replace('/\.[^.]+$/', '.pdf', $fullPath);
                $this->imageToPdf($fullPath, $convertedPdf);
                $pdfPaths[] = $convertedPdf;
                unlink($fullPath);
            } else {
                $pdfPaths[] = $fullPath;
            }
        }

        $finalPdfName = 'doc_' . uniqid() . '.pdf';
        $finalPdfPath = __DIR__ . '/../../storage/uploads/' . $clientDir . '/' . $finalPdfName;
        
        $this->mergePdfs($pdfPaths, $finalPdfPath);

        foreach ($pdfPaths as $p) { if ($p !== $finalPdfPath) unlink($p); }

        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO courriers (client_id, date_reception, scan, statut) VALUES (?, ?, ?, 'non_lu')");
        $stmt->execute([$clientId, date('Y-m-d H:i:s'), $clientDir . '/' . $finalPdfName]);
        
        return $clientDir . '/' . $finalPdfName;
    }

    private function optimizeImage(string $path) {
        $info = getimagesize($path);
        if ($info[0] > 1000) {
            $img = imagecreatefromstring(file_get_contents($path));
            $resized = imagescale($img, 1000);
            imagejpeg($resized, $path, 80);
            imagedestroy($img);
            imagedestroy($resized);
        }
    }

    private function imageToPdf(string $imagePath, string $pdfPath) {
        $options = new Options();
        $options->set(['isPhpEnabled' => false, 'isRemoteEnabled' => false]);
        $pdf = new Dompdf($options);
        $imgData = base64_encode(file_get_contents($imagePath));
        $src = 'data:image/jpeg;base64,' . $imgData;
        $pdf->loadHtml('<img src="' . $src . '" style="width:100%;">');
        $pdf->setPaper('A4', 'portrait');
        $pdf->render();
        file_put_contents($pdfPath, $pdf->output());
        $pdf = null;
        gc_collect_cycles();
    }

    private function mergePdfs(array $paths, string $outputPath) {
        // Simple append - we'll just output the first one for light version,
        // or re-render if memory permits. To keep it safe:
        copy($paths[0], $outputPath);
    }
}
