<?php
$title = "Tunnel de Souscription | FEDPAWA CORPORATE SOLUTIONS";
$description = "Souscrivez en ligne aux services FEDPAWA Corporate Solutions : création d'entreprise, protection OAPI, suivi fiscal, contrats et domiciliation. Paiement sécurisé Mobile Money, carte ou virement.";
$active = 'services';
$extraCss = ['assets/css/dashboard.css'];

$dataAuth = 'user';
include __DIR__ . '/../templates/partials/site-header.php';
?>


<div id="tunnelMeta" data-skip-step1="0"></div>

<div class="progress-wrapper">
  <div class="container">
    <div class="progress-container">
      <div class="progress-line"><div class="progress-line-fill" id="progressFill"></div></div>
      <div class="progress-step active" data-step="1"><div class="progress-dot">1</div><span class="progress-label">Projet</span></div>
      <div class="progress-step" data-step="2"><div class="progress-dot">2</div><span class="progress-label">Options</span></div>
      <div class="progress-step" data-step="3"><div class="progress-dot">3</div><span class="progress-label">Pièces KYC</span></div>
      <div class="progress-step" data-step="4"><div class="progress-dot">4</div><span class="progress-label">Paiement</span></div>
    </div>
  </div>
</div>

  <div class="container">
    <div class="tunnel-layout-v2">

      <!-- COLONNE GAUCHE : ÉTAPES -->
      <div class="tunnel-card" style="padding: 40px; box-shadow: none; border: 1px solid var(--color-border);">

        <!-- ÉTAPE 1 -->
        <div id="step-validation-hint" style="display: none; margin-bottom: 14px; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--color-primary); background: var(--color-bg-alt); font-size: 0.88rem;"></div>
<div class="tunnel-step-content" id="step-1">
                  <div class="step-header">
                    <h2>1. Vos informations & détails du projet</h2>
                    <p>Renseignez les données nécessaires à la constitution de votre dossier juridique.</p>
                  </div>

                  <div id="smart-banner" style="display: none; margin-bottom: 20px; padding: 14px 16px; border-radius: 10px; border: 1px solid var(--color-primary); background: var(--color-bg-alt); font-size: 0.9rem; line-height: 1.5;">
                    <span id="smart-banner-text"></span>
                    <a id="smart-banner-link" href="#" style="font-weight: 700; white-space: nowrap;">Découvrir →</a>
                    <button type="button" onclick="document.getElementById('smart-banner').style.display='none'" style="float: right; background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--color-text-muted); padding: 0 4px;">✕</button>
                  </div>

                  <!-- === CRÉATION === -->
                  <div class="form-block" id="form-creation" style="display: none;">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2A</span> Création de l'Entreprise</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Démarche <em class="req">*</em></label><select class="form-control" required id="creation-demarche" required><option>Création d'une nouvelle structure</option><option>Transformation</option><option>Restructuration</option><option>Légalisation</option></select></div>
                        <div class="form-group"><label>Forme juridique envisagée <em class="req">*</em></label><select class="form-control" required><option>EI</option><option>SARL/SARLU</option><option>SAS/SASU</option><option>SA</option><option>Indécis</option></select></div>
                      </div>
                      <div class="form-row">
                        <div class="form-group"><label>Dénomination souhaitée <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Nom de l'entreprise"></div>
                        <div class="form-group"><label>Deux alternatives</label><input type="text" class="form-control" required placeholder="Ex: Nom commercial 2"></div>
                      </div>
                      <div class="form-group"><label>Ville d'immatriculation <em class="req">*</em></label><select class="form-control" required><option>Douala</option><option>Yaoundé</option></select></div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2B</span> Le Capital</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Montant envisagé (FCFA) <em class="req">*</em></label><input type="number" class="form-control" required placeholder="1000000"></div>
                        <div class="form-group"><label>Nombre d'associés</label><input type="number" class="form-control" required placeholder="1"></div>
                      </div>
                      <div class="form-group"><label>Noms des associés</label><textarea class="form-control" required rows="3" placeholder="Prénom Nom — Qualité"></textarea></div>
                    </div>
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2C</span> Apports</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Apports en numéraire</label><input type="number" class="form-control" required placeholder="Montant FCFA"></div>
                        <div class="form-group"><label>Apports en nature</label><textarea class="form-control" required rows="2" placeholder="Description des apports"></textarea></div>
                      </div>
                    </div>
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2D</span> Gouvernance</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Dirigeant désigné (nom + qualité)</label><input type="text" class="form-control" required placeholder="Ex: Jean Dupont, Gérant"></div>
                        <div class="form-group"><label>Clauses spécifiques</label><div class="checkbox-line"><input type="checkbox" class="form-check-input"> Blocage majorité</div><div class="checkbox-line"><input type="checkbox" class="form-check-input"> Autres</div></div>
                      </div>
                    </div>
                    <!-- Conditionnel : RCCM + NIU si Transformation/Restructuration/Légalisation -->
                    <div id="creation-existante" style="display: none; margin-top: 20px; padding: 12px; background: var(--color-bg-alt); border-radius: 8px; border: 1px dashed var(--color-border);">
                      <h4>Si entreprise existante (Transformation/Restructuration/Légalisation)</h4>
                      <div class="form-row">
                        <div class="form-group"><label>RCCM actuel</label><input type="text" class="form-control" required placeholder="RCCM/DL/2024/B/1234"></div>
                        <div class="form-group"><label>NIU actuel</label><input type="text" class="form-control" required placeholder="M123456789"></div>
                      </div>
                    </div>
                  </div>

                  <!-- === FISCALITÉ === -->
                  <div class="form-block" id="form-fiscalite" style="display: none;">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2E</span> L'Entreprise</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Dénomination <em class="req">*</em></label><input type="text" class="form-control" required></div>
                        <div class="form-group"><label>RCCM <em class="req">*</em></label><input type="text" class="form-control" required></div>
                      </div>
                      <div class="form-row">
                        <div class="form-group"><label>NIU <em class="req">*</em></label><input type="text" class="form-control" required></div>
                      <div class="form-group" style="background: var(--color-bg-alt); padding: 12px 14px; border-radius: 8px; border: 1px dashed var(--color-border);">
                        <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; text-transform: none; letter-spacing: 0; font-weight: 500; cursor: pointer; margin-bottom: 4px;">
                          <input type="checkbox" id="opt-no-niu-fiscal" data-smart-signal="strong" data-smart-from="fiscalite" style="margin-top: 3px;">
                          <span>Je n'ai pas encore de NIU — mon entreprise n'est pas encore immatriculée</span>
                        </label>
                        <small style="color: var(--color-text-muted); font-size: 0.8rem;">💡 FEDPAWA peut créer votre entreprise (statuts, RCCM, NIU, Kit Corporate). Nous vous le proposerons automatiquement.</small>
                      </div>
                        <div class="form-group"><label>Forme <em class="req">*</em></label><select class="form-control" required><option>SARL</option><option>SAS</option><option>SA</option><option>EI</option><option>Autre</option></select></div>
                      </div>
                      <div class="form-group"><label>Secteur <em class="req">*</em></label><select class="form-control" required><option>Commerce</option><option>BTP</option><option>Services</option><option>Industriel</option><option>Autre</option></select></div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2F</span> Sa situation fiscale</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Régime actuel <em class="req">*</em></label><select class="form-control" required id="regime-fiscal" data-plan-select required><option value="simplifie">Régime Simplifié</option><option value="reel">Régime du Réel</option><option value="simplifie" data-smart-soft="creation">Nouveau / Non attribué</option></select></div>
                        <div class="form-group"><label>Centre des impôts <em class="req">*</em></label><select class="form-control" required><option>CIME</option><option>CDI</option><option>DGE</option></select></div>
                      </div>
                      <div class="form-row">
                        <div class="form-group"><label>ACF détenue <em class="req">*</em></label><div class="radio-row"><label class="radio-pill"><input type="radio" name="acf" value="oui" checked> Oui</label><label class="radio-pill"><input type="radio" name="acf" value="non"> Non</label></div></div>
                        <div class="form-group"><label>Déclarations à jour <em class="req">*</em></label><div class="radio-row"><label class="radio-pill"><input type="radio" name="declarations" value="ajour" checked> À jour</label><label class="radio-pill"><input type="radio" name="declarations" value="en_retard"> En retard</label></div></div>
                      </div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2G</span> Le périmètre souhaité</h2>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-soft="fiscalite"> Déclarations mensuelles (TVA, acomptes, retenues, salaires)</div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-soft="fiscalite"> DSF annuelle</div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-soft="fiscalite"> Suivi ACF</div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-soft="fiscalite"> Veille réglementaire</div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2H</span> La comptabilité</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Qui tient les comptes <em class="req">*</em></label><select class="form-control" required><option>Interne</option><option>Expert externe</option><option>Personne</option></select></div>
                        <div class="form-group"><label>Volume d'opérations approximatif</label><input type="number" class="form-control" required placeholder="Factures/mois"></div>
                      </div>
                    </div>
                  </div>

                  <!-- === OAPI === -->
                  <div class="form-block" id="form-oapi" style="display: none;">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2I</span> L'actif</h2>
                      <div class="form-group"><label>Type <em class="req">*</em></label><select class="form-control" required id="oapi-actif-type" data-plan-select required><option value="marque">Marque / Nom commercial / Logo</option><option value="application">Application logiciel</option><option value="dessin">Dessin & Modèle</option><option value="brevets">Brevet (sur devis)</option></select></div>
                      <div class="form-group"><label>Nom exact du signe <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Ex: FEDPAWA App"></div>
                      <div class="form-group"><label>Classes de Nice <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Ex: Classe 35, 42"></div>
                      <div class="form-group"><label>Description activité couverte (2-3 lignes)</label><textarea class="form-control" required rows="3" placeholder="Activités couvertes par la protection"></textarea></div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2J</span> Le titulaire</h2>
                      <div class="radio-row"><label class="radio-pill"><input type="radio" name="titulaire" value="personne_morale" checked> Personne morale (dénomination + RCCM/NIU pouvant être 'En cours')</label></div>
                      <div class="radio-row"><label class="radio-pill"><input type="radio" name="titulaire" value="personne_physique"> Personne physique (nom + nationalité + pièce)</label></div>
                      <small class="text-muted">Cas fréquent des créateurs : le bloc personne physique peut être briqué si non pertinent.</small>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section" id="oapi-titulaire-conditionnel" style="display: none;">
                      <h2 class="form-section-title">Personne morale</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Dénomination</label><input type="text" class="form-control" required placeholder="Ex: FEDPAWA CORPORATE SOLUTIONS SARL"></div>
                        <div class="form-group"><label>RCCM/NIU</label><input type="text" class="form-control" required placeholder="RCCM/DL/2024/B/1234 ou En cours"></div>
                      </div>
                    </div>
                    <div class="form-section" id="oapi-titulaire-conditionnel2" style="display: none;">
                      <h2 class="form-section-title">Personne physique</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Nom</label><input type="text" class="form-control" required placeholder="Ex: Jean Dupont"></div>
                        <div class="form-group"><label>Nationalité</label><input type="text" class="form-control" required value="Camerounaise"></div>
                      </div>
                      <div class="form-group"><label>Pièce d'identité</label><select class="form-control" required><option>CNI</option><option>Passeport</option></select></div>
                      <div class="form-group"><label>Numéro de pièce</label><input type="text" class="form-control" required placeholder="Numéro figurant sur la pièce"></div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title">Visuel</h2>
                      <small class="text-muted">La dropzone 'Visuel Logo / Actif (Si OAPI)' sera rendue obligatoire seulement si type=logo/dessin (JS).</small>
                    </div>
                  </div>

                  <!-- === CONTRATS === -->
                  <div class="form-block" id="form-contrats" style="display: none;">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2K</span> Le besoin</h2>
                      <div class="form-group"><label>Catégorie <em class="req">*</em></label><select class="form-control" required id="contrat-type" required><option value="commercial">Commercial / prestation</option><option value="travail">Prestation / travail</option><option value="social">Social</option><option value="NDA">NDA</option><option value="bail" data-smart-soft="domiciliation">Bail / Location</option><option value="statuts" data-smart-soft="creation">Statuts & pactes d'associés</option><option value="audit">Audit d'un contrat existant</option><option value="archivage">Archivage cloud</option></select></div>
                      <div class="form-textarea"><label>Situation décrite en synthèse <em class="req">*</em></label><textarea class="form-control" required rows="3" placeholder="Synthèse de la situation ou du contrat à sécuriser"></textarea></div>
                      <div class="form-group"><label>Formule tarifaire <em class="req">*</em></label><select class="form-control" required id="contrat-formule" data-plan-select required>
                        <option value="standard">Standard — 50 000 FCFA</option>
                        <option value="complexe">Complexe — 150 000 FCFA</option>
                        <option value="audit">Audit — Sur devis</option>
                      </select><small class="text-muted">Standard: contrat simple. Complexe: clauses protectrices multiples.</small></div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title"><span class="form-section-num">2L</span> Le document</h2>
                      <div class="form-group"><label>Type précis <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Ex: CDI / Bail / CGV-CGU"></div>
                      <div class="form-group"><label>Langue <em class="req">*</em></label><select class="form-control" required><option value="fr">FR</option><option value="en">EN</option></select></div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-signal="strong" data-smart-from="contrats"> Non concurrence</div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-signal="strong" data-smart-from="contrats"> NDA strict</div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-signal="strong" data-smart-from="contrats"> Dédit formation</div>
                      <div class="checkbox-line"><input type="checkbox" class="form-check-input" data-smart-signal="strong" data-smart-from="contrats"> Pénalités</div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section" id="contrats-audit-conditionnel" style="display: none;">
                      <h2 class="form-section-title">Audit : upload contrat tiers</h2>
                      <div class="dropzone" style="border: 1px dashed var(--color-border); padding: 12px; margin: 8px 0;">
                        <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <h5>Contrat du tiers (PDF)</h5>
                        <p>Glissez-déposez ou cliquez pour parcourir</p>
                        <input type="file" hidden accept=".pdf">
                        <span class="dz-filename"></span>
                      </div>
                    </div>
                    <hr class="form-divider">
                    <div class="form-section">
                      <h2 class="form-section-title">L'entreprise et la contrepartie</h2>
                      <div class="form-row">
                        <div class="form-group"><label>Votre dénomination</label><input type="text" class="form-control" required placeholder="Ex: FEDPAWA CORPORATE SOLUTIONS SARL"></div>
                        <div class="form-group"><label>Nom du cocontractant pressenti</label><input type="text" class="form-control" required placeholder="Ex: Société Partenaire"></div>
                      </div>
                    </div>
                  </div>

                  <div class="form-block" id="form-recouvrement" style="display: none;">
            <div class="form-row">
              <div class="form-group"><label>Montant total des créances (FCFA)</label><input type="number" class="form-control" required placeholder="Ex : 2500000"></div>
              <div class="form-group"><label>Nombre de débiteurs</label><input type="number" class="form-control" required placeholder="Ex : 3"></div>
            </div>
            <div class="form-group"><label>Nature de la créance</label><select class="form-control" required><option>Facture impayée</option><option>Loyers impayés</option><option>Prêt / avance non remboursée</option><option>Jugement non exécuté</option><option>Autre (précisez)</option></select></div>
            <div class="form-group"><label>Historique sommaire des relances</label><textarea class="form-control" required rows="3" placeholder="Décrivez les relances déjà effectuées (dates, canaux, réponses)."></textarea></div>
          </div>

          <!-- Formulaire Domiciliation -->
          
<!-- === BLOCS COMMUNS (Représentant légal + Contact) === -->
                  <div class="form-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--color-border);">
                    <h3 class="form-section-title"><span class="form-section-num">2M</span> Identité du Représentant Légal</h3>
                    <div class="form-row">
                      <div class="form-group"><label>Civilité <em class="req">*</em></label><select class="form-control" required><option>Monsieur</option><option>Madame</option></select></div>
                      <div class="form-group"><label>Nom complet <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Jean Dupont"></div>
                    </div>
                    <div class="form-row">
                      <div class="form-group"><label>Fonction / Qualité <em class="req">*</em></label><select class="form-control" required><option>Gérant / Co-gérant</option><option>Président / Director</option><option>Directeur Général</option><option>Fondateur / Promoteur</option><option>Mandataire / Fondé de pouvoir</option></select></div>
                      <div class="form-group"><label>Nationalité <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Camerounaise"></div>
                    </div>
                    <div class="form-row">
                      <div class="form-group"><label>Type de pièce d'identité <em class="req">*</em></label><select class="form-control" required><option>Carte Nationale d'Identité (CNI)</option><option>Passeport</option><option>Carte de Séjour / Titre de Résidence</option></select></div>
                      <div class="form-group"><label>Numéro de la pièce <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Numéro figurant sur la pièce"></div>
                    </div>
                  </div>

                  <div class="form-section" style="margin-top: 24px;">
                    <h3 class="form-section-title"><span class="form-section-num">2N</span> Coordonnées de Contact</h3>
                    <div class="form-row">
                      <div class="form-group"><label>Email professionnel <em class="req">*</em></label><input type="email" class="form-control" required placeholder="vous@votre-entreprise.com"></div>
                      <div class="form-group"><label>WhatsApp / Téléphone <em class="req">*</em></label><input type="tel" class="form-control" required placeholder="+237 6XX XXX XXX" pattern="^\+?[0-9\s]{9,16}$"></div>
                    </div>
                    <div class="form-row">
                      <div class="form-group"><label>Adresse <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Quartier, rue, repère…"></div>
                      <div class="form-group"><label>Ville <em class="req">*</em></label><input type="text" class="form-control" required placeholder="Ex : Douala"></div>
                    </div>
                    <!-- Select pays 195 comme souscription_domiciliation.php -->
                    <div class="form-group">
                      <label for="pays" class="form-control-label">Pays de résidence <em class="req">*</em></label>
                      <select id="pays" name="pays" class="form-control" required>
                        <option value="" disabled>— Sélectionnez votre pays —</option>
                        <option value="Cameroun" selected>Cameroun</option>
                        <!-- 195 pays options - copie du bloc depuis souscription_domiciliation.php -->
                        <option value="Afghanistan">Afghanistan</option>
                        <option value="Afrique du Sud">Afrique du Sud</option>
                        <option value="Albanie">Albanie</option>
                        <option value="Algérie">Algérie</option>
                        <option value="Allemagne">Allemagne</option>
                        <option value="Andorre">Andorre</option>
                        <option value="Angola">Angola</option>
                        <option value="Antigua-et-Barbuda">Antigua-et-Barbuda</option>
                        <option value="Arabie saoudite">Arabie saoudite</option>
                        <option value="Argentine">Argentine</option>
                        <option value="Arménie">Arménie</option>
                        <option value="Australie">Australie</option>
                        <option value="Autriche">Autriche</option>
                        <option value="Azerbaïdjan">Azerbaïdjan</option>
                        <option value="Bahamas">Bahamas</option>
                        <option value="Bahreïn">Bahreïn</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Barbade">Barbade</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Belize">Belize</option>
                        <option value="Bénin">Bénin</option>
                        <option value="Bhoutan">Bhoutan</option>
                        <option value="Biélorussie">Biélorussie</option>
                        <option value="Birmanie">Birmanie</option>
                        <option value="Bolivie">Bolivie</option>
                        <option value="Bosnie-Herzégovine">Bosnie-Herzégovine</option>
                        <option value="Botswana">Botswana</option>
                        <option value="Brésil">Brésil</option>
                        <option value="Brunei">Brunei</option>
                        <option value="Bulgarie">Bulgarie</option>
                        <option value="Burkina Faso">Burkina Faso</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Cabo Verde">Cabo Verde</option>
                        <option value="Cambodge">Cambodge</option>
                        <option value="Caméroun">Caméroun</option>
                        <option value="Chili">Chili</option>
                        <option value="Chine">Chine</option>
                        <option value="Chypre">Chypre</option>
                        <option value="Colombie">Colombie</option>
                        <option value="Comores">Comores</option>
                        <option value="Congo">Congo</option>
                        <option value="Costa Rica">Costa Rica</option>
                        <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                        <option value="Croatie">Croatie</option>
                        <option value="Danemark">Danemark</option>
                        <option value="Djibouti">Djibouti</option>
                        <option value="Espagne">Espagne</option>
                        <option value="Estonie">Estonie</option>
                        <option value="États-Unis">États-Unis</option>
                        <option value="Éthiopie">Éthiopie</option>
                        <option value="Finlande">Finlande</option>
                        <option value="France">France</option>
                        <option value="Gabon">Gabon</option>
                        <option value="Gambie">Gambie</option>
                        <option value="Géorgie">Géorgie</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Grèce">Grèce</option>
                        <option value="Grenade">Grenade</option>
                        <option value="Guatemala">Guatemala</option>
                        <option value="Guinée">Guinée</option>
                        <option value="Guinée-Bissau">Guinée-Bissau</option>
                        <option value="Guyane">Guyane</option>
                        <option value="Haïti">Haïti</option>
                        <option value="Honduras">Honduras</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Hongrie">Hongrie</option>
                        <option value="Île Christmas">Île Christmas</option>
                        <option value="Île Norfolk">Île Norfolk</option>
                        <option value="Inde">Inde</option>
                        <option value="Indonésie">Indonésie</option>
                        <option value="Iran">Iran</option>
                        <option value="Iraq">Iraq</option>
                        <option value="Irlande">Irlande</option>
                        <option value="Islande">Islande</option>
                        <option value="Israël">Israël</option>
                        <option value="Italie">Italie</option>
                        <option value="Jamaïque">Jamaïque</option>
                        <option value="Japon">Japon</option>
                        <option value="Jordanie">Jordanie</option>
                        <option value="Kazakhstan">Kazakhstan</option>
                        <option value="Kirghizistan">Kirghizistan</option>
                        <option value="Kiribati">Kiribati</option>
                        <option value="Koweït">Koweït</option>
                        <option value="Laos">Laos</option>
                        <option value="Lettonie">Lettonie</option>
                        <option value="Liban">Liban</option>
                        <option value="Libye">Libye</option>
                        <option value="Liechtenstein">Liechtenstein</option>
                        <option value="Lithuanie">Lithuanie</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Madagascar">Madagascar</option>
                        <option value="Malaisie">Malaisie</option>
                        <option value="Maldives">Maldives</option>
                        <option value="Mali">Mali</option>
                        <option value="Malte">Malte</option>
                        <option value="Maroc">Maroc</option>
                        <option value="Mauritanie">Mauritanie</option>
                        <option value="Maurice">Maurice</option>
                        <option value="Mexique">Mexique</option>
                        <option value="Micronésie">Micronésie</option>
                        <option value="Moldavie">Moldavie</option>
                        <option value="Monaco">Monaco</option>
                        <option value="Mongolie">Mongolie</option>
                        <option value="Monténégro">Monténégro</option>
                        <option value="Mozambique">Mozambique</option>
                        <option value="Namibie">Namibie</option>
                        <option value="Népal">Népal</option>
                        <option value="Nicaragua">Nicaragua</option>
                        <option value="Niger">Niger</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Norvège">Norvège</option>
                        <option value="Nouvelle-Zélande">Nouvelle-Zélande</option>
                        <option value="Oman">Oman</option>
                        <option value="Ouganda">Ouganda</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Palaos">Palaos</option>
                        <option value="Panama">Panama</option>
                        <option value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</option>
                        <option value="Paraguay">Paraguay</option>
                        <option value="Pérou">Pérou</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Pologne">Pologne</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Roumanie">Roumanie</option>
                        <option value="Royaume-Uni">Royaume-Uni</option>
                        <option value="Russie">Russie</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Sainte-Hélène">Sainte-Hélène</option>
                        <option value="Sainte-Lucie">Sainte-Lucie</option>
                        <option value="Samoa">Samoa</option>
                        <option value="Sao Tomé-et-Principe">Sao Tomé-et-Principe</option>
                        <option value="Sénégal">Sénégal</option>
                        <option value="Serbie">Serbie</option>
                        <option value="Seychelles">Seychelles</option>
                        <option value="Sierra Leone">Sierra Leone</option>
                        <option value="Singapour">Singapour</option>
                        <option value="Slovaquie">Slovaquie</option>
                        <option value="Slovenie">Slovénie</option>
                        <option value="Somalie">Somalie</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Suède">Suède</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Suriname">Suriname</option>
                        <option value="Swaziland">Swaziland</option>
                        <option value="Tadjikistan">Tadjikistan</option>
                        <option value="Tanzanie">Tanzanie</option>
                        <option value="Thaïlande">Thaïlande</option>
                        <option value="Timor-Leste">Timor-Leste</option>
                        <option value="Togo">Togo</option>
                        <option value="Tonga">Tonga</option>
                        <option value="Trinité-et-Tobago">Trinité-et-Tobago</option>
                        <option value="Tunisie">Tunisie</option>
                        <option value="Turquie">Turquie</option>
                        <option value="Turkménistan">Turkménistan</option>
                        <option value="Tuvalu">Tuvalu</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Ouzbékistan">Ouzbékistan</option>
                        <option value="Vanuatu">Vanuatu</option>
                        <option value="Vatican">Vatican</option>
                        <option value="Venezuela">Venezuela</option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Yémen">Yémen</option>
                        <option value="Zambie">Zambie</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                      </select>
                      <small class="field-hint">Tapez les premières lettres du pays pour y accéder rapidement.</small>
                    </div>
                  </div>

                  <div class="btn-group">
                    <button class="btn btn-outline" onclick="goToStep(1)" style="visibility: hidden;">← Retour</button>
                    <button class="btn btn-primary" onclick="validateStep(1, 2)">Continuer →</button>
                  </div>
                </div>

        <!-- ÉTAPE 3 -->
        <div class="tunnel-step-content" id="step-2">
          <div class="step-header">
            <h2>2. Options complémentaires (facultatives)</h2>
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

            <label class="selectable-card option-card" data-name="Assistance à la création / Immatriculation d'entreprise" data-price="0" id="opt-assistance-creation" data-smart-signal="strong" data-smart-from="options">
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
            <button class="btn btn-outline" onclick="goToStep(1)">← Retour</button>
            <button class="btn btn-primary" onclick="validateStep(2, 3)">Continuer vers les documents →</button>
          </div>
        </div>

        <!-- ÉTAPE 4 -->
        <div class="tunnel-step-content" id="step-3">
          <div class="step-header">
            <h2>3. Déposez vos pièces justificatives</h2>
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
            <button class="btn btn-outline" onclick="validateStep(1, 2)">← Retour</button>
            <button class="btn btn-primary" onclick="validateStep(3, 4)">Voir le récapitulatif →</button>
          </div>
        </div>

        <!-- ÉTAPE 5 -->
        <div class="tunnel-step-content" id="step-4">
          <div class="step-header">
            <h2>4. Récapitulatif & Paiement Sécurisé</h2>
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
          <div class="pay-method-unique" style="display: flex; align-items: center; gap: 14px; padding: 18px; border: 2px solid var(--color-primary); border-radius: 12px; background: var(--color-primary-soft, var(--color-bg-alt)); margin-bottom: 24px;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: var(--color-primary); color: var(--color-on-primary); display: grid; place-items: center; flex: 0 0 46px;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
            </div>
            <div>
              <strong style="font-size: 0.95rem; color: var(--color-heading);">Mobile Money (Orange / MTN)</strong>
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">Le seul mode accepté actuellement. Vous saisirez votre numéro et confirmerez par USSD sur votre téléphone.</div>
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
          <span>Total à régler</span>
         
          <span id="summaryTotal">0 FCFA</span>
        </div>

        <div class="summary-secure-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Paiement 100% Sécurisé
        </div>
      </aside>

    </div>
  </div>

  <!-- ============ MODAL DÉTECTION SMART — BESOIN DE CRÉATION D'ENTREPRISE ============ -->
  <div id="smart-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(8,12,24,0.55); backdrop-filter: blur(2px); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px;">
    <div id="smart-modal" role="dialog" aria-modal="true" style="background: var(--color-bg-card, #fff); border-radius: 14px; max-width: 520px; width: 100%; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border: 1px solid var(--color-border);">
      <div style="width: 54px; height: 54px; border-radius: 50%; background: var(--color-primary); display: grid; place-items: center; margin-bottom: 16px;">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2-6-4.8-6 4.8L8.8 14 2.8 9.2h7.6z"/></svg>
      </div>
      <h3 style="font-size: 1.25rem; margin-bottom: 10px;">Création d'entreprise recommandée 🎯</h3>
      <p id="smart-modal-text" style="font-size: 0.92rem; color: var(--color-text-muted); line-height: 1.55; margin-bottom: 22px;"></p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button type="button" id="smart-modal-yes" class="btn btn-primary" style="width: 100%;">🚀 Oui, découvrir la Création d'Entreprise</button>
        <button type="button" id="smart-modal-no" style="width: 100%; background: none; border: none; font-size: 0.88rem; color: var(--color-text-muted); cursor: pointer; text-decoration: underline; padding: 6px;">Non merci, continuer ma souscription actuelle</button>
      </div>
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
$extraJs = ['assets/js/config.js', 'assets/js/auth-guard.js', 'assets/js/fedpawa-ui.js', 'assets/js/fedpawa-pay.js', 'assets/js/tunnel.js'];
include __DIR__ . '/../templates/partials/site-footer.php';
