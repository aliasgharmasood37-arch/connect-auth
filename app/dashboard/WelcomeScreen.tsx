"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./welcome.module.css";

const FULL_MESSAGE = "Hi! I saw your ad and I'm interested in your services 👋";

// Animation phases (ms from cycle start)
const PHASE = {
  TYPE_START:    0,
  TYPE_END:      1500,
  ARROW1_START:  1500,
  ARROW1_END:    2000,
  AI_PULSE:      2000,
  AI_END:        3000,
  ARROW2_START:  3000,
  ARROW2_END:    3500,
  REPLY_IN:      3500,
  HOLD_END:      7000,
  FADE_START:    7000,
  FADE_END:      7500,
  CYCLE:         8000,
};

export default function WelcomeScreen({
  onConnect,
  connecting,
}: {
  onConnect: () => void;
  connecting: boolean;
}) {
  const [typedText, setTypedText]       = useState("");
  const [dmActive, setDmActive]         = useState(false);
  const [arrow1, setArrow1]             = useState(false);
  const [aiPulse, setAiPulse]           = useState(false);
  const [arrow2, setArrow2]             = useState(false);
  const [replyVisible, setReplyVisible] = useState(false);
  const [fading, setFading]             = useState(false);

  const cycleRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (cycleRef.current) clearTimeout(cycleRef.current);
    if (typeRef.current)  clearInterval(typeRef.current);
  }, []);

  const resetState = useCallback(() => {
    setTypedText("");
    setDmActive(false);
    setArrow1(false);
    setAiPulse(false);
    setArrow2(false);
    setReplyVisible(false);
    setFading(false);
  }, []);

  const runCycle = useCallback(() => {
    resetState();

    // Phase 1: type out message
    let i = 0;
    setDmActive(true);
    typeRef.current = setInterval(() => {
      i++;
      setTypedText(FULL_MESSAGE.slice(0, i));
      if (i >= FULL_MESSAGE.length) {
        if (typeRef.current) clearInterval(typeRef.current);
      }
    }, (PHASE.TYPE_END - PHASE.TYPE_START) / FULL_MESSAGE.length);

    // Phase 2: left arrow
    cycleRef.current = setTimeout(() => {
      setArrow1(true);
      setTimeout(() => setArrow1(false), 500);
    }, PHASE.ARROW1_START);

    // Phase 3: AI pulse
    cycleRef.current = setTimeout(() => {
      setAiPulse(true);
      setTimeout(() => setAiPulse(false), 900);
    }, PHASE.AI_PULSE);

    // Phase 4: right arrow
    cycleRef.current = setTimeout(() => {
      setArrow2(true);
      setTimeout(() => setArrow2(false), 500);
    }, PHASE.ARROW2_START);

    // Phase 5: reply appears
    cycleRef.current = setTimeout(() => {
      setReplyVisible(true);
    }, PHASE.REPLY_IN);

    // Phase 6: fade out
    cycleRef.current = setTimeout(() => {
      setFading(true);
    }, PHASE.FADE_START);

    // Phase 7: restart
    cycleRef.current = setTimeout(() => {
      runCycle();
    }, PHASE.CYCLE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    runCycle();
    return clearTimers;
  }, [runCycle, clearTimers]);

  return (
    <div className={styles.welcome}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Get started in 5 minutes
        </div>
        <h1 className={styles.heroTitle}>Welcome to InstaAutomate</h1>
        <p className={styles.heroSub}>
          Your AI-powered sales assistant for Instagram. It handles DMs, replies to comments,
          and captures leads — so you can focus on your business.
        </p>
      </section>

      {/* ── Demo animation ── */}
      <section className={`${styles.demoSection}${fading ? " " + styles.fadeOut : ""}`}>
        <div className={styles.demoRow}>

          {/* Left — Customer Message */}
          <div className={`${styles.demoCard} ${styles.dmCard}${dmActive ? " " + styles.active : ""}`}>
            <div className={styles.dmCardHeader}>
              <div className={styles.dmInstagramIcon}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                </svg>
              </div>
              <span className={styles.dmHeaderText}>Instagram DM</span>
              <div className={styles.dmNotifBadge}>1</div>
            </div>
            <div className={styles.dmBubble}>
              {typedText}
              {dmActive && typedText.length < FULL_MESSAGE.length && (
                <span className={styles.dmCursor} />
              )}
            </div>
            <p className={styles.dmTimestamp}>Just now</p>
          </div>

          {/* Arrow 1 */}
          <div className={styles.demoArrow}>
            <div className={styles.arrowTrack}>
              <span className={`${styles.arrowDot}${arrow1 ? " " + styles.animating : ""}`} />
              <span className={styles.arrowHead}>›</span>
            </div>
          </div>

          {/* Center — AI Processes */}
          <div className={styles.demoCenterCard}>
            <div className={`${styles.aiIconWrap}${aiPulse ? " " + styles.processing : ""}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5" />
                <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.5" />
                <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5" />
              </svg>
            </div>
            <span className={styles.aiLabel}>AI Agent</span>
          </div>

          {/* Arrow 2 */}
          <div className={styles.demoArrow}>
            <div className={styles.arrowTrack}>
              <span className={`${styles.arrowDot}${arrow2 ? " " + styles.animating : ""}`} />
              <span className={styles.arrowHead}>›</span>
            </div>
          </div>

          {/* Right — Instant Reply */}
          <div className={`${styles.demoCard} ${styles.replyCard}${replyVisible ? " " + styles.active : ""}`}>
            <div className={styles.dmCardHeader}>
              <div className={styles.replyCheckIcon}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className={styles.replyHeaderText}>Auto Reply</span>
              <span className={styles.replySentBadge}>Sent</span>
            </div>
            <div className={`${styles.replyContent}${replyVisible ? " " + styles.visible : ""}`}>
              <div className={styles.replyEchoBubble}>Hi! I saw your ad...</div>
              <div className={styles.replyAiBubble}>
                Thanks for reaching out! I&apos;d love to help. Let me share our pricing...
              </div>
              <p className={styles.replyInstantLabel}>⚡ Instant reply</p>
            </div>
          </div>
        </div>

        {/* Labels row */}
        <div className={styles.demoLabels}>
          <div className={styles.demoLabelSlot}>
            <p className={styles.demoLabel}>Customer Messages</p>
          </div>
          <div className={styles.demoArrowLabelSlot} />
          <div className={styles.demoCenterLabelSlot}>
            <p className={styles.demoLabel}>AI Processes</p>
          </div>
          <div className={styles.demoArrowLabelSlot} />
          <div className={styles.demoLabelSlot}>
            <p className={styles.demoLabel}>Instant Reply</p>
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className={styles.steps}>
        <div className={styles.stepCard}>
          <div className={styles.stepNum}>01</div>
          <p className={styles.stepTitle}>Connect Instagram</p>
          <p className={styles.stepDesc}>
            Link your Instagram Business account. We&apos;ll use it to read and reply to your DMs and comments automatically.
          </p>
        </div>
        <div className={styles.stepCard}>
          <div className={styles.stepNum}>02</div>
          <p className={styles.stepTitle}>Set up your AI agent</p>
          <p className={styles.stepDesc}>
            Fill a simple form about your business — services, pricing, tone, and how your agent should talk. Takes about 5–10 minutes.
          </p>
        </div>
        <div className={styles.stepCard}>
          <div className={styles.stepNum}>03</div>
          <p className={styles.stepTitle}>Go live</p>
          <p className={styles.stepDesc}>
            Turn on your AI agent. It replies to DMs, handles comments, captures leads, and sends them to your dashboard — 24/7.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <p className={styles.featuresTitle}>What you get</p>

        <div className={styles.featureRow}>
          <div className={styles.featureIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className={styles.featureText}>
            <p className={styles.featureTitle}>AI DM Replies</p>
            <p className={styles.featureDesc}>Answers customer DMs instantly</p>
          </div>
        </div>

        <div className={styles.featureRow}>
          <div className={styles.featureIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div className={styles.featureText}>
            <p className={styles.featureTitle}>Auto Comment Replies</p>
            <p className={styles.featureDesc}>Responds to comments on your posts and reels</p>
          </div>
        </div>

        <div className={styles.featureRow}>
          <div className={styles.featureIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className={styles.featureText}>
            <p className={styles.featureTitle}>Lead Capture</p>
            <p className={styles.featureDesc}>Collects phone, email, and custom info automatically</p>
          </div>
        </div>

        <div className={styles.featureRow}>
          <div className={styles.featureIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className={styles.featureText}>
            <p className={styles.featureTitle}>Knowledge Base</p>
            <p className={styles.featureDesc}>Your agent learns your business and talks like you</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <button className={styles.ctaBtn} onClick={onConnect} disabled={connecting}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
          </svg>
          {connecting ? "Redirecting..." : "Connect Instagram"}
        </button>
        <p className={styles.ctaNote}>Takes 30 seconds. We only need read and reply permissions.</p>
      </section>

    </div>
  );
}
