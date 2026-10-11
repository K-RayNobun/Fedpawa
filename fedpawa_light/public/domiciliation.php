<?php
$title = "Domiciliation de Personnes Morales et d'Entreprises à Douala Logpom | FEDPAWA CORPORATE SOLUTIONS SARL";
$description = "Domiciliation de personnes morales et d'entreprises à Douala Logpom - FEDPAWA CORPORATE SOLUTIONS SARL. Siège social, gestion de courrier, secrétariat téléphonique et bureaux Executive pour entrepreneurs, PME et multinationales.";
$active = 'domiciliation';
$extraCss = ['assets/css/pages.css'];

include __DIR__ . '/../templates/partials/site-header.php';
?>
  <!-- ============== HERO ============== -->
  <section class="page-hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">Locaux certifiés à Logpom</div>
        <h1>Domiciliation de Personnes Morales et d'Entreprises</h1>
        <p class="subtitle">Votre Infrastructure d'Affaires & Hub Opérationnel à Douala (Logpom)</p>
        <p>Que vous soyez un entrepreneur local lançant votre première activité au Cameroun, une PME nationale en pleine croissance, ou une multinationale ouvrant sa filiale en Afrique Centrale, l'immobilier classique ne doit plus être un frein à vos ambitions. Évitez les coûts étouffants d'un bail commercial traditionnel, les immobilisations financières de cautions pluriannuelles et la gestion quotidienne des infrastructures d'énergie ou de connectivité.</p>
        <p>FEDPAWA CORPORATE SOLUTIONS SARL met à la disposition de toutes les entreprises, sans distinction de taille ou de localisation, une infrastructure d'affaires de premier ordre au cœur de Douala, Logpom.</p>
        <p>Bien plus qu'une simple adresse administrative, notre centre fournit à chaque dirigeant un écosystème de confiance : la permanence d'une équipe sur place pour sécuriser vos flux documentaires et vos colis, un secrétariat téléphonique interconnecté pour ne rater aucun client, et l'accès exclusif à un bureau de direction Executive haut de gamme pour vos séances de travail ou vos rendez-vous stratégiques.</p>
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
          <h3>🛑 Cadre Contractuel & Sécurité Juridique</h3>
          <p>Afin de garantir une flexibilité totale à nos clients, l'intégralité de nos solutions d'hébergement est régie de manière exclusive par une <strong>Convention de mise à disposition d'infrastructures et de prestations de services</strong>.</p>
          <p>Cet acte juridique exclut expressément le statut des baux commerciaux au sens du droit Uniforme OHADA. En conséquence, cette convention n'accorde aucun droit au renouvellement, aucune propriété commerciale ni aucun droit de maintien dans les lieux au profit du souscripteur. Il s'agit d'une mise à disposition de services matériels, logistiques et technologiques, entièrement flexible et révocable, assurant une parfaite sécurité juridique et une liberté totale aux deux parties.</p>
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
        <span class="section-kicker">🇨🇲 Gamme Nationale</span>
        <h2>Packs pour les entreprises locales</h2>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="card-header"><h3>🔹 Pack ESSENTIAL</h3><div class="price">25 000 FCFA<span> / mois</span></div></div>
          <ul class="features-list">
            <li>Adresse de siège social à Logpom, Douala</li>
            <li>Réception du courrier</li>
            <li>Scan systématique de chaque courrier</li>
            <li>Archivage numérique (1 mois)</li>
            <li>Notification par email et WhatsApp à chaque réception</li>
            <li><strong>6 heures de bureau privé par mois incluses</strong></li>
          </ul>
          <a href="souscription_domiciliation.php?pack=national-essential" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card">
          <div class="card-header"><h3>🔹 Pack BUSINESS</h3><div class="price">45 000 FCFA<span> / mois</span></div></div>
          <ul class="features-list">
            <li>Adresse de siège social à Logpom, Douala</li>
            <li>Réception du courrier</li>
            <li>Scan systématique de chaque courrier</li>
            <li>Archivage numérique (1 mois)</li>
            <li>Notification par email et WhatsApp à chaque réception</li>
            <li>Réexpédition physique mensuelle du courrier</li>
            <li><strong>10 heures de bureau privé par mois incluses</strong> (avec Connexion Wifi Haute Performance)</li>
          </ul>
          <a href="souscription_domiciliation.php?pack=national-business" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card popular">
          <div class="popular-badge">Populaire</div>
          <div class="card-header"><h3>👑 Pack PREMIUM</h3><div class="price">70 000 FCFA<span> / mois</span></div></div>
          <ul class="features-list">
            <li>Adresse de siège social à Logpom, Douala</li>
            <li>Réception du courrier</li>
            <li>Scan systématique de chaque courrier</li>
            <li>Archivage numérique (1 mois)</li>
            <li>Notification par email et WhatsApp à chaque réception</li>
            <li>Réexpédition physique instantanée du courrier</li>
            <li><strong>📞 Réceptionniste Dédiée bilingue (Français & Anglais)</strong> : réponses aux appels entrants au nom exclusif de votre entreprise et transfert instantané des messages</li>
            <li>Attribution d'un numéro de téléphone local</li>
            <li><strong>15 heures de bureau privé par mois incluses</strong> (avec Connexion Wifi Haute Performance)</li>
          </ul>
          <a href="souscription_domiciliation.php?pack=national-premium" class="btn btn-primary btn-block">Je m'abonne</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== GAMME INTERNATIONALE ============== -->
  <section class="section-padding section-alt">
    <div class="container">
      <div class="pricing-intro">
        <span class="section-kicker">🌍 Gamme Internationale & Diaspora</span>
        <h2>Packs Diaspora & Multinationales</h2>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="card-header"><h3>✈️ ESSENTIAL DIGITAL</h3><div class="price">50 000 FCFA<span> / mois</span></div><div class="price-sub">~88 USD</div></div>
          <ul class="features-list">
            <li>Adresse officielle du siège social à Logpom</li>
            <li>Réception physique des plis et des colis à l'accueil</li>
            <li>Numérisation et scan instantané de chaque courrier reçu</li>
            <li>Envoi immédiat des documents scannés par e-mail ou WhatsApp</li>
            <li>Service de réexpédition physique des colis vers l'étranger (frais de port au réel)</li>
          </ul>
          <a href="souscription_domiciliation.php?pack=international-essential" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card">
          <div class="card-header"><h3>📞 BUSINESS VIRTUAL</h3><div class="price">110 000 FCFA<span> / mois</span></div><div class="price-sub">~180 USD</div></div>
          <ul class="features-list">
            <li>Adresse officielle du siège social à Logpom</li>
            <li>Réception physique des plis et des colis à l'accueil</li>
            <li>Numérisation et scan instantané de chaque courrier reçu</li>
            <li>Envoi immédiat des documents scannés par e-mail ou WhatsApp</li>
            <li>Service de réexpédition physique des colis vers l'étranger (frais de port au réel)</li>
            <li>Attribution d'un numéro de téléphone local camerounais dédié</li>
            <li>Réponse téléphonique personnalisée au nom de votre entreprise par la réceptionniste bilingue</li>
            <li>Prise de message et transmission immédiate des appels par WhatsApp ou e-mail</li>
          </ul>
          <a href="souscription_domiciliation.php?pack=international-business" class="btn btn-outline btn-block">Je m'abonne</a>
        </div>
        <div class="pricing-card popular">
          <div class="popular-badge">Prestige</div>
          <div class="card-header"><h3>🌟 PREMIUM EXECUTIVE</h3><div class="price">175 000 FCFA<span> / mois</span></div><div class="price-sub">~290 USD</div></div>
          <ul class="features-list">
            <li>Adresse officielle du siège social à Logpom</li>
            <li>Réception physique des plis et des colis à l'accueil</li>
            <li>Numérisation et scan instantané de chaque courrier reçu</li>
            <li>Envoi immédiat des documents scannés par e-mail ou WhatsApp</li>
            <li>Service de réexpédition physique des colis vers l'étranger (frais de port au réel)</li>
            <li>Attribution d'un numéro de téléphone local camerounais dédié</li>
            <li>Réponse téléphonique personnalisée au nom de votre entreprise par la réceptionniste bilingue</li>
            <li>Prise de message et transmission immédiate des appels par WhatsApp ou e-mail</li>
            <li><strong>Quota de 20 heures par mois dans un bureau privé climatisé de haut standing</strong> (sur réservation)</li>
            <li>Connexion Internet haut débit incluse pendant vos heures de session</li>
            <li>Accueil de prestige de vos délégations d'affaires par la réceptionniste</li>
            <li>Café inclus à volonté pour toute l'équipe pendant les sessions</li>
          </ul>
          <a href="souscription_domiciliation.php?pack=international-premium" class="btn btn-primary btn-block">Je m'abonne</a>
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
          <h2>🔒 Charte de Conformité & Dispositif KYC (Know Your Customer)</h2>
          <p>« En conformité stricte avec les réglementations nationales et les standards internationaux de transparence, l'accès à l'ensemble de nos infrastructures et services de gestion documentaire est soumis à une procédure obligatoire de vérification d'identité. Chaque souscripteur, qu'il soit national ou international, doit fournir une copie certifiée conforme des pièces d'identité des dirigeants, les statuts de la structure (ou projets de statuts), un justificatif de domicile et une description transparente des activités économiques réelles. FEDPAWA CORPORATE SOLUTIONS SARL se réserve le droit de refuser toute souscription ne répondant pas à ces critères de transparence et de sécurité légale. »</p>
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
