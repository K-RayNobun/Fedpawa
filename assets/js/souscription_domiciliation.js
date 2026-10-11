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
  packSelect.addEventListener('change', updateSummary);
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

    // Succès : collecte des données pour récap (pas d'envoi réseau — site statique)
    const data = new FormData(form);
    const name = data.get('nom_complet') || 'client';
    const pack = currentPack();

    form.style.display = 'none';
    const ok = document.getElementById('form-success');
    document.getElementById('success-name').textContent = name;
    ok.style.display = 'block';
    ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
