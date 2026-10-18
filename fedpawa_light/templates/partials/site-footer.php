<?php
// Partiel partagé : fermeture du <main>, footer, widgets flottants, scripts.
// Variable attendue (optionnelle) : $extraJs (array)
$extraJs   = $extraJs ?? [];
$lang      = $lang ?? 'fr';
$langPrefix = $langPrefix ?? '';
?>
</main>

<!-- ============== FOOTER ============== -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="<?= $langPrefix ?>index.php"><img class="brand-logo" src="<?= $langPrefix ?>assets/images/logo.jpg" alt="Logo FEDPAWA Corporate Solutions"><span class="brand-copy"><strong>FEDPAWA</strong><small>Corporate Solutions</small></span></a>
        <p><?= $lang === 'en' ? 'A first-class business infrastructure in the heart of Douala, Logpom. Room to settle in, room to grow.' : "Une infrastructure d'affaires de premier ordre au cœur de Douala, Logpom. Espace pour s'installer, espace pour grandir." ?></p>
      </div>
      <div class="footer-contact">
        <h3 class="footer-col-title"><?= $lang === "en" ? "Find Us" : "Nous trouver" ?></h3>
        <p><?= $lang === "en" ? "Logpom Pharmacy Building, roadside, Logpom, Douala, Cameroon" : "Immeuble Pharmacie de Logpom, en bordure de route, Logpom, Douala, Cameroun" ?></p>
        <p><?= $lang === "en" ? "Monday–Friday 8:00 – 18:00<br>Saturday 9:00 – 14:00" : "Lundi–Vendredi 8h00 – 18h00<br>Samedi 9h00 – 14h00" ?></p>
        <p><a href="mailto:contact@fedpawa.com">contact@fedpawa.com</a><br>
        <a href="tel:+237691704802"><?= $lang === "en" ? "Phone" : "Tél" ?> : +237 691 70 48 02</a><br>
        <a href="https://wa.me/237691704802" target="_blank" rel="noopener">WhatsApp : +237 691 70 48 02</a></p>
      </div>
      <div class="footer-links">
        <h3 class="footer-col-title"><?= $lang === "en" ? "Navigation" : "Navigation" ?></h3>
        <a href="<?= $langPrefix ?>index.php"><?= $lang === "en" ? "Home" : "Accueil" ?></a><a href="<?= $langPrefix ?>domiciliation.php">Domiciliation</a><a href="<?= $langPrefix ?>creation_entreprise.php"><?= $lang === 'en' ? 'Company Formation' : "Création d'entreprise" ?></a><a href="<?= $langPrefix ?>fiscalite.php"><?= $lang === "en" ? "Tax & Legal Advisory" : "Conseils & Suivi Fiscal" ?></a><a href="<?= $langPrefix ?>oapi.php"><?= $lang === "en" ? "OAPI Protection" : "Protection OAPI" ?></a><a href="<?= $langPrefix ?>contrats.php"><?= $lang === "en" ? "Contracts" : "Contrats" ?></a><a href="<?= $langPrefix ?>contact.php">Contact</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container"><span>© <span id="currentYear"></span> FEDPAWA CORPORATE SOLUTIONS. <?= $lang === "en" ? "All rights reserved." : "Tous droits réservés." ?></span><span>Douala · Logpom · <?= $lang === "en" ? "Cameroon" : "Cameroun" ?></span></div>
  </div>
</footer>

<!-- ============== WHATSAPP FLOAT (droite, à l'emplacement de l'ancien widget thème) ============== -->
<a class="whatsapp-float" href="https://wa.me/237691704802" aria-label="<?= $lang === "en" ? "Chat on WhatsApp" : "Discuter sur WhatsApp" ?>" target="_blank" rel="noopener">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
</a>

<script src="<?= $langPrefix ?>assets/js/config.js"></script>
<script src="<?= $langPrefix ?>assets/js/fedpawa-ui.js?v=2"></script>
<script src="<?= $langPrefix ?>assets/js/fedpawa-pay.js?v=3"></script>
<script src="<?= $langPrefix ?>assets/js/main.js?v=3"></script>
<?php foreach ($extraJs as $js): ?>
<script src="<?= htmlspecialchars($langPrefix . $js, ENT_QUOTES, 'UTF-8') ?>"></script>
<?php endforeach; ?>
</body>
</html>
