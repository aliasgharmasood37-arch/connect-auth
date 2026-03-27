"use client";

import { useState, useEffect } from "react";
import styles from "./guide.module.css";

const SECTIONS = [
  {
    title: "Dashboard Overview",
    content: [
      "Your dashboard shows your connected Instagram account, performance stats, and automation controls.",
      "Performance shows DMs replied, comments replied, and lead conversion rate for this week.",
      "Use the toggles to turn your AI DM agent and comment agent on or off anytime.",
    ],
  },
  {
    title: "Knowledge Base",
    content: [
      "Your knowledge base is how your AI agent understands your business — services, pricing, tone, and behavior rules.",
      "It's organized in collapsible sections: Business Basics, Services & Pricing, Trust & Guarantees, Contact & Logistics, AI Agent Behavior, Lead Capture, and Comment Reply Settings.",
      "You can edit any field directly by clicking on it.",
      "Changes are saved and your agent is automatically reconfigured with the updated info.",
    ],
  },
  {
    title: "AI Assistant",
    content: [
      "The AI Assistant sits on the right side of your Knowledge Base page.",
      "Tell it what's wrong with your agent — replies too short, wrong tone, missing info, wrong prices — and it will suggest exactly what to change.",
      "It can also make changes directly to your knowledge base if you agree.",
    ],
  },
  {
    title: "Test Your AI Agent",
    content: [
      "Use the \"Test Agent\" tab next to the AI Assistant to simulate a DM conversation with your agent.",
      "Send test messages and see how your agent would reply based on your current knowledge base.",
      "Great for testing after making changes before going live.",
    ],
  },
  {
    title: "AI DM Replies",
    content: [
      "When enabled, your AI agent automatically replies to all incoming Instagram DMs.",
      "It uses your knowledge base to answer questions about pricing, services, location, and more.",
      "It qualifies leads by asking the right questions before sharing your contact details.",
      "It captures lead info (phone, email, etc.) based on your lead capture settings.",
    ],
  },
  {
    title: "Auto Comment Replies",
    content: [
      "When enabled, your AI agent replies to comments on your Instagram posts and reels.",
      "Reply behavior is controlled by your Comment Reply Settings in the Knowledge Base — short replies, detailed replies, how to handle positive and negative comments.",
      "For pricing or detailed questions, the agent can also send a private DM with more info.",
    ],
  },
  {
    title: "Trigger Keywords",
    content: [
      "Trigger keywords let you set specific auto-replies for specific words in comments.",
      "If someone comments a keyword you've set, the agent replies with your custom message instead of generating one.",
      "You can set keywords for specific reels or all reels.",
      "Keywords are checked first — if no keyword matches, the agent uses its AI to reply.",
    ],
  },
  {
    title: "Comment Reply Rules",
    content: [
      "Reply rules are fallback instructions for when no trigger keyword matches.",
      "Set what the agent should always mention — price, location, current offers.",
      "Add custom instructions for specific reels.",
      "These rules apply to specific reels only. For general comment behavior, edit Comment Reply Settings in the Knowledge Base.",
    ],
  },
  {
    title: "Temporary Instructions",
    content: [
      "Use temporary instructions to override your agent's behavior in real time.",
      "Great for sales, closures, limited offers, or any time-sensitive info.",
      "Set an auto-disable timer so instructions turn off automatically after 24 hours, 3 days, or 7 days.",
    ],
  },
  {
    title: "Reel Context",
    content: [
      "When customers comment or DM about a specific reel, your agent needs context about that reel to reply properly.",
      "Add context to your reels so the agent knows what each reel shows — services, pricing, or details.",
      "Reels Missing Context shows reels that customers are asking about but your agent can't describe yet. Add context to these first.",
    ],
  },
  {
    title: "Leads",
    content: [
      "Every lead your AI agent captures shows up in the Leads dashboard.",
      "You can see their Instagram username, contact info, what they asked about, and lead score.",
      "Click on a lead to see more details. Change the status (New, Contacted, Converted, Lost) to track your pipeline.",
      "Export all leads as a CSV anytime.",
    ],
  },
];

export default function UserGuide({
  open,
  firstTime,
  onClose,
}: {
  open: boolean;
  firstTime: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<boolean[]>(
    () => Array(SECTIONS.length).fill(false)
  );

  // Reset all sections to collapsed whenever panel opens
  useEffect(() => {
    if (open) {
      setExpanded(Array(SECTIONS.length).fill(false));
    }
  }, [open]);

  const toggle = (i: number) =>
    setExpanded((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Panel */}
      <div className={`${styles.panel} ${styles.panelOpen}`}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelTitle}>How to use InstaAutomate</h2>
            <button className={styles.panelClose} onClick={onClose} aria-label="Close guide">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className={styles.panelSubtitle}>
            Everything you need to know to get the most out of your AI agent.
          </p>
        </div>

        {/* First-time banner */}
        {firstTime && (
          <div className={styles.welcomeBanner}>
            <span className={styles.welcomeBannerIcon}>🎉</span>
            Your AI agent is set up! Here&apos;s a quick guide to help you get the most out of InstaAutomate.
          </div>
        )}

        {/* Scrollable content */}
        <div className={styles.panelBody}>
          {SECTIONS.map((section, i) => (
            <div key={i} className={styles.section}>
              <button
                className={styles.sectionBtn}
                onClick={() => toggle(i)}
                aria-expanded={expanded[i]}
              >
                <span className={styles.sectionTitle}>{section.title}</span>
                <svg
                  className={`${styles.chevron}${expanded[i] ? " " + styles.chevronOpen : ""}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className={`${styles.sectionBody}${expanded[i] ? " " + styles.sectionBodyOpen : ""}`}>
                <div className={styles.sectionContent}>
                  {section.content.map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
