// =========================================================
// FEDPAWA - Dashboard Admin (donn\u00e9es r\u00e9elles uniquement)
// Charge /api/admin/lists + /api/admin/overview et peuple chaque onglet.
// Aucune donn\u00e9e de d\u00e9mo : les tables vides affichent un \u00e9tat vide propre.
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
    const fmtDate = (d) => d ? new Date(String(d).replace(' ', 'T')).toLocaleDateString('fr-FR') : '\u2014';
    const fmtFCFA = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
    const badge = (txt, cls) => `<span class="badge badge-${cls}">${esc(txt)}</span>`;
    const emptyRow = (cols, msg) => `<tr><td colspan="${cols}" style="text-align:center;color:var(--color-text-muted);padding:28px;">${esc(msg)}</td></tr>`;

    const statutBadge = (s) => {
        if (s === 'actif' || s === 'recu' || s === 'approuv\u00e9' || s === 'scann\u00e9' || s === 'closed') return badge(s, 'success');
        if (s === 'en_attente' || s === 'en_cours' || s === 'non_lu' || s === 'open') return badge(s, 'warning');
        return badge(s || 'inconnu', 'muted');
    };

    async function loadAdminData() {
        let lists = null, overview = null;
        try {
            const [r1, r2] = await Promise.all([
                fetch(apiUrl('/api/admin/lists'), { credentials: 'include' }),
                fetch(apiUrl('/api/admin/overview'), { credentials: 'include' })
            ]);
            if (r1.status === 403 || r2.status === 403) {
                // Session admin absente : renvoyer vers l'écran de connexion dédié
                window.location.href = 'authentification.html';
                return;
            }
            if (r1.ok) lists = await r1.json();
            if (r2.ok) overview = await r2.json();
        } catch (e) { console.error('Chargement admin:', e); return; }
        if (!lists) return;

        // ===== KPI (Vue d'ensemble) : stats r\u00e9elles =====
        if (overview && overview.stats) {
            const k = overview.stats;
            const set = (idx, val, sub) => {
                const cards = document.querySelectorAll('#tab-dashboard .kpi-value');
                if (cards[idx]) cards[idx].innerText = val;
                if (sub !== undefined) {
                    const subs = document.querySelectorAll('#tab-dashboard .kpi-sub');
                    if (subs[idx]) subs[idx].innerText = sub;
                }
            };
            set(0, k.clients ?? 0, 'Total enregistr\u00e9s');
            set(1, fmtFCFA((lists.paiements || []).reduce((t, p) => t + (p.statut === 'recu' ? Number(p.montant || 0) : 0), 0)), 'Paiements re\u00e7us cumul\u00e9s');
            set(2, k.abonnements ?? 0, 'Toutes souscriptions');
            set(3, k.kyc_en_cours ?? 0, 'Dossiers \u00e0 traiter');
            const navCount = document.querySelector('.db-nav-item[data-tab="kyc"] .nav-count');
            if (navCount) navCount.innerText = k.kyc_en_cours ?? 0;

            // Alertes dynamiques : fond\u00e9es sur les donn\u00e9es r\u00e9elles
            const alerts = document.querySelector('.alerts-grid');
            if (alerts) {
                const items = [];
                if (k.kyc_en_cours > 0) items.push(`<div class="alert-card danger"><div class="alert-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="alert-content"><h4>${k.kyc_en_cours} dossier(s) KYC \u00e0 valider</h4><p>Des clients attendent la validation de leurs pi\u00e8ces.</p><a href="#" class="alert-action" onclick="switchTab('kyc'); return false;">Examiner \u2192</a></div></div>`);
                const ticketsOpen = (lists.tickets || []).filter(t => t.statut === 'open').length;
                if (ticketsOpen > 0) items.push(`<div class="alert-card info"><div class="alert-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div class="alert-content"><h4>${ticketsOpen} ticket(s) support ouvert(s)</h4><p>R\u00e9pondez rapidement aux demandes clients.</p><a href="#" class="alert-action" onclick="switchTab('tickets'); return false;">Consulter \u2192</a></div></div>`);
                const msgs = (lists.messages || []).filter(m => m.sender_type === 'client').length;
                if (msgs > 0) items.push(`<div class="alert-card"><div class="alert-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="alert-content"><h4>${msgs} message(s) client(s) re\u00e7u(s)</h4><p>Bo\u00eete de r\u00e9ception interne.</p><a href="#" class="alert-action" onclick="switchTab('messages'); return false;">Ouvrir la messagerie \u2192</a></div></div>`);
                alerts.innerHTML = items.length ? items.join('') : '<p style="color:var(--color-text-muted);">Aucune action requise. Tout est \u00e0 jour.</p>';
            }
        }

        // ===== Clients =====
        const tClients = document.querySelector('#tab-clients tbody');
        if (tClients) {
            const rows = (lists.clients || []).map(c => `<tr><td>CL-${String(c.id).padStart(3, '0')}</td><td>${esc(c.nom)}</td><td>${esc(c.entreprise) || '\u2014'}</td><td>${esc(c.email)}</td><td>${statutBadge('actif')}</td><td>\u2014</td></tr>`);
            tClients.innerHTML = rows.length ? rows.join('') : emptyRow(6, 'Aucun client enregistr\u00e9');
        }

        // ===== Abonnements =====
        const tAbn = document.querySelector('#tab-abonnements tbody');
        if (tAbn) {
            const rows = (lists.abonnements || []).map(a => `<tr><td>AB-${a.id}</td><td>${esc(a.client_nom)}${a.entreprise ? ' (' + esc(a.entreprise) + ')' : ''}</td><td>${esc(a.pack)}</td><td>${fmtDate(a.date_fin)}</td><td>${statutBadge(a.statut)}</td><td>\u2014</td></tr>`);
            tAbn.innerHTML = rows.length ? rows.join('') : emptyRow(6, 'Aucun abonnement');
        }

        // ===== Paiements =====
        const tPay = document.querySelector('#tab-paiements tbody');
        if (tPay) {
            const rows = (lists.paiements || []).map(p => `<tr><td>${esc(p.transaction_id) || 'PAY-' + p.id}</td><td>${esc(p.client_nom) || '\u2014'}</td><td>${fmtFCFA(p.montant)}</td><td>${esc(p.mode_paiement)}</td><td>${fmtDate(p.date)}</td><td>${statutBadge(p.statut)}</td><td>${p.statut === 'recu' ? 'G\u00e9n\u00e9r\u00e9e' : '\u2014'}</td></tr>`);
            tPay.innerHTML = rows.length ? rows.join('') : emptyRow(7, 'Aucun paiement');
        }

        // ===== Courriers =====
        const tCour = document.querySelector('#tab-courriers .db-table-wrap:nth-of-type(2) tbody, #tab-courriers tbody');
        const tCour2 = document.querySelector('#tab-courriers table.db-table tbody');
        if (tCour2) {
            const rows = (lists.courriers || []).map(co => `<tr><td>${fmtDate(co.date_reception)}</td><td>${esc(co.client_nom) || '\u2014'}</td><td>Courrier re\u00e7u</td><td>${statutBadge(co.statut)}</td><td>${co.doc_exists ? `<a href="#" target="_blank" rel="noopener" class="action-link fp-doc-link" data-doc-type="courrier" data-doc-id="${co.id}">Consulter</a>` : '\u2014'}</td></tr>`);
            tCour2.innerHTML = rows.length ? rows.join('') : emptyRow(5, 'Aucun courrier');
        }

        // ===== Contrats =====
        const tCt = document.querySelector('#tab-contrats tbody');
        if (tCt) {
            const rows = (lists.contrats || []).map(ct => `<tr><td>CT-${String(ct.id).padStart(3, '0')}</td><td>${esc(ct.client_nom) || '\u2014'}</td><td>${esc(ct.type)}</td><td>${statutBadge('actif')}</td><td>${ct.doc_exists ? `<a href="#" target="_blank" rel="noopener" class="action-link fp-doc-link" data-doc-type="contrat" data-doc-id="${ct.id}">Consulter PDF</a>` : '\u2014'}</td></tr>`);
            tCt.innerHTML = rows.length ? rows.join('') : emptyRow(5, 'Aucun contrat');
        }

        // ===== KYC =====
        const kycWrap = document.querySelector('#tab-kyc');
        if (kycWrap) {
            const pending = (lists.kyc || []).filter(k => k.statuts === 'en_cours' || k.statuts === 'en_attente');
            const done = (lists.kyc || []).filter(k => k.statuts === 'approuv\u00e9' || k.statuts === 'rejet\u00e9');
            if (pending.length === 0 && done.length === 0) {
                kycWrap.innerHTML = '<div class="db-welcome"><div><h1>Validation KYC (Conformit\u00e9)</h1><p>Aucun dossier KYC soumis pour le moment.</p></div></div>';
            } else {
                let html = '<div class="db-welcome"><div><h1>Validation KYC (Conformit\u00e9)</h1><p>Examinez et validez les pi\u00e8ces d\'identit\u00e9 soumises par les clients.</p></div></div>';
                for (const k of pending) {
                    html += `<div class="kyc-review-card" data-kyc-id="${k.id}">
                        <div class="kyc-review-header">
                            <div><h3 style="margin-bottom: 4px;">${esc(k.client_nom)}${k.entreprise ? ' \u2014 ' + esc(k.entreprise) : ''}</h3><p style="font-size: 0.85rem; color: var(--color-text-muted);">Soumis le ${fmtDate(k.date_soumission)}</p></div>
                            ${badge(k.statuts, 'warning')}
                        </div>
                        <div class="kyc-docs-grid">
                            <div class="kyc-doc">${k.doc_exists_identite ? `<a href="/api/document?type=kyc&id=${k.id}&file=piece_identite" target="_blank" rel="noopener">` : '<a class="kyc-doc-na">'}<img src="/api/document?type=kyc&id=${k.id}&file=piece_identite" alt="CNI Recto" data-fallback="Pi\u00e8ce d'identit\u00e9 (PDF)"></a><p>Pi\u00e8ce d'identit\u00e9</p></div>
                            <div class="kyc-doc">${k.doc_exists_justificatif ? `<a href="/api/document?type=kyc&id=${k.id}&file=justificatif_domicile" target="_blank" rel="noopener">` : '<a class="kyc-doc-na">'}<img src="/api/document?type=kyc&id=${k.id}&file=justificatif_domicile" alt="Justificatif" data-fallback="Justificatif de domicile"></a><p>Justificatif de domicile</p></div>
                        </div>
                        <div class="kyc-actions">
                            <button class="btn btn-reject" data-kyc-reject="${k.id}">Rejeter (avec motif)</button>
                            <button class="btn btn-approve" data-kyc-approve="${k.id}">Approuver le dossier</button>
                        </div>
                    </div>`;
                }
                if (done.length) {
                    html += '<div class="db-section"><div class="db-section-header"><h2>Dossiers trait\u00e9s</h2></div><div class="db-table-wrap"><table class="db-table"><thead><tr><th>Client</th><th>Statut</th><th>Date</th><th>Pi\u00e8ces</th></tr></thead><tbody>' +
                        done.map(k => `<tr><td>${esc(k.client_nom)}</td><td>${statutBadge(k.statuts)}</td><td>${fmtDate(k.date_soumission)}</td><td>${k.doc_exists_identite ? `<a href="#" target="_blank" rel="noopener" class="action-link fp-doc-link" data-doc-type="kyc" data-doc-id="${k.id}" data-doc-file="piece_identite">Voir</a>` : '\u2014'}</td></tr>`).join('') +
                        '</tbody></table></div></div>';
                }
                kycWrap.innerHTML = html;
                // L011 : fallback propre si une pièce ne se charge pas (remplace
                // l'ancien attribut onerror échappé qui injectait du texte parasite
                // « "'> » sous les vignettes). Délégation via capture d'erreur.
                kycWrap.querySelectorAll('.kyc-doc img').forEach(img => {
                    img.addEventListener('error', () => {
                        const label = img.dataset.fallback || 'Document';
                        const p = document.createElement('p');
                        p.style.padding = '20px';
                        p.style.color = 'var(--color-text-muted)';
                        p.textContent = label;
                        img.replaceWith(p);
                    });
                });
                // Actions KYC
                kycWrap.querySelectorAll('[data-kyc-approve]').forEach(btn => btn.addEventListener('click', async () => {
                    const id = btn.dataset.kycApprove;
                    if (!confirm('Approuver ce dossier KYC ?')) return;
                    const res = await Api.post('/api/admin/kyc/approve', { id });
                    if (res.ok) { FedpawaUI.toast('Dossier approuv\u00e9. Client notifi\u00e9.', 'success'); loadAdminData(); }
                    else FedpawaUI.toast('Erreur lors de l\'approbation.', 'error');
                }));
                kycWrap.querySelectorAll('[data-kyc-reject]').forEach(btn => btn.addEventListener('click', async () => {
                    const id = btn.dataset.kycReject;
                    const motif = prompt('Motif du rejet :');
                    if (motif === null) return;
                    const res = await Api.post('/api/admin/kyc/reject', { id, motif });
                    if (res.ok) { FedpawaUI.toast('Dossier rejet\u00e9. Client notifi\u00e9.', 'success'); loadAdminData(); }
                    else FedpawaUI.toast('Erreur lors du rejet.', 'error');
                }));
            }
        }

        // ===== Nouveau courrier : clients r\u00e9els dans le select =====
        const selClient = document.querySelector('#tab-courriers select.form-control');
        if (selClient && (lists.clients || []).length) {
            selClient.innerHTML = '<option value="">S\u00e9lectionner un client...</option>' +
                lists.clients.map(c => `<option value="${c.id}">${esc(c.nom)}${c.entreprise ? ' (' + esc(c.entreprise) + ')' : ''} (CL-${String(c.id).padStart(3, '0')})</option>`).join('');
        }

        // ===== Onglet tickets (cr\u00e9\u00e9 dynamiquement si absent) =====
        ensureTabTickets(lists.tickets || []);
        // ===== Onglet messagerie interne =====
        ensureTabMessages(lists.messages || []);
    }

    // Onglets dynamiques tickets + messagerie (ajout\u00e9s \u00e0 la navigation s'ils n'existent pas)
    function ensureTabTickets(tickets) {
        let tab = document.getElementById('tab-tickets');
        if (!tab) {
            document.querySelector('.db-main').insertAdjacentHTML('beforeend', '<div class="db-tab-content" id="tab-tickets"></div>');
            tab = document.getElementById('tab-tickets');
            const nav = document.querySelector('.db-nav');
            if (nav && !nav.querySelector('[data-tab="tickets"]')) nav.insertAdjacentHTML('beforeend', '<div class="db-nav-item" data-tab="tickets"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Tickets Support</div>');
        }
        const rows = tickets.map(t => `<tr><td>#${t.id}</td><td>${esc(t.client_nom)}</td><td>${esc(t.sujet)}</td><td style="max-width:300px;">${esc(t.message)}</td><td>${fmtDate(t.created_at)}</td><td>${statutBadge(t.statut)}</td><td>${t.reponse ? '<span style="font-size:0.78rem;color:var(--color-text-muted);">Répondu</span>' : `<button class="btn btn-primary" style="padding:4px 10px;font-size:0.78rem;" onclick="adminTicketReply(${t.id})">Répondre</button>`}</td></tr>`);
        tab.innerHTML = '<div class="db-welcome"><div><h1>Tickets Support</h1><p>Demandes clients via l\'Espace Client.</p></div></div><div class="db-section"><div class="db-table-wrap"><table class="db-table"><thead><tr><th>ID</th><th>Client</th><th>Sujet</th><th>Message</th><th>Date</th><th>Statut</th><th>Action</th></tr></thead><tbody>' +
            (rows.length ? rows.join('') : emptyRow(7, 'Aucun ticket')) + '</tbody></table></div></div>';
    }

    // W-13: réponse admin à un ticket — visible côté client
    window.adminTicketReply = async function (ticketId) {
        const rep = window.prompt('Votre réponse au ticket #' + ticketId + ' :');
        if (!rep || !rep.trim()) return;
        try {
            const res = await Api.post('/api/admin/ticket/reply', { ticket_id: ticketId, reponse: rep.trim() });
            const data = await res.json().catch(() => ({}));
            if (res.ok && !data.error) {
                if (window.FedpawaUI) FedpawaUI.toast('Réponse envoyée. Le client la verra dans son espace.', 'success');
                typeof loadAdminData === 'function' && loadAdminData();
            } else {
                if (window.FedpawaUI) FedpawaUI.toast(data.error || 'Échec de l\'enregistrement.', 'error');
            }
        } catch (e) {
            if (window.FedpawaUI) FedpawaUI.toast('Erreur réseau.', 'error');
        }
    };

    function ensureTabMessages(messages) {
        let tab = document.getElementById('tab-messages');
        if (!tab) {
            document.querySelector('.db-main').insertAdjacentHTML('beforeend', '<div class="db-tab-content" id="tab-messages"></div>');
            tab = document.getElementById('tab-messages');
            const nav = +document.querySelector('.db-nav');
            const navEl = document.querySelector('.db-nav');
            if (navEl && !navEl.querySelector('[data-tab="messages"]')) navEl.insertAdjacentHTML('beforeend', '<div class="db-nav-item" data-tab="messages"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Messagerie</div>');
        }
        const rows = messages.map(m => `<tr><td>${esc(m.client_nom) || 'Admin'}</td><td>${esc(m.sender_type)}</td><td style="max-width:400px;">${esc(m.content)}</td><td>${fmtDate(m.created_at)}</td><td>${m.sender_type === 'client' ? `<button class="btn btn-outline" style="padding:4px 12px;font-size:0.75rem;" data-reply-client="${m.sender_id}">R\u00e9pondre</button>` : '\u2014'}</td></tr>`);
        tab.innerHTML = '<div class="db-welcome"><div><h1>Messagerie Interne</h1><p>\u00c9changes entre clients et administration.</p></div></div><div class="db-section"><div class="db-table-wrap"><table class="db-table"><thead><tr><th>Client</th><th>De</th><th>Message</th><th>Date</th><th>Action</th></tr></thead><tbody>' +
            (rows.length ? rows.join('') : emptyRow(5, 'Aucun message')) + '</tbody></table></div></div>';
        tab.querySelectorAll('[data-reply-client]').forEach(btn => btn.addEventListener('click', async () => {
            const content = prompt('R\u00e9ponse \u00e0 ce client :');
            if (!content) return;
            const res = await Api.post('/api/mail/reply', { client_id: Number(btn.dataset.replyClient), content });
            const data = await res.json().catch(() => ({}));
            if (res.ok && !data.error) { FedpawaUI.toast('R\u00e9ponse envoy\u00e9e.', 'success'); loadAdminData(); }
            else FedpawaUI.toast((data && data.error) || '\u00c9chec de l\'envoi.', 'error');
        }));
    }

    // =========================================================
    // L012 — Éditeur du modèle de contrat : flux OTP admin + TinyMCE
    // =========================================================
    // Le bouton « Modifier le contrat » (tab-contrats) déclenche :
    // 1. POST /api/admin/template/otp-request  -> code 6 chiffres envoyé à
    //    l'email admin (jamais exposé dans la réponse) + modal OTP.
    // 2. POST /api/admin/template/otp-verify   -> si OK, session déverrouillée
    //    10 min côté serveur, puis GET /api/admin/template + éditeur TinyMCE.
    // 3. POST /api/admin/template/update       -> refusé 403 sans déverrouillage.
    const TEMPLATE_UNLOCK_TTL = 10 * 60 * 1000; // miroir du serveur (600 s)
    let templateUnlockTimer = null;

    function initTemplateEditorFlow() {
        const btn = document.getElementById('btn-edit-template');
        if (!btn || btn.dataset.l012Bound) return; // délégation sûre même après re-render
        btn.dataset.l012Bound = '1';
        btn.addEventListener('click', requestTemplateOtp);
    }

    async function requestTemplateOtp() {
        try {
            const res = await Api.post('/api/admin/template/otp-request', {});
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.sent) {
                showTemplateOtpModal(data.email || '');
            } else {
                FedpawaUI.toast(data.error || 'Impossible d\u2019envoyer le code de v\u00e9rification.', 'error');
            }
        } catch (e) {
            FedpawaUI.toast('Erreur r\u00e9seau lors de l\u2019envoi du code.', 'error');
        }
    }

    function showTemplateOtpModal(maskedEmail) {
        FedpawaUI.modal({
            id: 'fp-otp-modal',
            title: 'V\u00e9rification de s\u00e9curit\u00e9',
            message: 'Un code de v\u00e9rification a \u00e9t\u00e9 envoy\u00e9 \u00e0 <strong>' + esc(maskedEmail) + '</strong>. Saisissez-le pour d\u00e9verrouiller l\u2019\u00e9diteur.',
            className: 'fp-otp-modal',
            buttons: [],
            disableOverlayClose: true,
            hideClose: false
        });
        // Le message de FedpawaUI.modal ne permet pas d'injecter un champ de
        // saisie proprement : on greffe le formulaire dans la modal ouverte.
        const box = document.querySelector('#fp-otp-modal .fp-modal');
        if (!box) return;
        const wrap = document.createElement('div');
        wrap.className = 'l012-otp-form';
        wrap.innerHTML =
            '<input id="l012-otp-input" class="l012-otp-input" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" aria-label="Code de v\u00e9rification \u00e0 6 chiffres">' +
            '<p class="l012-otp-error" id="l012-otp-error" role="alert"></p>' +
            '<div class="l012-otp-actions">' +
            '<button type="button" class="btn btn-outline" id="l012-otp-cancel">Annuler</button>' +
            '<button type="button" class="btn btn-primary" id="l012-otp-submit">Valider</button>' +
            '</div>';
        const actions = box.querySelector('.fp-modal-actions');
        if (actions) actions.remove();
        box.appendChild(wrap);
        document.getElementById('l012-otp-input').focus();
        document.getElementById('l012-otp-cancel').addEventListener('click', () => {
            document.getElementById('fp-otp-modal')?.remove();
            document.body.style.overflow = '';
        });
        document.getElementById('l012-otp-submit').addEventListener('click', submitTemplateOtp);
        document.getElementById('l012-otp-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); submitTemplateOtp(); }
        });
    }

    async function submitTemplateOtp() {
        const input = document.getElementById('l012-otp-input');
        const errEl = document.getElementById('l012-otp-error');
        const otp = (input ? input.value : '').replace(/\D/g, '');
        if (errEl) errEl.textContent = '';
        if (otp.length !== 6) {
            if (errEl) errEl.textContent = 'Saisissez les 6 chiffres du code re\u00e7u.';
            return;
        }
        try {
            const res = await Api.post('/api/admin/template/otp-verify', { otp });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.unlocked) {
                templateUnlockTimer = Date.now() + TEMPLATE_UNLOCK_TTL;
                openTemplateEditor();
            } else {
                if (errEl) errEl.textContent = data.error || 'Code invalide.';
            }
        } catch (e) {
            if (errEl) errEl.textContent = 'Erreur r\u00e9seau. R\u00e9essayez.';
        }
    }

    async function openTemplateEditor() {
        // Fermer la modal OTP
        document.getElementById('fp-otp-modal')?.remove();
        document.body.style.overflow = '';
        let data;
        try {
            const res = await fetch(apiUrl('/api/admin/template'), { credentials: 'include' });
            data = await res.json().catch(() => ({}));
            if (!res.ok || typeof data.content !== 'string') {
                FedpawaUI.toast(data.error || 'Impossible de charger le mod\u00e8le de contrat.', 'error');
                return;
            }
        } catch (e) {
            FedpawaUI.toast('Erreur r\u00e9seau lors du chargement du mod\u00e8le.', 'error');
            return;
        }

        FedpawaUI.modal({
            id: 'fp-template-modal',
            title: '\u00c9diteur du mod\u00e8le de contrat',
            className: 'fp-template-modal',
            buttons: [],
            disableOverlayClose: true
        });
        const box = document.querySelector('#fp-template-modal .fp-modal');
        if (!box) return;
        const editorWrap = document.createElement('div');
        editorWrap.className = 'l012-editor-wrap';
        editorWrap.innerHTML =
            '<textarea id="l012-template-content" aria-label="Contenu du mod\u00e8le de contrat"></textarea>' +
            '<p class="l012-editor-note">D\u00e9verrouillage valide 10 minutes. Enregistrez avant expiration.</p>' +
            '<div class="l012-editor-actions">' +
            '<button type="button" class="btn btn-outline" id="l012-editor-cancel">Annuler</button>' +
            '<button type="button" class="btn btn-primary" id="l012-editor-save">Enregistrer</button>' +
            '</div>';
        const actions = box.querySelector('.fp-modal-actions');
        if (actions) actions.remove();
        box.appendChild(editorWrap);

        document.getElementById('l012-editor-cancel').addEventListener('click', () => {
            document.getElementById('fp-template-modal')?.remove();
            document.body.style.overflow = '';
            if (window.tinymce && tinymce.get('l012-template-content')) tinymce.get('l012-template-content').destroy();
        });
        document.getElementById('l012-editor-save').addEventListener('click', saveTemplate);

        const ta = document.getElementById('l012-template-content');
        ta.value = data.content;
        if (window.tinymce) {
            tinymce.init({
                target: ta,
                skin: 'oxide-dark',           // coh\u00e9rent avec le th\u00e8me navy
                content_css: 'dark',
                height: 450,
                menubar: false,
                branding: false,
                plugins: 'table lists link',
                toolbar: 'undo redo | bold italic underline | bullist numlist | table link | removeformat',
                license_key: 'gpl',
                init_instance_callback: (ed) => ed.setContent(data.content || '')
            });
        } else {
            // fallback : édition HTML brute si TinyMCE n'a pas chargé
            ta.style.display = 'block';
            ta.style.width = '100%';
            ta.style.height = '450px';
        }
    }

    async function saveTemplate() {
        const btn = document.getElementById('l012-editor-save');
        const getContent = () => {
            if (window.tinymce && tinymce.get('l012-template-content')) return tinymce.get('l012-template-content').getContent();
            const ta = document.getElementById('l012-template-content');
            return ta ? ta.value : '';
        };
        const content = getContent();
        if (!content || content.trim().length < 50) {
            FedpawaUI.toast('Le contenu du mod\u00e8le est trop court.', 'error');
            return;
        }
        if (btn) btn.disabled = true;
        try {
            const res = await Api.post('/api/admin/template/update', { content });
            const data = await res.json().catch(() => ({}));
            if (res.ok && !data.error) {
                FedpawaUI.toast('Mod\u00e8le de contrat enregistr\u00e9.', 'success');
                document.getElementById('fp-template-modal')?.remove();
                document.body.style.overflow = '';
                if (window.tinymce && tinymce.get('l012-template-content')) tinymce.get('l012-template-content').destroy();
                templateUnlockTimer = null; // unlock consommé côté serveur
            } else if (res.status === 403) {
                FedpawaUI.toast('D\u00e9verrouillage expir\u00e9 : v\u00e9rification OTP requise.', 'error');
            } else {
                FedpawaUI.toast(data.error || '\u00c9chec de l\u2019enregistrement.', 'error');
            }
        } catch (e) {
            FedpawaUI.toast('Erreur r\u00e9seau lors de l\u2019enregistrement.', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // =========================================================
    // L011 — Visionneuse de documents : « Consulter/Voir » ouvre la
    // page admin_document.html (nouvel onglet) APRÈS re-vérification
    // via /api/admin/document-info (race-proof) ; si le fichier est
    // absent -> modal FedpawaUI « document non disponible ». Un lien
    // n'est rendu que si doc_exists (liste enrichie côté serveur).
    // =========================================================
    function openAdminDocumentViewer(link) {
        const type = link.dataset.docType;
        const id = link.dataset.docId;
        const file = link.dataset.docFile || '';
        const qs = 'type=' + encodeURIComponent(type) + '&id=' + encodeURIComponent(id) + (file ? '&file=' + encodeURIComponent(file) : '');
        fetch(apiUrl('/api/admin/document-info?' + qs), { credentials: 'include' })
            .then(r => {
                if (r.status === 403) { window.location.href = 'authentification.html'; return null; }
                return r.ok ? r.json() : { exists: false };
            })
            .then(info => {
                if (info && info.exists) {
                    window.open('/admin_document.html?' + qs, '_blank', 'noopener');
                } else {
                    FedpawaUI.modal({
                        iconType: 'error',
                        title: 'Document non disponible',
                        message: 'Ce document n\u2019est pas disponible : le fichier associ\u00e9 \u00e0 cette ligne est absent du stockage. Contactez l\u2019administrateur syst\u00e8me si cette situation vous semble anormale.',
                        buttons: [{ label: 'Fermer', className: 'fp-modal-btn-primary' }]
                    });
                }
            })
            .catch(() => {
                FedpawaUI.modal({
                    iconType: 'error',
                    title: 'Document non disponible',
                    message: 'Impossible de v\u00e9rifier la disponibilit\u00e9 de ce document (erreur r\u00e9seau). R\u00e9essayez.',
                    buttons: [{ label: 'Fermer', className: 'fp-modal-btn-primary' }]
                });
            });
    }

    // Délégation d'événements : les tableaux sont ré-rendus après chaque action
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.fp-doc-link');
        if (!link) return;
        e.preventDefault();
        openAdminDocumentViewer(link);
    });

    loadAdminData();
    initTemplateEditorFlow();
});
