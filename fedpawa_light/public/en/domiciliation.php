<?php
$lang = 'en';
$title = "Domiciliation for Legal Entities & Companies in Douala Logpom | FEDPAWA CORPORATE SOLUTIONS SARL";
$description = "Business domiciliation in Douala Logpom - FEDPAWA CORPORATE SOLUTIONS SARL. Registered office address, mail handling, telephone secretariat and Executive offices for entrepreneurs, SMEs and multinationals.";
$active = 'domiciliation';
$extraCss = ['assets/css/pages.css'];
$langPrefix = '../';

include __DIR__ . '/../../templates/partials/site-header.php';
?>
  <!-- ============== HERO ============== -->
  <section class="page-hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">Certified premises in Logpom</div>
        <h1>Domiciliation for Legal Entities & Companies</h1>
        <p class="subtitle">Your Business Infrastructure & Operational Hub in Douala (Logpom)</p>
        <p>Whether you are a local entrepreneur launching your first business in Cameroon, a fast-growing national SME, or a multinational opening its subsidiary in Central Africa, classic real estate should no longer be a brake on your ambitions. Avoid the stifling costs of a traditional commercial lease, the financial immobilization of multi-year deposits and the daily management of energy or connectivity infrastructures.</p>
        <p>FEDPAWA CORPORATE SOLUTIONS SARL makes a first-class business infrastructure available to all companies, regardless of size or location, in the heart of Douala, Logpom.</p>
        <p>Far more than a simple administrative address, our centre provides every executive with a trusted ecosystem: the permanence of an on-site team to secure your document flows and parcels, an interconnected telephone secretariat so you never miss a client, and exclusive access to a high-end Executive director's office for your work sessions or strategic meetings.</p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <a href="#packs-nationaux" class="btn btn-primary">Discover our plans</a>
          <a href="<?= $langPrefix ?>contact.php" class="btn btn-outline">Visit the premises</a>
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
          <h3>🛑 Contractual Framework & Legal Security</h3>
          <p>To guarantee total flexibility for our clients, all of our hosting solutions are governed exclusively by an <strong>Infrastructure and Services Provision Agreement</strong>.</p>
          <p>This legal act expressly excludes the status of commercial leases within the meaning of the Uniform OHADA Law. Consequently, this agreement grants no right to renewal, no commercial property and no right to remain in the premises for the subscriber. It is a provision of material, logistical and technological services, entirely flexible and revocable, ensuring perfect legal security and total freedom for both parties.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== GALLERY ============== -->
  <section class="section-padding section-alt">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Virtual tour</span>
        <h2>Gallery of our spaces</h2>
        <p>Discover the high-end environment we provide you in Logpom.</p>
      </div>

      <div class="gallery-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="accueil">Reception</button>
        <button class="filter-btn" data-filter="bureau">Private Offices</button>
        <button class="filter-btn" data-filter="reunion">Meeting room</button>
      </div>

      <div class="gallery-grid">
        <div class="gallery-item w-2 h-2" data-category="accueil">
          <img src="../assets/images/photo_1.jpg" alt="Reception and welcome desk" loading="lazy">
          <span class="gallery-caption">Reception & Welcome</span>
        </div>
        <div class="gallery-item" data-category="bureau">
          <img src="../assets/images/photo_2.jpg" alt="Private office" loading="lazy">
          <span class="gallery-caption">Executive Private Office</span>
        </div>
        <div class="gallery-item" data-category="reunion">
          <img src="../assets/images/photo_3.jpg" alt="Meeting room" loading="lazy">
          <span class="gallery-caption">Meeting Room & Hub</span>
        </div>
        <div class="gallery-item" data-category="bureau">
          <img src="../assets/images/photo_4.jpg" alt="Equipped office" loading="lazy">
          <span class="gallery-caption">High-speed workspace</span>
        </div>
        <div class="gallery-item w-2" data-category="accueil">
          <img src="../assets/images/photo_5.jpg" alt="Coffee area" loading="lazy">
          <span class="gallery-caption">Coffee & Lounge Area</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== NATIONAL RANGE ============== -->
  <section class="section-padding" id="packs-nationaux">
    <div class="container">
      <div class="pricing-intro">
        <span class="section-kicker">🇨🇲 National Range</span>
        <h2>Plans for local companies</h2>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="card-header"><h3>🔹 ESSENTIAL Plan</h3><div class="price">25 000 FCFA<span> / month</span></div></div>
          <ul class="features-list">
            <li>Registered office address in Logpom, Douala</li>
            <li>Mail reception</li>
            <li>Systematic scanning of every letter</li>
            <li>Digital archiving (1 month)</li>
            <li>Email and WhatsApp notification upon each reception</li>
            <li><strong>6 hours of private office per month included</strong></li>
          </ul>
          <a href="<?= $langPrefix ?>souscription_domiciliation.php?pack=national-essential" class="btn btn-outline btn-block">Subscribe</a>
        </div>
        <div class="pricing-card">
          <div class="card-header"><h3>🔹 BUSINESS Plan</h3><div class="price">45 000 FCFA<span> / month</span></div></div>
          <ul class="features-list">
            <li>Registered office address in Logpom, Douala</li>
            <li>Mail reception</li>
            <li>Systematic scanning of every letter</li>
            <li>Digital archiving (1 month)</li>
            <li>Email and WhatsApp notification upon each reception</li>
            <li>Monthly physical mail forwarding</li>
            <li><strong>10 hours of private office per month included</strong> (with High-Performance Wi-Fi)</li>
          </ul>
          <a href="<?= $langPrefix ?>souscription_domiciliation.php?pack=national-business" class="btn btn-outline btn-block">Subscribe</a>
        </div>
        <div class="pricing-card popular">
          <div class="popular-badge">Popular</div>
          <div class="card-header"><h3>👑 PREMIUM Plan</h3><div class="price">70 000 FCFA<span> / month</span></div></div>
          <ul class="features-list">
            <li>Registered office address in Logpom, Douala</li>
            <li>Mail reception</li>
            <li>Systematic scanning of every letter</li>
            <li>Digital archiving (1 month)</li>
            <li>Email and WhatsApp notification upon each reception</li>
            <li>Instant physical mail forwarding</li>
            <li><strong>📞 Dedicated bilingual Receptionist (French & English)</strong>: answering incoming calls exclusively in your company's name with instant message forwarding</li>
            <li>Assignment of a local phone number</li>
            <li><strong>15 hours of private office per month included</strong> (with High-Performance Wi-Fi)</li>
          </ul>
          <a href="<?= $langPrefix ?>souscription_domiciliation.php?pack=national-premium" class="btn btn-primary btn-block">Subscribe</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== INTERNATIONAL RANGE ============== -->
  <section class="section-padding section-alt">
    <div class="container">
      <div class="pricing-intro">
        <span class="section-kicker">🌍 International Range & Diaspora</span>
        <h2>Diaspora & Multinational Plans</h2>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="card-header"><h3>✈️ ESSENTIAL DIGITAL</h3><div class="price">50 000 FCFA<span> / month</span></div><div class="price-sub">~88 USD</div></div>
          <ul class="features-list">
            <li>Official registered office address in Logpom</li>
            <li>Physical reception of mail and parcels at the front desk</li>
            <li>Instant digitization and scanning of every letter received</li>
            <li>Immediate sending of scanned documents by email or WhatsApp</li>
            <li>Physical parcel forwarding service abroad (postage at actual cost)</li>
          </ul>
          <a href="<?= $langPrefix ?>souscription_domiciliation.php?pack=international-essential" class="btn btn-outline btn-block">Subscribe</a>
        </div>
        <div class="pricing-card">
          <div class="card-header"><h3>📞 BUSINESS VIRTUAL</h3><div class="price">110 000 FCFA<span> / month</span></div><div class="price-sub">~180 USD</div></div>
          <ul class="features-list">
            <li>Official registered office address in Logpom</li>
            <li>Physical reception of mail and parcels at the front desk</li>
            <li>Instant digitization and scanning of every letter received</li>
            <li>Immediate sending of scanned documents by email or WhatsApp</li>
            <li>Physical parcel forwarding service abroad (postage at actual cost)</li>
            <li>Assignment of a dedicated local Cameroonian phone number</li>
            <li>Personalized telephone answering in your company's name by the bilingual receptionist</li>
            <li>Message taking and instant call transmission via WhatsApp or email</li>
          </ul>
          <a href="<?= $langPrefix ?>souscription_domiciliation.php?pack=international-business" class="btn btn-outline btn-block">Subscribe</a>
        </div>
        <div class="pricing-card popular">
          <div class="popular-badge">Prestige</div>
          <div class="card-header"><h3>🌟 PREMIUM EXECUTIVE</h3><div class="price">175 000 FCFA<span> / month</span></div><div class="price-sub">~290 USD</div></div>
          <ul class="features-list">
            <li>Official registered office address in Logpom</li>
            <li>Physical reception of mail and parcels at the front desk</li>
            <li>Instant digitization and scanning of every letter received</li>
            <li>Immediate sending of scanned documents by email or WhatsApp</li>
            <li>Physical parcel forwarding service abroad (postage at actual cost)</li>
            <li>Assignment of a dedicated local Cameroonian phone number</li>
            <li>Personalized telephone answering in your company's name by the bilingual receptionist</li>
            <li>Message taking and instant call transmission via WhatsApp or email</li>
            <li><strong>Monthly quota of 20 hours in a high-end air-conditioned private office</strong> (by reservation)</li>
            <li>High-speed Internet connection included during your session hours</li>
            <li>Prestigious welcome of your business delegations by the receptionist</li>
            <li>Unlimited coffee included for the whole team during sessions</li>
          </ul>
          <a href="<?= $langPrefix ?>souscription_domiciliation.php?pack=international-premium" class="btn btn-primary btn-block">Subscribe</a>
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
          <h2>🔒 Compliance Charter & KYC (Know Your Customer) Framework</h2>
          <p>"In strict compliance with national regulations and international transparency standards, access to all of our infrastructure and document management services is subject to a mandatory identity verification procedure. Every subscriber, whether national or international, must provide a certified true copy of the directors' identity documents, the company's articles of association (or draft articles), proof of address and a transparent description of the actual economic activities. FEDPAWA CORPORATE SOLUTIONS SARL reserves the right to refuse any subscription that does not meet these criteria of transparency and legal security."</p>
        </div>
      </div>
    </div>
  </section>

<!-- ============== LIGHTBOX ============== -->
<div class="lightbox" id="lightbox">
  <span class="lightbox-close">&times;</span>
  <img src="" id="lightboxImg" alt="Enlarged preview">
</div>

<?php
$extraJs = ['assets/js/gallery.js'];
include __DIR__ . '/../../templates/partials/site-footer.php';
