"use client";

import { useState } from "react";
import styles from "./welcome-cards.module.css";

interface Props {
  onDismiss: () => void;
}

export default function WelcomeCards({ onDismiss }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"right" | "left">("right");

  const goNext = () => {
    setDirection("right");
    setCurrent((c) => Math.min(c + 1, 4));
  };

  const goBack = () => {
    setDirection("left");
    setCurrent((c) => Math.max(c - 1, 0));
  };

  return (
    <div className={styles.overlay}>
      <button className={styles.skip} onClick={onDismiss}>Skip</button>

      <div className={styles.cardWrap}>
        {/* key remounts the card div, triggering slide animation */}
        <div
          key={current}
          className={`${styles.card} ${direction === "right" ? styles.slideRight : styles.slideLeft}`}
        >
          {current === 0 && <CardKnowledgeBase />}
          {current === 1 && <CardDM />}
          {current === 2 && <CardComments />}
          {current === 3 && <CardLeads />}
          {current === 4 && <CardReady onDismiss={onDismiss} />}
        </div>

        {/* Dot indicators */}
        <div className={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
            />
          ))}
        </div>

        {/* Navigation — no Next on last card */}
        <div className={styles.nav}>
          <button className={styles.backBtn} onClick={goBack} disabled={current === 0}>
            Back
          </button>
          {current < 4 && (
            <button className={styles.nextBtn} onClick={goNext}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Card 1: Knowledge Base ── */
function CardKnowledgeBase() {
  return (
    <>
      <div className={styles.iconCircle} style={{ background: "rgba(16, 185, 129, 0.15)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h2 className={styles.title}>Your Knowledge Base is your agent&apos;s brain</h2>
      <p className={styles.subtitle}>
        This is where your AI agent learns everything about your business.
      </p>

      <div className={styles.miniVisual}>
        <div className={styles.kbRow}>
          <div className={styles.kbRowIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className={styles.kbRowLabel}>Services &amp; Pricing</span>
          <span className={styles.kbCheck}>✓</span>
        </div>
        <div className={styles.kbRow}>
          <div className={styles.kbRowIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </div>
          <span className={styles.kbRowLabel}>Agent Behavior &amp; Tone</span>
          <span className={styles.kbCheck}>✓</span>
        </div>
        <div className={styles.kbRow}>
          <div className={styles.kbRowIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <span className={styles.kbRowLabel}>Lead Capture Rules</span>
          <span className={styles.kbCheck}>✓</span>
        </div>
      </div>

      <p className={styles.visualNote}>
        You can edit your knowledge base anytime. The smarter you fill it, the better your agent performs.
      </p>
    </>
  );
}

/* ── Card 2: AI DM Agent ── */
function CardDM() {
  return (
    <>
      <div className={styles.iconCircle} style={{ background: "rgba(59, 130, 246, 0.15)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </div>
      <h2 className={styles.title}>Your AI handles every DM — 24/7</h2>
      <p className={styles.subtitle}>
        When a customer messages you on Instagram, your AI agent replies instantly using your knowledge base.
      </p>

      <div className={styles.miniVisual}>
        <div className={styles.chatWrap}>
          <div className={styles.bubbleCustomer}>How much for a helmet? 👀</div>
          <div className={styles.bubbleAgent}>
            Helmet ka ₹1,500–₹3,500 hota hai design ke hisaab se. Kaunsa design pasand hai? 😊
          </div>
        </div>
      </div>

      <p className={styles.visualNote}>
        Your agent qualifies leads, answers pricing questions, and captures contact info — all automatically.
      </p>
    </>
  );
}

/* ── Card 3: Auto Comment Replies ── */
function CardComments() {
  return (
    <>
      <div className={styles.iconCircle} style={{ background: "rgba(139, 92, 246, 0.15)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
      <h2 className={styles.title}>Never miss a comment again</h2>
      <p className={styles.subtitle}>
        Your agent replies to comments on your posts and reels. Questions get answered, compliments get thanked, and interested people get pushed to DMs.
      </p>

      <div className={styles.miniVisual}>
        <div className={styles.commentPairs}>
          <div className={styles.commentPair}>
            <div className={styles.commentOriginalRow}>
              <span className={styles.commentUsername}>@customer_1</span>
              How much is this?
            </div>
            <div className={styles.commentReplyRow}>
              <span className={styles.replyUsername}>@yourbrand</span>
              DM karo, details bhejta hoon! 🙌
            </div>
          </div>
          <div className={styles.commentPair}>
            <div className={styles.commentOriginalRow}>
              <span className={styles.commentUsername}>@customer_2</span>
              This looks amazing 🔥
            </div>
            <div className={styles.commentReplyRow}>
              <span className={styles.replyUsername}>@yourbrand</span>
              Thanks bhai! 🙏
            </div>
          </div>
        </div>
      </div>

      <p className={styles.visualNote}>
        Set your comment style, trigger keywords, and reel context from the dashboard.
      </p>
    </>
  );
}

/* ── Card 4: Lead Capture ── */
function CardLeads() {
  return (
    <>
      <div className={styles.iconCircle} style={{ background: "rgba(245, 158, 11, 0.15)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2 className={styles.title}>Every lead, captured automatically</h2>
      <p className={styles.subtitle}>
        Your agent collects phone numbers, emails, and inquiry details from DM conversations and saves them to your leads dashboard.
      </p>

      <div className={styles.miniVisual}>
        <table className={styles.leadsTable}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Phone</th>
              <th>Inquiry</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>@rider_99</td>
              <td>98765xxxxx</td>
              <td>Helmet pricing</td>
              <td><span className={styles.scoreHot}>🔥 Hot</span></td>
            </tr>
            <tr>
              <td>@priya_m</td>
              <td>87654xxxxx</td>
              <td>Full bike quote</td>
              <td><span className={styles.scoreWarm}>Warm</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={styles.visualNote}>
        Export leads as CSV anytime. Track status from New → Contacted → Converted.
      </p>
    </>
  );
}

/* ── Card 5: You're Ready ── */
function CardReady({ onDismiss }: { onDismiss: () => void }) {
  return (
    <>
      <div className={styles.iconCircle} style={{ background: "rgba(16, 185, 129, 0.15)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m3.29 15 5 5" />
          <path d="M20 4 8 16" />
          <path d="m4 20 5-5" />
          <path d="M14 4l6 6" />
          <path d="m8 10 6-6" />
        </svg>
      </div>
      <h2 className={styles.title}>You&apos;re all set to go live!</h2>
      <p className={styles.subtitle}>Here&apos;s what to do next:</p>

      <div className={styles.miniVisual}>
        <div className={styles.checklist}>
          <div className={styles.checkStep}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>Fill your Knowledge Base</span>
              <span className={styles.stepHelper}>Takes 5–10 minutes. The more detail, the smarter your agent.</span>
            </div>
          </div>
          <div className={styles.checkStep}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>Test your AI agent</span>
              <span className={styles.stepHelper}>Send test messages to see how it replies before going live.</span>
            </div>
          </div>
          <div className={styles.checkStep}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>Turn on your agent</span>
              <span className={styles.stepHelper}>Toggle AI DM Replies and Auto Comments on from the dashboard.</span>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.ctaBtn} onClick={onDismiss}>
        Go to Dashboard
      </button>
    </>
  );
}
