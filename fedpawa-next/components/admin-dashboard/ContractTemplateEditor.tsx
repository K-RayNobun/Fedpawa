// ==========================================================
// FEDPAWA — Éditeur TinyMCE (L012, vague D)
// Source : assets/vendor/tinymce 6.8.3 self-hosted. Décision
// verrouillée : NE PAS convertir le vendor — charger TinyMCE
// depuis le CDN officiel (cdn.tiny.cloud, même version 6.8.3,
// licence gpl) dans un composant client dédié. Même config que
// admin-dashboard.js : plugins 'table lists link', toolbar
// correspondante, skin oxide-dark (thème navy), height 450,
// branding off, licence gpl.
// Fallback : textarea brute si le CDN est injoignable.
// ==========================================================

"use client";

import { useEffect, useRef, useState } from "react";

/** URL CDN officielle TinyMCE 6.8.3 (GPL, parité vendor 6.8.3). */
const TINYMCE_CDN = "https://cdn.tiny.cloud/1/tinymce/6.8.3/tinymce.min.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    tinymce?: any;
  }
}

/** Charge le script TinyMCE une seule fois (promesse partagée). */
let tinymcePromise: Promise<any> | null = null;

function loadTinyMCE(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR"));
  }
  if (window.tinymce) return Promise.resolve(window.tinymce);
  if (tinymcePromise) return tinymcePromise;

  tinymcePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TINYMCE_CDN;
    script.referrerPolicy = "origin";
    script.async = true;
    script.onload = () => {
      if (window.tinymce) resolve(window.tinymce);
      else reject(new Error("TinyMCE chargé mais absent de window."));
    };
    script.onerror = () => {
      tinymcePromise = null; // permettre un retry au prochain montage
      reject(new Error("TinyMCE indisponible (CDN)."));
    };
    document.head.appendChild(script);
  });
  return tinymcePromise;
}

export interface ContractTemplateEditorProps {
  /** Contenu HTML initial du modèle. */
  initialContent: string;
  /** Appelé avec le contenu HTML courant (bouton Enregistrer). */
  onSave: (content: string) => void | Promise<void>;
  onCancel: () => void;
}

export default function ContractTemplateEditor({
  initialContent,
  onSave,
  onCancel,
}: ContractTemplateEditorProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let disposed = false;

    loadTinyMCE()
      .then((tinymce) => {
        if (disposed || !areaRef.current) return;
        tinymce.init({
          target: areaRef.current,
          skin: "oxide-dark", // cohérent avec le thème navy
          content_css: "dark",
          height: 450,
          menubar: false,
          branding: false,
          plugins: "table lists link",
          toolbar:
            "undo redo | bold italic underline | bullist numlist | table link | removeformat",
          license_key: "gpl",
          promotion: false,
          init_instance_callback: (ed: any) => {
            editorRef.current = ed;
            ed.setContent(initialContent || "");
            setReady(true);
          },
        });
      })
      .catch(() => {
        if (disposed) return;
        setFallback(true);
        setReady(true);
      });

    return () => {
      disposed = true;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // initialContent n'est lu qu'une fois à l'init (le modèle est rechargé à chaque ouverture)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getContent = (): string => {
    if (editorRef.current) return editorRef.current.getContent();
    return areaRef.current?.value ?? "";
  };

  const handleSave = async () => {
    const content = getContent();
    if (!content || content.trim().length < 50) {
      // parité saveTemplate() : contenu trop court refusé côté client aussi
      return;
    }
    setSaving(true);
    try {
      await onSave(content);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="l012-editor-wrap">
      <textarea
        ref={areaRef}
        id="l012-template-content"
        aria-label="Contenu du modèle de contrat"
        defaultValue={initialContent}
        className={fallback ? "tinymce-fallback" : undefined}
        style={
          fallback
            ? { display: "block", width: "100%", height: 450, padding: 12 }
            : undefined
        }
      />
      {!ready && (
        <p className="l012-editor-note">Chargement de l'éditeur…</p>
      )}
      {fallback && (
        <p className="l012-editor-note">
          Éditeur visuel indisponible (CDN injoignable) — édition HTML brute.
        </p>
      )}
      <p className="l012-editor-note">
        Déverrouillage valide 10 minutes. Enregistrez avant expiration.
      </p>
      <div className="l012-editor-actions">
        <button
          type="button"
          className="btn btn-outline"
          id="l012-editor-cancel"
          onClick={onCancel}
        >
          Annuler
        </button>
        <button
          type="button"
          className="btn btn-primary"
          id="l012-editor-save"
          disabled={!ready || saving}
          onClick={handleSave}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
