document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.progress-step');
    const contents = document.querySelectorAll('.tunnel-step-content');
    const progressFill = document.getElementById('progressFill');
    const summaryItems = document.getElementById('summaryItems');
    const summaryTotal = document.getElementById('summaryTotal');
    
    // État initial du panier
    let cart = {
        service: null,
        serviceName: null,
        price: 0,
        options: []
    };

    // 1. Routing via URL (Ex: ?service=creation)
    const params = new URLSearchParams(window.location.search);
    const urlService = params.get('service');
    if (urlService) {
        selectService(urlService, true);
    }

    // 2. Gestion des étapes
    window.goToStep = function(stepNumber) {
        steps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum < stepNumber) step.classList.add('completed');
            if (stepNum === stepNumber) step.classList.add('active');
        });

        const percentage = ((stepNumber - 1) / (steps.length - 1)) * 100;
        if (progressFill) progressFill.style.width = percentage + '%';

        contents.forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(`step-${stepNumber}`);
        if (activeContent) activeContent.classList.add('active');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateSummary();
    }

    // 3. Sélection de la prestation (Étape 1)
    window.selectService = function(serviceId, isInitial = false) {
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(c => c.classList.remove('selected'));
        
        const card = document.querySelector(`[data-service="${serviceId}"]`);
        if (card) {
            card.classList.add('selected');
            cart.service = serviceId;
            cart.serviceName = card.dataset.name;
            cart.price = parseInt(card.dataset.price);
            
            // Afficher le bon formulaire à l'étape 2
            document.querySelectorAll('.form-block').forEach(fb => fb.style.display = 'none');
            const formToShow = document.getElementById(`form-${serviceId}`);
            if (formToShow) formToShow.style.display = 'block';
            
            updateSummary();
            if (!isInitial) goToStep(2);
        }
    }

    // 4. Sélection des options (Étape 3)
    window.toggleOption = function(checkbox) {
        const card = checkbox.closest('.option-card');
        const price = parseInt(card.dataset.price);
        const name = card.dataset.name;
        
        if (checkbox.checked) {
            card.classList.add('selected');
            cart.options.push({ name, price });
        } else {
            card.classList.remove('selected');
            cart.options = cart.options.filter(opt => opt.name !== name);
        }
        updateSummary();
    }

    // 5. Gestion des modes de paiement
    window.togglePaymentMethod = function(method) {
        const momoBox = document.getElementById('pay-momo-box');
        const manualBox = document.getElementById('pay-manual-box');
        
        document.querySelectorAll('input[name="payment"]').forEach(inp => {
            const label = inp.closest('.selectable-card');
            if (label) label.classList.toggle('selected', inp.checked);
        });

        if (method === 'momo') {
            if (momoBox) momoBox.style.display = 'block';
            if (manualBox) manualBox.style.display = 'none';
        } else {
            if (momoBox) momoBox.style.display = 'none';
            if (manualBox) manualBox.style.display = 'block';
        }
    };

    // 6. Mise à jour du récapitulatif (Sidebar + 2% Frais de transfert)
    function updateSummary() {
        if (!summaryItems || !summaryTotal) return;
        summaryItems.innerHTML = '';
        let baseTotal = 0;

        if (cart.serviceName) {
            summaryItems.innerHTML += `<div class="summary-item"><span>${cart.serviceName}</span><span>${cart.price.toLocaleString()} FCFA</span></div>`;
            baseTotal += cart.price;
        } else {
            summaryItems.innerHTML = `<div class="summary-item muted">Aucune prestation sélectionnée</div>`;
        }

        cart.options.forEach(opt => {
            const priceLabel = opt.price ? opt.price.toLocaleString() + ' FCFA' : 'Sur devis';
            summaryItems.innerHTML += `<div class="summary-item"><span>${opt.name}</span><span>${priceLabel}</span></div>`;
            baseTotal += opt.price || 0;
        });

        // Débours officiels : facturés au coût réel sur justificatifs (aucun montant fixe)
        if (cart.service) {
             summaryItems.innerHTML += `<div class="summary-divider"></div><div class="summary-item muted"><span>Débours officiels (Notaire, Greffe, DGI)</span><span>Au coût réel</span></div>`;
        }

        // Ajouter 2% de frais de transfert
        const fee = Math.floor(baseTotal * 0.02);
        const finalTotal = baseTotal + fee;

        summaryItems.innerHTML += `<div class="summary-divider"></div><div class="summary-item"><span>Frais de traitement (2%)</span><span>${fee.toLocaleString()} FCFA</span></div>`;

        summaryTotal.innerText = finalTotal.toLocaleString() + ' FCFA';
        
        const finalBtn = document.getElementById('finalPayBtn');
        if (finalBtn) finalBtn.innerText = `🔒 Procéder au paiement sécurisé (${finalTotal.toLocaleString()} FCFA)`;
    }

    // ... (FileUpload logic)
    document.querySelectorAll('.dropzone').forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        if (!input) return;
        
        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                handleFileUpload(zone, e.dataTransfer.files[0]);
            }
        });
        input.addEventListener('change', () => {
            if (input.files.length > 0) handleFileUpload(zone, input.files[0]);
        });
    });

    function handleFileUpload(zone, file) {
        const h5 = zone.querySelector('h5');
        const p = zone.querySelector('p');
        if (h5) h5.innerText = file.name;
        if (p) {
            p.innerText = `${(file.size / 1024 / 1024).toFixed(2)} Mo - Cliquer pour remplacer`;
            p.style.color = 'var(--color-success)';
        }
    }

    // 8. Final Payment
    const finalPayBtn = document.getElementById('finalPayBtn');
    if (finalPayBtn) {
        finalPayBtn.addEventListener('click', async () => {
            if (!cart.service) {
                alert('Veuillez sélectionner une prestation.');
                goToStep(1);
                return;
            }

            const paymentMethodInput = document.querySelector('input[name="payment"]:checked');
            const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'momo';

            if (paymentMethod === 'card' || paymentMethod === 'bank') {
                const proofInput = document.getElementById('paymentProof');
                if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
                    alert('Veuillez téléverser un reçu ou une capture d\'écran de votre virement/paiement.');
                    return;
                }
            }

            const activeForm = document.querySelector(`#form-${cart.service}`);
            const name = activeForm ? (activeForm.querySelector('input[name="name"], input[placeholder*="Nom"], input[id*="nom"]')?.value || 'Client') : 'Client';
            const email = activeForm ? (activeForm.querySelector('input[type="email"]')?.value || 'client@fedpawa.cm') : 'client@fedpawa.cm';
            const telephone = activeForm ? (activeForm.querySelector('input[type="tel"]')?.value || '+237600000000') : '+237600000000';

            try {
                finalPayBtn.disabled = true;
                finalPayBtn.innerText = 'Traitement en cours...';

                // Calculer total réel avec frais (débours au coût réel : hors total)
                const baseTotal = cart.price + cart.options.reduce((sum, opt) => sum + (opt.price || 0), 0);
                const totalAvecFrais = Math.floor(baseTotal * 1.02);

                const res = await fetch('/api/souscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service: cart.service,
                        prix: totalAvecFrais,
                        options: cart.options,
                        paymentMethod,
                        name,
                        email,
                        telephone
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    alert(paymentMethod === 'momo' ? 'Paiement initié !' : 'Souscription enregistrée, en attente de vérification.');
                    window.location.href = 'espace_client.html';
                } else {
                    alert('Erreur: ' + (data.error || 'Échec'));
                    finalPayBtn.disabled = false;
                    updateSummary();
                }
            } catch (err) {
                console.error(err);
                alert('Erreur réseau.');
                finalPayBtn.disabled = false;
                updateSummary();
            }
        });
    }

    updateSummary();
});
