"use client";

import type { CSSProperties } from "react";
import type { TargetRect } from "@/features/tutorial/engine/target-resolver";

/**
 * Capa oscura con un hueco alrededor del elemento resaltado.
 *
 * Se dibuja con cuatro paneles (arriba, abajo, izquierda, derecha) en lugar de una
 * sombra gigante: así el hueco queda REALMENTE libre y la persona puede pulsar el
 * elemento cuando el paso se lo pide, sin que un overlay invisible se coma el clic.
 */

const PADDING = 8;

export type TutorialOverlayProps = {
  rect: TargetRect | null;
  /** El elemento resaltado queda utilizable (el paso espera una acción sobre él). */
  interactive: boolean;
  reducedMotion: boolean;
  /** Clic fuera del elemento resaltado. */
  onBackdropClick: () => void;
  /** Clic sobre el elemento resaltado cuando el paso no pide interacción real. */
  onSpotlightClick: () => void;
};

export function TutorialOverlay({
  rect,
  interactive,
  reducedMotion,
  onBackdropClick,
  onSpotlightClick,
}: TutorialOverlayProps) {
  const transition = reducedMotion ? "" : "transition-all duration-300 ease-out";

  if (!rect) {
    return (
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onBackdropClick}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/70"
      />
    );
  }

  const hole = {
    top: Math.max(0, rect.top - PADDING),
    left: Math.max(0, rect.left - PADDING),
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  const panels: CSSProperties[] = [
    { top: 0, left: 0, right: 0, height: hole.top },
    { top: hole.top + hole.height, left: 0, right: 0, bottom: 0 },
    { top: hole.top, left: 0, width: hole.left, height: hole.height },
    { top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height },
  ];

  return (
    <>
      {panels.map((style, index) => (
        <button
          key={index}
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={onBackdropClick}
          style={style}
          className={`absolute cursor-default bg-slate-950/70 ${transition}`}
        />
      ))}

      {/* Marco del elemento resaltado. No captura el puntero: el hueco queda libre. */}
      <div
        aria-hidden="true"
        style={{ ...hole, position: "absolute" }}
        className={`pointer-events-none rounded-xl ring-2 ring-card/90 ring-offset-2 ring-offset-primary/70 ${transition}`}
      />
      {!reducedMotion && (
        <div
          aria-hidden="true"
          style={{ ...hole, position: "absolute", animationDuration: "2.4s" }}
          className="animate-ping pointer-events-none rounded-xl border-2 border-primary/60"
        />
      )}

      {/* Cuando el paso no espera una acción concreta, pulsar el elemento avanza. Si la
          espera, este bloqueo no se monta y el clic llega al elemento real. */}
      {!interactive && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={onSpotlightClick}
          style={{ ...hole, position: "absolute" }}
          className="cursor-pointer rounded-xl"
        />
      )}
    </>
  );
}
