// Formulaire de contact — envoi réel via /api/contact (CSRF via Api)
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var feedback = document.getElementById('contactFeedback');
      function say(msg, ok) {
        if (feedback) { feedback.textContent = msg; feedback.className = 'form-feedback ' + (ok ? 'success' : 'error'); }
      }
      var data = {
        nom: form.nom.value.trim(),
        email: form.email.value.trim(),
        telephone: form.telephone.value.trim(),
        sujet: form.sujet.value,
        message: form.message.value.trim(),
        site: ''
      };
      if (!data.nom || !data.email || !data.sujet || !data.message) { say('Merci de remplir tous les champs requis.', false); return; }
      btn.disabled = true; btn.textContent = 'Envoi en cours…';
      try {
        var res = await window.Api.post('/api/contact', data);
        var body = await res.json();
        if (res.ok) { say(body.message || 'Message envoyé.', true); form.reset(); }
        else { say(body.error || "Erreur d'envoi. Réessayez ou écrivez à contact@fedpawa.com", false); }
      } catch (err) {
        say('Connexion impossible. Réessayez ou écrivez à contact@fedpawa.com', false);
      }
      btn.disabled = false; btn.textContent = 'Envoyer le message';
    });
  });
})();
