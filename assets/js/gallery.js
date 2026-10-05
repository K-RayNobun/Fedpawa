document.addEventListener('DOMContentLoaded', () => {
    // Gallery Filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const body = document.body;

    if (lightbox) {
        document.querySelectorAll('.gallery-item img').forEach(img => {
            img.addEventListener('click', (e) => {
                // Récupère la version haute qualité de l'image Unsplash en modifiant l'URL
                let src = e.target.src;
                // Remplace les paramètres de largeur pour avoir une plus grande image
                let highResSrc = src.replace('w=800', 'w=1200');
                if (!highResSrc.includes('w=1200')) {
                    highResSrc = src.replace('w=600', 'w=1200');
                }
                
                lightboxImg.src = highResSrc;
                lightbox.classList.add('open');
                body.style.overflow = 'hidden';
            });
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) {
                lightbox.classList.remove('open');
                body.style.overflow = '';
            }
        });
    }
});