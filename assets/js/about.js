document.addEventListener('DOMContentLoaded', () => {
    // 1. Compteurs Animés (Stats)
    const counters = document.querySelectorAll('.stat-counter');
    const speed = 2000; // Durée de l'animation en ms

    const startCounting = (counter) => {
        const target = +counter.getAttribute('data-target');
        const decimals = +counter.getAttribute('data-decimals') || 0;
        const suffix = counter.getAttribute('data-suffix') || '';
        let current = 0;
        
        const increment = target / (speed / 10);
        
        const updateCount = () => {
            current += increment;
            if (current < target) {
                counter.innerText = current.toFixed(decimals) + suffix;
                setTimeout(updateCount, 10);
            } else {
                counter.innerText = target.toFixed(decimals) + suffix;
            }
        };
        
        updateCount();
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    // 2. Modale de Prise de Rendez-vous
    const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
    const modalOverlay = document.getElementById('appointmentModal');
    
    if (modalTriggers.length > 0 && modalOverlay) {
        const modalClose = modalOverlay.querySelector('.modal-close');
        
        modalTriggers.forEach(btn => {
            btn.addEventListener('click', () => {
                modalOverlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        });

        const closeModal = () => {
            modalOverlay.classList.remove('open');
            document.body.style.overflow = '';
        };

        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
});