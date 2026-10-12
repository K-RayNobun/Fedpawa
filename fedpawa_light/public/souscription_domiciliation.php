<?php
$title = "Souscription Domiciliation d'Entreprises | FEDPAWA CORPORATE SOLUTIONS SARL";
$description = "Formulaire de souscription en ligne au service de domiciliation d'entreprises et mise à disposition d'infrastructures de FEDPAWA CORPORATE SOLUTIONS SARL à Douala Logpom.";
$active = 'services';
$extraCss = ['assets/css/dashboard.css'];

include __DIR__ . '/../templates/partials/site-header.php';
?>
<div class="progress-wrapper" id="domStepper">
  <div class="container">
      <div class="dom-step-mobile" id="domStepMobile">
        <div class="dom-step-mobile-txt"><span id="domStepCount">&Eacute;tape 1/5</span><strong id="domStepTitle">Entreprise</strong></div>
        <div class="dom-step-mobile-bar"><div class="dom-step-mobile-fill" id="domStepFill"></div></div>
      </div>
    <div class="progress-container">
      <div class="progress-line"><div class="progress-line-fill" id="progressFill"></div></div>
      <div class="progress-step active" data-step="1"><div class="progress-dot">1</div><span class="progress-label">Entreprise</span></div>
      <div class="progress-step" data-step="2"><div class="progress-dot">2</div><span class="progress-label">Repr&eacute;sentant</span></div>
      <div class="progress-step" data-step="3"><div class="progress-dot">3</div><span class="progress-label">Contact</span></div>
      <div class="progress-step" data-step="4"><div class="progress-dot">4</div><span class="progress-label">Formule</span></div>
      <div class="progress-step" data-step="5"><div class="progress-dot">5</div><span class="progress-label">Documents</span></div>
    </div>
  </div>
</div>

<div class="container" style="padding: 32px 16px 64px;">
  <div class="tunnel-layout-v2">

    <!-- ============ COLONNE GAUCHE : FORMULAIRE 6 SECTIONS ============ -->
    <div class="tunnel-card" style="padding: 40px; box-shadow: none; border: 1px solid var(--color-border);" id="souscriptionForm">

      <div class="step-header" style="margin-bottom: 28px;">
        <h1 style="font-size: 1.6rem;">Formulaire de Souscription en Ligne</h1>
        <p style="font-size: 1rem; color: var(--color-primary); font-weight: 600;">Service de Domiciliation d'Entreprises et Mise à Disposition d'Infrastructures</p>
      </div>

      <form id="domiciliationForm" novalidate>

      <div class="tunnel-step-content active" data-step="1">
        <!-- ============ SECTION 1 – SITUATION DE L'ENTREPRISE ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">1</span> Situation de l'Entreprise</h2>

          <div class="form-group">
            <label>Statut de la structure <em class="req">*</em></label>
            <div class="radio-row">
              <label class="radio-pill"><input type="radio" name="statut_structure" value="existante" checked> Entreprise déjà immatriculée (Existante)</label>
              <label class="radio-pill"><input type="radio" name="statut_structure" value="creation"> Entreprise en cours de constitution / création</label>
            </div>
          </div>

          <div class="form-group">
            <label for="denomination">Dénomination sociale / Nom commercial <em class="req">*</em></label>
            <input type="text" id="denomination" name="denomination" class="form-control" required placeholder="Exemple : FEDPAWA CORPORATE SOLUTIONS SARL">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="forme_juridique">Forme juridique <em class="req">*</em></label>
              <select id="forme_juridique" name="forme_juridique" class="form-control" required>
                <option value="">— Sélectionner —</option>
                <option>SARL / SARLU</option>
                <option>SAS / SASU</option>
                <option>SA</option>
                <option>Établissement (Nom propre / EI)</option>
                <option>GIE (Groupement d'Intérêt Économique)</option>
                <option>Succursale / Filiale</option>
                <option>Autre (précisez)</option>
              </select>
            </div>
            <div class="form-group" id="forme-autre-group" style="display: none;">
              <label for="forme_autre">Précisez la forme juridique</label>
              <input type="text" id="forme_autre" name="forme_autre" class="form-control" placeholder="Spécifiez votre forme juridique">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="rccm">Numéro RCCM (Registre du Commerce) <em class="req" id="rccm-req">*</em></label>
              <input type="text" id="rccm" name="rccm" class="form-control" required placeholder="Ex : RCCM/DL/2024/B/1234">
              <small class="field-hint" id="rccm-hint">Si votre entreprise est en cours de création, indiquez « En cours ».</small>
            </div>
            <div class="form-group">
              <label for="niu">Numéro NIU (Numéro d'Identifiant Unique) <em class="req" id="niu-req">*</em></label>
              <input type="text" id="niu" name="niu" class="form-control" required placeholder="Ex : M123456789">
              <small class="field-hint" id="niu-hint">Si votre entreprise est en cours de création, indiquez « En cours ».</small>
            </div>
          </div>

          <div class="form-group">
            <label for="secteur">Secteur d'activité principal <em class="req">*</em></label>
            <select id="secteur" name="secteur" class="form-control" required>
              <option value="">— Sélectionner —</option>
              <option>Commerce et distribution</option>
              <option>Services aux entreprises / Conseil</option>
              <option>Bâtiment et travaux publics (BTP)</option>
              <option>Agroalimentaire & Agriculture</option>
              <option>Technologie, Numérique & E-commerce</option>
              <option>Santé, Pharmacie & Bien-être</option>
              <option>Éducation, Formation & Coaching</option>
              <option>Transport, Logistique & Import-Export</option>
              <option>Finance, Assurance & Immobilier</option>
              <option>Autre (précisez)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="description">Description synthétique des activités <em class="req">*</em></label>
            <textarea id="description" name="description" class="form-control" rows="3" required placeholder="Décrivez brièvement l'objet social de votre entreprise."></textarea>
          </div>
        </section>

<div class="btn-group"><button type="button" class="btn btn-primary" onclick="domNext()">Continuer &rarr;</button></div>
      </div>

      <div class="tunnel-step-content" data-step="2">
        <!-- ============ SECTION 2 – REPRÉSENTANT LÉGAL & DIRIGEANT ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">2</span> Représentant Légal & Dirigeant</h2>

          <div class="form-row">
            <div class="form-group">
              <label for="civilite">Civilité <em class="req">*</em></label>
              <select id="civilite" name="civilite" class="form-control" required>
                <option value="">— Sélectionner —</option>
                <option>Monsieur</option>
                <option>Madame</option>
              </select>
            </div>
            <div class="form-group">
              <label for="nom_complet">Nom complet (Nom et Prénoms) <em class="req">*</em></label>
              <input type="text" id="nom_complet" name="nom_complet" class="form-control" required placeholder="Ex : Jean-Marie Dupont">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="fonction">Fonction / Qualité <em class="req">*</em></label>
              <select id="fonction" name="fonction" class="form-control" required>
                <option value="">— Sélectionner —</option>
                <option>Gérant / Co-gérant</option>
                <option>Président / Director</option>
                <option>Directeur Général</option>
                <option>Fondateur / Promoteur</option>
                <option>Mandataire / Fondé de pouvoir</option>
              </select>
            </div>
            <div class="form-group">
              <label for="nationalite">Nationalité <em class="req">*</em></label>
              <input type="text" id="nationalite" name="nationalite" class="form-control" required placeholder="Ex : Camerounaise">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="type_piece">Type de pièce d'identité officielle <em class="req">*</em></label>
              <select id="type_piece" name="type_piece" class="form-control" required>
                <option value="">— Sélectionner —</option>
                <option>Carte Nationale d'Identité (CNI)</option>
                <option>Passeport</option>
                <option>Carte de Séjour / Titre de Résidence</option>
              </select>
            </div>
            <div class="form-group">
              <label for="num_piece">Numéro de la pièce d'identité <em class="req">*</em></label>
              <input type="text" id="num_piece" name="num_piece" class="form-control" required placeholder="Numéro figurant sur la pièce">
            </div>
          </div>
        </section>

<div class="btn-group"><button type="button" class="btn btn-outline" onclick="goToStep(1)">&larr; Retour</button><button type="button" class="btn btn-primary" onclick="domNext()">Continuer &rarr;</button></div>
      </div>

      <div class="tunnel-step-content" data-step="3">
        <!-- ============ SECTION 3 – COORDONNÉES DE CONTACT & NOTIFICATION ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">3</span> Coordonnées de Contact & Notification</h2>
          <p class="section-intro">Ces coordonnées seront utilisées pour la transmission de vos courriers et l'accès à votre espace client.</p>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Adresse e-mail professionnelle <em class="req">*</em></label>
              <input type="email" id="email" name="email" class="form-control" required placeholder="vous@votre-entreprise.com">
            </div>
            <div class="form-group">
              <label for="telephone">Téléphone principal (WhatsApp) <em class="req">*</em></label>
              <input type="tel" id="telephone" name="telephone" class="form-control" required placeholder="+237 6XX XXX XXX" pattern="^\+?[0-9\s]{9,16}$">
              <small class="field-hint">Format : +237 6XX XXX XXX</small>
            </div>
          </div>

          <div class="form-group">
            <label for="adresse">Adresse de résidence / Siège actuel <em class="req">*</em></label>
            <input type="text" id="adresse" name="adresse" class="form-control" required placeholder="Quartier, rue, repère…">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ville">Ville de résidence <em class="req">*</em></label>
              <input type="text" id="ville" name="ville" class="form-control" required placeholder="Ex : Douala">
            </div>
            <div class="form-group">
              <label for="pays">Pays de résidence <em class="req">*</em></label>
              <select id="pays" name="pays" class="form-control" required>
<option value="" disabled>— Sélectionnez votre pays —</option>              <option value="Cameroun" selected>Cameroun</option>              <option value="Afghanistan">Afghanistan</option>              <option value="Afrique du Sud">Afrique du Sud</option>              <option value="Albanie">Albanie</option>              <option value="Algérie">Algérie</option>              <option value="Allemagne">Allemagne</option>              <option value="Andorre">Andorre</option>              <option value="Angola">Angola</option>              <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>              <option value="Arabie saoudite">Arabie saoudite</option>              <option value="Argentine">Argentine</option>              <option value="Arménie">Arménie</option>              <option value="Australie">Australie</option>              <option value="Autriche">Autriche</option>              <option value="Azerbaïdjan">Azerbaïdjan</option>              <option value="Bahamas">Bahamas</option>              <option value="Bahreïn">Bahreïn</option>              <option value="Bangladesh">Bangladesh</option>              <option value="Barbade">Barbade</option>              <option value="Belgique">Belgique</option>              <option value="Belize">Belize</option>              <option value="Bénin">Bénin</option>              <option value="Bhoutan">Bhoutan</option>              <option value="Biélorussie">Biélorussie</option>              <option value="Birmanie">Birmanie</option>              <option value="Bolivie">Bolivie</option>              <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>              <option value="Botswana">Botswana</option>              <option value="Brésil">Brésil</option>              <option value="Brunei">Brunei</option>              <option value="Bulgarie">Bulgarie</option>              <option value="Burkina Faso">Burkina Faso</option>              <option value="Burundi">Burundi</option>              <option value="Cambodge">Cambodge</option>              <option value="Canada">Canada</option>              <option value="Cap-Vert">Cap-Vert</option>              <option value="Chili">Chili</option>              <option value="Chine">Chine</option>              <option value="Chypre">Chypre</option>              <option value="Colombie">Colombie</option>              <option value="Comores">Comores</option>              <option value="Congo RDC">Congo RDC</option>              <option value="Congo-Brazzaville">Congo-Brazzaville</option>              <option value="Corée du Nord">Corée du Nord</option>              <option value="Corée du Sud">Corée du Sud</option>              <option value="Costa Rica">Costa Rica</option>              <option value="Côte d'Ivoire">Côte d'Ivoire</option>              <option value="Croatie">Croatie</option>              <option value="Cuba">Cuba</option>              <option value="Danemark">Danemark</option>              <option value="Djibouti">Djibouti</option>              <option value="Dominique">Dominique</option>              <option value="Égypte">Égypte</option>              <option value="Émirats arabes unis">Émirats arabes unis</option>              <option value="Équateur">Équateur</option>              <option value="Érythrée">Érythrée</option>              <option value="Espagne">Espagne</option>              <option value="Estonie">Estonie</option>              <option value="Eswatini">Eswatini</option>              <option value="États-Unis">États-Unis</option>              <option value="Éthiopie">Éthiopie</option>              <option value="Fidji">Fidji</option>              <option value="Finlande">Finlande</option>              <option value="France">France</option>              <option value="Gabon">Gabon</option>              <option value="Gambie">Gambie</option>              <option value="Géorgie">Géorgie</option>              <option value="Ghana">Ghana</option>              <option value="Grèce">Grèce</option>              <option value="Grenade">Grenade</option>              <option value="Guatemala">Guatemala</option>              <option value="Guinée">Guinée</option>              <option value="Guinée équatoriale">Guinée équatoriale</option>              <option value="Guinée-Bissau">Guinée-Bissau</option>              <option value="Guyana">Guyana</option>              <option value="Haïti">Haïti</option>              <option value="Honduras">Honduras</option>              <option value="Hongrie">Hongrie</option>              <option value="Îles Marshall">Îles Marshall</option>              <option value="Îles Salomon">Îles Salomon</option>              <option value="Inde">Inde</option>              <option value="Indonésie">Indonésie</option>              <option value="Irak">Irak</option>              <option value="Iran">Iran</option>              <option value="Irlande">Irlande</option>              <option value="Islande">Islande</option>              <option value="Israël">Israël</option>              <option value="Italie">Italie</option>              <option value="Jamaïque">Jamaïque</option>              <option value="Japon">Japon</option>              <option value="Jordanie">Jordanie</option>              <option value="Kazakhstan">Kazakhstan</option>              <option value="Kenya">Kenya</option>              <option value="Kirghizistan">Kirghizistan</option>              <option value="Kiribati">Kiribati</option>              <option value="Koweït">Koweït</option>              <option value="Laos">Laos</option>              <option value="Lesotho">Lesotho</option>              <option value="Lettonie">Lettonie</option>              <option value="Liban">Liban</option>              <option value="Liberia">Liberia</option>              <option value="Libye">Libye</option>              <option value="Liechtenstein">Liechtenstein</option>              <option value="Lituanie">Lituanie</option>              <option value="Luxembourg">Luxembourg</option>              <option value="Macédoine du Nord">Macédoine du Nord</option>              <option value="Madagascar">Madagascar</option>              <option value="Malaisie">Malaisie</option>              <option value="Malawi">Malawi</option>              <option value="Maldives">Maldives</option>              <option value="Mali">Mali</option>              <option value="Malte">Malte</option>              <option value="Maroc">Maroc</option>              <option value="Maurice">Maurice</option>              <option value="Mauritanie">Mauritanie</option>              <option value="Mexique">Mexique</option>              <option value="Micronésie">Micronésie</option>              <option value="Moldavie">Moldavie</option>              <option value="Monaco">Monaco</option>              <option value="Mongolie">Mongolie</option>              <option value="Monténégro">Monténégro</option>              <option value="Mozambique">Mozambique</option>              <option value="Namibie">Namibie</option>              <option value="Nauru">Nauru</option>              <option value="Népal">Népal</option>              <option value="Nicaragua">Nicaragua</option>              <option value="Niger">Niger</option>              <option value="Nigeria">Nigeria</option>              <option value="Norvège">Norvège</option>              <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>              <option value="Oman">Oman</option>              <option value="Ouganda">Ouganda</option>              <option value="Ouzbékistan">Ouzbékistan</option>              <option value="Pakistan">Pakistan</option>              <option value="Palaos">Palaos</option>              <option value="Palestine">Palestine</option>              <option value="Panama">Panama</option>              <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>              <option value="Paraguay">Paraguay</option>              <option value="Pays-Bas">Pays-Bas</option>              <option value="Pérou">Pérou</option>              <option value="Philippines">Philippines</option>              <option value="Pologne">Pologne</option>              <option value="Portugal">Portugal</option>              <option value="Qatar">Qatar</option>              <option value="République centrafricaine">République centrafricaine</option>              <option value="République dominicaine">République dominicaine</option>              <option value="République tchèque">République tchèque</option>              <option value="Roumanie">Roumanie</option>              <option value="Royaume-Uni">Royaume-Uni</option>              <option value="Russie">Russie</option>              <option value="Rwanda">Rwanda</option>              <option value="Saint-Kitts-et-Nevis">Saint-Kitts-et-Nevis</option>              <option value="Saint-Marin">Saint-Marin</option>              <option value="Saint-Vincent-et-les-Grenadines">Saint-Vincent-et-les-Grenadines</option>              <option value="Sainte-Lucie">Sainte-Lucie</option>              <option value="Salvador">Salvador</option>              <option value="Samoa">Samoa</option>              <option value="São Tomé-et-Principe">São Tomé-et-Principe</option>              <option value="Sénégal">Sénégal</option>              <option value="Serbie">Serbie</option>              <option value="Seychelles">Seychelles</option>              <option value="Sierra Leone">Sierra Leone</option>              <option value="Singapour">Singapour</option>              <option value="Slovaquie">Slovaquie</option>              <option value="Slovénie">Slovénie</option>              <option value="Somalie">Somalie</option>              <option value="Soudan">Soudan</option>              <option value="Soudan du Sud">Soudan du Sud</option>              <option value="Sri Lanka">Sri Lanka</option>              <option value="Suède">Suède</option>              <option value="Suisse">Suisse</option>              <option value="Suriname">Suriname</option>              <option value="Syrie">Syrie</option>              <option value="Tadjikistan">Tadjikistan</option>              <option value="Tanzanie">Tanzanie</option>              <option value="Tchad">Tchad</option>              <option value="Thaïlande">Thaïlande</option>              <option value="Timor oriental">Timor oriental</option>              <option value="Togo">Togo</option>              <option value="Tonga">Tonga</option>              <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>              <option value="Tunisie">Tunisie</option>              <option value="Turkménistan">Turkménistan</option>              <option value="Turquie">Turquie</option>              <option value="Tuvalu">Tuvalu</option>              <option value="Ukraine">Ukraine</option>              <option value="Uruguay">Uruguay</option>              <option value="Vanuatu">Vanuatu</option>              <option value="Vatican">Vatican</option>              <option value="Venezuela">Venezuela</option>              <option value="Vietnam">Vietnam</option>              <option value="Yémen">Yémen</option>              <option value="Zambie">Zambie</option>              <option value="Zimbabwe">Zimbabwe</option>
              </select>
              <small class="field-hint">Tapez les premi&egrave;res lettres du pays pour y acc&eacute;der rapidement.</small>
            </div>
          </div>
        </section>

<div class="btn-group"><button type="button" class="btn btn-outline" onclick="goToStep(2)">&larr; Retour</button><button type="button" class="btn btn-primary" onclick="domNext()">Continuer &rarr;</button></div>
      </div>

      <div class="tunnel-step-content" data-step="4">
        <!-- ============ SECTION 4 – CHOIX DE LA FORMULE & ENGAGEMENT ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">4</span> Choix de la Formule & Engagement</h2>

          <div class="form-group">
            <label>Gamme sélectionnée <em class="req">*</em></label>
            <div class="gamme-grid">
              <div class="selectable-card gamme-card" id="gamme-nationale" data-gamme="nationale" onclick="selectGamme('nationale')">
                <span class="card-badge">🇨🇲 Gamme Nationale</span>
                <h4>Entreprises locales au Cameroun</h4>
                <p class="card-desc">Siège social à Logpom, courrier scann&eacute;, bureaux priv&eacute;s, r&eacute;ceptionniste d&eacute;di&eacute;e selon le pack.</p>
              </div>
              <div class="selectable-card gamme-card" id="gamme-internationale" data-gamme="internationale" onclick="selectGamme('internationale')">
                <span class="card-badge">🌍 Gamme Internationale & Diaspora</span>
                <h4>À l'étranger & multinationales</h4>
                <p class="card-desc">Adresse officielle, num&eacute;risation instantan&eacute;e, ligne t&eacute;l&eacute;phonique locale, r&eacute;exp&eacute;dition internationale.</p>
              </div>
            </div>
          </div>

          <div class="form-group" id="pack-select-group">
            <label for="pack">Choisissez votre pack <em class="req">*</em></label>
            <select id="pack" name="pack" class="form-control" required>
              <option value="" disabled selected>— Sélectionnez votre pack —</option>
              <optgroup label="🇨🇲 Gamme Nationale" data-gamme="nationale">
                <option value="national-essential" data-price="25000" data-label="Pack ESSENTIAL — 25 000 FCFA / mois">Pack ESSENTIAL</option>
                <option value="national-business" data-price="45000" data-label="Pack BUSINESS — 45 000 FCFA / mois">Pack BUSINESS</option>
                <option value="national-premium" data-price="70000" data-label="Pack PREMIUM — 70 000 FCFA / mois">Pack PREMIUM (Populaire)</option>
              </optgroup>
              <optgroup label="🌍 Gamme Internationale & Diaspora" data-gamme="internationale">
                <option value="international-essential" data-price="50000" data-label="ESSENTIAL DIGITAL — 50 000 FCFA (~88 $) / mois">ESSENTIAL DIGITAL</option>
                <option value="international-business" data-price="110000" data-label="BUSINESS VIRTUAL — 110 000 FCFA (~180 $) / mois">BUSINESS VIRTUAL</option>
                <option value="international-premium" data-price="175000" data-label="PREMIUM EXECUTIVE — 175 000 FCFA (~290 $) / mois">PREMIUM EXECUTIVE (Prestige)</option>
              </optgroup>
            </select>
            <small class="field-hint">Le détail du pack s'affiche dès que vous en choisissez un.</small>
          </div>

          <div class="pack-detail" id="packDetail" style="display: none;">
            <div class="pack-detail-head">
              <div>
                <span class="pack-detail-badge" id="pdBadge"></span>
                <h4 id="pdName"></h4>
                <p class="pack-detail-usd" id="pdUsd" style="display: none;"></p>
              </div>
              <div class="pack-detail-price" id="pdPrice"></div>
            </div>
            <ul class="pack-detail-features" id="pdFeatures"></ul>
          </div>

          <div class="form-group">
            <label for="periodicite">Périodicité et Mode de Règlement <em class="req">*</em></label>
            <select id="periodicite" name="periodicite" class="form-control" required>
              <option value="mensuel" data-months="1">Mensuel (Paiement chaque mois)</option>
              <option value="semestriel" data-months="6">Semestriel (6 mois)</option>
              <option value="annuel" data-months="12">Annuel (12 mois – Bénéficiez de remises exclusives)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Options complémentaires souhaitées <small class="field-hint-inline">(facultatif)</small></label>
            <div class="options-list">
              <label class="checkbox-line"><input type="checkbox" name="options" value="Heures de bureau privé supplémentaires" data-price="0"> Heures de bureau privé supplémentaires</label>
              <label class="checkbox-line"><input type="checkbox" name="options" value="Attribution de ligne téléphonique / Standard dédié" data-price="0"> Attribution de ligne téléphonique / Standard dédié</label>
              <label class="checkbox-line"><input type="checkbox" name="options" value="Réservation de salle de réunion / Conférence" data-price="0"> Réservation de salle de réunion / Conférence</label>
              <label class="checkbox-line"><input type="checkbox" name="options" value="Assistance à la création / Immatriculation d'entreprise" data-price="0"> Assistance à la création / Immatriculation d'entreprise</label>
            </div>
            <small class="field-hint">La tarification des options vous sera confirmée sur devis.</small>
          </div>
        </section>

<div class="btn-group"><button type="button" class="btn btn-outline" onclick="goToStep(3)">&larr; Retour</button><button type="button" class="btn btn-primary" onclick="domNext()">Continuer &rarr;</button></div>
      </div>

      <div class="tunnel-step-content" data-step="5">
        <!-- ============ SECTION 5 – CONFORMITÉ & DISPOSITIF KYC ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">5</span> Conformité & Dispositif KYC (Know Your Customer)</h2>
          <p class="section-intro">Conformément aux normes juridiques et anti-blanchiment, veuillez télécharger les justificatifs requis.</p>

          <div class="dropzone required" data-required="true" id="dz-identite">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h5>Pièce d'identité du représentant légal (CNI ou Passeport) <em class="req">*</em></h5>
            <p>Glissez-déposez ou cliquez pour parcourir — Format PDF, JPG, PNG</p>
            <span class="dz-filename"></span>
            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png">
          </div>

          <div class="dropzone required" data-required="true" id="dz-statuts">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
            <h5>Statuts certifiés ou Projet de statuts <em class="req">*</em></h5>
            <p>Glissez-déposez ou cliquez pour parcourir — Format PDF</p>
            <span class="dz-filename"></span>
            <input type="file" hidden accept=".pdf">
          </div>

          <div class="dropzone" id="dz-domicile">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <h5>Justificatif de domicile du dirigeant <small class="field-hint-inline">(Facultatif à la souscription, requis avant validation finale)</small></h5>
            <p>Facture ENEO, Camwater, Bail ou Attestation — PDF, JPG, PNG</p>
            <span class="dz-filename"></span>
            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png">
          </div>

          <p style="font-size: 0.85rem; color: var(--color-text-muted); margin: 20px 0; display: flex; align-items: center; gap: 8px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pacte de Confidentialité : Vos documents sont strictement protégés et chiffrés.</p>
        </section>

        <!-- ============ SECTION 6 – VALIDATION ET SÉCURITÉ JURIDIQUE ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">6</span> Validation et Sécurité Juridique</h2>

          <div class="form-group validation-group">
            <label class="checkbox-line validation-line"><input type="checkbox" id="chk-cgv" required> <span><strong>Conditions Générales :</strong> J'accepte expressément les Conditions Générales de Vente, la Politique de Confidentialité et la Charte KYC de FEDPAWA CORPORATE SOLUTIONS SARL.</span></label>
            <label class="checkbox-line validation-line"><input type="checkbox" id="chk-cadre" required> <span><strong>Cadre Contractuel :</strong> Je reconnais que la prestation de domiciliation est régie par une <strong>Convention de mise à disposition d'infrastructures et de services</strong>, excluant expressément le statut des baux commerciaux au sens du Droit Uniforme OHADA.</span></label>
            <label class="checkbox-line validation-line"><input type="checkbox" id="chk-exactitude" required> <span><strong>Exactitude des informations :</strong> Je certifie sur l'honneur que les informations et documents fournis sont exacts, authentiques et sincères.</span></label>
          </div>

          <div id="form-errors" class="form-errors" style="display: none;"></div>

          <button type="button" class="btn btn-outline" style="width: 100%; margin-bottom: 14px;" onclick="goToStep(4)">&larr; Retour &agrave; l'&eacute;tape pr&eacute;c&eacute;dente</button>
          <button type="submit" class="btn btn-primary btn-block btn-validate">👉 VALIDER ET GÉNÉRER MON CONTRAT DE DOMICILIATION</button>
        </section>
      </div>
      </form>

      <!-- ============ ÉCRAN DE SUCCÈS ============ -->
      <div id="form-success" style="display: none; text-align: center; padding: 60px 20px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%; background: var(--color-primary); display: grid; place-items: center;">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style="font-size: 1.5rem; margin-bottom: 12px;">Demande de souscription enregistrée !</h2>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto 8px;">Merci <strong id="success-name"></strong>. Votre demande de domiciliation a bien été transmise à nos équipes.</p>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto 24px;">Un juriste FEDPAWA vous recontacte sous <strong>24 heures ouvrées</strong> pour finaliser votre dossier et générer votre contrat de domiciliation.</p>
        <a href="index.php" class="btn btn-outline">← Retour à l'accueil</a>
      </div>

    </div>

    <!-- ============ COLONNE DROITE : SIDEBAR RECAP ============ -->
    <aside class="order-summary">
      <div class="summary-header">
        <h3>Votre Souscription</h3>
      </div>
      <div id="summaryItems">
        <div class="summary-item"><span class="sum-label">Pack</span><span class="sum-value" id="sum-pack">—</span></div>
        <div class="summary-item"><span class="sum-label">Périodicité</span><span class="sum-value" id="sum-periodicite">Mensuel</span></div>
        <div class="summary-item"><span class="sum-label">Prix mensuel</span><span class="sum-value" id="sum-monthly">—</span></div>
      </div>
      <div class="summary-divider"></div>
      <div id="summaryOptions"></div>
      <div class="summary-total">
        <span id="sum-total-label">Total (mensuel)</span>
        <span id="summaryTotal">0 FCFA</span>
      </div>
      <div class="summary-secure-badge">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Conformité KYC & Sécurité Juridique
      </div>
    </aside>

  </div>
</div>

<?php
$extraJs = ['assets/js/souscription_domiciliation.js'];
include __DIR__ . '/../templates/partials/site-footer.php';
