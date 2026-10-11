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

});