document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.progress-step');
    const TOTAL_STEPS = steps.length;
    const contents = document.querySelectorAll('.tunnel-step-content');
    const progressFill = document.getElementById('progressFill');
    const summaryItems = document.getElementById('summaryItems');
    const summaryTotal = document.getElementById('summaryTotal');
    
    // ============ CATALOGUE PACKS / PLANS (source de vérité) ============
    // price = 0 => "Sur devis" (pas de total numérique)
    const PLANS = {
        creation: {
            standard: { label: 'Formule Totale OHADA — Création & Légalisation', price: 100000, unit: '' }
        },
        oapi: {
            protect_brand: { label: 'Forfait Protect Brand & Tech', price: 200000, unit: '', range: '200 000 – 900 000 FCFA' },
            anteriorite:   { label: 'Recherche d\'Antériorité', price: 50000, unit: '', range: '50 000 – 100 000 FCFA' },
            brevets:       { label: 'Brevets d\'Invention', price: 0, unit: '', range: 'Sur devis' }
        },
        fiscalite: {
            simplifie: { label: 'Forfait Régime Simplifié', price: 35000, unit: '/ mois' },
            reel:      { label: 'Régime du Réel / Corporate', price: 0, unit: '', range: 'Sur devis' }
        },
        contrats: {
            standard: { label: 'Forfait Acte Standard', price: 50000, unit: '', range: '50 000 – 150 000 FCFA' },
            complexe: { label: 'Forfait Acte Complexe', price: 150000, unit: '', range: '150 000 – 500 000 FCFA' },
            audit:    { label: 'Audit Juridique Tiers', price: 0, unit: '', range: 'Sur devis' }
        },
        domiciliation: {
            'national-essential':    { label: 'Pack Essential (Nationale)', price: 25000, unit: '/ mois' },
            'national-business':    { label: 'Pack Business (Nationale)', price: 45000, unit: '/ mois' },
            'national-premium':     { label: 'Pack Premium (Nationale)', price: 70000, unit: '/ mois' },
            'international-essential': { label: 'Essential Digital (Internationale)', price: 50000, unit: '/ mois' },
            'international-business': { label: 'Business Virtual (Internationale)', price: 110000, unit: '/ mois' },
            'international-premium': { label: 'Premium Executive (Internationale)', price: 175000, unit: '/ mois' }
        },
        recouvrement: {
            succes: { label: 'Commission sur créances recouvrées', price: 0, unit: '', range: 'Sur devis' }
        }
    };

    // État initial du panier
    let cart = {
        service: null,
        serviceName: null,
        price: 0,
        planId: null,
        planLabel: null,
        planPrice: 0,
        planUnit: '',
        options: []
    };

    // 1. Routing via URL (Ex: ?service=contrats&pack=complexe)
    const params = new URLSearchParams(window.location.search);
    const urlService = params.get('service');
    const urlPack = params.get('pack');

    // 2. Gestion des étapes
    window.goToStep = function(stepNumber) {
        steps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum < stepNumber) step.classList.add('completed');
            if (stepNum === stepNumber) step.classList.add('active');
        });

        const percentage = ((stepNumber - 1) / (steps.length - 1)) * 100;
        if (progressFill) progressFill.style.width = percentage + '%';

        contents.forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(`step-${stepNumber}`);
        if (activeContent) activeContent.classList.add('active');

        // La facture (sidebar) n'est visible qu'à l'étape 5 (récapitulatif & paiement)
        const summaryAside = document.querySelector('.order-summary');
        if (summaryAside) summaryAside.classList.toggle('invoice-final', stepNumber === TOTAL_STEPS);

        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateSummary();
    }

    // 2bis. Validation obligatoire d'une étape avant de continuer (Lane tunnel v3)
    // Tous les champs [required] visibles de l'étape doivent être remplis.
    window.validateStep = function(fromStep, toStep) {
        const content = document.getElementById('step-' + fromStep);
        if (!content) { goToStep(toStep); return; }
        // activer temporairement la validité native des champs visibles de l'étape
        const fields = Array.from(content.querySelectorAll('input, select, textarea')).filter(el => {
            if (!el.offsetParent && el.type !== 'checkbox' && el.type !== 'radio') return false; // invisible
            return el.willValidate !== undefined;
        });
        const invalid = fields.filter(el => {
            // les champs required cachés (blocs conditionnels repliés) ne bloquent pas
            if (!el.offsetParent && (el.type === 'checkbox' || el.type === 'radio')) return false;
            return !el.checkValidity();
        });
        if (invalid.length) {
            invalid[0].reportValidity ? invalid[0].reportValidity() : content.reportValidity();
            invalid[0].focus({ preventScroll: false });
            invalid[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            // bannière d'aide
            const hint = document.getElementById('step-validation-hint');
            if (hint) {
                hint.style.display = 'block';
                hint.textContent = invalid.length === 1
                    ? 'Merci de compléter ce champ obligatoire avant de continuer.'
                    : (invalid.length + ' champs obligatoires restent à compléter avant de continuer.');
            }
            return;
        }
        const hint = document.getElementById('step-validation-hint');
        if (hint) hint.style.display = 'none';
        goToStep(toStep);
    };

    // 3. Sélection de la prestation (Étape 1)
    window.selectService = function(serviceId, isInitial = false, planId = null) {
        // Domiciliation: formulaire dédié multi-étapes (Lane #3)
        if (serviceId === 'domiciliation') {
            window.location.href = 'souscription_domiciliation.php' + (planId ? '?pack=' + encodeURIComponent(planId) : '');
            return;
        }
        // Lane tunnel v3 : l'étape de sélection des cartes a été supprimée.
        // Sans carte visible, on initialise le panier directement depuis le catalogue PLANS.
        const plan = (PLANS[serviceId] || {})[planId || Object.keys(PLANS[serviceId] || {})[0]];
        const SERVICE_NAMES = {
            creation: 'Création d\'entreprise',
            oapi: 'Protection OAPI',
            fiscalite: 'Conseils & Suivi Fiscal',
            contrats: 'Contrats & Rédaction Juridique',
            recouvrement: 'Recouvrement de Créances'
        };
        if (plan) {
            cart.service = serviceId;
            cart.serviceName = SERVICE_NAMES[serviceId] || serviceId;
            applyPlan(serviceId, (planId && (PLANS[serviceId] || {})[planId]) ? planId : Object.keys(PLANS[serviceId])[0]);

            // Afficher le bon formulaire à l'étape 2
            document.querySelectorAll('.form-block').forEach(fb => fb.style.display = 'none');
            const formToShow = document.getElementById(`form-${serviceId}`);
            if (formToShow) formToShow.style.display = 'block';

            updateSummary();
            if (!isInitial) goToStep(1);
        }
        // Compat : si des cartes service existent encore (autre page), garder l'ancien chemin
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(c => c.classList.remove('selected'));
        
        const card = document.querySelector(`[data-service="${serviceId}"]`);
        if (card && !plan) {
            card.classList.add('selected');
            cart.service = serviceId;
            cart.serviceName = card.dataset.name;

            // Plan par défaut : celui demandé via ?pack=, sinon le premier du catalogue
            const plans = PLANS[serviceId] || {};
            const chosenPlan = (planId && plans[planId]) ? planId : Object.keys(plans)[0];
            applyPlan(serviceId, chosenPlan);
            
            // Afficher le bon formulaire à l'étape 2
            document.querySelectorAll('.form-block').forEach(fb => fb.style.display = 'none');
            const formToShow = document.getElementById(`form-${serviceId}`);
            if (formToShow) formToShow.style.display = 'block';
            
            updateSummary();
            if (!isInitial) goToStep(1);
        }
    }

    // 3bis. Applique un plan : met à jour le panier + synchronise le sélecteur du formulaire
    function applyPlan(serviceId, planId) {
        const plan = (PLANS[serviceId] || {})[planId];
        if (!plan) return;
        cart.planId = planId;
        cart.planLabel = plan.label;
        cart.planPrice = plan.price;
        cart.planUnit = plan.unit || '';
        cart.price = plan.price;

        // Synchroniser le select du formulaire correspondant s'il existe
        const form = document.getElementById(`form-${serviceId}`);
        if (form) {
            const sel = form.querySelector('select[data-plan-select], select#dom-pack-select');
            if (sel) {
                sel.value = planId;
                if (sel.value !== planId) {
                    // le select ne contient pas ce plan (libellés détaillés) : fallback par index
                    const idx = Array.from(sel.options).findIndex(o => o.value === planId || o.textContent.toLowerCase().includes(planId.replace(/_/g, ' ')));
                    if (idx >= 0) sel.selectedIndex = idx;
                }
                // répercuter un changement manuel du select sur le panier
                if (!sel.dataset.bound) {
                    sel.dataset.bound = '1';
                    sel.addEventListener('change', () => {
                        const v = sel.value;
                        if ((PLANS[serviceId] || {})[v]) { applyPlan(serviceId, v); updateSummary(); }
                    });
                }
            }
        }
    }
    window.applyPlan = applyPlan;

    // 4. Sélection des options (Étape 3)
    window.toggleOption = function(checkbox) {
        const card = checkbox.closest('.option-card');
        const price = parseInt(card.dataset.price);
        const name = card.dataset.name;
        
        if (checkbox.checked) {
            card.classList.add('selected');
            cart.options.push({ name, price });
        } else {
            card.classList.remove('selected');
            cart.options = cart.options.filter(opt => opt.name !== name);
        }
        updateSummary();
    }

    // 5. Modes de paiement: Mobile Money uniquement (les autres sont désactivés faute de service)
    window.togglePaymentMethod = function () {};

    let finalBaseTotal = 0; // total HT (plans + options chiffrées), hors frais 2%
    // 6. Mise à jour du récapitulatif — le total affiché inclut les frais de service 2% (inclus, non détaillés)
    function updateSummary() {
        if (!summaryItems || !summaryTotal) return;
        summaryItems.innerHTML = '';
        let baseTotal = 0;
        let devisOnly = false;

        if (cart.serviceName) {
            // Ligne prestation : label du plan si défini, sinon nom du service
            const lineLabel = cart.planLabel ? `${cart.serviceName} — ${cart.planLabel}` : cart.serviceName;
            if (cart.price > 0) {
                summaryItems.innerHTML += `<div class="summary-item"><span>${lineLabel}</span><span>Prix Total Hors Taxe : ${cart.price.toLocaleString('fr-FR')} FCFA${cart.planUnit}</span></div>`;
                baseTotal += cart.price;
            } else {
                summaryItems.innerHTML += `<div class="summary-item"><span>${lineLabel}</span><span>Sur devis</span></div>`;
                devisOnly = true;
            }
        } else {
            summaryItems.innerHTML = `<div class="summary-item muted">Aucune prestation sélectionnée</div>`;
        }

        cart.options.forEach(opt => {
            const priceLabel = opt.price ? opt.price.toLocaleString('fr-FR') + ' FCFA HT' : 'Sur devis';
            summaryItems.innerHTML += `<div class="summary-item"><span>${opt.name}</span><span>${priceLabel}</span></div>`;
            baseTotal += opt.price || 0;
        });

        // Débours officiels : facturés au coût réel sur justificatifs (aucun montant fixe)
        if (cart.service) {
             summaryItems.innerHTML += `<div class="summary-divider"></div><div class="summary-item muted"><span>Débours officiels (Notaire, Greffe, DGI)</span><span>Au coût réel</span></div>`;
        }

        if (devisOnly && baseTotal === 0) {
            // Tout est sur devis : pas de total chiffré ni frais
            summaryItems.innerHTML += `<div class="summary-divider"></div><div class="summary-item muted"><span>Total</span><span>Sur devis personnalisé</span></div>`;
            summaryTotal.innerText = 'Sur devis';
            const finalBtn = document.getElementById('finalPayBtn');
            if (finalBtn) finalBtn.innerText = '🔒 Envoyer ma demande (devis personnalisé)';
            return;
        }

        // Total : plan affiché HT, le total général inclut subtilement les 2% de frais
        const fee = Math.floor(baseTotal * 0.02);
        finalBaseTotal = baseTotal;
        const finalTotal = baseTotal + fee;

        summaryTotal.innerText = finalTotal.toLocaleString('fr-FR') + ' FCFA';

        // ===== Synchro table de récap (step-4) — UX-S5-1: ventilation explicite =====
        const tableMain = document.getElementById('tableMain');
        const tableOptions = document.getElementById('tableOptions');
        const tableFees = document.getElementById('tableFees');
        const tableTotal = document.getElementById('tableTotal');
        const fmt = v => v.toLocaleString('fr-FR') + ' FCFA';
        if (tableMain) {
            const mainLine = cart.serviceName ? (cart.planLabel ? `${cart.serviceName} — ${cart.planLabel}` : cart.serviceName) : '—';
            tableMain.innerText = cart.price > 0 ? fmt(cart.price) + ' HT' : (devisOnly ? 'Sur devis' : '—');
            if (tableMain.parentElement && tableMain.parentElement.children[0]) {
                tableMain.parentElement.children[0].innerText = mainLine;
            }
        }
        if (tableOptions) {
            const optTotal = cart.options.reduce((s, o) => s + (o.price || 0), 0);
            tableOptions.innerText = optTotal > 0 ? fmt(optTotal) : (cart.options.length ? 'Sur devis' : 'Aucune');
        }
        if (tableFees) tableFees.innerText = fee > 0 ? fmt(fee) : '—';
        if (tableTotal) tableTotal.innerText = fmt(finalTotal);

        const finalBtn = document.getElementById('finalPayBtn');
        if (finalBtn) finalBtn.innerText = `🔒 Procéder au paiement sécurisé (${finalTotal.toLocaleString('fr-FR')} FCFA)`;
    }

    // ... (FileUpload logic)
    document.querySelectorAll('.dropzone').forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        if (!input) return;
        
        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                handleFileUpload(zone, e.dataTransfer.files[0]);
            }
        });
        input.addEventListener('change', () => {
            if (input.files.length > 0) handleFileUpload(zone, input.files[0]);
        });
    });

    function handleFileUpload(zone, file) {
        const h5 = zone.querySelector('h5');
        const p = zone.querySelector('p');
        if (h5) h5.innerText = file.name;
        if (p) {
            p.innerText = `${(file.size / 1024 / 1024).toFixed(2)} Mo - Cliquer pour remplacer`;
            p.style.color = 'var(--color-success)';
        }
    }

    // 8. Final Payment — Mobile Money uniquement, réservé aux connectés (Lane #2)
    const finalPayBtn = document.getElementById('finalPayBtn');
    if (finalPayBtn) {
        finalPayBtn.addEventListener('click', async () => {
            if (!cart.service) {
                if (window.FedpawaUI) FedpawaUI.toast('Veuillez sélectionner une prestation.', 'warning');
                goToStep(1);
                return;
            }

            const activeForm = document.querySelector(`#form-${cart.service}`);
            const name = activeForm ? (activeForm.querySelector('input[name="name"], input[placeholder*="Nom"], input[id*="nom"]')?.value || 'Client') : 'Client';
            const email = activeForm ? (activeForm.querySelector('input[type="email"]')?.value || '') : '';
            const telephone = activeForm ? (activeForm.querySelector('input[type="tel"]')?.value || '') : '';

            // Total réel avec frais 2% (débours au coût réel : hors total)
            const baseTotal = cart.price + cart.options.reduce((sum, opt) => sum + (opt.price || 0), 0);
            const totalAvecFrais = Math.floor(baseTotal * 1.02);

            if (!window.FedpawaPay) {
                if (window.FedpawaUI) FedpawaUI.toast('Composant paiement indisponible.', 'error');
                return;
            }

            const submitPayload = async (pay) => {
                try {
                                        const res = await Api.post('/api/souscription', {
                            service: cart.service,
                            plan: cart.planId,
                            pack: cart.planId,
                            planLabel: cart.planLabel,
                            prix: totalAvecFrais,
                            options: cart.options,
                            paymentMethod: 'momo',
                            momo_phone: pay.phone,
                            momo_operator: pay.operator,
                            nom: name,
                            name,
                            email,
                            telephone: telephone || pay.phone
                        });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.status !== 'error') {
                        return {
                            ok: true,
                            message: data.message || 'Souscription enregistrée.',
                            subscription_ref: data.subscription_ref || data.transaction_id || null,
                            // Lane contrat : données brutes pour « Vérifier Mon Paiement » + contrat
                            api: (data.status === 'payment_pending') ? {
                                status: data.status,
                                subscription_id: data.subscription_id,
                                client_id: data.client_id,
                                transaction_id: data.transaction_id,
                                signature_otp: data.signature_otp,
                                subscription_ref: data.subscription_ref || data.transaction_id,
                                client_name: name
                            } : null
                        };
                    }
                    return { ok: false, message: data.message || data.error || 'Échec de la souscription.' };
                } catch (err) {
                    console.error(err);
                    return { ok: false, message: 'Erreur réseau.' };
                }
            };

            const openMomo = () => FedpawaPay.momoScreen({
                label: (cart.serviceName || 'Prestation') + (cart.planLabel ? ' — ' + cart.planLabel : ''),
                priceFCFA: totalAvecFrais,
                contract: cart.service === 'domiciliation', // seul service avec contrat
                onSubmit: submitPayload
            });

            // Garde de connexion puis écran Mobile Money
            const session = await FedpawaPay.getSession();
            if (!session.authenticated) {
                FedpawaPay.loginModal(openMomo);
                return;
            }
            openMomo();
        });
    }


    // ============ 7bis. LOGIQUE CONDITIONNELLE DES FORMULAIRES PAR SERVICE (Lane #3) ============
    function initServiceFormConditionals() {
        // --- Création: démarche -> bloc "si existante" (RCCM + NIU actuels) ---
        const demarche = document.getElementById('creation-demarche');
        const creationEx = document.getElementById('creation-existante');
        if (demarche && creationEx) {
            const toggle = () => {
                const isExisting = !/Création d'une nouvelle structure/i.test(demarche.value || demarche.options[demarche.selectedIndex]?.text || '');
                creationEx.style.display = isExisting ? 'block' : 'none';
                creationEx.querySelectorAll('input').forEach(inp => inp.required = isExisting);
            };
            demarche.addEventListener('change', toggle);
            toggle();
        }

        // --- OAPI: titulaire personne morale / physique ---
        const radiosTitulaire = document.querySelectorAll('#form-oapi input[name="titulaire"]');
        const condPM = document.getElementById('oapi-titulaire-conditionnel');
        const condPF = document.getElementById('oapi-titulaire-conditionnel2');
        if (radiosTitulaire.length && condPM && condPF) {
            const toggleTitulaire = () => {
                const val = document.querySelector('#form-oapi input[name="titulaire"]:checked')?.value;
                condPM.style.display = (val === 'personne_morale') ? 'block' : 'none';
                condPF.style.display = (val === 'personne_physique') ? 'block' : 'none';
                condPM.querySelectorAll('input,select').forEach(el => el.required = (val === 'personne_morale'));
                condPF.querySelectorAll('input,select').forEach(el => el.required = (val === 'personne_physique'));
            };
            radiosTitulaire.forEach(r => r.addEventListener('change', toggleTitulaire));
            toggleTitulaire();
        }

        // --- OAPI: visuel obligatoire si logo/dessin ---
        const actifType = document.getElementById('oapi-actif-type');
        const dzVisuel = document.getElementById('dz-oapi-visuel');
        if (actifType && dzVisuel) {
            const toggleVisuel = () => {
                const t = (actifType.value || actifType.options[actifType.selectedIndex]?.text || '').toLowerCase();
                dzVisuel.classList.toggle('required', /logo|dessin/.test(t));
            };
            actifType.addEventListener('change', toggleVisuel);
            toggleVisuel();
        }

        // --- Contrats: catégorie audit -> formule sur devis + dropzone du contrat tiers ---
        const contratType = document.getElementById('contrat-type');
        const auditCond = document.getElementById('contrats-audit-conditionnel');
        const contratFormule = document.getElementById('contrat-formule');
        if (contratType && auditCond) {
            const toggleAudit = () => {
                const isAudit = contratType.value === 'audit';
                auditCond.style.display = isAudit ? 'block' : 'none';
                if (isAudit && contratFormule) {
                    contratFormule.value = 'audit';
                    contratFormule.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };
            contratType.addEventListener('change', toggleAudit);
            toggleAudit();
        }
    }
    initServiceFormConditionals();

    // ============ 10. DÉTECTION SMART DES BESOINS (signaux subtils) ============
    // Marqueurs data- dans le DOM :
    //   data-smart-signal="strong" data-smart-from="<service>"  → opt-in explicite ("Je ne dispose pas encore")
    //   data-smart-soft="<page>" sur une <option>                          → signal subtil d'un select
    // Fort signal = modal de redirection (besoin réel détecté) ; faible = bannière contextuelle discrète.
    const SMART_TARGETS = {
        creation: { url: 'creation_entreprise.php', label: 'Création d\'Entreprise' },
        domiciliation: { url: 'domiciliation.php', label: 'Domiciliation' },
        contrats: { url: 'contrats.php', label: 'Contrats' },
        oapi: { url: 'oapi.php', label: 'Protection OAPI' },
        fiscalite: { url: 'fiscalite.php', label: 'Fiscalité' }
    };

    function smartShowModal(fromService) {
        const overlay = document.getElementById('smart-modal-overlay');
        if (!overlay) return;
        const target = SMART_TARGETS.creation;
        const texts = {
            domiciliation: `Nous avons détecté que votre entreprise n\'est pas encore immatriculée (pas de RCCM / NIU). Bonne nouvelle : FEDPAWA prend en charge la création complète — statuts, RCCM, NIU et Kit Corporate — pour que votre domiciliation démarre sur des bases solides.`,
            fiscalite: `Sans NIU, les télédéclarations fiscales sont impossibles. FEDPAWA peut créer votre entreprise et obtenir votre NIU auprès de la DGI, puis activer votre suivi fiscal.`,
            options: `Vous avez demandé une assistance à la création / immatriculation. Notre prestation « Création & Légalisation » (100 000 FCFA) couvre exactement ce parcours : statuts, RCCM, NIU, Kit Corporate.`
        };
        const t = document.getElementById('smart-modal-text');
        if (t) t.innerText = texts[fromService] || texts.domiciliation;
        overlay.style.display = 'flex';
    }
    window.smartDismiss = function() {
        const overlay = document.getElementById('smart-modal-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    function smartShowBanner(targetKey, message) {
        const banner = document.getElementById('smart-banner');
        if (!banner) return;
        const target = SMART_TARGETS[targetKey];
        if (!target) return;
        document.getElementById('smart-banner-text').innerText = message;
        document.getElementById('smart-banner-link').href = target.url;
        document.getElementById('smart-banner-link').innerText = `Découvrir ${target.label} →`;
        banner.style.display = 'block';
    }

    function smartInit() {
        // a) Forts signaux : opt-ins « Je ne dispose pas encore »
        // (les option-cards portent le marqueur sur le <label> — l'input à l'intérieur porte l'événement)
        document.querySelectorAll('[data-smart-signal="strong"]').forEach(el => {
            const cb = el.tagName === 'INPUT' ? el : el.querySelector('input[type="checkbox"]');
            if (!cb) return;
            cb.addEventListener('change', () => {
                if (cb.checked) smartShowModal(el.dataset.smartFrom);
                else smartDismiss();
            });
        });

        // b) Modal : boutons
        const overlay = document.getElementById('smart-modal-overlay');
        if (overlay) {
            const yesBtn = document.getElementById('smart-modal-yes');
            const noBtn = document.getElementById('smart-modal-no');
            if (yesBtn) yesBtn.addEventListener('click', () => { window.location.href = SMART_TARGETS.creation.url; });
            if (noBtn) noBtn.addEventListener('click', smartDismiss);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) smartDismiss(); });
        }

        // c) Faibles signaux : options de select → bannière contextuelle
        document.querySelectorAll('select option[data-smart-soft]').forEach(opt => {
            const sel = opt.closest('select');
            if (!sel || sel.dataset.smartBound) return;
            sel.dataset.smartBound = '1';
            const check = () => {
                const chosen = sel.selectedOptions[0];
                if (chosen && chosen.dataset.smartSoft) {
                    const targetKey = chosen.dataset.smartSoft;
                    const msgs = {
                        creation: '💡 Vous préparez des statuts ou un pacte d\'associés ? Notre prestation Création & Légalisation structure votre entreprise dès l\'origine.',
                        domiciliation: '💡 Vous cherchez un local ? Notre Domiciliation Commerciale (dès 25 000 FCFA / mois) vous donne une adresse fiscale à Logpom sans bail.'
                    };
                    smartShowBanner(targetKey, msgs[targetKey] || '');
                }
            };
            sel.addEventListener('change', check);
        });
    }
    smartInit();

    // 9. Initialisation : ?service=contrats&pack=complexe pré-sélectionne tout
    if (urlService) {
        selectService(urlService, true, urlPack);
        // L'utilisateur arrive déjà ciblé (bouton d'une page service) :
        // la prestation est connue -> on ouvre directement le formulaire (étape 1)
        goToStep(1);
    } else {
        // Aucun service ciblé (bouton neutre) -> renvoyer vers la section services de l'accueil
        window.location.replace('index.php#services');
    }
    updateSummary();
});
