"use client";

import {
  useState, useEffect, useLayoutEffect,
  useRef, useCallback, useId,
} from "react";
import styles from "./helptooltip.module.css";

const CLOSE_OTHERS = "help-tooltip:close-others";
const TIP_W  = 320;  // matches CSS width
const PAD    = 16;   // min distance from any viewport edge

interface HelpTooltipProps {
  title: string;
  content: React.ReactNode;
}

type Pos = {
  top: number;
  left: number;
  above: boolean;
  arrowLeft: number;
};

export default function HelpTooltip({ title, content }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<Pos | null>(null);

  const uid        = useId();
  const wrapRef    = useRef<HTMLDivElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Position calculation ──────────────────────────────────────────────────
  const calcPos = useCallback(() => {
    if (!btnRef.current) return;

    const btn     = btnRef.current.getBoundingClientRect();
    const tipH    = tooltipRef.current?.getBoundingClientRect().height ?? 280;
    const vw      = window.innerWidth;
    const vh      = window.innerHeight;

    // Vertical: prefer below; flip above only when below overflows AND above fits
    const above =
      btn.bottom + 10 + tipH > vh - PAD &&
      btn.top    - 10 - tipH >= PAD;

    const top = above
      ? btn.top  - 10 - tipH
      : btn.bottom + 10;

    // Horizontal: start at icon left, clamp so tooltip stays on screen
    let left = btn.left;
    if (left + TIP_W > vw - PAD) left = vw - PAD - TIP_W;
    if (left < PAD)               left = PAD;

    // Arrow: horizontally centered on the icon, relative to clamped left
    const arrowLeft = Math.min(
      Math.max(btn.left + btn.width / 2 - left - 5, 8),
      TIP_W - 18,
    );

    setPos({ top, left, above, arrowLeft });
  }, []);

  // Run after tooltip DOM node exists (useLayoutEffect = before paint)
  useLayoutEffect(() => {
    if (open) calcPos();
    else      setPos(null);
  }, [open, calcPos]);

  // Recalculate while open so scroll / resize never leaves it stale
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open, calcPos]);

  // ── Singleton: close when another tooltip opens ───────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== uid) setOpen(false);
    };
    document.addEventListener(CLOSE_OTHERS, handler);
    return () => document.removeEventListener(CLOSE_OTHERS, handler);
  }, [uid]);

  // ── Outside-click dismiss (mobile) ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Open / close ──────────────────────────────────────────────────────────
  const openTip = useCallback(() => {
    document.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: uid }));
    setOpen(true);
  }, [uid]);

  const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

  const onMouseEnter = () => {
    if (isTouch()) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) openTimer.current = setTimeout(openTip, 200);
  };

  const onMouseLeave = () => {
    if (isTouch()) return;
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) setOpen(false);
    else openTip();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        ref={btnRef}
        type="button"
        className={styles.btn}
        onClick={onClick}
        aria-label={`Help: ${title}`}
        aria-expanded={open}
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
        </svg>
      </button>

      {open && (
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          role="tooltip"
          style={
            pos
              ? { top: pos.top, left: pos.left, visibility: "visible" }
              : { visibility: "hidden" }
          }
        >
          {/* Arrow points toward the icon */}
          <div
            className={pos?.above ? styles.arrowAbove : styles.arrow}
            style={{ left: pos?.arrowLeft ?? 7 }}
          />
          <p className={styles.tipTitle}>{title}</p>
          <div className={styles.content}>{content}</div>
        </div>
      )}
    </div>
  );
}
