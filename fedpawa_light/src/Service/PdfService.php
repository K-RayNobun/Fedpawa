<?php
namespace App\Service;

use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\Loader\ChainLoader;
use Twig\Loader\FilesystemLoader;

class PdfService {
    private Environment $twig;

    public function __construct() {
        $db = Database::getConnection();
        $template = $db->query("SELECT content FROM contract_templates WHERE name = 'contract'")->fetch();

        // Le contrat vient de la BDD (éditable par l'admin),
        // les autres templates (facture) viennent du système de fichiers.
        $dbLoader = new ArrayLoader([
            'contract.html.twig' => $template['content'] ?? ''
        ]);
        $fsLoader = new FilesystemLoader(__DIR__ . '/../../templates');
        $this->twig = new Environment(new ChainLoader([$dbLoader, $fsLoader]));
    }

    private function dompdf(): Dompdf {
        $options = new Options();
        $options->set([
            'defaultFont' => 'Helvetica',
            'isPhpEnabled' => false,
            'isRemoteEnabled' => false
        ]);
        return new Dompdf($options);
    }

    public function generateContract(array $data): string {
        $dompdf = $this->dompdf();

        $html = $this->twig->render('contract.html.twig', [
            'client_name' => $data['client_name'] ?? 'Client',
            'company_name' => $data['company_name'] ?? 'Entreprise',
            'price' => $data['price'] ?? 50000,
        ]);

        // L022: substituer les placeholders [DOMICILIE_*] par les données réelles
        $html = self::fillDomicilie($html, $data);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
    }

    /**
     * L022 — Remplace les placeholders [DOMICILIE_*] du contrat par les données
     * réelles de la souscription (colonne abonnements.details + champs directs).
     * $data accepte 'details' (JSON string ou array) + les clés directes.
     */
    public static function fillDomicilie(string $html, array $data): string {
        $d = $data['details'] ?? [];
        if (is_string($d)) { $d = json_decode($d, true) ?: []; }
        $get = function(string $key, string $fallback) use ($d, $data) {
            $v = $d[$key] ?? $data[$key] ?? '';
            $v = trim((string)$v);
            return $v !== '' ? $v : $fallback;
        };

        $rep = $get('representant', $data['client_name'] ?? '…………');
        $entreprise = $get('entreprise', $data['company_name'] ?? '…………');
        $today = date('d/m/Y à H:i');

        $map = [
            '[DOMICILIE_CAPITAL]' => $get('capital', '………'),
            '[DOMICILIE_RCCM]' => $get('rccm', 'en cours d\'immatriculation'),
            '[DOMICILIE_NIU]' => $get('niu', 'en cours d\'attribution'),
            '[DOMICILIE_SIEGE]' => $get('siege', '………'),
            '[DOMICILIE_REPRESENTANT]' => $rep,
            '[DOMICILIE_QUALITE]' => $get('qualite', 'Représentant légal'),
            '[DOMICILIE_ENTREPRISE]' => $entreprise,
            '[DOMICILIE_IP]' => $_SERVER['REMOTE_ADDR'] ?? '—',
            '[DOMICILIE_DATE]' => $today,
        ];
        return strtr($html, $map);
    }

    public function generateInvoice(array $data): string {
        $dompdf = $this->dompdf();

        $html = $this->twig->render('invoice.html.twig', [
            'invoice_number' => $data['invoice_number'] ?? 'FAC-2026-001',
            'client_name' => $data['client_name'] ?? 'Client',
            'amount' => $data['amount'] ?? 50000,
        ]);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
    }
}
