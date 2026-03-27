"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import WelcomeScreen from "./WelcomeScreen";
import WelcomeCards from "./WelcomeCards";
import HelpTooltip from "./HelpTooltip";

// ── Help tooltip content ──────────────────────────────────────────────────────

const HELP_ACCOUNT = (
  <p>Shows your connected Instagram account and whether your AI agent is currently active. Your agent is active when either DM replies or Comment replies are turned on.</p>
);

const HELP_PERFORMANCE = (
  <p>Shows how your AI agent performed this week — DMs replied, comments replied, and your lead conversion rate. Resets every Monday.</p>
);

const HELP_DM = (
  <>
    <p>When turned on, your AI agent automatically replies to all incoming Instagram DMs using your knowledge base.</p>
    <p><strong>How it helps:</strong> Customers get instant replies 24/7, your agent qualifies leads, answers questions about pricing, services, location, and captures their contact info.</p>
    <p>Tips:</p>
    <ul>
      <li>Test your agent before going live using &ldquo;Test AI Agent&rdquo;</li>
      <li>Edit your knowledge base to improve replies</li>
      <li>Check your leads dashboard to see captured contacts</li>
      <li>Use temporary instructions for time-sensitive offers</li>
    </ul>
  </>
);

const HELP_COMMENTS = (
  <>
    <p>When turned on, your AI agent replies to comments on your Instagram posts and reels.</p>
    <p><strong>How it helps:</strong> Engages your audience automatically, answers common questions in comments, and pushes interested people to your DMs for detailed conversations.</p>
    <p>Tips:</p>
    <ul>
      <li>Set your comment behavior in Reply Configuration</li>
      <li>Add trigger keywords for specific auto-replies</li>
      <li>Add reel context so your agent knows what each reel shows</li>
      <li>For detailed questions, your agent sends a private DM automatically</li>
    </ul>
  </>
);

const HELP_TEMP = (
  <>
    <p>Override your AI agent&apos;s behavior in real time. Perfect for sales, closures, new offers, or anything time-sensitive.</p>
    <p><strong>How it works:</strong> Type your instruction, turn it on, and your agent will follow it immediately. Set an auto-disable timer so it turns off automatically.</p>
    <p>Examples:</p>
    <ul>
      <li>&ldquo;20% off all services this week — mention to anyone asking about pricing&rdquo;</li>
      <li>&ldquo;We&apos;re closed for Diwali from Oct 20–25 — tell customers we reopen Oct 26&rdquo;</li>
      <li>&ldquo;New service launched: ceramic coating starting ₹5,000 — promote to interested customers&rdquo;</li>
    </ul>
  </>
);

const HELP_REEL_CONTEXT = (
  <>
    <p>When customers comment or DM about a specific reel, your agent needs to know what that reel shows to reply properly.</p>
    <p><strong>How it helps:</strong> Add a short description for each reel — what service it shows, pricing, any special details. Your agent uses this to give accurate, specific replies.</p>
    <p>Tips:</p>
    <ul>
      <li>Start with your most popular reels</li>
      <li>Keep descriptions short — 1–2 lines with key info and pricing</li>
      <li>Check &ldquo;Reels Missing Context&rdquo; for reels customers are asking about</li>
    </ul>
  </>
);

type DashboardAccount = {
  username: string | null;
  token_expires_at: string | null;
  created_at: string | null;
};

type DashboardStats = {
  dms_handled: number;
  comments_replied: number;
  response_rate: number;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const LIVE_TEMPLATES = [
  { label: "🏷️ Running a Sale", text: "We are running a [X]% off sale on [offer] until [date]. Mention this in every conversation and encourage people to book or buy before the deadline. Link: " },
  { label: "🚫 Shop Temporarily Closed", text: "Our shop is currently closed until [date]. Let customers know we are not taking new bookings right now but they can join our waitlist at: " },
  { label: "🎁 New Offer", text: "We just launched a new offer: [offer name]. Price is [price]. Prioritize this offer in all conversations and send interested leads to: " },
  { label: "📅 Cohort Starting Soon", text: "Our next cohort starts on [date] and spots are limited to [number]. Create urgency around this in every conversation. Booking link: " },
  { label: "⏰ Limited Spots", text: "We only have [X] spots remaining. Mention this scarcity naturally in conversations to create urgency without being pushy." },
];

const EXPIRY_OPTIONS = [
  { value: "24h", label: "24 hours" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "none", label: "No expiry" },
];

function calcExpiryTimestamp(expiry: string): string | null {
  if (expiry === "none") return null;
  const d = new Date();
  if (expiry === "24h") d.setHours(d.getHours() + 24);
  else if (expiry === "3d") d.setDate(d.getDate() + 3);
  else if (expiry === "7d") d.setDate(d.getDate() + 7);
  return d.toISOString();
}

function formatRemainingTime(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `Expires in ${Math.ceil(hours)}h`;
  const days = hours / 24;
  return `Expires in ${Math.ceil(days)} day${Math.ceil(days) === 1 ? "" : "s"}`;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "No activity yet";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = ms / 60000;
  const hours = mins / 60;
  const days = hours / 24;
  if (mins < 1) return "just now";
  if (mins < 60) return `${Math.floor(mins)} minute${Math.floor(mins) === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? "" : "s"} ago`;
  if (days < 2) return "yesterday";
  if (days < 7) return `${Math.floor(days)} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function guessExpiryOption(expiresAt: string): string {
  const hours = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours <= 26) return "24h";
  if (hours <= 80) return "3d";
  if (hours <= 180) return "7d";
  return "none";
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [connected, setConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dmActive, setDmActive] = useState(false);
  const [commentsActive, setCommentsActive] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | "dm" | "comments" | "disconnect" | "connect">(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [missingReelCount, setMissingReelCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [dmLastActive, setDmLastActive] = useState<string | null>(null);
  const [commentLastActive, setCommentLastActive] = useState<string | null>(null);

  // Temporary instructions
  const [tempActive, setTempActive] = useState(false);
  const [tempInstruction, setTempInstruction] = useState("");
  const [tempExpiry, setTempExpiry] = useState("none");
  const [tempExpiresAt, setTempExpiresAt] = useState<string | null>(null);
  const [tempSaving, setTempSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showWelcomeCards, setShowWelcomeCards] = useState(false);

  // Chat modal
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.replace("/");
          return;
        }

        setAccessToken(session.access_token);

        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.status === 401) {
          router.replace("/");
          return;
        }

        if (!res.ok) throw new Error("Failed to load dashboard");

        const data = await res.json();
        setConnected(data.connected);
        setIsConfigured(data.isConfigured);
        setAccount(data.account);
        setStats(data.stats);
        setDmActive(data.automation?.dm_active ?? false);
        setCommentsActive(data.automation?.comment_active ?? false);
        setMissingReelCount(data.missingReelCount ?? 0);
        setLeadsCount(data.leadsCount ?? 0);
        setDmLastActive(data.dmLastActive ?? null);
        setCommentLastActive(data.commentLastActive ?? null);
        setTempInstruction(data.tempInstructions ?? "");

        const expiresAt: string | null = data.tempInstructionsExpiresAt ?? null;
        const isExpired = expiresAt !== null && new Date(expiresAt) < new Date();

        if (data.tempInstructionsActive && isExpired) {
          setTempActive(false);
          setTempExpiresAt(null);
          setTempExpiry("none");
          fetch("/api/temp-instructions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ active: false, expiresAt: null }),
          }).catch(() => {});
        } else {
          setTempActive(data.tempInstructionsActive ?? false);
          setTempExpiresAt(expiresAt);
          setTempExpiry(expiresAt && !isExpired ? guessExpiryOption(expiresAt) : "none");
        }

        if (data.connected && !data.isConfigured) {
          router.replace("/onboarding");
          return;
        }

        if (data.connected && data.isConfigured) {
          const seen = localStorage.getItem("welcome_cards_shown");
          if (!seen) setShowWelcomeCards(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDashboard();
  }, [router, supabase.auth]);

  // Scroll chat to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatSending]);

  const handleToggleDm = async () => {
    if (!accessToken) return;
    setLoading("dm");
    try {
      const res = await fetch("/api/automation/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ active: !dmActive }),
      });
      if (!res.ok) throw new Error();
      setDmActive(!dmActive);
    } catch {
      alert("Failed to update DM automation.");
    } finally {
      setLoading(null);
    }
  };

  const handleToggleComments = async () => {
    if (!accessToken) return;
    setLoading("comments");
    try {
      const res = await fetch("/api/automation/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ active: !commentsActive }),
      });
      if (!res.ok) throw new Error();
      setCommentsActive(!commentsActive);
    } catch {
      alert("Failed to update comment automation.");
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (!accessToken) return;
    setLoading("disconnect");
    try {
      const res = await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      router.push("/");
    } catch {
      alert("There was a problem disconnecting Instagram.");
      setLoading(null);
    }
  };

  const handleConnectInstagram = async () => {
    if (!accessToken) return;
    setLoading("connect");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data?.url) throw new Error();
      window.location.assign(data.url);
    } catch {
      alert("Failed to start Instagram Business connection.");
      setLoading(null);
    }
  };

  const handleViewKnowledgeForm = () => {
    router.push("/dashboard/knowledge-base");
  };

  const handleSendTestMessage = async () => {
    if (!chatInput.trim() || chatSending) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatSending(true);

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: userMsg },
    ];
    setChatHistory(updatedHistory);

    try {
      // Always use a fresh session token so an expired state value never causes 401
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("not authenticated");

      const res = await fetch("/api/ai/test-dm", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatHistory([...updatedHistory, { role: "assistant", content: data.reply }]);
    } catch {
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: "Failed to get a response. Please try again." },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const handleDismissWelcomeCards = () => {
    localStorage.setItem("welcome_cards_shown", "true");
    setShowWelcomeCards(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleTempActive = async () => {
    if (!accessToken || tempSaving) return;
    const newActive = !tempActive;
    setTempActive(newActive);
    if (!newActive) {
      setTempSaving(true);
      try {
        const res = await fetch("/api/temp-instructions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ active: false, expiresAt: null }),
        });
        if (!res.ok) throw new Error();
        setTempExpiresAt(null);
        setTempExpiry("none");
        showToast("Temporary instructions paused.");
      } catch {
        setTempActive(true);
      } finally {
        setTempSaving(false);
      }
    }
  };

  const handleSaveTempInstruction = async () => {
    if (!accessToken) return;
    setTempSaving(true);
    const expiresAt = calcExpiryTimestamp(tempExpiry);
    try {
      const res = await fetch("/api/temp-instructions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ active: true, instruction: tempInstruction, expiresAt }),
      });
      if (!res.ok) throw new Error();
      setTempExpiresAt(expiresAt);
      showToast("Temporary instructions are now live!");
    } catch {
      alert("Failed to save instructions.");
    } finally {
      setTempSaving(false);
    }
  };

  if (initialLoading) {
    return <div className={styles.loadingWrapper}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header — only when connected */}
      {connected && (
        <header className={styles.header}>
          <div className={`${styles.badge} ${styles.badgeConnected}`}>
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            @{account?.username}
          </div>
        </header>
      )}

      {!connected ? (
        /* ── Not connected — welcome screen ── */
        <WelcomeScreen
          onConnect={handleConnectInstagram}
          connecting={loading === "connect"}
        />
      ) : (
        <main className={styles.body}>
          {/* ── Connected ── */}
          <>
            {/* Missing reels attention banner */}
            {missingReelCount > 0 && (
              <div className={styles.attentionBanner} onClick={() => router.push("/dashboard/reel-context")} role="button" tabIndex={0}>
                <span className={styles.attentionBannerIcon}>⚠</span>
                <span className={styles.attentionBannerText}>
                  {missingReelCount} reel{missingReelCount !== 1 ? "s" : ""} need your attention — customers are asking about reels your agent can&apos;t describe yet.
                </span>
                <span className={styles.attentionBannerArrow}>→</span>
              </div>
            )}

            {/* Account + Stats row */}
            <div className={styles.grid}>
              {/* Account */}
              <div className={styles.card}>
                <div className={styles.cardLabelRow}>
                  <p className={styles.cardLabel}>Account</p>
                  <HelpTooltip title="Your Account" content={HELP_ACCOUNT} />
                </div>
                <div className={styles.accountGrid}>
                  <div className={styles.accountField}>
                    <label>Username</label>
                    <p>@{account?.username}</p>
                  </div>
                  <div className={styles.accountField}>
                    <label>Agent Status</label>
                    <div className={styles.agentStatus}>
                      <span className={`${styles.agentDot} ${(dmActive || commentsActive) ? styles.agentDotActive : styles.agentDotInactive}`} />
                      <span className={styles.agentStatusText}>{(dmActive || commentsActive) ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={styles.card}>
                <div className={styles.cardLabelRow}>
                  <p className={styles.cardLabel}>Performance</p>
                  <HelpTooltip title="Weekly Performance" content={HELP_PERFORMANCE} />
                </div>
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <p className={styles.statValue}>{stats?.dms_handled ?? 0}</p>
                    <p className={styles.statLabel}>DMs Replied</p>
                  </div>
                  <div className={styles.statBox}>
                    <p className={styles.statValue}>{stats?.comments_replied ?? 0}</p>
                    <p className={styles.statLabel}>Comments Replied</p>
                  </div>
                  <div className={styles.statBox}>
                    <p className={styles.statValue}>
                      {(stats?.dms_handled ?? 0) > 0
                        ? `${Math.round((leadsCount / stats!.dms_handled) * 100)}%`
                        : "0%"}
                    </p>
                    <p className={styles.statLabel}>Lead Conversion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Automation controls */}
            <div className={styles.automationGrid}>
              {/* AI DM Replies */}
              <div className={styles.automationCard}>
                <div className={styles.automationCardHeader}>
                  <div className={styles.automationCardInfo}>
                    <div className={styles.automationTitleRow}>
                      <p className={styles.automationCardTitle}>AI DM Replies</p>
                      <HelpTooltip title="AI DM Replies" content={HELP_DM} />
                    </div>
                    <p className={styles.automationCardDesc}>Automatically reply to incoming direct messages.</p>
                    <p className={styles.automationCardLastActive}>
                      {dmLastActive ? `Last active: ${formatRelativeTime(dmLastActive)}` : "No activity yet"}
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={dmActive}
                      onChange={handleToggleDm}
                      disabled={loading === "dm"}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
                <div className={styles.automationCardBtns}>
                  <button className={styles.automationBtn} onClick={handleViewKnowledgeForm}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    View &amp; Edit Knowledge Base
                  </button>
                  <button className={`${styles.automationBtn} ${styles.automationBtnEmerald}`} onClick={() => setShowChat(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Test AI Agent
                  </button>
                </div>
              </div>

              {/* Auto Comment Replies */}
              <div className={styles.automationCard}>
                <div className={styles.automationCardHeader}>
                  <div className={styles.automationCardInfo}>
                    <div className={styles.automationTitleRow}>
                      <p className={styles.automationCardTitle}>Auto Comment Replies</p>
                      <HelpTooltip title="Auto Comment Replies" content={HELP_COMMENTS} />
                    </div>
                    <p className={styles.automationCardDesc}>Reply to new comments on your posts automatically.</p>
                    <p className={styles.automationCardLastActive}>
                      {commentLastActive ? `Last active: ${formatRelativeTime(commentLastActive)}` : "No activity yet"}
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={commentsActive}
                      onChange={handleToggleComments}
                      disabled={loading === "comments"}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
                <div className={styles.automationCardBtns}>
                  <button className={styles.automationBtn} onClick={() => router.push("/dashboard/comment-replies")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Edit Comment Behavior
                  </button>
                </div>
              </div>
            </div>

            {/* Live Agent Instructions */}
            <div className={styles.cardFull}>
              <div className={styles.liveCardHeader}>
                <p className={styles.cardLabel}>Live Agent Instructions</p>
                <div className={styles.liveStatusPill}>
                  <span className={`${styles.dot} ${tempActive ? styles.dotGreen : styles.dotGray}`} />
                  {tempActive && tempInstruction.trim() ? (
                    <span className={styles.liveStatusActive}>
                      <span className={styles.liveStatusText}>{tempInstruction}</span>
                      <span className={styles.liveBadge}>Live</span>
                    </span>
                  ) : (
                    <span className={styles.liveStatusText}>No live instructions set</span>
                  )}
                </div>
              </div>

              <div className={styles.liveHeaderRow}>
                <div>
                  <div className={styles.toggleTitleRow}>
                    <p className={styles.toggleTitle}>Temporary Instructions</p>
                    <HelpTooltip title="Temporary Instructions" content={HELP_TEMP} />
                  </div>
                  <p className={styles.toggleDesc}>Override your AI agent in real time — sales, closures, new offers, or anything time-sensitive.</p>
                  {tempActive && tempExpiresAt && new Date(tempExpiresAt) > new Date() && (
                    <p className={styles.expiryCountdown}>{formatRemainingTime(tempExpiresAt)}</p>
                  )}
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={tempActive}
                    onChange={handleToggleTempActive}
                    disabled={tempSaving}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>

              {tempActive && (
                <>
                  <div className={styles.liveTextareaWrapper}>
                    <textarea
                      className={styles.liveTextarea}
                      placeholder="Example: We're running 20% off on all helmets this week. Mention this to anyone asking about helmet pricing."
                      value={tempInstruction}
                      onChange={(e) => setTempInstruction(e.target.value.slice(0, 500))}
                      rows={3}
                    />
                    <span className={`${styles.charCounter} ${tempInstruction.length >= 500 ? styles.charCounterLimit : ""}`}>
                      {tempInstruction.length} / 500
                    </span>
                  </div>

                  <div className={styles.templatesSection}>
                    <span className={styles.templatesLabel}>Quick templates:</span>
                    <div className={styles.templateChips}>
                      {LIVE_TEMPLATES.map((t) => (
                        <button key={t.label} className={styles.templateChip} onClick={() => setTempInstruction(t.text)}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.expiryRow}>
                    <span className={styles.expiryLabel}>Auto-disable after:</span>
                    <div className={styles.expiryPills}>
                      {EXPIRY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          className={`${styles.expiryPill} ${tempExpiry === opt.value ? styles.expiryPillActive : ""}`}
                          onClick={() => setTempExpiry(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.liveActions}>
                    <button className={styles.applyBtn} onClick={handleSaveTempInstruction} disabled={tempSaving}>
                      {tempSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </>
              )}

              <div className={styles.priorityNote}>
                <span>⚡</span>
                <span>Live instructions are injected at the top of every AI prompt and override your base knowledge base settings.</span>
              </div>
            </div>

            {/* Reel Context */}
            <div className={styles.reelContextCard}>
              <div className={styles.reelContextInfo}>
                <div className={styles.reelContextIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div>
                  <div className={styles.reelContextTitleRow}>
                    <p className={styles.reelContextTitle}>Reel Context</p>
                    <HelpTooltip title="Reel Context" content={HELP_REEL_CONTEXT} />
                  </div>
                  <p className={styles.reelContextDesc}>
                    Help the AI understand your reels — used when replying to DMs that mention a reel and when commenting on reel posts.
                  </p>
                </div>
              </div>
              <button
                className={styles.reelContextBtn}
                onClick={() => router.push("/dashboard/reel-context")}
              >
                Configure
              </button>
            </div>

            {/* Disconnect */}
            <div className={styles.footer}>
              <button
                className={styles.disconnectBtn}
                onClick={handleDisconnect}
                disabled={loading === "disconnect"}
              >
                {loading === "disconnect" ? "Disconnecting..." : "Disconnect Instagram"}
              </button>
            </div>
          </>
        </main>
      )}

      {/* ── Welcome cards (first-time, post-connection) ── */}
      {showWelcomeCards && <WelcomeCards onDismiss={handleDismissWelcomeCards} />}

      {/* ── Toast ── */}
      {toast && (
        <div className={styles.toast}>✓ {toast}</div>
      )}

      {/* ── AI Test Chat Modal ── */}
      {showChat && (
        <div className={styles.modalOverlay} onClick={() => setShowChat(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalTitle}>Test AI Agent</p>
                <p className={styles.modalSubtitle}>Simulate how the AI responds to DMs</p>
              </div>
              <div className={styles.modalHeaderActions}>
                <button
                  className={styles.resetBtn}
                  onClick={async () => {
                    setChatHistory([]);
                    if (accessToken) {
                      await fetch("/api/ai/reset-dm", {
                        method: "POST",
                        credentials: "include",
                        headers: { Authorization: `Bearer ${accessToken}` },
                      });
                    }
                  }}
                  disabled={chatSending}
                >
                  Reset
                </button>
                <button className={styles.closeBtn} onClick={() => setShowChat(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className={styles.chatMessages}>
              {chatHistory.length === 0 && !chatSending && (
                <p className={styles.chatEmpty}>
                  Send a message to preview how your AI agent will respond.
                </p>
              )}

              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={msg.role === "user" ? styles.bubbleUser : styles.bubbleAI}
                >
                  {msg.content}
                </div>
              ))}

              {chatSending && (
                <div className={styles.bubbleAI}>
                  <span className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input row */}
            <div className={styles.chatInputRow}>
              <input
                className={styles.chatInput}
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendTestMessage();
                  }
                }}
                disabled={chatSending}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSendTestMessage}
                disabled={chatSending || !chatInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
