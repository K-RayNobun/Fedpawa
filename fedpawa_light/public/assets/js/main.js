// ==========================================================
// FEDPAWA - GLOBAL SCRIPTS
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Dynamic Year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

    // 2. Header Scroll Effect
    const header = document.getElementById('siteHeader');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 30);
        });
    }

    // 3. Mobile Navigation Toggle
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const body = document.body;
    const mobileCloseBtn = document.querySelector('.mobile-close-btn');

    // L013: CTA mobile « Se Déconnecter » → détruit la session puis redirige vers l'auth
    const mobileLogoutCta = mobileNav ? mobileNav.querySelector('[data-logout]') : null;
    if (mobileLogoutCta) {
        mobileLogoutCta.addEventListener('click', async (e) => {
            e.preventDefault();
            try { await fetch(window.apiUrl('/api/logout'), { method: 'POST', credentials: 'include' }); } catch (err) {}
            window.location.href = mobileLogoutCta.getAttribute('href') || 'authentification.html';
        });
    }

    if (menuToggle && mobileNav) {
        // Toggle menu open/close
        menuToggle.addEventListener('click', () => {
            const open = mobileNav.classList.toggle('open');
            menuToggle.classList.toggle('open', open);
            body.classList.toggle('nav-open', open);
            menuToggle.setAttribute('aria-expanded', open);
        });

        // Close menu when clicking the ✕ button
        if (mobileCloseBtn) {
            mobileCloseBtn.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                menuToggle.classList.remove('open');
                body.classList.remove('nav-open');
                menuToggle.setAttribute('aria-expanded', false);
            });
        }

        // Close menu when clicking outside the mobile nav content
        // (le burger est hors du nav : exclure menuToggle de la fermeture, sinon le clic d'ouverture referme immédiatement)
        document.addEventListener('click', (e) => {
            const isClickInside = mobileNav.contains(e.target) || menuToggle.contains(e.target);
            if (!isClickInside && mobileNav.classList.contains('open')) {
                mobileNav.classList.remove('open');
                menuToggle.classList.remove('open');
                body.classList.remove('nav-open');
                menuToggle.setAttribute('aria-expanded', false);
            }
        });

        // Close menu when clicking a nav link
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                menuToggle.classList.remove('open');
                body.classList.remove('nav-open');
            });
        });
    }

    // 4. Reveal on Scroll (Intersection Observer)
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        reveals.forEach(el => observer.observe(el));
    }

    // 5. Expertise Tabs (Home & Services Pages)
    const navItems = document.querySelectorAll('.expertise-nav-item');
    const contents = document.querySelectorAll('.expertise-content');
    const medias = document.querySelectorAll('.expertise-media');

    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.target;
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                let mediaIndex = 0;
                contents.forEach((c, i) => {
                    const active = c.dataset.service === target;
                    c.style.display = active ? 'flex' : 'none';
                    if (active) mediaIndex = i;
                });
                medias.forEach((m, i) => m.style.display = (i === mediaIndex) ? 'block' : 'none');
            });
        });
    }

    // 6. Theme & Mode Switcher
    const htmlEl = document.documentElement;
    const themeButtons = document.querySelectorAll('.theme-btn');
    const modeToggle = document.getElementById('modeToggle');

    const savedTheme = localStorage.getItem('fedpawa-theme') || 'navy';
    const savedMode = localStorage.getItem('fedpawa-mode') || 'dark';

    setTheme(savedTheme);
    setMode(savedMode);

    function setTheme(theme) {
        htmlEl.setAttribute('data-theme', theme);
        themeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
        localStorage.setItem('fedpawa-theme', theme);
    }

    function setMode(mode) {
        htmlEl.setAttribute('data-mode', mode);
        localStorage.setItem('fedpawa-mode', mode);
    }
    themeButtons.forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
    if (modeToggle) modeToggle.addEventListener('click', () => setMode(htmlEl.getAttribute('data-mode') === 'light' ? 'dark' : 'light'));

    // 7. Language switcher (FR/EN) — navigation vers la page jumelle
    // FR: /page.php  <->  EN: /en/page.php (pages dédiées par langue)
    const langToggle = document.getElementById('langToggle');
    if (langToggle) langToggle.addEventListener('click', switchLanguage);

    // Language switcher MOBILE (dans le menu déroulant) — même logique
    const mobileLangToggle = document.getElementById('mobileLangToggle');
    if (mobileLangToggle) mobileLangToggle.addEventListener('click', switchLanguage);

    function switchLanguage() {
        const path = window.location.pathname;
        const file = path.split('/').pop() || 'index.php';
        const isEn = path.includes('/en/');
        const target = isEn ? '../' + file : 'en/' + file;
        window.location.href = target;
    }

    // Mode toggle MOBILE (dans le menu déroulant) — même logique que le header
    const mobileModeToggle = document.getElementById('mobileModeToggle');
    if (mobileModeToggle) mobileModeToggle.addEventListener('click', () => setMode(htmlEl.getAttribute('data-mode') === 'light' ? 'dark' : 'light'));

    // 8. État de connexion + boutons paramètres (non-connecté) / profil (connecté)
    //    Site statique : la session vit sur l'API (config.js fournit window.apiUrl()).
    async function checkConnectionStatus() {
        // Retourne false si non connecté, sinon { authenticated, role, name, email }
        try {
            if (typeof window.apiUrl !== 'function') return false;
            const response = await fetch(window.apiUrl('/api/me'), {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) return false;
            const data = await response.json();
            if (data.authenticated !== true) return false;
            return data;
        } catch (error) {
            // Dégradation gracieuse : API injoignable -> non-connecté, jamais de blocage
            return false;
        }
    }

    function langPrefixFor(file) {
        const path = window.location.pathname;
        const isEn = path.includes('/en/');
        return isEn ? '../' + file : file;
    }

    function buildSubmenu(container, withAccount) {
        // ---- Accordéon Thème : clic -> déplie Jour/Nuit ----
        const themeSec = document.createElement('div');
        themeSec.className = 'settings-section';
        const themeTrigger = document.createElement('button');
        themeTrigger.className = 'settings-accordion-trigger';
        themeTrigger.setAttribute('aria-expanded', 'false');
        themeTrigger.innerHTML = '<span>🎨 Thème / Theme</span><span class="chev">▾</span>';
        const themeOpts = document.createElement('div');
        themeOpts.className = 'settings-accordion-body';
        themeOpts.style.display = 'none';
        const btnJour = document.createElement('button');
        btnJour.className = 'settings-submenu-btn';
        btnJour.dataset.mode = 'light';
        btnJour.textContent = '☀️ Jour / Day';
        const btnNuit = document.createElement('button');
        btnNuit.className = 'settings-submenu-btn';
        btnNuit.dataset.mode = 'dark';
        btnNuit.textContent = '🌙 Nuit / Night';
        themeOpts.append(btnJour, btnNuit);
        themeTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = themeOpts.style.display === 'none';
            themeOpts.style.display = open ? 'block' : 'none';
            themeTrigger.setAttribute('aria-expanded', open);
        });
        [btnJour, btnNuit].forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation();
            setMode(b.dataset.mode);
            container.classList.remove('open');
        }));
        themeSec.append(themeTrigger, themeOpts);
        container.appendChild(themeSec);

        // ---- Accordéon Langue : clic -> déplie Français/English ----
        const langSec = document.createElement('div');
        langSec.className = 'settings-section';
        const langTrigger = document.createElement('button');
        langTrigger.className = 'settings-accordion-trigger';
        langTrigger.setAttribute('aria-expanded', 'false');
        langTrigger.innerHTML = '<span>🌐 Langue / Language</span><span class="chev">▾</span>';
        const langOpts = document.createElement('div');
        langOpts.className = 'settings-accordion-body';
        langOpts.style.display = 'none';
        const btnFr = document.createElement('button');
        btnFr.className = 'settings-submenu-btn';
        btnFr.dataset.lang = 'fr';
        btnFr.textContent = '🇫🇷 Français';
        const btnEn = document.createElement('button');
        btnEn.className = 'settings-submenu-btn';
        btnEn.dataset.lang = 'en';
        btnEn.textContent = '🇬🇧 English';
        langOpts.append(btnFr, btnEn);
        langTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = langOpts.style.display === 'none';
            langOpts.style.display = open ? 'block' : 'none';
            langTrigger.setAttribute('aria-expanded', open);
        });
        [btnFr, btnEn].forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.remove('open');
            const isEn = window.location.pathname.includes('/en/');
            const file = window.location.pathname.split('/').pop() || 'index.php';
            const target = (b.dataset.lang === 'en') ? (isEn ? null : 'en/' + file) : (isEn ? '../' + file : null);
            if (target) window.location.href = target;
        }));
        langSec.append(langTrigger, langOpts);
        container.appendChild(langSec);

        if (withAccount) {
            const accSec = document.createElement('div');
            accSec.className = 'settings-section';
            const monEspace = document.createElement('a');
            monEspace.href = langPrefixFor('espace_client.html');
            monEspace.textContent = '👤 Mon Espace / My Account';
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'profile-logout-btn';
            logoutBtn.textContent = '🚪 Se déconnecter / Log out';
            logoutBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    if (typeof window.apiUrl === 'function') {
                        await fetch(window.apiUrl('/api/logout'), { method: 'POST', credentials: 'include' });
                    }
                } catch (err) { /* dégradation gracieuse */ }
                // F1: après logout réel, les pages privées doivent renvoyer vers la connexion
                const here = window.location.pathname.split('/').pop() || 'index.php';
                if (/^(espace_client|admin_dashboard|mot_de_passe_oublie)\.html$/.test(here)) {
                    window.location.href = 'authentification.html';
                } else {
                    window.location.reload();
                }
            });
            accSec.append(monEspace, logoutBtn);
            container.appendChild(accSec);

            // F4: entrées compte dans le menu burger mobile (Espace + Déconnexion)
            const mobileNavEl = document.getElementById('mobileNav');
            if (mobileNavEl && !mobileNavEl.querySelector('.mobile-account-links')) {
                const mAcc = document.createElement('div');
                mAcc.className = 'mobile-account-links';
                mAcc.style.cssText = 'border-top: 1px solid rgba(255,255,255,.15); margin-top: 14px; padding-top: 14px; display: grid; gap: 4px;';
                mAcc.innerHTML = '<a href="' + langPrefixFor('espace_client.html') + '" style="color:#fff; padding: 10px 14px;">👤 Mon Espace</a>' +
                                 '<button type="button" class="mobile-logout-btn" style="color:#ffd98a; background:none; border:none; text-align:left; padding: 10px 14px; font: inherit; cursor:pointer;">🚪 Se déconnecter</button>';
                const mLogout = mAcc.querySelector('.mobile-logout-btn');
                if (mLogout) mLogout.addEventListener('click', async () => {
                    try { await fetch(window.apiUrl('/api/logout'), { method: 'POST', credentials: 'include' }); } catch (err) {}
                    window.location.href = langPrefixFor('authentification.html');
                });
                mobileNavEl.appendChild(mAcc);
            }
        }
    }


    // Positionne un menu déroulant juste sous son bouton déclencheur (aligné à droite),
    // sans jamais chevaucher le header ni sortir de l'écran.
    function positionMenuUnder(menu, btn) {
        if (!menu || !btn) return;
        const r = btn.getBoundingClientRect();
        menu.style.visibility = 'hidden';
        menu.style.opacity = '0';
        menu.classList.add('open');
        const mw = menu.offsetWidth, mh = menu.offsetHeight;
        menu.classList.remove('open');
        menu.style.visibility = '';
        menu.style.opacity = '';
        const gap = 10;
        let top = r.bottom + window.scrollY + gap;
        let left = r.right + window.scrollX - mw;
        if (r.bottom + gap + mh > window.innerHeight) {
            top = Math.max(r.top + window.scrollY - mh - gap, window.scrollY + 8);
        }
        left = Math.max(8, Math.min(left, window.scrollX + window.innerWidth - mw - 8));
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        menu.style.right = 'auto';
    }

    function renderNavActions(me) {
        const isConnected = me && me.authenticated === true;
        const navActions = document.getElementById('navActions');
        if (!navActions) return;

        if (isConnected) {
            navActions.innerHTML = '<a class="nav-login nav-espace-client" href="' + langPrefixFor('espace_client.html') + '">Espace Client</a><button class="nav-profile-btn" id="navProfileBtn" aria-label="Menu profil / Profile menu" title="Profil" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></button>';
            const profileBtn = document.getElementById('navProfileBtn');
            const profileMenu = document.createElement('div');
            profileMenu.className = 'profile-menu settings-menu';
            // ---- Bloc identité : nom + email de l'utilisateur connecté ----
            const idSec = document.createElement('div');
            idSec.className = 'settings-section profile-identity';
            const nameEl = document.createElement('div');
            nameEl.className = 'profile-name';
            nameEl.textContent = (me && me.name) ? me.name : (document.documentElement.getAttribute('lang') === 'en' ? 'My account' : 'Mon compte');
            const emailEl = document.createElement('div');
            emailEl.className = 'profile-email';
            emailEl.textContent = (me && me.email) ? me.email : '';
            idSec.append(nameEl, emailEl);
            profileMenu.appendChild(idSec);
            buildSubmenu(profileMenu, true);
            document.body.appendChild(profileMenu);
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasOpen = profileMenu.classList.contains('open');
                if (!wasOpen) positionMenuUnder(profileMenu, profileBtn);
                profileMenu.classList.toggle('open', !wasOpen);
                profileBtn.setAttribute('aria-expanded', !wasOpen);
            });
            document.addEventListener('click', (e) => {
                if (!profileMenu.contains(e.target) && e.target !== profileBtn && !profileBtn.contains(e.target)) {
                    profileMenu.classList.remove('open');
                    profileBtn.setAttribute('aria-expanded', 'false');
                }
            });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { profileMenu.classList.remove('open'); profileBtn.setAttribute('aria-expanded', 'false'); } });
        } else {
            navActions.innerHTML = '<a class="nav-login" href="' + langPrefixFor('authentification.html') + '">' + (document.documentElement.getAttribute('lang') === 'en' ? 'Sign in' : 'Se connecter') + '</a><button class="nav-settings-btn" id="navSettingsBtn" aria-label="Paramètres / Settings" title="Paramètres" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>';
            const settingsBtn = document.getElementById('navSettingsBtn');
            const settingsMenu = document.createElement('div');
            settingsMenu.className = 'settings-menu';
            buildSubmenu(settingsMenu, false);
            document.body.appendChild(settingsMenu);
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasOpen = settingsMenu.classList.contains('open');
                if (!wasOpen) positionMenuUnder(settingsMenu, settingsBtn);
                settingsMenu.classList.toggle('open', !wasOpen);
                settingsBtn.setAttribute('aria-expanded', !wasOpen);
            });
            document.addEventListener('click', (e) => {
                if (!settingsMenu.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
                    settingsMenu.classList.remove('open');
                    settingsBtn.setAttribute('aria-expanded', 'false');
                }
            });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { settingsMenu.classList.remove('open'); settingsBtn.setAttribute('aria-expanded', 'false'); } });
        }
    }

    // On est DÉJÀ dans un bloc DOMContentLoaded : exécution directe
    checkConnectionStatus().then(renderNavActions);

});
