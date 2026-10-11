<?php
$title = "Souscription Domiciliation d'Entreprises | FEDPAWA CORPORATE SOLUTIONS SARL";
$description = "Formulaire de souscription en ligne au service de domiciliation d'entreprises et mise à disposition d'infrastructures de FEDPAWA CORPORATE SOLUTIONS SARL à Douala Logpom.";
$active = 'services';
$extraCss = ['assets/css/dashboard.css'];

include __DIR__ . '/../templates/partials/site-header.php';
?>
<header class="tunnel-header">
  <div class="container">
    <a href="index.php" class="brand">
      <img class="brand-logo" src="assets/images/logo.jpg" alt="Logo FEDPAWA">
      <span class="brand-copy"><strong>FEDPAWA</strong><small>Corporate Solutions</small></span>
    </a>
    <div style="display: flex; gap: 24px; align-items: center;">
      <div class="security-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Connexion Sécurisée SSL</div>
      <div class="security-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Conformité OHADA</div>
    </div>
  </div>
</header>

<div class="container" style="padding: 32px 16px 64px;">
  <div class="tunnel-layout-v2">

    <!-- ============ COLONNE GAUCHE : FORMULAIRE 6 SECTIONS ============ -->
    <div class="tunnel-card" style="padding: 40px; box-shadow: none; border: 1px solid var(--color-border);" id="souscriptionForm">

      <div class="step-header" style="margin-bottom: 28px;">
        <h1 style="font-size: 1.6rem;">Formulaire de Souscription en Ligne</h1>
        <p style="font-size: 1rem; color: var(--color-primary); font-weight: 600;">Service de Domiciliation d'Entreprises et Mise à Disposition d'Infrastructures</p>
      </div>

      <form id="domiciliationForm" novalidate>

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
              <input type="text" id="pays" name="pays" class="form-control" required placeholder="Ex : Cameroun">
            </div>
          </div>
        </section>

        <!-- ============ SECTION 4 – CHOIX DE LA FORMULE & ENGAGEMENT ============ -->
        <section class="form-section">
          <h2 class="form-section-title"><span class="form-section-num">4</span> Choix de la Formule & Engagement</h2>

          <div class="form-group">
            <label>Gamme sélectionnée <em class="req">*</em></label>
            <div class="gamme-grid">
              <div class="selectable-card gamme-card" id="gamme-nationale" data-gamme="nationale" onclick="selectGamme('nationale')">
                <span class="card-badge">🇨🇲 Gamme Nationale</span>
                <h4>Entreprises locales au Cameroun</h4>
                <p class="card-desc">Essential <strong>25 000 F</strong> · Business <strong>45 000 F</strong> · Premium <strong>70 000 F</strong> / mois</p>
              </div>
              <div class="selectable-card gamme-card" id="gamme-internationale" data-gamme="internationale" onclick="selectGamme('internationale')">
                <span class="card-badge">🌍 Gamme Internationale & Diaspora</span>
                <h4>À l'étranger & multinationales</h4>
                <p class="card-desc">Essential Digital <strong>~88 $</strong> · Business Virtual <strong>~180 $</strong> · Premium Executive <strong>~290 $</strong> / mois</p>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="pack">Pack choisi <em class="req">*</em></label>
              <select id="pack" name="pack" class="form-control" required>
                <optgroup label="🇨🇲 Gamme Nationale" data-gamme="nationale">
                  <option value="national-essential" data-price="25000" data-label="Pack ESSENTIAL — 25 000 FCFA / mois">Pack ESSENTIAL (25 000 FCFA / mois)</option>
                  <option value="national-business" data-price="45000" data-label="Pack BUSINESS — 45 000 FCFA / mois">Pack BUSINESS (45 000 FCFA / mois)</option>
                  <option value="national-premium" data-price="70000" data-label="Pack PREMIUM — 70 000 FCFA / mois">Pack PREMIUM (70 000 FCFA / mois)</option>
                </optgroup>
                <optgroup label="🌍 Gamme Internationale & Diaspora" data-gamme="internationale">
                  <option value="international-essential" data-price="50000" data-label="ESSENTIAL DIGITAL — 50 000 FCFA (~88 $) / mois">ESSENTIAL DIGITAL (50 000 FCFA / ~88 $ / mois)</option>
                  <option value="international-business" data-price="110000" data-label="BUSINESS VIRTUAL — 110 000 FCFA (~180 $) / mois">BUSINESS VIRTUAL (110 000 FCFA / ~180 $ / mois)</option>
                  <option value="international-premium" data-price="175000" data-label="PREMIUM EXECUTIVE — 175 000 FCFA (~290 $) / mois">PREMIUM EXECUTIVE (175 000 FCFA / ~290 $ / mois)</option>
                </optgroup>
              </select>
            </div>
            <div class="form-group">
              <label for="periodicite">Périodicité et Mode de Règlement <em class="req">*</em></label>
              <select id="periodicite" name="periodicite" class="form-control" required>
                <option value="mensuel" data-months="1">Mensuel (Paiement chaque mois)</option>
                <option value="semestriel" data-months="6">Semestriel (6 mois)</option>
                <option value="annuel" data-months="12">Annuel (12 mois – Bénéficiez de remises exclusives)</option>
              </select>
            </div>
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

          <button type="submit" class="btn btn-primary btn-block btn-validate">👉 VALIDER ET GÉNÉRER MON CONTRAT DE DOMICILIATION</button>
        </section>
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
