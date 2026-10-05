<?php
// Partiel partagé : fermeture du <main>, footer, widgets flottants, scripts.
// Variable attendue (optionnelle) : $extraJs (array)
$extraJs = $extraJs ?? [];
?>
</main>

<!-- ============== FOOTER ============== -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="index.php"><span class="brand-mark">F</span><span class="brand-copy"><strong>FEDPAWA</strong><small>Corporate Solutions</small></span></a>
        <p>Une infrastructure d'affaires de premier ordre au cœur de Douala, Logpom. Espace pour s'installer, espace pour grandir.</p>
      </div>
      <div class="footer-contact">
        <h3 class="footer-col-title">Nous trouver</h3>
        <p>Immeuble Pharmacie de Logpom, en bordure de route, Logpom, Douala, Cameroun</p>
        <p>Lundi–Vendredi 8h00 – 18h00<br>Samedi 9h00 – 14h00</p>
        <p><a href="mailto:contact@fedpawacorporatesolutions.com">contact@fedpawacorporatesolutions.com</a></p>
      </div>
      <div class="footer-links">
        <h3 class="footer-col-title">Navigation</h3>
        <a href="index.php">Accueil</a><a href="domiciliation.php">Domiciliation</a><a href="creation_entreprise.php">Création d'entreprise</a><a href="fiscalite.php">Fiscalité</a><a href="oapi.php">OAPI</a><a href="contrats.php">Contrats</a><a href="contact.php">Contact</a>
      </div>
      <div class="footer-legal">
        <h3 class="footer-col-title">Informations légales</h3>
        <p>RC : à compléter<br>IFU : à compléter<br>CNPS : à compléter</p>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container"><span>© <span id="currentYear"></span> FEDPAWA CORPORATE SOLUTIONS. Tous droits réservés.</span><span>Douala · Logpom · Cameroun</span></div>
  </div>
</footer>

<!-- ============== WHATSAPP FLOAT ============== -->
<a class="whatsapp-float" href="https://wa.me/2376XXXXXXXX" aria-label="Discuter sur WhatsApp" target="_blank" rel="noopener">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
</a>

<!-- ============== THEME & MODE SWITCHER ============== -->
<div class="switcher-container" aria-label="Sélecteur de thème et de mode">
  <div class="theme-pill">
    <button class="theme-btn active" data-theme="bordeaux" title="Thème Bordeaux">
      <span class="theme-dot" style="background: #7A1C1C;"></span>
      <span>Bordeaux</span>
    </button>
    <button class="theme-btn" data-theme="navy" title="Thème Bleu Nuit & Or">
      <span class="theme-dot" style="background: #15294D; border-color: #D4AF37;"></span>
      <span>Nuit & Or</span>
    </button>
  </div>
  <div class="switcher-divider"></div>
  <button class="mode-toggle" id="modeToggle" aria-label="Basculer en mode sombre/clair">
    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  </button>
</div>

<script src="assets/js/main.js"></script>
<?php foreach ($extraJs as $js): ?>
<script src="<?= htmlspecialchars($js, ENT_QUOTES, 'UTF-8') ?>"></script>
<?php endforeach; ?>
</body>
</html>
