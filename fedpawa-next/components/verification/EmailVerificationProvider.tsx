// ==========================================================
// FEDPAWA — EmailVerificationProvider (CONTRAT-VERIF, worker A)
// Source de vérité du statut email_verified côté client :
// monté dans les DEUX layouts racines (fr + en), au-dessus de
// PwaProvider. Interroge GET /api/v1/auth/me (champ email_verified
// du contrat) :
// - au montage ;
// - au retour de focus de l'onglet (vérification faite ailleurs) ;
// - à la demande (refresh(), ex. bouton « J'ai vérifié mon e-mail »).
// Expose aussi resend() (POST /auth/resend-verification, 429 géré)
// et requestGate() : une réponse 403 email_non_verifie interceptée
// n'importe où rouvre la modal bloquante des pages de souscription.
// ==========================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api";
import { fetchMe } from "@/lib/auth";
import {
  resendVerification,
  statusFromMe,
  type VerificationStatus,
} from "@/lib/verification";

export interface ResendFeedback {
  type: "success" | "error" | "info";
  text: string;
  /** 429 deja_envoye : délai restant en secondes. */
  retryAfter?: number;
}

export interface EmailVerificationContextValue {
  status: VerificationStatus;
  authenticated: boolean;
  /** true si non vérifié (bannière + modal). */
  unverified: boolean;
  /** Modal forcée par une interception 403 email_non_verifie. */
  gateOpen: boolean;
  requestGate: () => void;
  /** Re-appelle /auth/me ; renvoie le statut obtenu. */
  refresh: () => Promise<VerificationStatus>;
  refreshing: boolean;
  resend: () => Promise<ResendFeedback>;
  resending: boolean;
  resendFeedback: ResendFeedback | null;
  clearResendFeedback: () => void;
}

const EmailVerificationContext = createContext<EmailVerificationContextValue>({
  status: "loading",
  authenticated: false,
  unverified: false,
  gateOpen: false,
  requestGate: () => {},
  refresh: async () => "loading",
  refreshing: false,
  resend: async () => ({ type: "error", text: "" }),
  resending: false,
  resendFeedback: null,
  clearResendFeedback: () => {},
});

export function useEmailVerification(): EmailVerificationContextValue {
  return useContext(EmailVerificationContext);
}

export default function EmailVerificationProvider({
  children,
}: {
  children?: ReactNode;
}) {
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [authenticated, setAuthenticated] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<ResendFeedback | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<VerificationStatus> => {
    setRefreshing(true);
    try {
      const me = await fetchMe();
      const next = statusFromMe(me);
      if (mounted.current) {
        setAuthenticated(me.authenticated);
        setStatus(next);
        // Statut confirmé vérifié → la modal forcée (403) se ferme.
        if (next === "verified") setGateOpen(false);
      }
      return next;
    } catch {
      // API injoignable : on garde l'état courant (dégradation gracieuse).
      return status;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    // Vérification faite dans un autre onglet : re-lire /me au focus.
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const requestGate = useCallback(() => setGateOpen(true), []);

  const resend = useCallback(async (): Promise<ResendFeedback> => {
    setResending(true);
    setResendFeedback(null);
    try {
      await resendVerification();
      const fb: ResendFeedback = {
        type: "success",
        text: "ok",
      };
      setResendFeedback(fb);
      return fb;
    } catch (err) {
      let fb: ResendFeedback;
      if (err instanceof ApiError && err.status === 429) {
        const b = err.body as { code?: string; retry_after?: number } | null;
        fb = {
          type: "info",
          text: "wait",
          retryAfter: typeof b?.retry_after === "number" ? b.retry_after : undefined,
        };
      } else if (err instanceof ApiError && err.status === 401) {
        fb = { type: "error", text: "needLogin" };
      } else {
        fb = { type: "error", text: "ko" };
      }
      setResendFeedback(fb);
      return fb;
    } finally {
      if (mounted.current) setResending(false);
    }
  }, []);

  const clearResendFeedback = useCallback(() => setResendFeedback(null), []);

  const value: EmailVerificationContextValue = {
    status,
    authenticated,
    unverified: status === "unverified",
    gateOpen,
    requestGate,
    refresh,
    refreshing,
    resend,
    resending,
    resendFeedback,
    clearResendFeedback,
  };

  return (
    <EmailVerificationContext.Provider value={value}>
      {children}
    </EmailVerificationContext.Provider>
  );
}
