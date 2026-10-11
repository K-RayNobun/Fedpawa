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
            const res = await fetch('/api/dashboard');
            if (res.status === 401) {
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
                        <td><a href="#" class="action-link">Consulter le scan</a></td>
                    </tr>
                `).join('');
            }

        } catch (err) {
            console.error('Erreur chargement dashboard:', err);
        }
    }

    loadDashboardData();

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
});
