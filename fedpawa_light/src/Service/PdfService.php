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

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
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
