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
            const rows = (lists.courriers || []).map(co => `<tr><td>${fmtDate(co.date_reception)}</td><td>${esc(co.client_nom) || '\u2014'}</td><td>Courrier re\u00e7u</td><td>${statutBadge(co.statut)}</td><td>${co.scan ? `<a href="/api/document?type=courrier&id=${co.id}" target="_blank" class="action-link">Consulter</a>` : '\u2014'}</td></tr>`);
            tCour2.innerHTML = rows.length ? rows.join('') : emptyRow(5, 'Aucun courrier');
        }

        // ===== Contrats =====
        const tCt = document.querySelector('#tab-contrats tbody');
        if (tCt) {
            const rows = (lists.contrats || []).map(ct => `<tr><td>CT-${String(ct.id).padStart(3, '0')}</td><td>${esc(ct.client_nom) || '\u2014'}</td><td>${esc(ct.type)}</td><td>${statutBadge('actif')}</td><td><a href="/api/document?type=contrat&id=${ct.id}" target="_blank" class="action-link">Consulter PDF</a></td></tr>`);
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
                            <div class="kyc-doc"><a href="/api/document?type=kyc&id=${k.id}&file=piece_identite" target="_blank"><img src="/api/document?type=kyc&id=${k.id}&file=piece_identite" alt="CNI Recto" onerror="this.outerHTML='<p style=\\"padding:20px;color:var(--color-text-muted)\\">Pi\u00e8ce d\'identit\u00e9 (PDF)</p>'"></a><p>Pi\u00e8ce d'identit\u00e9</p></div>
                            <div class="kyc-doc"><a href="/api/document?type=kyc&id=${k.id}&file=justificatif_domicile" target="_blank"><img src="/api/document?type=kyc&id=${k.id}&file=justificatif_domicile" alt="Justificatif" onerror="this.outerHTML='<p style=\\"padding:20px;color:var(--color-text-muted)\\">Justificatif de domicile</p>'"></a><p>Justificatif de domicile</p></div>
                        </div>
                        <div class="kyc-actions">
                            <button class="btn btn-outline" style="border-color: var(--color-danger); color: var(--color-danger);" data-kyc-reject="${k.id}">Rejeter (avec motif)</button>
                            <button class="btn btn-primary" style="background-color: var(--color-success); border-color: var(--color-success);" data-kyc-approve="${k.id}">Approuver le dossier</button>
                        </div>
                    </div>`;
                }
                if (done.length) {
                    html += '<div class="db-section"><div class="db-section-header"><h2>Dossiers trait\u00e9s</h2></div><div class="db-table-wrap"><table class="db-table"><thead><tr><th>Client</th><th>Statut</th><th>Date</th><th>Pi\u00e8ces</th></tr></thead><tbody>' +
                        done.map(k => `<tr><td>${esc(k.client_nom)}</td><td>${statutBadge(k.statuts)}</td><td>${fmtDate(k.date_soumission)}</td><td><a href="/api/document?type=kyc&id=${k.id}&file=piece_identite" target="_blank" class="action-link">Voir</a></td></tr>`).join('') +
                        '</tbody></table></div></div>';
                }
                kycWrap.innerHTML = html;
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

    loadAdminData();
});
