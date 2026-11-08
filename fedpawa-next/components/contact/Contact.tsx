"use client";

// ==========================================================
// FEDPAWA — Contact : Hero, infos, formulaire branché à
// l'API Laravel (POST /api/v1/contact), quick actions
// WhatsApp/Email, carte Google Maps. Conversion de
// contact.php + contact-form.js. Client component :
// soumission fetch + feedback + pré-remplissage ?service=.
// ==========================================================

import { useEffect, useState } from "react";
import { type Locale, getPageDictionary } from "@/lib/i18n";
import { apiPost, ApiError } from "@/lib/api";

export interface ContactProps {
  locale?: Locale;
}

interface ContactPayload {
  nom: string;
  email: string;
  telephone: string;
  sujet: string;
  message: string;
  site: string;
}

const SUBJECT_KEYS = [
  { key: "subjectDomiciliation", value: "Domiciliation" },
  { key: "subjectCreation", value: "Création d'entreprise" },
  { key: "subjectFiscalite", value: "Fiscalité" },
  { key: "subjectOapi", value: "OAPI" },
  { key: "subjectContrats", value: "Contrats" },
  { key: "subjectAutre", value: "Autre" },
] as const;

/**
 * Normalise une chaîne : minuscules + suppression des accents/diacritiques
 * (é→e…) via NFD + strip des combining marks — robuste sur tous les
 * navigateurs cibles (Intl manquant sur certains anciens WebViews).
 */
function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Mappe ?service=… → option du select sujet.
 * Parité source : les CTA vitrines envoient fiscalite-devis,
 * fiscalite-reel, oapi-recherche, oapi-brevet, audit-juridique.
 * Normalisation des DEUX côtés (accents + casse) : "Fiscalité"
 * (valeur du select) doit matcher "fiscalite" (segment URL).
 * Roots non triviaux mappés explicitement (audit-juridique →
 * Contrats : segment "audit" inexistant dans les libellés).
 */
const SERVICE_ROOT_TO_SUBJECT: Record<string, string> = {
  "audit-juridique": "Contrats",
};

function subjectFromQuery(queryService: string | null): string {
  if (!queryService) return "";
  const root = queryService.split("-")[0];
  // Mapping explicite prioritaire (roots sans rapport avec un libellé)
  const explicit = SERVICE_ROOT_TO_SUBJECT[normalizeKey(queryService)];
  if (explicit) return explicit;
  const normRoot = normalizeKey(root);
  const hit = SUBJECT_KEYS.find(
    (s) =>
      normalizeKey(s.value).startsWith(normRoot) ||
      // "creation" vs "Création d'entreprise" : le libellé complet normalisé
      // doit aussi matcher la query entière normalisée (ex. "creation").
      normalizeKey(s.value).split(" ")[0] === normRoot,
  );
  return hit ? hit.value : "";
}

export default function Contact({ locale = "fr" }: ContactProps) {
  const t = getPageDictionary(locale, "contact");
  const [form, setForm] = useState<ContactPayload>({
    nom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
    site: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState("");

  // Pré-remplissage depuis ?service= (liens CTA des pages vitrines).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const preset = subjectFromQuery(params.get("service"));
    if (preset) setForm((f) => ({ ...f, sujet: preset }));
  }, []);

  const set = (field: keyof ContactPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const say = (msg: string, ok: boolean) => {
      setFeedback(msg);
      setStatus(ok ? "ok" : "error");
    };
    const data: ContactPayload = {
      nom: form.nom.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
      sujet: form.sujet,
      message: form.message.trim(),
      site: "",
    };
    if (!data.nom || !data.email || !data.sujet || !data.message) {
      say(t.missingFields, false);
      return;
    }
    setStatus("sending");
    setFeedback("");
    try {
      const body = await apiPost<{ message?: string; error?: string }>(
        "/api/v1/contact",
        data,
      );
      say(body.message || t.sentOk, true);
      setForm({ nom: "", email: "", telephone: "", sujet: "", message: "", site: "" });
    } catch (err) {
      if (err instanceof ApiError && err.status > 0) {
        const b = err.body as { message?: string; error?: string } | null;
        say(b?.message || b?.error || t.sendKo, false);
      } else {
        say(t.connKo, false);
      }
    }
  }

  const subjects = SUBJECT_KEYS.map((s) => ({ ...s, label: t[s.key] }));
  const waLink = `https://wa.me/237691704802?text=${encodeURIComponent(
    t.qaWhatsPrefill,
  )}`;

  return (
    <>
      {/* ============== HERO ============== */}
      <section className="page-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t.heroSubtitle}</div>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
          </div>
        </div>
      </section>

      {/* ============== CONTACT GRID ============== */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3>{t.infoAddressTitle}</h3>
                  <p dangerouslySetInnerHTML={{ __html: t.infoAddressText }} />
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <h3>{t.infoHoursTitle}</h3>
                  <p dangerouslySetInnerHTML={{ __html: t.infoHoursText }} />
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3>{t.infoDirectTitle}</h3>
                  <p>
                    {t.infoDirectPhoneLabel}
                    <a href="tel:+237691704802">+237 691 70 48 02</a>
                    <br />
                    {t.infoDirectWhatsappLabel}
                    <a
                      href="https://wa.me/237691704802"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      +237 691 70 48 02
                    </a>
                  </p>
                </div>
              </div>
              <div className="info-card">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                </div>
                <div>
                  <h3>{t.infoEmailTitle}</h3>
                  <p>
                    <a href="mailto:contact@fedpawa.com">contact@fedpawa.com</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <div className="form-header">
                <h2>{t.formTitle}</h2>
                <p>{t.formIntro}</p>
              </div>
              <form id="contactForm" onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">{t.labelName}</label>
                    <input
                      type="text"
                      id="name"
                      name="nom"
                      className="form-control"
                      maxLength={120}
                      required
                      value={form.nom}
                      onChange={set("nom")}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">{t.labelEmail}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      maxLength={190}
                      required
                      value={form.email}
                      onChange={set("email")}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">{t.labelPhone}</label>
                    <input
                      type="tel"
                      id="phone"
                      name="telephone"
                      className="form-control"
                      maxLength={25}
                      value={form.telephone}
                      onChange={set("telephone")}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">{t.labelSubject}</label>
                    <select
                      id="subject"
                      name="sujet"
                      className="form-control"
                      required
                      value={form.sujet}
                      onChange={set("sujet")}
                    >
                      <option value="">{t.subjectPlaceholder}</option>
                      {subjects.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group full">
                  <label htmlFor="message">{t.labelMessage}</label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-control"
                    maxLength={5000}
                    required
                    value={form.message}
                    onChange={set("message")}
                  />
                </div>
                <p
                  id="contactFeedback"
                  className={
                    "form-feedback " +
                    (status === "ok" ? "success" : status === "error" ? "error" : "")
                  }
                  role="status"
                  aria-live="polite"
                >
                  {feedback}
                </p>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? t.sending : t.sendButton}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ============== QUICK ACTIONS ============== */}
      <section className="quick-actions" id="whatsapp">
        <div className="container">
          <div className="qa-grid">
            <a
              href={waLink}
              className="qa-card whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="qa-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <div>
                <h3>{t.qaWhatsTitle}</h3>
                <p>{t.qaWhatsText}</p>
              </div>
            </a>
            <a href="mailto:contact@fedpawa.com" className="qa-card email">
              <div className="qa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </div>
              <div>
                <h3>{t.qaEmailTitle}</h3>
                <p>{t.qaEmailText}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ============== MAP ============== */}
      <section className="map-section">
        <div className="container">
          <div className="map-header">
            <h2>{t.mapTitle}</h2>
            <p>{t.mapText}</p>
          </div>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps?q=4.082803,9.770557&hl=fr&z=17&output=embed"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t.mapTitle}
            />
          </div>
        </div>
      </section>
    </>
  );
}
