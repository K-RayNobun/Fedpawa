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

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            const open = mobileNav.classList.toggle('open');
            menuToggle.classList.toggle('open', open);
            body.classList.toggle('nav-open', open);
            menuToggle.setAttribute('aria-expanded', open);
        });

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

    const savedTheme = localStorage.getItem('fedpawa-theme') || 'bordeaux';
    const savedMode = localStorage.getItem('fedpawa-mode') || 'light';
    
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

});