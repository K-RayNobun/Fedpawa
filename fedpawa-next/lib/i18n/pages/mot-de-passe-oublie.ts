// ==========================================================
// FEDPAWA — dictionnaires page mot_de_passe_oublie FR/EN
// FR : extraction exacte de mot_de_passe_oublie.html.
// EN : PAS de source .en.html — règle projet : JAMAIS INVENTER.
// Le dict EN est une copie exacte du FR ; la route /en/... sert
// le contenu FR pour ce flux (traduction inventée retirée).
// ==========================================================

import type { PageDict } from "../../i18n/types";

export const resetFr: PageDict = {
  heroTitle: "Sécurité et <span>Confidentialité</span> Absolue.",
  heroDesc:
    "Vos données sont protégées par un chiffrement de bout en bout. Réinitialisez votre accès en toute sérénité.",
  feat1: "Chiffrement SSL 256-bit",
  feat2: "Authentification Sécurisée",
  feat3: "Assistance 24/7",
  copyright: "© FEDPAWA Corporate Solutions",

  backLogin: "← Retour à la page de connexion",
  reqTitle: "Mot de passe oublié ?",
  reqText: "Ne vous inquiétez pas. Saisissez votre identifiant pour réinitialiser votre accès.",
  reqLabel: "Adresse E-mail professionnelle",
  reqPlaceholder: "nom@entreprise.cm",
  reqButton: "Envoyer le lien de réinitialisation",
  troubleText: "Vous rencontrez des difficultés ?",
  supportLink: "Contacter le support client",

  backEdit: "← Modifier l'identifiant",
  otpTitle: "Saisissez le code de vérification",
  otpText: "Un code à 6 chiffres a été envoyé à votre adresse e-mail professionnelle.",
  otpTimerLabel: "Vous pourrez redemander un code dans : ",
  otpResend: "Vous n'avez rien reçu ? Renvoyer le code",
  otpCanResend: "Vous pouvez redemander un code.",
  otpButton: "Valider le code",

  pwdTitle: "Réinitialisez votre mot de passe",
  pwdText: "Choisissez un mot de passe robuste pour protéger votre espace d'affaires.",
  newPwdLabel: "Nouveau mot de passe",
  confirmPwdLabel: "Confirmer le nouveau mot de passe",
  pwdUpdateButton: "Mettre à jour mon mot de passe",
  chk1: "Au moins 8 caractères",
  chk2: "1 majuscule et 1 minuscule",
  chk3: "1 chiffre",
  chk4: "1 caractère spécial (@, #, $...)",
  strength0: "",
  strength1: "Faible",
  strength2: "Moyen",
  strength3: "Fort",
  strength4: "Très Fort",

  okTitle: "Mot de passe mis à jour avec succès !",
  okText:
    "Votre mot de passe a été réinitialisé. Vous pouvez maintenant accéder à votre Espace Client pour suivre vos démarches.",
  okButton: "Se connecter à l'Espace Client",

  // toasts / modales (password-reset.js)
  toastCodeSent: "Un code de vérification a été envoyé à votre adresse e-mail. Valable 15 minutes.",
  toastCodeResent: "Un nouveau code a été envoyé à votre adresse e-mail.",
  toastSendKo: "Impossible d'envoyer le code",
  toastResendKo: "Impossible de renvoyer le code",
  toastInvalidCode: "Code invalide ou expiré",
  toastResetKo: "Impossible de réinitialiser le mot de passe",
  toastMismatch: "Les mots de passe ne correspondent pas.",
  toastNetwork: "Erreur réseau. Vérifiez votre connexion.",
  preprodTitle: "Mode pré-production",
  preprodMsg:
    "Si cette adresse existe, un code de vérification vous a été envoyé par e-mail.<br><small>Le service d'envoi est en cours d'activation — si vous ne recevez rien, contactez le support.</small>",
  preprodBtn: "J'ai noté mon code",
  resendModalTitle: "Nouveau code envoyé",
  resendModalMsg:
    "Un nouveau code de vérification a été envoyé à votre adresse e-mail.<br><small>Si vous ne recevez rien, contactez le support.</small>",
  resendModalBtn: "OK",
};

export const resetEn: PageDict = {
  heroTitle: "Sécurité et <span>Confidentialité</span> Absolue.",
  heroDesc:
    "Vos données sont protégées par un chiffrement de bout en bout. Réinitialisez votre accès en toute sérénité.",
  feat1: "Chiffrement SSL 256-bit",
  feat2: "Authentification Sécurisée",
  feat3: "Assistance 24/7",
  copyright: "© FEDPAWA Corporate Solutions",

  backLogin: "← Retour à la page de connexion",
  reqTitle: "Mot de passe oublié ?",
  reqText: "Ne vous inquiétez pas. Saisissez votre identifiant pour réinitialiser votre accès.",
  reqLabel: "Adresse E-mail professionnelle",
  reqPlaceholder: "nom@entreprise.cm",
  reqButton: "Envoyer le lien de réinitialisation",
  troubleText: "Vous rencontrez des difficultés ?",
  supportLink: "Contacter le support client",

  backEdit: "← Modifier l'identifiant",
  otpTitle: "Saisissez le code de vérification",
  otpText: "Un code à 6 chiffres a été envoyé à votre adresse e-mail professionnelle.",
  otpTimerLabel: "Vous pourrez redemander un code dans : ",
  otpResend: "Vous n'avez rien reçu ? Renvoyer le code",
  otpCanResend: "Vous pouvez redemander un code.",
  otpButton: "Valider le code",

  pwdTitle: "Réinitialisez votre mot de passe",
  pwdText: "Choisissez un mot de passe robuste pour protéger votre espace d'affaires.",
  newPwdLabel: "Nouveau mot de passe",
  confirmPwdLabel: "Confirmer le nouveau mot de passe",
  pwdUpdateButton: "Mettre à jour mon mot de passe",
  chk1: "Au moins 8 caractères",
  chk2: "1 majuscule et 1 minuscule",
  chk3: "1 chiffre",
  chk4: "1 caractère spécial (@, #, $...)",
  strength0: "",
  strength1: "Faible",
  strength2: "Moyen",
  strength3: "Fort",
  strength4: "Très Fort",

  okTitle: "Mot de passe mis à jour avec succès !",
  okText:
    "Votre mot de passe a été réinitialisé. Vous pouvez maintenant accéder à votre Espace Client pour suivre vos démarches.",
  okButton: "Se connecter à l'Espace Client",

  // toasts / modales (password-reset.js)
  toastCodeSent: "Un code de vérification a été envoyé à votre adresse e-mail. Valable 15 minutes.",
  toastCodeResent: "Un nouveau code a été envoyé à votre adresse e-mail.",
  toastSendKo: "Impossible d'envoyer le code",
  toastResendKo: "Impossible de renvoyer le code",
  toastInvalidCode: "Code invalide ou expiré",
  toastResetKo: "Impossible de réinitialiser le mot de passe",
  toastMismatch: "Les mots de passe ne correspondent pas.",
  toastNetwork: "Erreur réseau. Vérifiez votre connexion.",
  preprodTitle: "Mode pré-production",
  preprodMsg:
    "Si cette adresse existe, un code de vérification vous a été envoyé par e-mail.<br><small>Le service d'envoi est en cours d'activation — si vous ne recevez rien, contactez le support.</small>",
  preprodBtn: "J'ai noté mon code",
  resendModalTitle: "Nouveau code envoyé",
  resendModalMsg:
    "Un nouveau code de vérification a été envoyé à votre adresse e-mail.<br><small>Si vous ne recevez rien, contactez le support.</small>",
  resendModalBtn: "OK",
};
