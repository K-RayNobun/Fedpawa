<?php
$title = "Domiciliation des Entreprises à Douala Logpom | FEDPAWA Corporate Solutions";
$description = "Domiciliation d'entreprise à Douala Logpom - FEDPAWA Corporate Solutions. Siège social, gestion de courrier et espace de travail professionnel pour entrepreneurs.";
$active = 'domiciliation';
$extraCss = ['assets/css/pages.css'];

include __DIR__ . '/../templates/partials/site-header.php';
?>
  <!-- ============== HERO ============== -->
  <section class="page-hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">Locaux certifiés à Logpom</div>
        <h1>Domiciliation des Entreprises</h1>
        <p class="subtitle">Votre infrastructure d'affaires à Douala, Logpom</p>
        <p>Que vous soyez un entrepreneur local, une PME ou une multinationale, l'immobilier classique ne doit plus être un frein à vos ambitions. Évitez les coûts d'un bail commercial traditionnel, les cautions pluriannuelles et la gestion quotidienne des infrastructures. FEDPAWA CORPORATE SOLUTIONS met à votre disposition une infrastructure d'affaires de premier ordre.</p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <a href="#packs-nationaux" class="btn btn-primary">Découvrir nos packs</a>
          <a href="contact.php" class="btn btn-outline">Visiter les locaux</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== LEGAL ALERT ============== -->
  <section class="legal-section">
    <div class="container">
      <div class="legal-alert">
        <div class="legal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
        <div class="legal-content">
          <h3>Cadre Contractuel et Sécurité Juridique</h3>
          <p>Afin de garantir une flexibilité totale à nos clients, l'intégralité de nos solutions d'hébergement est régie par une <strong>Convention de mise à disposition d'infrastructures et de prestations de services</strong>. Cet acte exclut expressément le statut des baux commerciaux OHADA. En conséquence, cette convention n'accorde aucun droit au renouvellement, aucune propriété commerciale ni aucun droit de maintien dans les lieux. Il s'agit d'une mise à disposition de services entièrement flexible et révocable.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== GALLERY ============== -->
  <section class="section-padding section-alt">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Tour virtuel</span>
        <h2>Galerie de nos espaces</h2>
        <p>Découvrez l'environnement haut standing que nous mettons à votre disposition à Logpom.</p>
      </div>
      
      <div class="gallery-filters">
        <button class="filter-btn active" data-filter="all">Tout</button>
        <button class="filter-btn" data-filter="accueil">Accueil</button>
        <button class="filter-btn" data-filter="bureau">Bureaux Privés</button>
        <button class="filter-btn" data-filter="reunion">Salle de réunion</button>
      </div>

      <div class="gallery-grid">
        <div class="gallery-item w-2 h-2" data-category="accueil">
          <img src="assets/images/photo_1.jpg" alt="Accueil et réception" loading="lazy">
          <span class="gallery-caption">Accueil & Réception</span>
        </div>
        <div class="gallery-item" data-category="bureau">
          <img src="assets/images/photo_2.jpg" alt="Bureau privé" loading="lazy">
          <span class="gallery-caption">Bureau Privé Executive</span>
        </div>
        <div class="gallery-item" data-category="reunion">
          <img src="assets/images/photo_3.jpg" alt="Salle de réunion" loading="lazy">
          <span class="gallery-caption">Salle de Réunion & Hub</span>
        </div>
        <div class="gallery-item" data-category="bureau">
          <img src="assets/images/photo_4.jpg" alt="Bureau équipé" loading="lazy">
          <span class="gallery-caption">Espace de travail haut débit</span>
        </div>
        <div class="gallery-item w-2" data-category="accueil">
          <img src="assets/images/photo_5.jpg" alt="Espace café" loading="lazy">
          <span class="gallery-caption">Espace Café & Détente</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== GAMME NATIONALE ============== -->
  <section class="section-padding" id="packs-nationaux">
    <div class="container">
      <div class="pricing-intro">
        <span class="section-kicker">Gamme Nationale</span>
        <h2>Packs pour les entreprises locales</h2>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="card-header"><h3>Pack ESSENTIAL</h3><div class="price">25 000 FCFA<span> / mois</span></div></div>
          <ul class="features-list">
            <li>Adresse siège social Logpom</li>
            <li>Réception & Scan du courrier + notification</li>
            <li>Archivage numérique 1 mois</li>
            <li><strong>6h de bureau privé/mois</strong></li>
          </ul>
          <a href="tunnel_souscription.php?pack=domiciliation-national-essential" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card">
          <div class="card-header"><h3>Pack BUSINESS</h3><div class="price">45 000 FCFA<span> / mois</span></div></div>
          <ul class="features-list">
            <li>Tout du Pack Essential</li>
            <li>Réexpédition physique mensuelle du courrier</li>
            <li><strong>10h de bureau privé/mois</strong> (Wi-Fi HD)</li>
          </ul>
          <a href="tunnel_souscription.php?pack=domiciliation-national-business" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card popular">
          <div class="popular-badge">Populaire</div>
          <div class="card-header"><h3>Pack PREMIUM</h3><div class="price">70 000 FCFA<span> / mois</span></div></div>
          <ul class="features-list">
            <li>Tout du Pack Business</li>
            <li>Réexpédition physique instantanée</li>
            <li><strong>Réceptionniste Dédiée bilingue</strong></li>
            <li><strong>Numéro local dédié</strong></li>
            <li><strong>15h de bureau privé/mois</strong></li>
          </ul>
          <a href="tunnel_souscription.php?pack=domiciliation-national-premium" class="btn btn-primary btn-block">Je m'abonne</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== GAMME INTERNATIONALE ============== -->
  <section class="section-padding section-alt">
    <div class="container">
      <div class="pricing-intro">
        <span class="section-kicker">Gamme Internationale</span>
        <h2>Packs Diaspora & Multinationales</h2>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="card-header"><h3>ESSENTIAL DIGITAL</h3><div class="price">50 000 FCFA<span> / mois</span></div><div class="price-sub">~88 USD</div></div>
          <ul class="features-list">
            <li>Adresse siège social à Logpom</li>
            <li>Numérisation & envoi instantané (Email/WhatsApp)</li>
            <li>Réexpédition colis à l'étranger (frais au réel)</li>
          </ul>
          <a href="tunnel_souscription.php?pack=domiciliation-international-essential" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card">
          <div class="card-header"><h3>BUSINESS VIRTUAL</h3><div class="price">110 000 FCFA<span> / mois</span></div><div class="price-sub">~180 USD</div></div>
          <ul class="features-list">
            <li>Tout du Pack Essential Digital</li>
            <li>Numéro de téléphone camerounais dédié</li>
            <li>Réponse téléphonique personnalisée</li>
            <li>Transmission de messages instantanée</li>
          </ul>
          <a href="tunnel_souscription.php?pack=domiciliation-international-business" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card popular">
          <div class="popular-badge">Prestige</div>
          <div class="card-header"><h3>PREMIUM EXECUTIVE</h3><div class="price">175 000 FCFA<span> / mois</span></div><div class="price-sub">~290 USD</div></div>
          <ul class="features-list">
            <li>Tout du Pack Business Virtual</li>
            <li><strong>20h/mois bureau privé haut standing</strong></li>
            <li>Accueil de prestige de vos délégations</li>
            <li>Café à volonté pendant les sessions</li>
          </ul>
          <a href="tunnel_souscription.php?pack=domiciliation-international-premium" class="btn btn-primary btn-block">Je m'abonne</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== KYC SECTION ============== -->
  <section class="kyc-section">
    <div class="container">
      <div class="kyc-card">
        <div class="kyc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
        <div class="kyc-content">
          <h2>Charte de Conformité & Dispositif KYC</h2>
          <p>En conformité stricte avec les réglementations nationales et les standards internationaux de transparence, l'accès à l'ensemble de nos infrastructures est soumis à une procédure obligatoire de vérification d'identité (pièces d'identité certifiées, statuts, justificatif de domicile, description d'activité). FEDPAWA CORPORATE SOLUTIONS se réserve le droit de refuser toute souscription non conforme.</p>
        </div>
      </div>
    </div>
  </section>

<!-- ============== LIGHTBOX ============== -->
<div class="lightbox" id="lightbox">
  <span class="lightbox-close">&times;</span>
  <img src="" id="lightboxImg" alt="Aperçu agrandi">
</div>

<?php
$extraJs = ['assets/js/gallery.js'];
include __DIR__ . '/../templates/partials/site-footer.php';
