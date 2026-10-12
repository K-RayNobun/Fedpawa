// ==========================================================
// FEDPAWA - API Helper (CSRF-aware)
// Tous les POST vers /api doivent passer par Api.post / Api.postForm
// ==========================================================
window.Api = (function () {
    let csrfToken = null;
    let csrfPromise = null;

    async function ensureCsrfToken() {
        if (csrfToken) return csrfToken;
        if (!csrfPromise) {
            csrfPromise = fetch('/api/csrf-token')
                .then(r => r.json())
                .then(data => {
                    csrfToken = data.csrf_token;
                    if (data.session_expired) {
                        // La session a expiré après inactivité (côté serveur)
                        const evt = new CustomEvent('fedpawa:session-expired');
                        window.dispatchEvent(evt);
                    }
                    return csrfToken;
                })
                .catch(() => { csrfPromise = null; throw new Error('Impossible de récupérer le jeton CSRF.'); });
        }
        return csrfPromise;
    }

    // En cas de 403 CSRF (token périmé), on rafraîchit le token une fois puis on retente
    async function post(url, body, retried = false) {
        const token = await ensureCsrfToken();
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': token
            },
            body: JSON.stringify(body)
        });

        if (res.status === 403 && !retried) {
            const data = await res.clone().json().catch(() => ({}));
            if (data && data.error && data.error.toLowerCase().includes('csrf')) {
                csrfToken = null;
                csrfPromise = null;
                return post(url, body, true);
            }
        }
        return res;
    }

    // Uploads multipart (FormData) - le token CSRF passe par le header
    async function postForm(url, formData, retried = false) {
        const token = await ensureCsrfToken();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'X-CSRF-Token': token },
            body: formData
        });

        if (res.status === 403 && !retried) {
            const data = await res.clone().json().catch(() => ({}));
            if (data && data.error && data.error.toLowerCase().includes('csrf')) {
                csrfToken = null;
                csrfPromise = null;
                return postForm(url, formData, true);
            }
        }
        return res;
    }

    return { post, postForm, ensureCsrfToken };
})();
