<?php
namespace App\Service;

use Dompdf\Dompdf;
use Dompdf\Options;

class PdfService {
    public function generateContract(array $data): string {
        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);

        $html = '
        <html>
        <head>
            <style>
                body { font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 40px; }
                h1 { color: #7A1C1C; text-align: center; border-bottom: 2px solid #7A1C1C; padding-bottom: 10px; font-size: 20px; }
                .section { margin-top: 20px; font-size: 13px; }
                .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #ddd; paddingTop: 10px; }
            </style>
        </head>
        <body>
            <h1>CONVENTION DE DOMICILIATION & SERVICES</h1>
            <div class="section">
                <p><strong>Entre les soussignés :</strong></p>
                <p>La société <strong>FEDPAWA CORPORATE SOLUTIONS SARL</strong>, sise à l’Immeuble Pharmacie de Logpom, Douala, Cameroun.</p>
                <p>Et : <strong>' . htmlspecialchars($data['client_name']) . '</strong> (' . htmlspecialchars($data['company_name'] ?? 'Entreprise') . ').</p>
            </div>
            <div class="section">
                <h3>Article 1 : Objet de la Convention</h3>
                <p>Le présent contrat a pour objet la domiciliation du siège social ainsi que l’accès aux services d’infrastructure d’affaires et de permanence téléphonique proposés par FEDPAWA au cœur de Logpom, Douala.</p>
            </div>
            <div class="section">
                <h3>Article 2 : Engagements & Confidentialité</h3>
                <p>FEDPAWA s’engage à réceptionner, trier et archiver de manière sécurisée tout courrier postal destiné au client, et à notifier ce dernier en temps réel. Le client certifie l’exactitude des pièces fournies.</p>
            </div>
            <div class="section">
                <h3>Article 3 : Conditions Financières</h3>
                <p>Le montant total de la prestation s’élève à <strong>' . number_format($data['price'] ?? 50000, 0, ',', ' ') . ' FCFA</strong>, réglé selon les modalités convenues et validé par accusé de réception.</p>
            </div>
            <div class="footer">
                <p>FEDPAWA Corporate Solutions · Immeuble Pharmacie de Logpom, Douala · Cameroun · contact@fedpawacorporatesolutions.com</p>
            </div>
        </body>
        </html>
        ';

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
    }

    public function generateInvoice(array $data): string {
        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);

        $html = '
        <html>
        <head>
            <style>
                body { font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; margin: 40px; }
                h1 { color: #7A1C1C; font-size: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                th { background-color: #f8f9fa; color: #333; }
                .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>FACTURE / REÇU DE PAIEMENT</h1>
            <p><strong>Facture N° :</strong> ' . htmlspecialchars($data['invoice_number'] ?? 'FAC-2026-001') . '</p>
            <p><strong>Date :</strong> ' . date('d/m/Y') . '</p>
            <p><strong>Client :</strong> ' . htmlspecialchars($data['client_name']) . '</p>
            <table>
                <thead>
                    <tr><th>Désignation</th><th>Montant (FCFA)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Prestation & Services FEDPAWA Corporate Solutions</td><td>' . number_format($data['amount'] ?? 50000, 0, ',', ' ') . '</td></tr>
                </tbody>
            </table>
            <div class="total">Total Payé : ' . number_format($data['amount'] ?? 50000, 0, ',', ' ') . ' FCFA</div>
        </body>
        </html>
        ';

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
    }
}
