<?php
$title = "Tunnel de Souscription | FEDPAWA CORPORATE SOLUTIONS";
$description = "Souscrivez en ligne aux services FEDPAWA Corporate Solutions : création d'entreprise, protection OAPI, suivi fiscal et domiciliation. Paiement sécurisé Mobile Money, carte ou virement.";
$active = 'services';
$extraCss = ['assets/css/dashboard.css'];

include __DIR__ . '/../templates/partials/site-header.php';
?>
<header class="tunnel-header">
  <div class="container">
    <a href="index.php" class="brand">
      <span class="brand-mark">F</span>
      <span class="brand-copy"><strong>FEDPAWA</strong><small>Corporate Solutions</small></span>
    </a>
    <div style="display: flex; gap: 24px; align-items: center;">
      <div class="security-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Connexion Sécurisée SSL</div>
      <div class="security-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Conformité OHADA</div>
    </div>
  </div>
</header>

<div class="progress-wrapper">
  <div class="container">
    <div class="progress-container">
      <div class="progress-line"><div class="progress-line-fill" id="progressFill"></div></div>
      <div class="progress-step active" data-step="1"><div class="progress-dot">1</div><span class="progress-label">Offre</span></div>
      <div class="progress-step" data-step="2"><div class="progress-dot">2</div><span class="progress-label">Projet</span></div>
      <div class="progress-step" data-step="3"><div class="progress-dot">3</div><span class="progress-label">Options</span></div>
      <div class="progress-step" data-step="4"><div class="progress-dot">4</div><span class="progress-label">Pièces KYC</span></div>
      <div class="progress-step" data-step="5"><div class="progress-dot">5</div><span class="progress-label">Paiement</span></div>
    </div>
  </div>
</div>

  <div class="container">
    <div class="tunnel-layout-v2">
      
      <!-- COLONNE GAUCHE : ÉTAPES -->
      <div class="tunnel-card" style="padding: 40px; box-shadow: none; border: 1px solid var(--color-border);">
        
        <!-- ÉTAPE 1 -->
        <div class="tunnel-step-content active" id="step-1">
          <div class="step-header">
            <h2>1. Sélectionnez votre prestation</h2>
            <p>Choisissez le service principal que vous souhaitez confier à FEDPAWA.</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="selectable-card service-card" data-service="creation" data-name="Création d'Entreprise" data-price="100000" onclick="selectService('creation')">
              <span class="card-badge">Formule Totale OHADA</span>
              <h4>Création & Légalisation</h4>
              <div class="card-price">100 000 FCFA</div>
              <p class="card-desc">Immatriculation complète, statuts, RCCM, NIU et Kit Corporate.</p>
            </div>
            <div class="selectable-card service-card" data-service="oapi" data-name="Protection OAPI" data-price="200000" onclick="selectService('oapi')">
              <span class="card-badge">Coverage 17 Pays</span>
              <h4>Propriété Intellectuelle</h4>
              <div class="card-price">De 200 000 FCFA</div>
              <p class="card-desc">Recherche, dépôt de marque, logos et logiciels OAPI.</p>
            </div>
            <div class="selectable-card service-card" data-service="fiscalite" data-name="Suivi Fiscal Mensuel" data-price="35000" onclick="selectService('fiscalite')">
              <span class="card-badge">Conformité DGI</span>
              <h4>Suivi Réglementaire</h4>
              <div class="card-price">35 000 FCFA / mois</div>
              <p class="card-desc">Télé-déclarations, ACF, arrêté des comptes (DSF).</p>
            </div>
            <div class="selectable-card service-card" data-service="domiciliation" data-name="Domiciliation Siège" data-price="25000" onclick="selectService('domiciliation')">
              <span class="card-badge">Adresse Logpom</span>
              <h4>Domiciliation Commerciale</h4>
              <div class="card-price">À partir de 25 000 FCFA / mois</div>
              <p class="card-desc">Adresse fiscale, gestion courrier, salles de réunion.</p>
            </div>
          </div>
          <div class="btn-group">
            <a href="index.php" class="btn btn-outline">Annuler</a>
          </div>
        </div>

        <!-- ÉTAPE 2 -->
        <div class="tunnel-step-content" id="step-2">
          <div class="step-header">
            <h2>2. Vos informations & détails du projet</h2>
            <p>Renseignez les données nécessaires à la constitution de votre dossier juridique.</p>
          </div>

          <!-- Formulaire Création -->
          <div class="form-block" id="form-creation" style="display: none;">
            <div class="form-row">
              <div class="form-group"><label>Type de démarche</label><select class="form-control"><option>Création d'une nouvelle structure</option><option>Restructuration / Modification</option></select></div>
              <div class="form-group"><label>Forme juridique</label><select class="form-control"><option>SARL / SARLU</option><option>SAS / SASU</option><option>SA</option><option>Établissement</option><option>Indécis</option></select></div>
            </div>
            <div class="form-group"><label>Dénomination sociale (Choix 1)</label><input type="text" class="form-control" placeholder="Nom de l'entreprise"></div>
            <div class="form-row">
              <div class="form-group"><label>Capital social (FCFA)</label><input type="number" class="form-control" placeholder="1000000"></div>
              <div class="form-group"><label>Secteur d'activité</label><select class="form-control"><option>Commerce</option><option>BTP</option><option>Technologies</option><option>Services</option></select></div>
            </div>
            <div class="form-group"><label>Description de l'activité</label><textarea class="form-control" rows="3"></textarea></div>
          </div>

          <!-- Formulaire OAPI -->
          <div class="form-block" id="form-oapi" style="display: none;">
            <div class="form-group"><label>Type d'actif à protéger</label><select class="form-control"><option>Marque / Nom commercial / Logo</option><option>Application mobile / Logiciel</option><option>Dessin ou Modèle</option><option>Brevet</option></select></div>
            <div class="form-group"><label>Nom exact de la marque / titre</label><input type="text" class="form-control" placeholder="Ex: FEDPAWA App"></div>
            <div class="form-group"><label>Classes de produits/services</label><input type="text" class="form-control" placeholder="Ex: Classe 35, 42 (ou laisser vide pour conseil expert)"></div>
          </div>

          <!-- Formulaire Fiscalité -->
          <div class="form-block" id="form-fiscalite" style="display: none;">
            <div class="form-row">
              <div class="form-group"><label>Numéro NIU (si existant)</label><input type="text" class="form-control" placeholder="M123456789"></div>
              <div class="form-group"><label>Centre des impôts</label><select class="form-control"><option>CIME</option><option>CDI</option><option>DGE</option><option>Ne sais pas</option></select></div>
            </div>
            <div class="form-group"><label>Régime fiscal actuel</label><select class="form-control"><option>Régime Simplifié</option><option>Régime du Réel</option><option>Nouveau/Non attribué</option></select></div>
          </div>

          <!-- Formulaire Domiciliation -->
          <div class="form-block" id="form-domiciliation" style="display: none;">
            <div class="form-group"><label>Statut de la structure</label>
              <div style="display: flex; gap: 16px; flex-wrap: wrap; padding-top: 6px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; text-transform: none; letter-spacing: 0; font-weight: 500;"><input type="radio" name="statut_structure" value="existante" checked> Entreprise déjà immatriculée</label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; text-transform: none; letter-spacing: 0; font-weight: 500;"><input type="radio" name="statut_structure" value="creation"> En cours de constitution / création</label>
              </div>
            </div>
            <div class="form-group"><label>Dénomination sociale / Nom commercial</label><input type="text" class="form-control" placeholder="Ex : FEDPAWA CORPORATE SOLUTIONS SARL"></div>
            <div class="form-row">
              <div class="form-group"><label>Forme juridique</label><select class="form-control"><option>SARL / SARLU</option><option>SAS / SASU</option><option>SA</option><option>Établissement (Nom propre / EI)</option><option>GIE (Groupement d'Intérêt Économique)</option><option>Succursale / Filiale</option><option>Autre (précisez)</option></select></div>
              <div class="form-group"><label>Secteur d'activité principal</label><select class="form-control"><option>Commerce et distribution</option><option>Services aux entreprises / Conseil</option><option>Bâtiment et travaux publics (BTP)</option><option>Agroalimentaire & Agriculture</option><option>Technologie, Numérique & E-commerce</option><option>Santé, Pharmacie & Bien-être</option><option>Éducation, Formation & Coaching</option><option>Transport, Logistique & Import-Export</option><option>Finance, Assurance & Immobilier</option><option>Autre (précisez)</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Numéro RCCM</label><input type="text" class="form-control" placeholder="Ex : RCCM/DL/2024/B/1234 (ou « En cours »)"></div>
              <div class="form-group"><label>Numéro NIU</label><input type="text" class="form-control" placeholder="Ex : M123456789 (ou « En cours »)"></div>
            </div>
            <div class="form-group"><label>Description synthétique des activités</label><textarea class="form-control" rows="3" placeholder="Décrivez brièvement l'objet social de votre entreprise."></textarea></div>
            <div class="form-row">
              <div class="form-group"><label>Gamme & pack choisi</label><select class="form-control"><optgroup label="🇨🇲 Gamme Nationale"><option>Pack Essential (25 000 F / mois)</option><option>Pack Business (45 000 F / mois)</option><option>Pack Premium (70 000 F / mois)</option></optgroup><optgroup label="🌍 Gamme Internationale & Diaspora"><option>Essential Digital (50 000 F / ~88 $)</option><option>Business Virtual (110 000 F / ~180 $)</option><option>Premium Executive (175 000 F / ~290 $)</option></optgroup></select></div>
              <div class="form-group"><label>Périodicité et mode de règlement</label><select class="form-control"><option>Mensuel (Paiement chaque mois)</option><option>Semestriel (6 mois)</option><option>Annuel (12 mois – remises exclusives)</option></select></div>
            </div>
          </div>

          <!-- Bloc Commun -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--color-border);">
            <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Identité du Représentant Légal</h3>
            <div class="form-row">
              <div class="form-group"><label>Civilité</label><select class="form-control"><option>Monsieur</option><option>Madame</option></select></div>
              <div class="form-group"><label>Nom complet</label><input type="text" class="form-control" placeholder="Jean Dupont"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Fonction</label><select class="form-control"><option>Fondateur / Gérant</option><option>Président</option><option>Mandataire</option></select></div>
              <div class="form-group"><label>Pays de résidence</label><input type="text" class="form-control" value="Cameroun"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Email</label><input type="email" class="form-control" placeholder="contact@email.com"></div>
              <div class="form-group"><label>Téléphone / WhatsApp</label><input type="tel" class="form-control" placeholder="+237 6XX XX XX XX"></div>
            </div>
          </div>
          
          <div class="btn-group">
            <button class="btn btn-outline" onclick="goToStep(1)">← Retour</button>
            <button class="btn btn-primary" onclick="goToStep(3)">Continuer vers les options →</button>
          </div>
        </div>

        <!-- ÉTAPE 3 -->
        <div class="tunnel-step-content" id="step-3">
          <div class="step-header">
            <h2>3. Options complémentaires (facultatives)</h2>
            <p>Cochez les services additionnels souhaités. La tarification de ces options vous sera confirmée sur devis.</p>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <label class="selectable-card option-card" data-name="Heures de bureau privé supplémentaires" data-price="0">
              <input type="checkbox" onchange="toggleOption(this)" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4>Heures de bureau privé supplémentaires</h4>
                  <p class="card-desc">Réservez des créneaux additionnels dans nos bureaux privés climatisés de Logpom.</p>
                </div>
                <div class="card-price">Sur devis</div>
              </div>
            </label>

            <label class="selectable-card option-card" data-name="Attribution de ligne téléphonique / Standard dédié" data-price="0">
              <input type="checkbox" onchange="toggleOption(this)" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4>Attribution de ligne téléphonique / Standard dédié</h4>
                  <p class="card-desc">Numéro local dédié avec réponse personnalisée au nom de votre entreprise.</p>
                </div>
                <div class="card-price">Sur devis</div>
              </div>
            </label>

            <label class="selectable-card option-card" data-name="Réservation de salle de réunion / Conférence" data-price="0">
              <input type="checkbox" onchange="toggleOption(this)" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4>Réservation de salle de réunion / Conférence</h4>
                  <p class="card-desc">Accès à nos salles de réunion haut standing pour vos rendez-vous stratégiques.</p>
                </div>
                <div class="card-price">Sur devis</div>
              </div>
            </label>

            <label class="selectable-card option-card" data-name="Assistance à la création / Immatriculation d'entreprise" data-price="0">
              <input type="checkbox" onchange="toggleOption(this)" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4>Assistance à la création / Immatriculation d'entreprise</h4>
                  <p class="card-desc">Prise en charge du parcours GUCE : statuts, RCCM, NIU et Kit Corporate.</p>
                </div>
                <div class="card-price">Sur devis</div>
              </div>
            </label>
          </div>

          <div class="btn-group">
            <button class="btn btn-outline" onclick="goToStep(2)">← Retour</button>
            <button class="btn btn-primary" onclick="goToStep(4)">Continuer vers les documents →</button>
          </div>
        </div>

        <!-- ÉTAPE 4 -->
        <div class="tunnel-step-content" id="step-4">
          <div class="step-header">
            <h2>4. Déposez vos pièces justificatives</h2>
            <p>Transmettez vos documents de manière 100% sécurisée. (PDF, PNG, JPG - Max 10 Mo).</p>
          </div>

          <div class="dropzone">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <h5>CNI ou Passeport du Dirigeant</h5>
            <p>Glissez-déposez ou cliquez pour parcourir</p>
            <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg">
          </div>

          <div class="dropzone">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <h5>Justificatif de domicile / Plan localisation</h5>
            <p>Glissez-déposez ou cliquez pour parcourir</p>
            <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg">
          </div>

          <div class="dropzone">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            <h5>Visuel Logo / Actif (Si OAPI)</h5>
            <p>Glissez-déposez ou cliquez pour parcourir</p>
            <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg">
          </div>

          <p style="font-size: 0.85rem; color: var(--color-text-muted); margin: 20px 0; display: flex; align-items: center; gap: 8px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pacte de Confidentialité : Vos documents sont strictement protégés et chiffrés.</p>

          <div class="btn-group">
            <button class="btn btn-outline" onclick="goToStep(3)">← Retour</button>
            <button class="btn btn-primary" onclick="goToStep(5)">Voir le récapitulatif →</button>
          </div>
        </div>

        <!-- ÉTAPE 5 -->
        <div class="tunnel-step-content" id="step-5">
          <div class="step-header">
            <h2>5. Récapitulatif & Paiement Sécurisé</h2>
            <p>Vérifiez le détail de votre commande et finalisez votre souscription.</p>
          </div>

          <table class="cost-table">
            <thead>
              <tr><th>Désignation</th><th style="text-align: right;">Montant</th></tr>
            </thead>
            <tbody>
              <tr><td>Prestation Principale (Voir sidebar)</td><td style="text-align: right;">Variable</td></tr>
              <tr><td>Options Complémentaires (Voir sidebar)</td><td style="text-align: right;">Variable</td></tr>
              <tr style="background: var(--color-bg-alt);"><td colspan="2" style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic;">Estimation des débours officiels (Notaire, Greffe, DGI) facturés au coût réel sur justificatifs.</td></tr>
              <tr class="total-row"><td>TOTAL GÉNÉRAL À REGLER</td><td style="text-align: right;" id="tableTotal">0 FCFA</td></tr>
            </tbody>
          </table>

          <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Mode de paiement</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <label class="selectable-card selected" style="padding: 16px;"><input type="radio" name="payment" value="momo" checked style="margin-right: 10px;" onchange="togglePaymentMethod('momo')"> Mobile Money (Orange / MTN)</label>
            <label class="selectable-card" style="padding: 16px;"><input type="radio" name="payment" value="card" style="margin-right: 10px;" onchange="togglePaymentMethod('card')"> Carte Bancaire (Visa / Mastercard)</label>
            <label class="selectable-card" style="padding: 16px;"><input type="radio" name="payment" value="bank" style="margin-right: 10px;" onchange="togglePaymentMethod('bank')"> Virement Bancaire</label>
          </div>

          <div id="pay-momo-box" class="payment-box">
            <div class="form-group">
              <label>Numéro de téléphone Mobile Money</label>
              <input type="tel" id="momoPhoneInput" class="form-control" placeholder="+237 6XX XX XX XX">
              <small style="color: var(--color-text-muted);">Une invite USSD sera envoyée sur ce numéro pour valider le paiement.</small>
            </div>
          </div>

          <div id="pay-manual-box" class="payment-box" style="display: none; background: var(--color-bg-alt); padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--color-border);">
            <h4 style="font-size: 1rem; margin-bottom: 8px; color: var(--color-primary);">Instructions de Paiement / Virement</h4>
            <p style="font-size: 0.85rem; margin-bottom: 12px;">Veuillez effectuer le virement ou dépôt sur nos coordonnées bancaires ci-dessous, puis téléversez la capture d'écran (screenshot) ou le reçu prouvant le paiement.</p>
            <div style="font-size: 0.85rem; margin-bottom: 14px; line-height: 1.6;">
              <strong>Bénéficiaire :</strong> FEDPAWA CORPORATE SOLUTIONS SARL<br>
              <strong>Banque :</strong> UBA Cameroun / Afriland First Bank<br>
              <strong>Numéro de Compte / IBAN :</strong> CM21 1000 5000 12345678901 45<br>
              <strong>Référence à indiquer :</strong> ABONNEMENT FEDPAWA
            </div>
            <div class="form-group">
              <label>Téléverser la capture / reçu de paiement (Obligatoire)</label>
              <input type="file" id="paymentProof" class="form-control" accept=".png,.jpg,.jpeg,.pdf">
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: var(--color-text-main);"><input type="checkbox" required style="margin-top: 3px;"> J'accepte les Conditions Générales de Vente (CGV), la Politique de Confidentialité et la Charte KYC de FEDPAWA CORPORATE SOLUTIONS SARL.</label>
          </div>
          <div class="form-group">
            <label class="checkbox-label" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: var(--color-text-main);"><input type="checkbox" required style="margin-top: 3px;"> Je reconnais que la prestation de domiciliation est régie par une <strong>Convention de mise à disposition d'infrastructures et de services</strong>, excluant expressément le statut des baux commerciaux au sens du Droit Uniforme OHADA.</label>
          </div>
          <div class="form-group">
            <label class="checkbox-label" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: var(--color-text-main);"><input type="checkbox" required style="margin-top: 3px;"> Je certifie sur l'honneur l'exactitude des informations et pièces fournies.</label>
          </div>

          <button id="finalPayBtn" class="btn btn-primary btn-block">🔒 Procéder au paiement</button>
        </div>

      </div>

      <!-- COLONNE DROITE : SIDEBAR RECAP -->
      <aside class="order-summary">
        <div class="summary-header">
          <h3>Votre Commande</h3>
        </div>
        <div id="summaryItems"></div>
        
        <div class="summary-divider"></div>
        
        <div class="summary-total">
          <span>Total Estimé</span>
          <span id="summaryTotal">0 FCFA</span>
        </div>

        <div class="summary-secure-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Paiement 100% Sécurisé
        </div>
      </aside>

    </div>
  </div>

<script>
// Synchroniser le total du tableau Étape 5 avec le total du sidebar
const summaryTotalEl = document.getElementById('summaryTotal');
const tableTotalEl = document.getElementById('tableTotal');
const observer = new MutationObserver(() => { tableTotalEl.innerText = summaryTotalEl.innerText; });
observer.observe(summaryTotalEl, { childList: true });
</script>

<?php
$extraJs = ['assets/js/tunnel.js'];
include __DIR__ . '/../templates/partials/site-footer.php';
