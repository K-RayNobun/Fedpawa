/* =====================================================================
   Formulaire de Souscription Domiciliation — 6 sections (docx fidèle)
   ===================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('domiciliationForm');
  if (!form) return;

  const FR = {
    packMissing: "Veuillez sélectionner votre pack dans la section 4.",
    requiredMissing: "Merci de compléter tous les champs obligatoires (marqués *).",
    identiteMissing: "Pièce d\u2019identité du représentant légal manquante (Section 5).",
    statutsMissing: "Statuts certifiés ou projet de statuts manquant (Section 5).",
    validationsMissing: "Les 3 validations obligatoires de la Section 6 doivent être cochées.",
    emailInvalid: "Adresse e-mail invalide.",
    phoneInvalid: "Téléphone invalide. Format attendu : +237 6XX XXX XXX",
  };

  /* ---------- Reflected XSS safety ---------- */
  const esc = (s) => String(s)
    .replace(/&/g, String.fromCharCode(38) + 'amp;')
    .replace(/</g, String.fromCharCode(38) + 'lt;')
    .replace(/>/g, String.fromCharCode(38) + 'gt;')
    .replace(/"/g, String.fromCharCode(38) + 'quot;')
    .replace(/'/g, String.fromCharCode(38) + '#39;');


  /* ---------- STEPPER MULTI-ETAPES (Lane #3) ---------- */
  const stepContents = Array.from(document.querySelectorAll('.tunnel-step-content[data-step]'));
  const stepDots = Array.from(document.querySelectorAll('.progress-step[data-step]'));
  const progressFill = document.getElementById('progressFill');
  let currentStep = 1;
  const TOTAL_STEPS = stepContents.length || 5;

  function showStep(n) {
    currentStep = n;
    stepContents.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === n));
    stepDots.forEach(d => {
      const sn = Number(d.dataset.step);
      d.classList.toggle('active', sn === n);
      d.classList.toggle('completed', sn < n);
    });
    if (progressFill) progressFill.style.width = ((n - 1) / (TOTAL_STEPS - 1)) * 100 + '%';
    // En-tête mobile : compteur + titre de l'étape courante + barre de progression
    const mobCount = document.getElementById('domStepCount');
    const mobTitle = document.getElementById('domStepTitle');
    const mobFill = document.getElementById('domStepFill');
    if (mobCount) mobCount.textContent = '\u00c9tape ' + n + '/' + TOTAL_STEPS;
    if (mobTitle) {
      const d = stepDots.find(x => Number(x.dataset.step) === n);
      const lbl = d ? d.querySelector('.progress-label') : null;
      if (lbl) mobTitle.textContent = lbl.textContent;
    }
    if (mobFill) mobFill.style.width = ((n - 1) / (TOTAL_STEPS - 1)) * 100 + '%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.goToStep = function (n) {
    if (n >= 1 && n <= TOTAL_STEPS) showStep(n);
  };

  // Validation locale d'une etape avant de passer a la suivante
  function stepFields(n) {
    const cont = stepContents.find(el => Number(el.dataset.step) === n);
    return cont ? Array.from(cont.querySelectorAll('input, select, textarea')) : [];
  }
  function validateStep(n) {
    const errs = [];
    stepFields(n).forEach(f => {
      if (f.willValidate && !f.checkValidity()) {
        errs.push(FR.requiredMissing);
        f.reportValidity && f.reportValidity();
      }
    });
    // Etape 4 : pack obligatoire
    if (n === 4 && !packSelect.value) errs.push(FR.packMissing);
    return [...new Set(errs)];
  }
  window.domNext = function () {
    const errs = validateStep(currentStep);
    if (errs.length) {
      errorsBox.style.display = 'block';
      errorsBox.innerHTML = '<strong>⚠️ Merci de corriger :</strong><ul>' + errs.map(m => '<li>' + esc(m) + '</li>').join('') + '</ul>';
      errorsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    errorsBox.style.display = 'none';
    if (currentStep < TOTAL_STEPS) showStep(currentStep + 1);
  };

  // Navigation directe via le stepper : clic sur une etape deja validee (precedente) seulement
  stepDots.forEach(d => {
    d.addEventListener('click', () => {
      const n = Number(d.dataset.step);
      if (n < currentStep) showStep(n);
    });
  });

  showStep(1);

  /* ---------- SECTION 1 : statut conditionnel ---------- */
  const statutRadios = document.querySelectorAll('input[name="statut_structure"]');
  const rccmInput = document.getElementById('rccm');
  const niuInput = document.getElementById('niu');
  const rccmReq = document.getElementById('rccm-req');
  const niuReq = document.getElementById('niu-req');

  function applyStatut() {
    const enCreation = document.querySelector('input[name="statut_structure"]:checked').value === 'creation';
    if (enCreation) {
      rccmInput.required = false; niuInput.required = false;
      rccmReq.style.display = 'none'; niuReq.style.display = 'none';
      rccmInput.placeholder = '« En cours » — finalisez à la validation';
      niuInput.placeholder = '« En cours » — finalisez à la validation';
    } else {
      rccmInput.required = true; niuInput.required = true;
      rccmReq.style.display = ''; niuReq.style.display = '';
      rccmInput.placeholder = 'Ex : RCCM/DL/2024/B/1234';
      niuInput.placeholder = 'Ex : M123456789';
    }
  }
  statutRadios.forEach(r => r.addEventListener('change', applyStatut));
  applyStatut();

  /* ---------- Forme juridique « Autre » ---------- */
  const formeSelect = document.getElementById('forme_juridique');
  const formeAutreGroup = document.getElementById('forme-autre-group');
  const formeAutreInput = document.getElementById('forme_autre');
  formeSelect.addEventListener('change', () => {
    const isAutre = formeSelect.value === 'Autre (précisez)';
    formeAutreGroup.style.display = isAutre ? '' : 'none';
    formeAutreInput.required = isAutre;
  });

  /* ---------- SECTION 4 : gammes + pack dynamique ---------- */
  const PACKS = {
    nationale: [
      { value: 'national-essential', price: 25000, label: 'Pack ESSENTIAL — 25 000 FCFA / mois' },
      { value: 'national-business', price: 45000, label: 'Pack BUSINESS — 45 000 FCFA / mois' },
      { value: 'national-premium', price: 70000, label: 'Pack PREMIUM — 70 000 FCFA / mois' },
    ],
    internationale: [
      { value: 'international-essential', price: 50000, label: 'ESSENTIAL DIGITAL — 50 000 FCFA (~88 $) / mois' },
      { value: 'international-business', price: 110000, label: 'BUSINESS VIRTUAL — 110 000 FCFA (~180 $) / mois' },
      { value: 'international-premium', price: 175000, label: 'PREMIUM EXECUTIVE — 175 000 FCFA (~290 $) / mois' },
    ],
  };

  let gamme = 'nationale';
  const packSelect = document.getElementById('pack');
  const cards = { nationale: document.getElementById('gamme-nationale'), internationale: document.getElementById('gamme-internationale') };
  const periodSelect = document.getElementById('periodicite');
  const optionBoxes = document.querySelectorAll('input[name="options"]');


  /* ---------- SECTION 4bis : caract&eacute;ristiques d&eacute;taill&eacute;es des packs (source: page domiciliation.php) ---------- */
  const PACK_DETAILS = {
    'national-essential': { badge: 'Nationale', name: 'Pack ESSENTIAL', usd: null, features: [
      'Adresse de si&egrave;ge social &agrave; Logpom, Douala', 'R&eacute;ception du courrier', 'Scan syst&eacute;matique de chaque courrier',
      'Archivage num&eacute;rique (1 mois)', 'Notification par email et WhatsApp &agrave; chaque r&eacute;ception', '6 heures de bureau priv&eacute; par mois incluses' ] },
    'national-business': { badge: 'Nationale', name: 'Pack BUSINESS', usd: null, features: [
      'Adresse de si&egrave;ge social &agrave; Logpom, Douala', 'R&eacute;ception du courrier', 'Scan syst&eacute;matique de chaque courrier',
      'Archivage num&eacute;rique (1 mois)', 'Notification par email et WhatsApp &agrave; chaque r&eacute;ception', 'R&eacute;exp&eacute;dition physique mensuelle du courrier',
      '10 heures de bureau priv&eacute; par mois incluses (WiFi haute performance)' ] },
    'national-premium': { badge: 'Populaire', name: 'Pack PREMIUM', usd: null, features: [
      'Adresse de si&egrave;ge social &agrave; Logpom, Douala', 'R&eacute;ception du courrier', 'Scan syst&eacute;matique de chaque courrier',
      'Archivage num&eacute;rique (1 mois)', 'Notification par email et WhatsApp &agrave; chaque r&eacute;ception', 'R&eacute;exp&eacute;dition physique instantan&eacute;e du courrier',
      'R&eacute;ceptionniste d&eacute;di&eacute;e bilingue au nom de votre entreprise + ligne t&eacute;l&eacute;phonique locale',
      '15 heures de bureau priv&eacute; par mois incluses (WiFi haute performance)' ] },
    'international-essential': { badge: 'Internationale', name: 'ESSENTIAL DIGITAL', usd: '~88 USD', features: [
      'Adresse officielle du si&egrave;ge social &agrave; Logpom', 'R&eacute;ception physique des plis et colis &agrave; l\u2019accueil',
      'Num&eacute;risation et scan instantan&eacute; de chaque courrier', 'Envoi imm&eacute;diat des documents scann&eacute;s par e-mail ou WhatsApp',
      'R&eacute;exp&eacute;dition physique des colis vers l\u2019&eacute;tranger (frais de port au r&eacute;el)' ] },
    'international-business': { badge: 'Internationale', name: 'BUSINESS VIRTUAL', usd: '~180 USD', features: [
      'Adresse officielle du si&egrave;ge social &agrave; Logpom', 'R&eacute;ception physique des plis et colis &agrave; l\u2019accueil',
      'Num&eacute;risation et scan instantan&eacute; de chaque courrier', 'Envoi imm&eacute;diat des documents scann&eacute;s par e-mail ou WhatsApp',
      'R&eacute;exp&eacute;dition physique des colis vers l\u2019&eacute;tranger (frais de port au r&eacute;el)', 'Num&eacute;ro de t&eacute;l&eacute;phone local camerounais d&eacute;di&eacute;',
      'R&eacute;ponse t&eacute;l&eacute;phonique personnalis&eacute;e (r&eacute;ceptionniste bilingue)', 'Prise de message et transmission imm&eacute;diate par WhatsApp ou e-mail' ] },
    'international-premium': { badge: 'Prestige', name: 'PREMIUM EXECUTIVE', usd: '~290 USD', features: [
      'Adresse officielle du si&egrave;ge social &agrave; Logpom', 'R&eacute;ception physique des plis et colis &agrave; l\u2019accueil',
      'Num&eacute;risation et scan instantan&eacute; de chaque courrier', 'Envoi imm&eacute;diat des documents scann&eacute;s par e-mail ou WhatsApp',
      'R&eacute;exp&eacute;dition physique des colis vers l\u2019&eacute;tranger (frais de port au r&eacute;el)', 'Num&eacute;ro de t&eacute;l&eacute;phone local camerounais d&eacute;di&eacute;',
      'R&eacute;ponse t&eacute;l&eacute;phonique personnalis&eacute;e (r&eacute;ceptionniste bilingue)', 'Prise de message et transmission imm&eacute;diate par WhatsApp ou e-mail',
      '20 heures/mois en bureau priv&eacute; climatis&eacute; haut standing (sur r&eacute;servation)', 'Connexion Internet haut d&eacute;bit pendant vos sessions',
      'Accueil de prestige de vos d&eacute;l&eacute;gations d\u2019affaires', 'Caf&eacute; inclus &agrave; volont&eacute; pour toute l\u2019&eacute;quipe' ] }
  };

  function renderPackDetail(packValue) {
    const box = document.getElementById('packDetail');
    if (!box) return;
    const d = PACK_DETAILS[packValue];
    if (!d) { box.style.display = 'none'; return; }
    document.getElementById('pdBadge').textContent = d.badge;
    document.getElementById('pdName').textContent = d.name;
    const usdEl = document.getElementById('pdUsd');
    usdEl.style.display = d.usd ? '' : 'none';
    if (d.usd) usdEl.textContent = d.usd + ' / mois';
    const pack = currentPack();
    document.getElementById('pdPrice').textContent = pack ? fmt(pack.price) + ' / mois' : '';
    document.getElementById('pdFeatures').innerHTML = d.features.map(f => '<li>' + f + '</li>').join('');
    box.style.display = 'block';
  }

  /* ---------- Sidebar récap ---------- */
  function currentPack() {
    const opt = packSelect.selectedOptions[0];
    if (!opt || !opt.value) return null;
    return { price: Number(opt.dataset.price || 0), label: opt.dataset.label || opt.textContent.trim() };
  }

  function fmt(n) { return n.toLocaleString('fr-FR') + ' FCFA'; }

  function updateSummary() {
    const pack = currentPack();
    const periodLabel = periodSelect.selectedOptions[0] ? periodSelect.selectedOptions[0].textContent : '';
    const months = periodSelect.selectedOptions[0] ? Number(periodSelect.selectedOptions[0].dataset.months || 1) : 1;

    document.getElementById('sum-pack').textContent = pack ? pack.label : '—';
    document.getElementById('sum-periodicite').textContent = periodLabel || '—';
    document.getElementById('sum-monthly').textContent = pack ? fmt(pack.price) : '—';

    const opts = [...optionBoxes].filter(cb => cb.checked);
    const optBox = document.getElementById('summaryOptions');
    optBox.innerHTML = opts.length
      ? opts.map(cb => '<div class="summary-item"><span class="sum-label">Option</span><span class="sum-value">' + esc(cb.value) + '</span></div>').join('')
      : '';

    const totalLabel = document.getElementById('sum-total-label');
    const totalEl = document.getElementById('summaryTotal');
    if (pack) {
      const total = pack.price * months;
      totalLabel.textContent = months === 1 ? 'Total (mensuel)' : 'Total (' + months + ' mois)';
      totalEl.textContent = fmt(total);
    }
  }

  window.selectGamme = function (g) {
    gamme = g;
    Object.entries(cards).forEach(([k, el]) => el.classList.toggle('selected', k === g));
    // Pack options dynamiques selon la gamme
    const optSel = packSelect.querySelector('optgroup[data-gamme="' + g + '"]');
    packSelect.querySelectorAll('optgroup').forEach(og => { og.hidden = og !== optSel; });
    packSelect.value = '';
    packSelect.required = true;
    updateSummary();
  };

  // Listeners
  packSelect.addEventListener('change', () => { updateSummary(); renderPackDetail(packSelect.value); });
  periodSelect.addEventListener('change', updateSummary);
  optionBoxes.forEach(cb => cb.addEventListener('change', updateSummary));

  // init — pré-sélection depuis l'URL (?pack=national-premium par ex.)
  const urlPack = new URLSearchParams(location.search).get('pack');
  if (urlPack && (urlPack.startsWith('national-') || urlPack.startsWith('international-'))) {
    window.selectGamme(urlPack.startsWith('national-') ? 'nationale' : 'internationale');
    const opt = packSelect.querySelector('option[value="' + urlPack + '"]');
    if (opt) packSelect.value = urlPack;
  } else {
    window.selectGamme('nationale');
  }
  updateSummary();
  renderPackDetail(packSelect.value);

  /* ---------- SECTION 5 : dropzones ---------- */
  document.querySelectorAll('.dropzone').forEach(dz => {
    const input = dz.querySelector('input[type="file"]');
    dz.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files.length) {
        dz.classList.add('has-file');
        dz.querySelector('.dz-filename').textContent = '📄 ' + input.files[0].name + ' (' + Math.round(input.files[0].size / 1024) + ' Ko)';
      } else {
        dz.classList.remove('has-file');
        dz.querySelector('.dz-filename').textContent = '';
      }
    });
    ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag-over'); }));
    dz.addEventListener('drop', e => {
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  });

  /* ---------- SECTION 6 : validation + soumission ---------- */
  const errorsBox = document.getElementById('form-errors');

  function validate() {
    const errs = [];

    // 1. Champs obligatoires (via checkValidity + messages ciblés)
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) {
        if (firstInvalid.id === 'pack') errs.push(FR.packMissing);
        else errs.push(FR.requiredMissing);
      }
    }

    // Emails / téléphone
    const email = document.getElementById('email');
    const tel = document.getElementById('telephone');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) errs.push(FR.emailInvalid);
    if (tel.value && !/^\+?[0-9\s]{9,16}$/.test(tel.value)) errs.push(FR.phoneInvalid);

    // Dropzones obligatoires
    if (!document.querySelector('#dz-identite input').files.length) errs.push(FR.identiteMissing);
    if (!document.querySelector('#dz-statuts input').files.length) errs.push(FR.statutsMissing);

    // 3 validations
    if (!document.getElementById('chk-cgv').checked) errs.push(FR.validationsMissing);
    if (!document.getElementById('chk-cadre').checked) errs.push(FR.validationsMissing);
    if (!document.getElementById('chk-exactitude').checked) errs.push(FR.validationsMissing);

    return errs;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errs = validate();

    if (errs.length) {
      errorsBox.style.display = 'block';
      errorsBox.innerHTML = '<strong>⚠️ Merci de corriger :</strong><ul>' + errs.map(m => '<li>' + esc(m) + '</li>').join('') + '</ul>';
      errorsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Lane #2: connexion requise puis paiement Mobile Money
    const data = new FormData(form);
    const name = data.get('nom_complet') || 'client';
    const pack = currentPack();
    const months = periodSelect.selectedOptions[0] ? Number(periodSelect.selectedOptions[0].dataset.months || 1) : 1;
    const total = pack ? pack.price * months : 0;
    const phone = data.get('telephone') || '';

    if (!window.FedpawaPay) {
      errorsBox.style.display = 'block';
      errorsBox.innerHTML = '<strong>Composant paiement indisponible.</strong>';
      return;
    }

    const submitPayload = async (pay) => {
      try {
        const csrf = await FedpawaPay.getCsrf();
        const res = await fetch(apiUrl('/api/souscription'), {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
          body: JSON.stringify({
            service: 'domiciliation',
            pack: packSelect.value,
            plan: packSelect.value,
            nom: name,
            name,
            planLabel: pack ? pack.label : '',
            prix: total,
            periodicite: data.get('periodicite'),
            paymentMethod: 'momo',
            momo_phone: pay.phone,
            momo_operator: pay.operator,
            name,
            email: data.get('email'),
            telephone: phone || pay.phone,
            denom: data.get('denomination')
          })
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.status !== 'error') {
          return { ok: true, message: out.message || 'Souscription enregistrée.', subscription_ref: out.subscription_ref || null };
        }
        return { ok: false, message: out.message || out.error || 'Échec de la souscription.' };
      } catch (err) {
        console.error(err);
        return { ok: false, message: 'Erreur réseau.' };
      }
    };

    const openMomo = () => FedpawaPay.momoScreen({
      label: (pack ? pack.label : 'Domiciliation') + (data.get('periodicite') === 'annuel' ? ' — Annuel (12 mois)' : (data.get('periodicite') === 'semestriel' ? ' — Semestriel (6 mois)' : ' — Mensuel')),
      priceFCFA: total,
      onSubmit: submitPayload
    });

    FedpawaPay.getSession().then(session => {
      if (!session.authenticated) {
        FedpawaPay.loginModal(openMomo);
        return;
      }
      openMomo();
    });
  });
})();
