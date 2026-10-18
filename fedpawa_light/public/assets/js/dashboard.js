// (Navigation par onglets déplacée dans db-tabs.js, partagée avec le dashboard admin)
document.addEventListener('DOMContentLoaded', () => {
// Fetch Real User Data from Server
    async function loadDashboardData() {
        try {
            const res = await fetch(apiUrl('/api/dashboard'), {
                credentials: 'include'
            });
            if (res.status === 401 || res.status === 403) {
                // Non connecté : renvoyer vers l'écran de connexion dédié.
                window.location.href = 'authentification.html';
                return;
            }
            if (!res.ok) return;

            const data = await res.json();
            const client = data.client;
            const sub = data.subscription;
            const factures = data.factures || [];
            const contrats = data.contrats || [];
            const courriers = data.courriers || [];
            const kyc = data.kyc;

            // F6: exposer le service de l'abonnement au bouton « Changer de pack »
            window.__lastSub = sub || null;
            window.__pastSubscriptions = data.pastSubscriptions || [];

            // Populate User Name & Avatar
            if (client) {
                const userNameEls = document.querySelectorAll('.user-name');
                userNameEls.forEach(el => el.innerText = client.nom);

                const avatarEl = document.querySelector('.user-avatar');
                if (avatarEl) {
                    const initials = client.nom.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                    avatarEl.innerText = initials;
                }

                // Welcome Greeting
                const welcomeEl = document.querySelector('.db-welcome h1');
                if (welcomeEl) welcomeEl.innerText = `Bonjour, ${client.nom}`;

                // Profile form fields
                const profileForm = document.querySelector('#tab-profil form');
                if (profileForm) {
                    const inputs = profileForm.querySelectorAll('input');
                    if (inputs[0]) inputs[0].value = client.nom || '';
                    if (inputs[1]) inputs[1].value = client.entreprise || '';
                    if (inputs[2]) inputs[2].value = client.email || '';
                    if (inputs[3]) inputs[3].value = client.telephone || '';
                    if (inputs[4]) inputs[4].value = client.adresse || '';
                }
            }

            // Populate Overview Card / Abonnement
            const overviewCards = document.querySelectorAll('.overview-card');
            if (overviewCards.length > 0) {
                if (sub) {
                    overviewCards[0].querySelector('.value').innerText = sub.pack || 'Aucun pack';
                    overviewCards[0].querySelector('.sub-value').innerText = sub.date_fin ? `Prochaine échéance : ${sub.date_fin}` : 'Sans engagement';
                    overviewCards[0].querySelector('.badge').innerText = sub.statut === 'actif' ? 'Actif' : 'En attente';
                    overviewCards[0].querySelector('.badge').className = `badge badge-${sub.statut === 'actif' ? 'success' : 'warning'}`;
                } else {
                    // F2/F3: pas d'abonnement → état honnête, pas de badge "Actif" mensonger
                    overviewCards[0].querySelector('.value').innerText = 'Aucun abonnement';
                    overviewCards[0].querySelector('.sub-value').innerText = 'Souscrivez à une offre pour activer vos services';
                    const b = overviewCards[0].querySelector('.badge');
                    if (b) { b.innerText = 'Inactif'; b.className = 'badge badge-muted'; }
                }
            }
            // Cartes KYC/Courrier: sortir du "Chargement…" si absence de données
            if (overviewCards.length > 1 && !kyc) {
                overviewCards[1].querySelector('.value').innerText = 'Aucun dossier';
                overviewCards[1].querySelector('.sub-value').innerText = '—';
                const bk = overviewCards[1].querySelector('.badge');
                if (bk) { bk.innerText = 'À soumettre'; bk.className = 'badge badge-muted'; }
            }
            if (overviewCards.length > 2 && (!courriers || courriers.length === 0)) {
                overviewCards[2].querySelector('.value').innerText = 'Aucun courrier';
                overviewCards[2].querySelector('.sub-value').innerText = '—';
                const bc = overviewCards[2].querySelector('.badge');
                if (bc) { bc.innerText = '—'; bc.className = 'badge badge-muted'; }
            }

            // Populate KYC Status
            if (kyc && overviewCards.length > 1) {
                overviewCards[1].querySelector('.value').innerText = kyc.statuts === 'approuvé' ? 'Dossier validé' : 'Dossier en attente';
                overviewCards[1].querySelector('.badge').innerText = kyc.statuts === 'approuvé' ? 'Conforme' : 'Action requise';
                overviewCards[1].querySelector('.badge').className = `badge badge-${kyc.statuts === 'approuvé' ? 'success' : 'warning'}`;
                // F3: résoudre le sub-value même quand le KYC existe mais n'a pas encore
                // de contenu (sinon « Chargement… » persiste).
                const subk = overviewCards[1].querySelector('.sub-value');
                if (subk && /Chargement/.test(subk.innerText)) subk.innerText = '—';
            }

            // Populate Latest Courrier
            if (courriers.length > 0 && overviewCards.length > 2) {
                overviewCards[2].querySelector('.value').innerText = new Date(courriers[0].date_reception).toLocaleDateString('fr-FR');
                overviewCards[2].querySelector('.sub-value').innerText = courriers[0].statut === 'scanné' ? 'Courrier numérisé' : 'Réception enregistrée';
            }

            // Populate Factures Table
            const facturesTbody = document.querySelector('#tab-factures tbody');
            if (facturesTbody && factures.length === 0) {
                // F8: état vide explicite
                facturesTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:28px 12px; color:var(--color-text-muted); font-size:0.92rem;">Aucune facture pour le moment. Elles apparaîtront ici après votre première souscription payée.</td></tr>';
            }
            if (facturesTbody && factures.length > 0) {
                facturesTbody.innerHTML = factures.map(f => `
                    <tr>
                        <td>${f.numero}</td>
                        <td>${f.date}</td>
                        <td>${f.montant.toLocaleString()} FCFA</td>
                        <td><span class="badge badge-success">Payée</span></td>
                        <td><a href="${f.lien_pdf || '#'}" class="action-link" target="_blank">Télécharger (PDF)</a></td>
                    </tr>
                `).join('');
            }

            // Populate Contrats Table
            const contratsTbody = document.querySelector('#tab-contrats tbody');
            if (contratsTbody && contrats.length === 0) {
                contratsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:28px 12px; color:var(--color-text-muted); font-size:0.92rem;">Aucun contrat pour le moment. Vos actes signés électroniquement apparaîtront ici.</td></tr>';
            }
            if (contratsTbody && contrats.length > 0) {
                contratsTbody.innerHTML = contrats.map(c => `
                    <tr>
                        <td>${c.type}</td>
                        <td>${c.date_signature}</td>
                        <td>Signature électronique (Doc@uthANTIC)</td>
                        <td><a href="${c.fichier}" class="action-link" target="_blank">Télécharger (PDF)</a></td>
                    </tr>
                `).join('');
            }

            // Populate Courriers Table
            const courriersTbody = document.querySelector('#tab-courriers tbody');
            if (courriersTbody && courriers.length === 0) {
                courriersTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:28px 12px; color:var(--color-text-muted); font-size:0.92rem;">Aucun courrier reçu pour le moment. Chaque courrier adressé à votre adresse de domiciliation sera numérisé ici.</td></tr>';
            }
            if (courriersTbody && courriers.length > 0) {
                courriersTbody.innerHTML = courriers.map(co => `
                    <tr>
                        <td>${co.date_reception}</td>
                        <td>Courrier postal / Administratif</td>
                        <td><span class="badge badge-success">${co.statut}</span></td>
                        <td>${co.scan ? `<a href="/api/document?type=courrier&id=${co.id}" target="_blank" class="action-link">Consulter le scan</a>` : '<span class="action-link" style="opacity:.5">Aucun scan</span>'}</td>
                    </tr>
                `).join('');
            }


        // ===== Lane audit: onglet Abonnement (données réelles) =====
        const offerLabel = document.getElementById('offerLabel');
        if (offerLabel && !sub) {
            // F3: sans abonnement, état explicite au lieu de "Chargement…" éternel
            offerLabel.innerText = 'Aucun abonnement actif pour le moment.';
            const badgeAbo = document.querySelector('#tab-abonnement .db-section-header .badge');
            if (badgeAbo) { badgeAbo.innerText = 'Inactif'; badgeAbo.className = 'badge badge-muted'; }
            const noAbo = document.getElementById('offerPrice');
            if (noAbo) noAbo.innerHTML = '<strong>Tarif :</strong> —';
        }
        if (offerLabel && sub) {
            offerLabel.innerText = (sub.pack || 'Aucun pack');
            // W-9: badge de l'onglet = statut réel (fini le "Actif" statique mensonger)
            const badgeTab = document.querySelector('#tab-abonnement .db-section-header .badge');
            if (badgeTab) {
                badgeTab.innerText = sub.statut === 'actif' ? 'Actif' : 'En attente';
                badgeTab.className = 'badge badge-' + (sub.statut === 'actif' ? 'success' : 'warning');
            }
            const price = document.getElementById('offerPrice');
            const start = document.getElementById('offerStart');
            const end = document.getElementById('offerEnd');
            const hours = document.getElementById('offerHours');
            if (price) price.innerHTML = '<strong>Tarif :</strong> ' + Number(sub.prix || 0).toLocaleString('fr-FR') + ' FCFA';
            if (start) start.innerHTML = '<strong>Date de début :</strong> ' + (sub.date_debut ? new Date(String(sub.date_debut).replace(' ', 'T')).toLocaleDateString('fr-FR') : '—');
            if (end) end.innerHTML = '<strong>Date de fin :</strong> ' + (sub.date_fin ? new Date(String(sub.date_fin).replace(' ', 'T')).toLocaleDateString('fr-FR') : 'Sans engagement');
            if (hours) hours.innerText = '';
        }

        // ===== Lane audit: documents KYC - statuts réels =====
        const docItems = document.querySelectorAll('#tab-documents .doc-item');
        if (kyc && docItems.length) {
            const setDoc = (idx, ok, label) => {
                const d = docItems[idx];
                if (!d) return;
                const st = d.querySelector('.doc-status');
                if (st) st.className = 'doc-status ' + (ok ? 'valid' : 'pending');
                const p = d.querySelector('.doc-info p');
                if (p) p.innerText = label;
            };
            const approuve = kyc.statuts === 'approuvé';
            // F9: chaque doc-item lit SON champ — plus de doublon piece_identite
            setDoc(0, !!kyc.piece_identite, kyc.piece_identite ? (approuve ? 'Validé' : 'Téléversé, en validation') : 'En attente de téléversement');
            setDoc(1, !!kyc.statuts_entreprise, kyc.statuts_entreprise ? (approuve ? 'Validé' : 'Téléversé, en validation') : 'En attente de téléversement');
            setDoc(2, !!kyc.justificatif_domicile, kyc.justificatif_domicile ? (approuve ? 'Validé' : 'Téléversé, en validation') : 'En attente de téléversement');
            setDoc(3, approuve, approuve ? 'Validé par l\'administration' : 'En attente de validation');
        }
        } catch (err) {
            console.error('Erreur chargement dashboard:', err);
        }
    }

    // Lane audit: ce script ne charge les données CLIENT que sur l'espace client.
    // Sur admin_dashboard.html, /api/dashboard est 401 (route client) et la redirection
    // provoquait une boucle infinie admin_dashboard <-> authentification.
    if (document.documentElement.getAttribute('data-auth') !== 'admin') {
        loadDashboardData();
    }

    // KYC Drag & Drop (Espace Client)
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragout');
            if (e.dataTransfer.files.length > 0) {
                alert(`${e.dataTransfer.files.length} fichier(s) prêt(s) à être téléversé(s).`);
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                alert(`${fileInput.files.length} fichier(s) sélectionné(s).`);
            }
        });
    }

    // ===== F6: bouton « Changer de pack / Ajouter des options » — inline component avec conditions =====\n    const changePackBtn = document.querySelector('#tab-abonnement .btn-outline');\n    if (changePackBtn && !changePackBtn.dataset.wired) {\n        changePackBtn.dataset.wired = '1';\n        changePackBtn.addEventListener('click', () => {\n            // Récupérer les données du tableau de bord\n            const sub = window.__lastSub || null;\n            const pastSubs = window.__pastSubscriptions || [];\n\n            // Condition 1: Abonnement actif → warning dans le composant\n            if (sub && sub.statut === 'actif') {\n                // Afficher le composant avec warning\n                showPackComponent(true, true, null, sub);\n                return;\n            }\n\n            // Condition 2: Pas d'abonnement actif mais abonnements passés → texte + 2 boutons\n            if (!sub || sub.statut !== 'actif') {\n                if (pastSubs.length > 0) {\n                    // Afficher le composant sans warning, avec les 2 boutons\n                    showPackComponent(false, false, pastSubs);\n                    return;\n                }\n                // Aucun abonnement du tout\n                showPackComponent(false, false, []);\n                return;\n            }\n\n            // Fallback redirection selon le service (pour les cas edge)\n            const PACK2SERVICE = {\n                standard: 'creation', protect_brand: 'oapi', anteriorite: 'oapi', brevets: 'oapi',\n                simplifie: 'fiscalite', reel: 'fiscalite', complexe: 'contrats', integral: 'contrats'\n            };\n            const pack = (sub && sub.pack) || '';\n            const svc = PACK2SERVICE[pack] || 'domiciliation';\n            window.location.href = 'tunnel_souscription.php?service=' + encodeURIComponent(svc);\n        });\n    }\n\n    // ===== F6b: composant inline « Changer de Pack / Ajouter des options » =====\n    function showPackComponent(hasWarning, hasActiveSub, pastSubs, activeSub) {\n        // Récupérer window.FP_PLANS depuis tunnel.js (catalogue source de vérité)\n        const PLANS = window.FP_PLANS || window.PLANS || {};\n        \n        // Structure du composant inline\n        const componentHTML = `\\n        <div id=\"fp-pack-component\" style=\\\"position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.5); z-index: 1000; padding: 20px; display: flex; flex-direction: column;\\\">\\n            <div style=\\\"background: white; margin: 20px auto; width: 95%; max-width: 400px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.15); overflow: hidden;\\\">\\n                <div style=\\\"padding: 20px; border-bottom: 1px solid #e0e0e0;\\\">\\n                    <h3 style=\\\"margin: 0; font-size: 1.25rem;\\\">Choisissez votre nouveau pack</h3>\\n                </div>\\n            </div>\\n        `;\n        \n        // Ajouter warning si actif\n        if (hasWarning && activeSub) {\n            componentHTML += `\\n            <div style=\\\"padding: 12px 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 16px 20px;\\\">\\n                <p style=\\\"margin: 0; font-size: 0.875rem; color: #856404;\\\">Vous avez un pack en cours. Vous devez d'abord épuiser votre pack actuel avant de souscrire à un autre. Les packs restent consultables, mais la souscription est clairement conditionnée.</p>\\n            </div>`;\n        }\n        \n        // Condition 2: pas d'abonnement actif mais abonnements passés\n        if (!hasActiveSub && pastSubs && pastSubs.length > 0) {\n            componentHTML += `\\n            <div style=\\\"padding: 12px 20px; margin: 16px 20px;\\\">\\n                <p style=\\\"margin: 0; font-size: 0.875rem;\\\">Vous n'avez pas de pack actif actuellement.</p>\\n            </div>`;\n            \n            // Boutons\n            componentHTML += `\\n            <div style=\\\"padding: 12px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;\\\">\\n                <button class=\\\"btn btn-outline\\\" style=\\\"justify-self: start;\\\" onclick=\"hidePackComponent();\">Souscrire à nouveau</button>\\n                <button class=\\\"btn btn-outline\\\" style=\\\"justify-self: start;\\\" onclick=\"hidePackComponent();\">Changer de pack</button>\\n            </div>`;\n        }\n        \n        // Cartes de packs groupées par service\n        const serviceGroups = {};\n        \n        // Si on a des pastSubs, grouper par service\n        const packsToShow = hasActiveSub ? [activeSub] : [];\n        \n        if (pastSubs && pastSubs.length > 0) {\n            pastSubs.forEach(sub => {\n                const pack = sub.pack || '';\n                let service;\n                if (pack === 'standard') service = 'creation';\n                else if (['protect_brand', 'anteriorite', 'brevets'].includes(pack)) service = 'oapi';\n                else if (['simplifie', 'reel'].includes(pack)) service = 'fiscalite';\n                else if (['complexe', 'integral'].includes(pack)) service = 'contrats';\n                else if (pack && (pack.startsWith('national-') || pack.startsWith('international-'))) service = 'domiciliation';\n                else service = 'creation';\n                \n                if (!serviceGroups[service]) serviceGroups[service] = [];\n                serviceGroups[service].push({ pack, label: sub.pack.replace(/_/g, ' '), client_id: sub.id });\n            });\n        }\n        \n        // Ajouter les packs depuis FP_PLANS si pas d'abonnements passés ou si on veut montrer les options\n        if (!hasActiveSub) {\n            Object.entries(PLANS).forEach(([serviceId, servicePlans]) => {\n                Object.entries(servicePlans).forEach(([packId, plan]) => {\n                    if (!packId.startsWith('national-') && !packId.startsWith('international-')) {\n                        if (!serviceGroups[serviceId]) serviceGroups[serviceId] = [];\n                        serviceGroups[serviceId].push({ pack: packId, label: plan.label, isFromCatalogue: true });\n                    }\n                });\n            });\n        }\n        \n        // Rendre les cartes visibles par service\n        let firstService = true;\n        for (const [serviceId, packs] of Object.entries(serviceGroups)) {\n            const serviceNames = {\n                creation: 'Création d\\'entreprise',\n                oapi: 'Protection OAPI',\n                fiscalite: 'Fiscalité',\n                contrats: 'Contrats',\n                domiciliation: 'Domiciliation'\n            };\n            \n            const serviceLabel = serviceNames[serviceId] || serviceId;\n            \n            componentHTML += `\\n            <div style=\\\"padding: 12px 20px; margin: 8px 0; border-top: 1px solid #f0f0f0;\\\">\\n                <strong style=\\\"font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-muted); letter-spacing: 0.5px;\\\">${serviceLabel}</strong>`;\n            \n            packs.forEach((plan, idx) => {\n                const packLabel = plan.label || plan.pack || 'Pack';\n                const packId = plan.pack || plan.client_id;\n                const isFromCatalogue = plan.isFromCatalogue === true;\n                \n                // Déterminer le service de routage\n                let routeSvc = 'contrats';\n                if (packId === 'standard') routeSvc = 'creation';\n                else if (['protect_brand', 'anteriorite', 'brevets'].includes(packId)) routeSvc = 'oapi';\n                else if (['simplifie', 'reel'].includes(packId)) routeSvc = 'fiscalite';\n                else if (packId && (packId.startsWith('national-') || packId.startsWith('international-'))) routeSvc = 'domiciliation';\n                \n                const href = `tunnel_souscription.php?service=${routeSvc}&pack=${encodeURIComponent(packId)}`;\n                \n                componentHTML += `\\n                <div style=\\\"cursor: pointer; padding: 8px 0; border-bottom: 1px solid #f5f5f5;\\\" onclick=\"window.location.href='${href}'\\\">\\n                    <span style=\\\"display: block; font-size: 0.875rem;\\\">${packLabel}</span>\\n                </div>`;\n            });\n            \n            componentHTML += `\\n            </div>`;\n        }\n        \n        document.body.insertAdjacentHTML('beforeend', componentHTML);\n    }\n\n    // Fonction pour masquer le composant\n    window.hidePackComponent = function() {\n        const comp = document.getElementById('fp-pack-component');\n        if (comp) comp.remove();\n    };\n\n    // ===== F7: historique des tickets support du client =====\n

    // ===== F7: historique des tickets support du client =====
    const ticketsList = document.getElementById('ticketsList');
    if (ticketsList) {
        (async () => {
            try {
                const echap = str => String(str == null ? '' : str).replace(/[&<>"'\/]/g, ch => ({ '&': String.fromCharCode(38,97,109,112,59), '<': String.fromCharCode(38,108,116,59), '>': String.fromCharCode(38,103,116,59), '"': String.fromCharCode(38,113,117,111,116,59), "'": String.fromCharCode(38,35,51,57,59), '/': String.fromCharCode(47) }[ch]));
                const res = await fetch(apiUrl('/api/support/tickets'), { credentials: 'include' });
                if (!res.ok) { ticketsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">Historique indisponible.</p>'; return; }
                const data = await res.json();
                const tickets = data.tickets || [];
                if (!tickets.length) {
                    ticketsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">Aucune demande pour le moment. Vos messages au support apparaîtront ici avec leur statut.</p>';
                    return;
                }
                const badge = st => {
                    if (st === 'resolved' || st === 'closed') return '<span class="badge badge-success">Résolu</span>';
                    if (st === 'répondu' || st === 'repondu') return '<span class="badge badge-success">Répondu</span>';
                    if (st === 'in_progress' || st === 'en_cours') return '<span class="badge badge-warning">En cours</span>';
                    return '<span class="badge badge-warning">Ouvert</span>';
                };
                ticketsList.innerHTML = tickets.map(t =>
                    '<div style="border: 1px solid var(--color-border); border-radius: 10px; padding: 14px 16px;">' +
                    '<div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">' +
                    '<strong style="font-size:0.95rem; color:var(--color-heading);">' + echap(t.sujet) + '</strong>' + badge(t.statut) + '</div>' +
                    '<p style="font-size:0.86rem; color:var(--color-text-main); margin:8px 0 6px;">' + echap(String(t.message || '').slice(0, 200)) + ((t.message || '').length > 200 ? '…' : '') + '</p>' +
                    (t.reponse ? '<div style="background:var(--color-bg-alt); border-radius:8px; padding:10px 12px; margin:8px 0;"><strong style="font-size:0.78rem; color:var(--color-primary);">Réponse du support :</strong><p style="font-size:0.86rem; margin:4px 0 0;">' + echap(String(t.reponse)) + '</p><div style="font-size:0.74rem; color:var(--color-text-muted); margin-top:4px;">' + (t.reponse_at ? new Date(String(t.reponse_at).replace(' ', 'T')).toLocaleDateString('fr-FR') : '') + '</div></div>' : '') +
                    '<div style="font-size:0.76rem; color:var(--color-text-muted);">Envoyé le ' + (t.created_at ? new Date(String(t.created_at).replace(' ', 'T')).toLocaleDateString('fr-FR') : '—') + '</div>' +
                    '</div>'
                ).join('');
            } catch (e) {
                ticketsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">Historique indisponible.</p>';
            }
        })();
    }

    // ===== Lane audit: formulaires réels (profil, support, KYC, mail) =====
    const profilForm = document.getElementById('profilForm');
    if (profilForm) {
        profilForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = profilForm.querySelectorAll('input');
            const payload = { nom: inputs[0]?.value, entreprise: inputs[1]?.value, email: inputs[2]?.value, telephone: inputs[3]?.value, adresse: inputs[4]?.value };
            try {
                const res = await Api.post('/api/profil/update', payload);
                const data = await res.json().catch(() => ({}));
                if (res.ok && !data.error) { if (window.FedpawaUI) FedpawaUI.toast('Profil mis à jour.', 'success'); loadDashboardData(); }
                else if (window.FedpawaUI) FedpawaUI.toast((data && data.error) || 'Erreur de mise à jour.', 'error');
            } catch (err) { if (window.FedpawaUI) FedpawaUI.toast('Erreur réseau.', 'error'); }
        });
    }

    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sujet = supportForm.querySelector('input')?.value?.trim();
            const message = supportForm.querySelector('textarea')?.value?.trim();
            if (!sujet || !message) return;
            const btn = supportForm.querySelector('button[type="submit"], .btn-primary');
            if (btn) { btn.disabled = true; btn.innerText = 'Envoi...'; }
            try {
                const res = await Api.post('/api/support', { sujet, message });
                const data = await res.json().catch(() => ({}));
                if (res.ok && !data.error) {
                    if (window.FedpawaUI) FedpawaUI.toast('Message envoyé au support. Réponse sous 24h.', 'success');
                    supportForm.reset();
                } else if (window.FedpawaUI) FedpawaUI.toast((data && data.error) || 'Erreur d\'envoi.', 'error');
            } catch (err) { if (window.FedpawaUI) FedpawaUI.toast('Erreur réseau.', 'error'); }
            if (btn) { btn.disabled = false; btn.innerText = 'Envoyer'; }
        });
    }

    // ===== Lane audit: envoi de documents KYC réel =====
    if (uploadArea && fileInput) {
        const submitKyc = async (files) => {
            if (!files.length) return;
            const fd = new FormData();
            // le backend attend exactement ces deux champs (KycService)
            if (files[0]) fd.append('piece_identite', files[0], files[0].name || 'identite.pdf');
            if (files[1]) fd.append('justificatif_domicile', files[1], files[1].name || 'justificatif.pdf');
            try {
                const csrf = await (await fetch(apiUrl('/api/csrf-token'), { credentials: 'include' })).json();
                const res = await fetch(apiUrl('/api/kyc/submit'), {
                    method: 'POST', credentials: 'include',
                    headers: { 'X-CSRF-Token': csrf.csrf_token || '' },
                    body: fd
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && !data.error) { if (window.FedpawaUI) FedpawaUI.toast('Documents transmis. Validation en cours.', 'success'); loadDashboardData(); }
                else if (window.FedpawaUI) FedpawaUI.toast((data && data.error) || 'Erreur de téléversement.', 'error');
            } catch (err) { if (window.FedpawaUI) FedpawaUI.toast('Erreur réseau.', 'error'); }
        };
        // remplacer les alert() de démo par l'envoi réel
        uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); submitKyc(e.dataTransfer.files); });
        fileInput.addEventListener('change', () => submitKyc(fileInput.files));
        const kycBtn = document.querySelector('#tab-documents .btn-primary');
        if (kycBtn) kycBtn.addEventListener('click', () => { if (fileInput.files.length) submitKyc(fileInput.files); else if (fileInput) fileInput.click(); });
    }

});

// ===== F6b: composant inline « Changer de Pack / Ajouter des options » =====
function showPackComponent(hasWarning, hasActiveSub, pastSubs, activeSub) {
    // Récupérer window.FP_PLANS depuis tunnel.js (catalogue source de vérité)
    const PLANS = window.FP_PLANS || window.PLANS || {};

    // Structure du composant inline - inséré dans #tab-abonnement
    const componentHTML = `
<div style="
    padding: 20px;
    background: var(--color-bg-main);
    border: 1px var(--color-border) solid;
    border-radius: 12px;
    margin: 20px 0;
    max-width: 960px;
    width: 100%;
    box-shadow: 0 4px 24px rgba(0,0,0,.15);
    position: relative;
">
    <h3 style="margin: 0 0 16px 0; font-size: 1.25rem;">Choisissez votre nouveau pack</h3>
`;

// Ajouter warning si abonnement actif
if (hasWarning && activeSub) {
    componentHTML += `
<div style="
    padding: 12px 20px;
    background: var(--color-warning-bg);
    border: 1px var(--color-border-warning) solid;
    border-radius: 8px;
    margin: 16px 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
">
    <p style="margin: 0;">Vous avez un pack en cours. Vous devez d'abord épuiser votre pack actuel avant de souscrire à un autre. Les packs restent consultables, mais la souscription est clairement conditionnée.</p>
</div>`;
}

// Condition 2: pas d'abonnement actif mais abonnements passés
if (!hasActiveSub && pastSubs && pastSubs.length > 0) {
    componentHTML += `
<div style="
    padding: 12px 20px;
    margin: 16px 0;
    font-size: 0.875rem;
">
    <p style="margin: 0;">Vous n'avez pas de pack actif actuellement.</p>
</div>`;

    // Boutons - les 2 boutons ouvrent le composant (déjà ouvert, donc on cache)
    componentHTML += `
<div style="
    padding: 12px 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
">
    <button class="btn btn-outline" style="justify-self: start;" onclick="hidePackComponent()">Souscrire à nouveau</button>
    <button class="btn btn-outline" style="justify-self: start;" onclick="hidePackComponent()">Changer de pack</button>
</div>`;
}

// Cartes de packs groupées par service
const serviceGroups = {};

// Si on a des pastSubs, grouper par service
if (pastSubs && pastSubs.length > 0) {
    pastSubs.forEach(sub => {
        const pack = sub.pack || '';
        let service;
        if (pack === 'standard') service = 'creation';
        else if (['protect_brand', 'anteriorite', 'brevets'].includes(pack)) service = 'oapi';
        else if (['simplifie', 'reel'].includes(pack)) service = 'fiscalite';
        else if (['complexe', 'integral'].includes(pack)) service = 'contrats';
        else if (pack && (pack.startsWith('national-') || pack.startsWith('international-'))) service = 'domiciliation';
        else service = 'creation';

        if (!serviceGroups[service]) serviceGroups[service] = [];
        serviceGroups[service].push({ pack, label: sub.pack });
    });
}

// Ajouter les packs depuis FP_PLANS (catalogue tunnel.js)
if (!hasActiveSub) {
    Object.entries(PLANS).forEach(([serviceId, servicePlans]) => {
        Object.entries(servicePlans).forEach(([packId, plan]) => {
            if (!serviceGroups[serviceId]) serviceGroups[serviceId] = [];
            serviceGroups[serviceId].push({ pack: packId, label: plan.label, fromCatalogue: true });
        });
    });
}

// Rendre les cartes visibles par service
const serviceNames = {
    creation: 'Création d\'entreprise',
    oapi: 'Protection OAPI',
    fiscalite: 'Fiscalité',
    contrats: 'Contrats',
    domiciliation: 'Domiciliation'
};

for (const [serviceId, packs] of Object.entries(serviceGroups)) {
    const serviceLabel = serviceNames[serviceId] || serviceId;

    componentHTML += `
<div style="
    padding: 12px 20px;
    margin: 8px 0;
    border-top: 1px var(--color-border) solid;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-muted);
">
    <strong>${serviceLabel}</strong>
</div>`;

    packs.forEach((plan, idx) => {
        const packLabel = plan.label || plan.pack || 'Pack';
        const packId = plan.pack || (plan.client_id ? `past_${plan.client_id}` : '');

        let routeSvc = 'contrats';
        if (packId === 'standard') routeSvc = 'creation';
        else if (['protect_brand', 'anteriorite', 'brevets'].includes(packId)) routeSvc = 'oapi';
        else if (['simplifie', 'reel'].includes(packId)) routeSvc = 'fiscalite';
        else if (packId && (packId.startsWith('national-') || packId.startsWith('international-'))) routeSvc = 'domiciliation';

        let href;
        if (routeSvc === 'domiciliation') {
            href = `souscription_domiciliation.php?pack=${encodeURIComponent(packId)}`;
        } else {
            href = `tunnel_souscription.php?service=${routeSvc}&pack=${encodeURIComponent(packId)}`;
        }

        componentHTML += `
<div style="
    cursor: pointer;
    padding: 8px 0;
    border-bottom: 1px var(--color-border) solid;
    font-size: 0.875rem;
">
    <span style="display: block;">${packLabel}</span>
</div>`;
    });

    componentHTML += `</div>`;
}

document.querySelector('#tab-abonnement').insertAdjacentHTML('beforeend', componentHTML);
}

// Fonction pour masquer le composant
window.hidePackComponent = function() {
    const comp = document.getElementById('fp-pack-component');
    if (comp) comp.remove();
};
