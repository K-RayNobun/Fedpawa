document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Gestion des états (écrans)
    const states = document.querySelectorAll('.reset-state');
    
    window.showState = function(stateId) {
        states.forEach(s => s.classList.remove('active'));
        document.getElementById(stateId).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. Onglets Email / WhatsApp
    const tabs = document.querySelectorAll('.channel-tab');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    let currentEmail = '';
    
    window.switchChannel = function(channel) {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-channel="${channel}"]`).classList.add('active');
        
        if (channel === 'email') {
            emailInput.style.display = 'block';
            phoneInput.style.display = 'none';
        } else {
            emailInput.style.display = 'none';
            phoneInput.style.display = 'block';
        }
    }

    // 3. Demande d'envoi du code (État 1 -> État 2)
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailField = emailInput.querySelector('input');
            currentEmail = emailField ? emailField.value : '';

            try {
                const res = await fetch('/api/password/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Code de réinitialisation envoyé ! (Pour test, utilisez le code : 123456)');
                    showState('state-otp');
                    startOtpTimer();
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible d\'envoyer le code'));
                }
            } catch (err) {
                console.error(err);
                alert('Erreur réseau.');
            }
        });
    }

    // 4. Compte à rebours OTP
    let otpTimerInterval;
    function startOtpTimer() {
        let timeLeft = 299; // 5 minutes
        const timerEl = document.getElementById('otpTimer');
        const resendLink = document.getElementById('resendLink');
        resendLink.style.display = 'none';

        otpTimerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            if (timerEl) timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(otpTimerInterval);
                if (timerEl) timerEl.innerText = "Expiré";
                if (resendLink) resendLink.style.display = 'inline-block';
            }
        }, 1000);
    }

    // 5. Auto-saut OTP inputs
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
    });

    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let otpCode = '';
            otpInputs.forEach(inp => otpCode += inp.value);

            try {
                const res = await fetch('/api/password/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ otp: otpCode })
                });
                const data = await res.json();
                if (res.ok) {
                    clearInterval(otpTimerInterval);
                    showState('state-new-pwd');
                } else {
                    alert('Erreur: ' + (data.error || 'Code OTP invalide'));
                }
            } catch (err) {
                console.error(err);
                alert('Erreur réseau.');
            }
        });
    }

    // 6. Force du mot de passe & Checklist
    const newPwdInput = document.getElementById('newPwd');
    const confirmPwdInput = document.getElementById('confirmPwd');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const checklistItems = document.querySelectorAll('.pwd-checklist li');

    if (newPwdInput) {
        newPwdInput.addEventListener('input', (e) => {
            const val = e.target.value;
            let strength = 0;
            
            const hasLength = val.length >= 8;
            const hasUpperLower = /[A-Z]/.test(val) && /[a-z]/.test(val);
            const hasNumber = /[0-9]/.test(val);
            const hasSpecial = /[@#$%^&*!]/.test(val);

            if (checklistItems.length >= 4) {
                checklistItems[0].classList.toggle('valid', hasLength);
                checklistItems[1].classList.toggle('valid', hasUpperLower);
                checklistItems[2].classList.toggle('valid', hasNumber);
                checklistItems[3].classList.toggle('valid', hasSpecial);
            }

            if (hasLength) strength++;
            if (hasUpperLower) strength++;
            if (hasNumber) strength++;
            if (hasSpecial) strength++;

            const colors = ['#dc3545', '#ffc107', '#17a2b8', '#28a745'];
            const labels = ['Faible', 'Moyen', 'Fort', 'Très Fort'];
            const widths = ['25%', '50%', '75%', '100%'];

            if (val.length === 0) {
                strengthFill.style.width = '0%';
                strengthText.innerText = '';
            } else {
                strengthFill.style.width = widths[strength - 1] || '100%';
                strengthFill.style.backgroundColor = colors[strength - 1] || '#28a745';
                strengthText.innerText = labels[strength - 1] || 'Très Fort';
                strengthText.style.color = colors[strength - 1] || '#28a745';
            }
        });
    }

    // 7. Soumission du nouveau mot de passe
    const newPwdForm = document.getElementById('newPwdForm');
    if (newPwdForm) {
        newPwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (newPwdInput.value !== confirmPwdInput.value) {
                alert('Les mots de passe ne correspondent pas.');
                return;
            }

            try {
                const res = await fetch('/api/password/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mot_de_passe: newPwdInput.value })
                });
                const data = await res.json();
                if (res.ok) {
                    showState('state-success');
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible de réinitialiser le mot de passe'));
                }
            } catch (err) {
                console.error(err);
                alert('Erreur réseau.');
            }
        });
    }

    // 8. Toggle affichage mot de passe
    window.togglePwd = function(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.nextElementSibling.querySelector('svg');
        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
            input.type = 'password';
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
    }
});
