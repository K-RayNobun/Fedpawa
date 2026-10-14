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
      if (!data.nom || !data.email || !data.sujet || !data.message) { say('Please fill in all required fields.', false); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        var res = await window.Api.post('/api/contact', data);
        var body = await res.json();
        if (res.ok) { say(body.message || 'Message envoyé.', true); form.reset(); }
        else { say(body.error || "Sending failed. Try again or write to contact@fedpawa.com", false); }
      } catch (err) {
        say('Connection failed. Try again or write to contact@fedpawa.com', false);
      }
      btn.disabled = false; btn.textContent = 'Send message';
    });
  });
})();
