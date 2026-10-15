document.addEventListener('DOMContentLoaded', () => {
    // Dashboard Tabs
    const navItems = document.querySelectorAll('.db-nav-item');
    const tabContents = document.querySelectorAll('.db-tab-content');

    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.dataset.tab;
                
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                tabContents.forEach(content => content.classList.remove('active'));
                const activeTab = document.getElementById(`tab-${tabId}`);
                if (activeTab) activeTab.classList.add('active');
            });
        });
    }

    window.switchTab = function(tabId) {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
            }
        });
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab-${tabId}`) {
                content.classList.add('active');
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
            if (sub && overviewCards.length > 0) {
                overviewCards[0].querySelector('.value').innerText = sub.pack || 'Aucun pack';
                overviewCards[0].querySelector('.sub-value').innerText = sub.date_fin ? `Prochaine échéance : ${sub.date_fin}` : 'Sans engagement';
                overviewCards[0].querySelector('.badge').innerText = sub.statut === 'actif' ? 'Actif' : 'En attente';
                overviewCards[0].querySelector('.badge').className = `badge badge-${sub.statut === 'actif' ? 'success' : 'warning'}`;
            }

            // Populate KYC Status
            if (kyc && overviewCards.length > 1) {
                overviewCards[1].querySelector('.value').innerText = kyc.statuts === 'approuvé' ? 'Dossier validé' : 'Dossier en attente';
                overviewCards[1].querySelector('.badge').innerText = kyc.statuts === 'approuvé' ? 'Conforme' : 'Action requise';
                overviewCards[1].querySelector('.badge').className = `badge badge-${kyc.statuts === 'approuvé' ? 'success' : 'warning'}`;
            }

            // Populate Latest Courrier
            if (courriers.length > 0 && overviewCards.length > 2) {
                overviewCards[2].querySelector('.value').innerText = new Date(courriers[0].date_reception).toLocaleDateString('fr-FR');
                overviewCards[2].querySelector('.sub-value').innerText = courriers[0].statut === 'scanné' ? 'Courrier numérisé' : 'Réception enregistrée';
            }

            // Populate Factures Table
            const facturesTbody = document.querySelector('#tab-factures tbody');
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
        if (offerLabel && sub) {
            offerLabel.innerText = (sub.pack || 'Aucun pack');
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
            setDoc(0, !!kyc.piece_identite, kyc.piece_identite ? (approuve ? 'Validé' : 'Téléversé, en validation') : 'En attente de téléversement');
            setDoc(1, !!kyc.piece_identite, kyc.piece_identite ? (approuve ? 'Validé' : 'Téléversé, en validation') : 'En attente de téléversement');
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
