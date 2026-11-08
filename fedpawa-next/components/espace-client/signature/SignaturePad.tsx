// ==========================================================
// FEDPAWA — pavé de signature (canvas) + repli dactylographié.
// - Dessin au doigt (pointer events, tactile) ou à la souris.
// - Bouton d'effacement.
// - Mode « saisir » : la signature tapée est rendue sur le canvas
//   (police cursive) — produit aussi un PNG en base64.
// - getPngDataUrl() renvoie un data URI « data:image/png;base64,… »
//   (format exigé par POST /api/v1/signature/signer), ou null si vide.
// - Responsive : la largeur suit le conteneur, la résolution interne
//   tient compte du devicePixelRatio (net sur mobile retina).
// ==========================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PadMode = "draw" | "type";

interface SignaturePadProps {
  mode: PadMode;
  typedText: string;
  onModeChange: (mode: PadMode) => void;
  onTypedTextChange: (text: string) => void;
  /** true quand le canvas contient quelque chose (active le bouton signer). */
  onContentChange: (hasContent: boolean) => void;
  /** Ref partagée : permet au parent de récupérer le PNG au submit. */
  apiRef: React.RefObject<SignaturePadHandle | null>;
}

export interface SignaturePadHandle {
  getPngDataUrl: () => string | null;
  clear: () => void;
}

const PAD_HEIGHT_CSS = 220;

export default function SignaturePad({
  mode,
  typedText,
  onModeChange,
  onTypedTextChange,
  onContentChange,
  apiRef,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasContent = useRef(false);

  const ctx2d = () => canvasRef.current?.getContext("2d") ?? null;

  /** (Re)dimensionne le canvas à la largeur réelle du conteneur. */
  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 320;
    const cssHeight = PAD_HEIGHT_CSS;
    const w = Math.round(cssWidth * dpr);
    const h = Math.round(cssHeight * dpr);
    if (canvas.width === w && canvas.height === h) return;
    // Préserve le dessin existant lors d'un redimensionnement.
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    if (canvas.width && canvas.height) snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
    canvas.width = w;
    canvas.height = h;
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#15294D";
      ctx.fillStyle = "#15294D";
      if (snapshot.width) ctx.drawImage(snapshot, 0, 0, w, h);
    }
  }, []);

  useEffect(() => {
    fitCanvas();
    const onResize = () => fitCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitCanvas]);

  /** Efface le canvas et rend le mode « saisir » à jour. */
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctx2d();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasContent.current = false;
    onContentChange(false);
    if (mode === "type") renderTyped();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedText]);

  /** Rend le texte saisi sur le canvas (mode repli). */
  const renderTyped = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctx2d();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const text = typedText.trim();
    if (!text) {
      hasContent.current = false;
      onContentChange(false);
      return;
    }
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const fontPx = Math.round(44 * dpr);
    ctx.font = `${fontPx}px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Réduit la police si le nom est long (petit écran).
    const maxWidth = canvas.width * 0.86;
    let size = fontPx;
    while (size > 14 * dpr && ctx.measureText(text).width > maxWidth) {
      size -= 2 * dpr;
      ctx.font = `${size}px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive`;
    }
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    hasContent.current = true;
    onContentChange(true);
  }, [typedText, onContentChange]);

  // Re-rend le texte quand il change en mode « type ».
  useEffect(() => {
    if (mode === "type") renderTyped();
  }, [mode, renderTyped]);

  // API impérative exposée au parent.
  useEffect(() => {
    apiRef.current = {
      getPngDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasContent.current) return null;
        // Refus propre : canvas entièrement transparent.
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] !== 0) return canvas.toDataURL("image/png");
          }
          return null;
        }
        return canvas.toDataURL("image/png");
      },
      clear,
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, clear]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
    // Point isolé (tap) : dessine un point.
    const ctx = ctx2d();
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      hasContent.current = true;
      onContentChange(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== "draw" || !last.current) return;
    e.preventDefault();
    const ctx = ctx2d();
    if (!ctx) return;
    const p = pos(e);
    ctx.lineWidth = Math.max(2, canvasRef.current!.width / 220);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasContent.current = true;
    onContentChange(true);
  };

  const stopDrawing = () => {
    drawing.current = false;
    last.current = null;
  };

  return (
    <div className="sig-pad">
      <div className="sig-pad-modes" role="tablist" aria-label="Mode de signature">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "draw"}
          className={`sig-pad-mode${mode === "draw" ? " active" : ""}`}
          onClick={() => onModeChange("draw")}
        >
          Dessiner ma signature
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "type"}
          className={`sig-pad-mode${mode === "type" ? " active" : ""}`}
          onClick={() => onModeChange("type")}
        >
          Saisir ma signature
        </button>
      </div>

      {mode === "type" && (
        <div className="form-group">
          <label htmlFor="sig-typed">Votre nom tel qu&apos;il apparaîtra signé</label>
          <input
            id="sig-typed"
            type="text"
            className="form-control"
            placeholder="Ex. Marie Nguema"
            value={typedText}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => onTypedTextChange(e.target.value)}
          />
        </div>
      )}

      <div className="sig-pad-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="sig-pad-canvas"
          aria-label="Pavé de signature — dessinez votre signature ici"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        {mode === "draw" && (
          <span className="sig-pad-hint">Dessinez votre signature dans ce cadre (doigt ou souris)</span>
        )}
      </div>
      <div className="sig-pad-actions">
        <button type="button" className="btn btn-outline sig-pad-clear" onClick={clear}>
          Effacer
        </button>
      </div>
    </div>
  );
}
