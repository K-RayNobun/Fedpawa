document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.form-wrapper');
    const switchLinks = document.querySelectorAll('.switch-link');
    const globalLoader = document.getElementById('globalLoader');

    function showLoader() {
        if (globalLoader) globalLoader.classList.add('active');
    }

    function hideLoader() {
        if (globalLoader) globalLoader.classList.remove('active');
    }

    function switchForm(target) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        forms.forEach(f => f.classList.toggle('active', f.id === `${target}Form`));
    }

    tabs.forEach(tab => tab.addEventListener('click', () => switchForm(tab.dataset.tab)));
    
    switchLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchForm(link.dataset.target);
        });
    });

    // Toast Notification Component
    function showToast(message, type = 'success') {
        let existingToast = document.querySelector('.auth-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `auth-toast auth-toast-${type}`;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 99999;
            padding: 14px 20px; border-radius: 8px; color: #fff;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 0.9rem;
            transition: opacity 0.3s ease;
        `;
        toast.innerText = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Password Visibility Toggle
    window.togglePwd = function(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const btn = input.nextElementSibling;
        const icon = btn ? btn.querySelector('svg') : null;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
            input.type = 'password';
            if (icon) icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
    }

    // Login Form Submission
    const loginForm = document.querySelector('#loginForm form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login_email').value.trim();
            const mot_de_passe = document.getElementById('login_password').value;

            if (!email || !mot_de_passe) {
                showToast('Veuillez remplir tous les champs.', 'error');
                return;
            }

            try {
                showLoader();
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, mot_de_passe })
                });
                const data = await res.json();
                hideLoader();

                if (res.ok) {
                    showToast('Connexion réussie ! Redirection...', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect || 'espace_client.html';
                    }, 800);
                } else {
                    showToast(data.error || 'Identifiants invalides.', 'error');
                }
            } catch (err) {
                hideLoader();
                console.error(err);
                showToast('Erreur de connexion au serveur.', 'error');
            }
        });
    }

    // Signup Form Submission with Robust Regex Validation
    const signupForm = document.querySelector('#signupForm form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nom = document.getElementById('fullname').value.trim();
            const entreprise = document.getElementById('company').value.trim();
            const email = document.getElementById('signup_email').value.trim();
            const telephone = document.getElementById('phone').value.trim();
            const mot_de_passe = document.getElementById('signup_password').value;
            const confirm = document.getElementById('confirm_password').value;
            const cgu = document.getElementById('cgu').checked;

            if (!cgu) {
                showToast('Vous devez accepter les CGU.', 'error');
                return;
            }

            if (mot_de_passe !== confirm) {
                showToast('Les mots de passe ne correspondent pas.', 'error');
                return;
            }

            // Robust Password Regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(mot_de_passe)) {
                showToast('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.', 'error');
                return;
            }

            try {
                showLoader();
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nom, entreprise, email, telephone, mot_de_passe })
                });
                const data = await res.json();
                hideLoader();

                if (res.ok) {
                    showToast('Compte créé avec succès ! Connectez-vous.', 'success');
                    signupForm.reset();
                    switchForm('login');
                } else {
                    showToast(data.error || 'Impossible de créer le compte.', 'error');
                }
            } catch (err) {
                hideLoader();
                console.error(err);
                showToast('Erreur de connexion au serveur.', 'error');
            }
        });
    }

    // Language Switcher (FR / EN)
    const translations = {
        fr: {
            hero_title: 'Gérez votre entreprise en <span>toute sérénité</span>.',
            hero_desc: 'Accédez à votre tableau de bord pour suivre vos abonnements, téléverser vos documents KYC, consulter vos courriers scannés et gérer votre fiscalité.',
            feat_1: 'Suivi des démarches en temps réel',
            feat_2: 'Archivage cloud sécurisé (Contrats & Courriers)',
            feat_3: 'Factures et attestations fiscales à portée de clic',
            auth_header: 'Espace Client',
            auth_subheader: 'Connectez-vous ou créez un compte pour continuer.',
            tab_login: 'Connexion',
            tab_signup: 'Inscription',
            lbl_email: 'Adresse e-mail',
            lbl_password: 'Mot de passe',
            remember: 'Se souvenir de moi',
            forgot: 'Mot de passe oublié ?',
            btn_login: 'Se connecter',
            no_account: 'Pas encore de compte ?',
            goto_signup: 'Créer un compte',
            lbl_civility: 'Civilité',
            sel_select: 'Sélectionner',
            sel_mr: 'Monsieur',
            sel_mme: 'Madame',
            lbl_fullname: 'Nom complet',
            lbl_company: "Nom de l'entreprise",
            lbl_legal: 'Forme juridique',
            lbl_phone: 'Téléphone',
            lbl_confirm: 'Confirmer',
            pwd_hint: 'Min. 8 caractères, 1 majuscule, 1 chiffre.',
            cgu_label: "J'accepte les Conditions Générales d'Utilisation (CGU) et la politique de confidentialité de FEDPAWA.",
            btn_signup: 'Créer mon compte',
            has_account: 'Déjà un compte ?',
            goto_login: 'Se connecter'
        },
        en: {
            hero_title: 'Manage your business with <span>complete peace of mind</span>.',
            hero_desc: 'Access your dashboard to track subscriptions, upload KYC documents, view scanned mail, and manage taxes.',
            feat_1: 'Real-time procedure tracking',
            feat_2: 'Secure cloud archiving (Contracts & Mail)',
            feat_3: 'Invoices and tax certificates at your fingertips',
            auth_header: 'Client Portal',
            auth_subheader: 'Log in or create an account to continue.',
            tab_login: 'Login',
            tab_signup: 'Sign Up',
            lbl_email: 'Email address',
            lbl_password: 'Password',
            remember: 'Remember me',
            forgot: 'Forgot password?',
            btn_login: 'Log In',
            no_account: "Don't have an account?",
            goto_signup: 'Create an account',
            lbl_civility: 'Civility',
            sel_select: 'Select',
            sel_mr: 'Mr.',
            sel_mme: 'Mrs.',
            lbl_fullname: 'Full Name',
            lbl_company: 'Company Name',
            lbl_legal: 'Legal Form',
            lbl_phone: 'Phone',
            lbl_confirm: 'Confirm Password',
            pwd_hint: 'Min. 8 chars, 1 uppercase, 1 number.',
            cgu_label: 'I accept the Terms of Service and Privacy Policy of FEDPAWA.',
            btn_signup: 'Create Account',
            has_account: 'Already have an account?',
            goto_login: 'Log In'
        }
    };

    window.setLanguage = function(lang) {
        localStorage.setItem('fedpawa_lang', lang);
        document.getElementById('langFrBtn').classList.toggle('active', lang === 'fr');
        document.getElementById('langEnBtn').classList.toggle('active', lang === 'en');

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });
    }

    const savedLang = localStorage.getItem('fedpawa_lang') || 'fr';
    setLanguage(savedLang);
});
