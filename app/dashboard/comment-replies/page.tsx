"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./comment-replies.module.css";

// ── Types ────────────────────────────────────────────────────────────────────

type Scope = "all" | "specific";

type KeywordRule = {
  id: string;
  keyword: string;
  replyMessage: string;
  scope: Scope;
  reelUrls: string[];
  sendPrivateDm: boolean;
  privateDmMessage: string;
  active: boolean;
};

type AppliesTo = "all_reels" | "specific_reels";

type ReplyRule = {
  id: string;
  alwaysMentionPrice: string;
  alwaysMentionLocation: string;
  alwaysMentionOffer: string;
  customInstruction: string;
  applies_to: AppliesTo;
  reel_urls: string[];
  active: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapKeyword(row: any): KeywordRule {
  return {
    id: row.id,
    keyword: row.keyword,
    replyMessage: row.reply_message,
    scope: row.scope,
    reelUrls: row.reel_urls ?? [],
    sendPrivateDm: row.send_private_dm ?? false,
    privateDmMessage: row.private_dm_message ?? "",
    active: row.active,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReplyRule(row: any): ReplyRule {
  const r = row.rules ?? {};
  return {
    id: row.id,
    alwaysMentionPrice:    r.always_mention_price    ?? "",
    alwaysMentionLocation: r.always_mention_location ?? "",
    alwaysMentionOffer:    r.always_mention_offer    ?? "",
    customInstruction:     r.custom_instruction      ?? "",
    applies_to: row.applies_to ?? "all_reels",
    reel_urls:  row.reel_urls  ?? [],
    active:     row.active,
  };
}

const EMPTY_RULE_FORM = {
  alwaysMentionPrice: "",
  alwaysMentionLocation: "",
  alwaysMentionOffer: "",
  customInstruction: "",
  applies_to: "specific_reels" as AppliesTo,
  reel_urls: [""] as string[],
};

// ── Comment Config ─────────────────────────────────────────────────────────────

type CommentConfig = {
  reply_style: string;
  dm_push_message: string;
  reply_to: string;
  positive_handling: string;
  negative_handling: string;
};

const DEFAULT_CONFIG: CommentConfig = {
  reply_style: "Friendly",
  dm_push_message: "",
  reply_to: "all",
  positive_handling: "thank_and_engage",
  negative_handling: "address_politely",
};

function buildConfigSummary(cfg: CommentConfig): string {
  const styleMap: Record<string, string> = {
    short_push_to_dm: "Short replies, pushes to DMs",
    detailed: "Detailed replies in comments",
    questions_only: "Only replies to questions",
    Friendly: "Friendly replies", Professional: "Professional replies",
    Casual: "Casual replies", Witty: "Witty replies",
  };
  const replyToMap: Record<string, string> = {
    all: "replies to all comments",
    questions_and_compliments: "replies to questions and compliments",
    questions_only: "replies to questions only",
    questions: "replies to questions only",
    new_followers: "replies to new followers",
  };
  const positiveMap: Record<string, string> = {
    thank_and_engage: "Thanks warmly for positive comments",
    thank_briefly: "Thanks briefly for positive comments",
    ignore_positive: "Ignores compliments",
  };
  const negativeMap: Record<string, string> = {
    address_politely: "addresses negative comments politely",
    brief_response: "responds briefly to negative comments",
    ignore_negative: "ignores negative comments",
  };
  const style = styleMap[cfg.reply_style] ?? cfg.reply_style;
  const replyTo = replyToMap[cfg.reply_to] ?? cfg.reply_to;
  const pos = positiveMap[cfg.positive_handling] ?? "";
  const neg = negativeMap[cfg.negative_handling] ?? "";
  const line1 = `${style}; ${replyTo}.`;
  const line2 = pos || neg ? `${pos}${pos && neg ? "; " : ""}${neg ? neg.charAt(0).toUpperCase() + neg.slice(1) : ""}.` : "";
  return [line1, line2].filter(Boolean).join(" ");
}

// ── HelpTooltip sub-component ─────────────────────────────────────────────

function HelpTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.helpWrap}>
      <button
        type="button"
        className={styles.helpIcon}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        aria-label="How private DM works"
      >
        ?
      </button>
      {open && (
        <div className={styles.helpTooltip}>
          <p className={styles.helpTooltipTitle}>How it works</p>
          <p className={styles.helpTooltipText}>
            User comments: &quot;price&quot;<br />
            ↓ Bot replies publicly: &quot;Check your DMs 👀&quot;<br />
            ↓ Bot sends a private DM with the full details.
          </p>
        </div>
      )}
    </div>
  );
}

// ── ApplyTo info tooltip ──────────────────────────────────────────────────────

function ApplyToInfoTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={styles.helpWrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.helpIcon}
        onClick={() => setOpen((v) => !v)}
        aria-label="About Apply To"
      >
        ?
      </button>
      {open && (
        <div className={styles.applyToTooltip}>
          <p className={styles.helpTooltipText}>
            Want to change behavior for all reels? Edit your Comment Configuration in the{" "}
            <a href="/dashboard/knowledge-base" className={styles.tooltipLink}>Knowledge Base</a>.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Reel URL list sub-component ───────────────────────────────────────────────

function ReelUrlList({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const update = (i: number, val: string) => {
    const next = [...urls];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => onChange(urls.filter((_, idx) => idx !== i));
  const add = () => onChange([...urls, ""]);

  return (
    <div className={styles.reelUrlList}>
      {urls.map((url, i) => (
        <div key={i} className={styles.reelUrlRow}>
          <input
            className={styles.input}
            placeholder="https://www.instagram.com/reel/..."
            value={url}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            className={styles.reelUrlRemove}
            onClick={() => remove(i)}
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
      <button type="button" className={styles.reelUrlAdd} onClick={add}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Reel URL
      </button>
    </div>
  );
}

// ── Scope selector sub-component ─────────────────────────────────────────────

function ScopeSelector({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div className={styles.scopeSelector}>
      <button
        type="button"
        className={`${styles.scopeOption} ${value === "all" ? styles.scopeActive : ""}`}
        onClick={() => onChange("all")}
      >
        All reels
      </button>
      <button
        type="button"
        className={`${styles.scopeOption} ${value === "specific" ? styles.scopeActive : ""}`}
        onClick={() => onChange("specific")}
      >
        Specific reels only
      </button>
    </div>
  );
}

// ── DM Flow section sub-component ────────────────────────────────────────────

function DmFlowSection({
  sendDm,
  dmMessage,
  onToggle,
  onMessageChange,
}: {
  sendDm: boolean;
  dmMessage: string;
  onToggle: (v: boolean) => void;
  onMessageChange: (v: string) => void;
}) {
  return (
    <div className={styles.dmSection}>
      <div className={styles.dmFlowRow}>
        <svg className={styles.dmArrowIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
        <span className={styles.dmFlowLabel}>Send Private DM</span>
        <label className={styles.miniToggle}>
          <input type="checkbox" checked={sendDm} onChange={(e) => onToggle(e.target.checked)} />
          <span className={styles.miniSlider} />
        </label>
        <HelpTooltip />
      </div>
      {sendDm && (
        <div className={styles.fieldGroup} style={{ marginTop: 10 }}>
          <label className={styles.fieldLabel}>Private DM Message</label>
          <textarea
            className={styles.textarea}
            placeholder="Hey! Thanks for asking. Here are the full details..."
            rows={2}
            value={dmMessage}
            onChange={(e) => onMessageChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CommentRepliesPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [ready, setReady] = useState(false);

  // Trigger keywords
  const [keywords, setKeywords] = useState<KeywordRule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newReply, setNewReply] = useState("");
  const [newScope, setNewScope] = useState<Scope>("all");
  const [newReelUrls, setNewReelUrls] = useState<string[]>([""]);
  const [newSendPrivateDm, setNewSendPrivateDm] = useState(false);
  const [newPrivateDmMessage, setNewPrivateDmMessage] = useState("");

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState("");
  const [editReply, setEditReply] = useState("");
  const [editScope, setEditScope] = useState<Scope>("all");
  const [editReelUrls, setEditReelUrls] = useState<string[]>([]);
  const [editSendPrivateDm, setEditSendPrivateDm] = useState(false);
  const [editPrivateDmMessage, setEditPrivateDmMessage] = useState("");

  // Reply rules
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE_FORM);
  const [ruleAdded, setRuleAdded] = useState(false);
  const [savedRules, setSavedRules] = useState<ReplyRule[]>([]);

  // Comment config (read-only summary — editing is done in Knowledge Base page)
  const [commentConfig, setCommentConfig] = useState<CommentConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [kwRes, rulesRes, cfgRes] = await Promise.all([
        fetch("/api/comment-trigger-keywords", { headers }),
        fetch("/api/comment-reply-rules", { headers }),
        fetch("/api/comment-config", { headers }),
      ]);

      if (kwRes.ok) {
        const kwData = await kwRes.json();
        setKeywords((kwData.keywords ?? []).map(mapKeyword));
      }
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setSavedRules((rulesData.rules ?? []).map(mapReplyRule));
      }
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) {
          setCommentConfig({
            ...DEFAULT_CONFIG,
            ...cfgData.config,
          });
        }
      }

      setReady(true);
    };
    init();
  }, [router, supabase.auth]);

  // ── Keyword actions ───────────────────────────────────────────────────────

  const resetAddForm = () => {
    setNewKeyword("");
    setNewReply("");
    setNewScope("all");
    setNewReelUrls([""]);
    setNewSendPrivateDm(false);
    setNewPrivateDmMessage("");
    setShowAddForm(false);
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !newReply.trim()) return;
    if (newSendPrivateDm && !newPrivateDmMessage.trim()) return;

    const urls = newScope === "specific"
      ? newReelUrls.map((u) => u.trim()).filter(Boolean)
      : [];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/comment-trigger-keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        keyword: newKeyword.trim(),
        replyMessage: newReply.trim(),
        scope: newScope,
        reelUrls: urls,
        sendPrivateDm: newSendPrivateDm,
        privateDmMessage: newSendPrivateDm ? newPrivateDmMessage.trim() : "",
        active: true,
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    setKeywords((prev) => [...prev, mapKeyword(data.keyword)]);
    resetAddForm();
  };

  const handleToggleKeyword = (id: string) => {
    let newActive = false;
    setKeywords((prev) => prev.map((k) => {
      if (k.id === id) { newActive = !k.active; return { ...k, active: newActive }; }
      return k;
    }));
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch(`/api/comment-trigger-keywords/${id}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ active: newActive }),
      });
    });
  };

  const handleDeleteKeyword = async (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    if (editingId === id) setEditingId(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/comment-trigger-keywords/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  };

  const startEdit = (rule: KeywordRule) => {
    setEditingId(rule.id);
    setEditKeyword(rule.keyword);
    setEditReply(rule.replyMessage);
    setEditScope(rule.scope);
    setEditReelUrls(rule.reelUrls.length > 0 ? [...rule.reelUrls] : [""]);
    setEditSendPrivateDm(rule.sendPrivateDm);
    setEditPrivateDmMessage(rule.privateDmMessage);
    setShowAddForm(false);
  };

  const saveEdit = async () => {
    if (!editKeyword.trim() || !editReply.trim()) return;
    if (editSendPrivateDm && !editPrivateDmMessage.trim()) return;

    const urls = editScope === "specific"
      ? editReelUrls.map((u) => u.trim()).filter(Boolean)
      : [];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/comment-trigger-keywords/${editingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        keyword: editKeyword.trim(),
        replyMessage: editReply.trim(),
        scope: editScope,
        reelUrls: urls,
        sendPrivateDm: editSendPrivateDm,
        privateDmMessage: editSendPrivateDm ? editPrivateDmMessage.trim() : "",
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    setKeywords((prev) => prev.map((k) => k.id === editingId ? mapKeyword(data.keyword) : k));
    setEditingId(null);
  };

  // ── Reply rules ───────────────────────────────────────────────────────────

  const handleSaveRule = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const cleanUrls = ruleForm.applies_to === "specific_reels"
      ? ruleForm.reel_urls.map((u) => u.trim()).filter(Boolean)
      : [];

    const res = await fetch("/api/comment-reply-rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...ruleForm, reel_urls: cleanUrls }),
    });

    if (!res.ok) return;
    const data = await res.json();
    setSavedRules((prev) => [...prev, mapReplyRule(data.rule)]);
    setRuleForm(EMPTY_RULE_FORM);
    setRuleAdded(true);
    setTimeout(() => setRuleAdded(false), 2500);
  };

  const handleToggleRule = (id: string) => {
    let newActive = false;
    setSavedRules((prev) => prev.map((r) => {
      if (r.id === id) { newActive = !r.active; return { ...r, active: newActive }; }
      return r;
    }));
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch(`/api/comment-reply-rules/${id}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ active: newActive }),
      });
    });
  };

  const handleDeleteRule = async (id: string) => {
    setSavedRules((prev) => prev.filter((r) => r.id !== id));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/comment-reply-rules/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  };

  if (!ready) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </button>
        <div>
          <h1 className={styles.title}>Comment Reply Configuration</h1>
          <p className={styles.desc}>Configure how the system responds to comments.</p>
        </div>
      </header>

      <main className={styles.body}>

        {/* ── Agent Behaviour (read-only summary) ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Agent Behaviour</p>
              <p className={styles.sectionDesc}>How the AI agent handles and responds to comments.</p>
            </div>
          </div>
          <div className={styles.configSummaryBlock}>
            <p className={styles.configSummaryText}>{buildConfigSummary(commentConfig)}</p>
            <button
              className={styles.editConfigBtn}
              onClick={() => router.push("/dashboard/knowledge-base#comment-config-section")}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Comment Settings
            </button>
          </div>
        </section>

        {/* ── Logic card ── */}
        <div className={styles.logicCard}>
          <div className={styles.logicStep}>
            <span className={styles.logicNum}>1</span>
            <div>
              <p className={styles.logicTitle}>Trigger keyword matched</p>
              <p className={styles.logicText}>If a comment contains a trigger keyword, the configured reply is sent immediately.</p>
            </div>
          </div>
          <div className={styles.logicDivider} />
          <div className={styles.logicStep}>
            <span className={styles.logicNum}>2</span>
            <div>
              <p className={styles.logicTitle}>No keyword matched</p>
              <p className={styles.logicText}>If no keyword matches, the AI generates a contextual reply guided by your Reply Rules.</p>
            </div>
          </div>
        </div>

        {/* ── Section 1: Trigger Keywords ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Trigger Keywords</p>
              <p className={styles.sectionDesc}>Send an instant reply when a comment contains a specific keyword.</p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Keyword
            </button>
          </div>

          {/* ── Add form ── */}
          {showAddForm && (
            <div className={styles.ruleForm}>
              <div className={styles.ruleFormTop}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Keyword</label>
                  <input
                    className={styles.input}
                    placeholder='e.g. "price"'
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Reply Comment</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="The public reply to post when this keyword is detected..."
                    rows={2}
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                  />
                </div>
              </div>

              <DmFlowSection
                sendDm={newSendPrivateDm}
                dmMessage={newPrivateDmMessage}
                onToggle={setNewSendPrivateDm}
                onMessageChange={setNewPrivateDmMessage}
              />

              <div className={styles.fieldGroup} style={{ marginTop: 14 }}>
                <label className={styles.fieldLabel}>Applies To</label>
                <ScopeSelector value={newScope} onChange={(s) => {
                  setNewScope(s);
                  if (s === "specific" && newReelUrls.length === 0) setNewReelUrls([""]);
                }} />
              </div>

              {newScope === "specific" && (
                <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
                  <label className={styles.fieldLabel}>Reel URLs</label>
                  <ReelUrlList urls={newReelUrls} onChange={setNewReelUrls} />
                </div>
              )}

              <div className={styles.ruleFormActions}>
                <button className={styles.cancelBtn} onClick={resetAddForm}>Cancel</button>
                <button
                  className={styles.saveBtn}
                  onClick={handleAddKeyword}
                  disabled={
                    !newKeyword.trim() ||
                    !newReply.trim() ||
                    (newSendPrivateDm && !newPrivateDmMessage.trim())
                  }
                >
                  Add Rule
                </button>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          {keywords.length === 0 && !showAddForm ? (
            <div className={styles.emptyTable}>
              <p className={styles.emptyText}>No keyword rules yet.</p>
              <p className={styles.emptySubtext}>Add a keyword to send automatic replies when it appears in a comment.</p>
            </div>
          ) : keywords.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Reply Comment</th>
                    <th>Applies To</th>
                    <th>Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((rule) => (
                    editingId === rule.id ? (
                      /* ── Edit row (full-width form) ── */
                      <tr key={rule.id} className={styles.editRow}>
                        <td colSpan={5}>
                          <div className={styles.ruleForm} style={{ margin: 0, borderRadius: 8 }}>
                            <div className={styles.ruleFormTop}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Keyword</label>
                                <input
                                  className={styles.input}
                                  value={editKeyword}
                                  onChange={(e) => setEditKeyword(e.target.value)}
                                />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Reply Comment</label>
                                <textarea
                                  className={styles.textarea}
                                  value={editReply}
                                  rows={2}
                                  onChange={(e) => setEditReply(e.target.value)}
                                />
                              </div>
                            </div>

                            <DmFlowSection
                              sendDm={editSendPrivateDm}
                              dmMessage={editPrivateDmMessage}
                              onToggle={setEditSendPrivateDm}
                              onMessageChange={setEditPrivateDmMessage}
                            />

                            <div className={styles.fieldGroup} style={{ marginTop: 14 }}>
                              <label className={styles.fieldLabel}>Applies To</label>
                              <ScopeSelector value={editScope} onChange={(s) => {
                                setEditScope(s);
                                if (s === "specific" && editReelUrls.length === 0) setEditReelUrls([""]);
                              }} />
                            </div>

                            {editScope === "specific" && (
                              <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
                                <label className={styles.fieldLabel}>Reel URLs</label>
                                <ReelUrlList urls={editReelUrls} onChange={setEditReelUrls} />
                              </div>
                            )}

                            <div className={styles.ruleFormActions}>
                              <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
                              <button
                                className={styles.saveBtn}
                                onClick={saveEdit}
                                disabled={
                                  !editKeyword.trim() ||
                                  !editReply.trim() ||
                                  (editSendPrivateDm && !editPrivateDmMessage.trim())
                                }
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      /* ── Normal row ── */
                      <tr key={rule.id}>
                        <td><span className={styles.keywordChip}>{rule.keyword}</span></td>
                        <td className={styles.replyCell}>
                          <span>{rule.replyMessage}</span>
                          {rule.sendPrivateDm && (
                            <span className={styles.dmBadge}>→ DM</span>
                          )}
                        </td>
                        <td>
                          {rule.scope === "all" ? (
                            <span className={styles.scopeBadgeAll}>All reels</span>
                          ) : (
                            <span className={styles.scopeBadgeSpecific}>
                              {rule.reelUrls.length} reel{rule.reelUrls.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </td>
                        <td>
                          <label className={styles.miniToggle}>
                            <input type="checkbox" checked={rule.active} onChange={() => handleToggleKeyword(rule.id)} />
                            <span className={styles.miniSlider} />
                          </label>
                        </td>
                        <td className={styles.rowActions}>
                          <button className={styles.editBtn} onClick={() => startEdit(rule)} title="Edit">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className={styles.deleteBtn} onClick={() => handleDeleteKeyword(rule.id)} title="Delete">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 2: Reply Rules ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Reply Rules</p>
              <p className={styles.sectionDesc}>Instructions the AI follows when no trigger keyword is matched.</p>
            </div>
          </div>

          {/* ── Create form ── */}
          <div className={styles.rulesForm}>
            <div className={styles.rulesGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Always Mention Price</label>
                <input className={styles.input} placeholder="e.g. $120 for most hydrodipping jobs" value={ruleForm.alwaysMentionPrice} onChange={(e) => setRuleForm((r) => ({ ...r, alwaysMentionPrice: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Always Mention Location</label>
                <input className={styles.input} placeholder="e.g. Miami, Florida" value={ruleForm.alwaysMentionLocation} onChange={(e) => setRuleForm((r) => ({ ...r, alwaysMentionLocation: e.target.value }))} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Always Mention Offer</label>
                <input className={styles.input} placeholder="e.g. 20% discount this week" value={ruleForm.alwaysMentionOffer} onChange={(e) => setRuleForm((r) => ({ ...r, alwaysMentionOffer: e.target.value }))} />
              </div>
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: "16px" }}>
              <label className={styles.fieldLabel}>Custom Instruction</label>
              <textarea className={styles.textarea} placeholder="e.g. Encourage users to send a DM for more details." rows={3} value={ruleForm.customInstruction} onChange={(e) => setRuleForm((r) => ({ ...r, customInstruction: e.target.value }))} />
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: "20px" }}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Apply To</label>
                <ApplyToInfoTooltip />
              </div>
              <ReelUrlList
                urls={ruleForm.reel_urls}
                onChange={(urls) => setRuleForm((r) => ({ ...r, reel_urls: urls }))}
              />
            </div>

            <div className={styles.rulesFooter}>
              {ruleAdded && (
                <span className={styles.savedBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added
                </span>
              )}
              <button className={styles.saveBtn} onClick={handleSaveRule}>Save Rule</button>
            </div>
          </div>

          {/* ── Saved rules table ── */}
          {savedRules.length > 0 && (
            <div className={styles.tableWrapper} style={{ marginTop: 24 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Applies To</th>
                    <th>Always Mention Price</th>
                    <th>Always Mention Location</th>
                    <th>Always Mention Offer</th>
                    <th>Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {savedRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        {rule.applies_to === "all_reels" ? (
                          <span className={styles.scopeBadgeAll}>All reels</span>
                        ) : (
                          <span className={styles.scopeBadgeSpecific}>
                            {rule.reel_urls.length} reel{rule.reel_urls.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className={styles.replyCell}>{rule.alwaysMentionPrice || "—"}</td>
                      <td className={styles.replyCell}>{rule.alwaysMentionLocation || "—"}</td>
                      <td className={styles.replyCell}>{rule.alwaysMentionOffer || "—"}</td>
                      <td>
                        <label className={styles.miniToggle}>
                          <input type="checkbox" checked={rule.active} onChange={() => handleToggleRule(rule.id)} />
                          <span className={styles.miniSlider} />
                        </label>
                      </td>
                      <td className={styles.rowActions}>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteRule(rule.id)} title="Delete">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
