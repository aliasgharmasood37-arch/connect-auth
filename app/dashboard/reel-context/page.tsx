"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./reel-context.module.css";

type SavedReel = {
  id: string;
  url: string;
  shortcode: string | null;
  context: string;
  created_at: string;
};

type MissingReel = {
  id: string;
  url: string;
  mention_count: number;
  last_mentioned_at: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateUrl(url: string, maxLen = 52): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + "…";
}

const MISSING_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "30days", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

function getDateCutoff(filter: string): string | null {
  const now = new Date();
  if (filter === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (filter === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // days since Monday
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff).toISOString();
  }
  if (filter === "30days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
  return null; // "all"
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Unknown";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ReelContextPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Saved reels (has context)
  const [savedReels, setSavedReels] = useState<SavedReel[]>([]);
  const [loadingReels, setLoadingReels] = useState(true);

  // Missing reels (no context)
  const [missingReels, setMissingReels] = useState<MissingReel[]>([]);
  const [loadingMissing, setLoadingMissing] = useState(true);

  // Inline edit state (section 1)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContext, setEditContext] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form state (section 1)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newContext, setNewContext] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addSavedId, setAddSavedId] = useState<string | null>(null);

  // Missing reels filter + refresh
  const [missingFilter, setMissingFilter] = useState("week");
  const [missingRefreshing, setMissingRefreshing] = useState(false);

  // Add context for missing reel (section 2)
  const [expandedMissingId, setExpandedMissingId] = useState<string | null>(null);
  const [missingContextText, setMissingContextText] = useState("");
  const [missingSaving, setMissingSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMissingReels = useCallback(async (token: string, filter: string) => {
    const since = getDateCutoff(filter);
    const url = since
      ? `/api/reel-context?missing=true&since=${encodeURIComponent(since)}`
      : "/api/reel-context?missing=true";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMissingReels(data.reels ?? []);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setAccessToken(session.access_token);

      const [savedRes] = await Promise.all([
        fetch("/api/reel-context", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetchMissingReels(session.access_token, "week"),
      ]);

      if (savedRes.ok) {
        const data = await savedRes.json();
        setSavedReels(data.reels ?? []);
      }
      setLoadingReels(false);
      setLoadingMissing(false);
      setReady(true);
    };
    init();
  }, [router, supabase.auth, fetchMissingReels]);

  // Poll missing reels every 30 seconds
  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(() => fetchMissingReels(accessToken, missingFilter), 30000);
    return () => clearInterval(id);
  }, [accessToken, missingFilter, fetchMissingReels]);

  // ── Add new reel (section 1) ─────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!newUrl.trim() || !newContext.trim() || !accessToken) return;
    setAddSaving(true);

    const res = await fetch("/api/reel-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url: newUrl.trim(), context: newContext.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setSavedReels((prev) => [data.reel, ...prev]);
      setAddSavedId(data.reel.id);
      setTimeout(() => setAddSavedId(null), 2500);
      setNewUrl("");
      setNewContext("");
      setShowAddForm(false);
    }
    setAddSaving(false);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewUrl("");
    setNewContext("");
  };

  // ── Inline edit (section 1) ──────────────────────────────────────────────────

  const startEdit = (reel: SavedReel) => {
    setEditingId(reel.id);
    setEditContext(reel.context);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContext("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContext.trim() || !accessToken) return;
    setEditSaving(true);

    const res = await fetch(`/api/reel-context/${editingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ context: editContext.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setSavedReels((prev) =>
        prev.map((r) => (r.id === editingId ? data.reel : r))
      );
      setEditingId(null);
      setEditContext("");
    }
    setEditSaving(false);
  };

  // ── Delete (section 1) ───────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    setDeletingId(id);

    const res = await fetch(`/api/reel-context/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      setSavedReels((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
    }
    setDeletingId(null);
  };

  // ── Missing reels filter + refresh ───────────────────────────────────────────

  const handleFilterChange = async (filter: string) => {
    setMissingFilter(filter);
    if (!accessToken) return;
    setLoadingMissing(true);
    await fetchMissingReels(accessToken, filter);
    setLoadingMissing(false);
  };

  const handleRefreshMissing = async () => {
    if (!accessToken || missingRefreshing) return;
    setMissingRefreshing(true);
    await fetchMissingReels(accessToken, missingFilter);
    setMissingRefreshing(false);
  };

  // ── Add context for missing reel (section 2) ─────────────────────────────────

  const handleExpandMissing = (reel: MissingReel) => {
    if (expandedMissingId === reel.id) {
      setExpandedMissingId(null);
      setMissingContextText("");
    } else {
      setExpandedMissingId(reel.id);
      setMissingContextText("");
    }
  };

  const handleSaveMissingContext = async (reel: MissingReel) => {
    if (!missingContextText.trim() || !accessToken) return;
    setMissingSaving(true);

    const res = await fetch(`/api/reel-context/${reel.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ context: missingContextText.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      // Move reel from missing → saved
      setSavedReels((prev) => [data.reel, ...prev]);
      setMissingReels((prev) => prev.filter((r) => r.id !== reel.id));
      setExpandedMissingId(null);
      setMissingContextText("");
      showToast("Context added! Your agent can now answer questions about this reel.");
    } else {
      showToast("Failed to save context. Please try again.");
    }
    setMissingSaving(false);
  };

  if (!ready) {
    return <div className={styles.loadingWrapper}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </button>

        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <span className={styles.brandName}>InstaAutomate</span>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Reel Context</h1>
          <p className={styles.pageDesc}>
            Tell the AI what each reel is about so it can leave more relevant comment replies.
          </p>
        </div>

        {/* ── Section 1: Saved Reels ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Your Reel Context</p>
              <p className={styles.sectionDesc}>
                {savedReels.length > 0
                  ? `${savedReels.length} reel${savedReels.length !== 1 ? "s" : ""} saved`
                  : "Add context for each reel so the AI knows what to reference."}
              </p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Reel
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className={`${styles.entryCard} ${styles.addCard}`}>
              <div className={styles.entryHeader}>
                <label className={styles.fieldLabel}>New Reel</label>
                <button className={styles.deleteBtn} onClick={handleCancelAdd}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cancel
                </button>
              </div>

              <label className={styles.fieldLabel} style={{ marginBottom: 6, display: "block" }}>Reel URL</label>
              <input
                className={styles.urlInput}
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                autoFocus
              />

              <label className={styles.fieldLabel} style={{ marginTop: 12, marginBottom: 6, display: "block" }}>
                What is this reel about?
              </label>
              <textarea
                className={styles.contextTextarea}
                placeholder="e.g. This reel shows our new skincare routine product launch. It demonstrates how to apply the serum for best results."
                rows={3}
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
              />

              <div className={styles.entryFooter}>
                {addSavedId && (
                  <span className={styles.savedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </span>
                )}
                <button
                  className={styles.saveBtn}
                  onClick={handleAdd}
                  disabled={!newUrl.trim() || !newContext.trim() || addSaving}
                >
                  {addSaving ? "Saving..." : "Save Reel"}
                </button>
              </div>
            </div>
          )}

          {/* Saved reels list */}
          {loadingReels ? (
            <div className={styles.loadingInline}>Loading saved reels...</div>
          ) : savedReels.length === 0 && !showAddForm ? (
            <div className={styles.emptyEntries}>
              <div className={styles.emptyIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <p className={styles.emptyText}>No reel context added yet.</p>
              <p className={styles.emptySubtext}>Click &quot;Add Reel&quot; to get started.</p>
            </div>
          ) : (
            <div className={styles.entriesList}>
              {savedReels.map((reel) => (
                <div key={reel.id} className={styles.savedReelCard}>
                  {/* Top row: URL + date + actions */}
                  <div className={styles.reelCardTop}>
                    <div className={styles.reelUrlGroup}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.reelIcon}>
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.reelUrl}
                        title={reel.url}
                      >
                        {truncateUrl(reel.url)}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.externalIcon}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>

                    <div className={styles.reelCardActions}>
                      <span className={styles.reelDate}>{formatDate(reel.created_at)}</span>
                      <button
                        className={styles.editBtn}
                        onClick={() => editingId === reel.id ? cancelEdit() : startEdit(reel)}
                        title="Edit context"
                      >
                        {editingId === reel.id ? (
                          "Cancel"
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </>
                        )}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(reel.id)}
                        disabled={deletingId === reel.id}
                        title="Delete reel"
                      >
                        {deletingId === reel.id ? (
                          "..."
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Context — view or edit */}
                  {editingId === reel.id ? (
                    <div className={styles.editArea}>
                      <textarea
                        className={styles.contextTextarea}
                        rows={3}
                        value={editContext}
                        onChange={(e) => setEditContext(e.target.value)}
                        autoFocus
                      />
                      <div className={styles.entryFooter}>
                        <button className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                        <button
                          className={styles.saveBtn}
                          onClick={handleSaveEdit}
                          disabled={!editContext.trim() || editSaving}
                        >
                          {editSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.reelContextText}>{reel.context}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 2: Reels Missing Context ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>
                Reels Missing Context
                {missingReels.length > 0 && (
                  <span className={styles.missingCountBadge}>{missingReels.length}</span>
                )}
              </p>
              <p className={styles.sectionDesc}>
                Reels that received comments but have no context configured yet.
              </p>
            </div>
          </div>

          {/* Filter pills + refresh */}
          <div className={styles.missingControls}>
            <div className={styles.missingFilterPills}>
              {MISSING_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.missingFilterPill} ${missingFilter === f.value ? styles.missingFilterPillActive : ""}`}
                  onClick={() => handleFilterChange(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              className={styles.refreshBtn}
              onClick={handleRefreshMissing}
              disabled={missingRefreshing}
              title="Refresh"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={missingRefreshing ? styles.spinning : undefined}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {loadingMissing ? (
            <div className={styles.loadingInline}>Loading...</div>
          ) : missingReels.length === 0 ? (
            <div className={styles.missingEmpty}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              All caught up! No reels missing context.
            </div>
          ) : (
            <div className={styles.missingList}>
              {missingReels.map((reel) => (
                <div
                  key={reel.id}
                  className={`${styles.missingCardLive} ${expandedMissingId === reel.id ? styles.missingCardExpanded : ""}`}
                >
                  {/* Top row */}
                  <div className={styles.missingCardRow}>
                    <div className={styles.missingIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <div className={styles.missingInfo}>
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.missingUrl}
                        title={reel.url}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {truncateUrl(reel.url, 48)}
                      </a>
                      <div className={styles.missingMeta}>
                        <span>Mentioned {reel.mention_count} time{reel.mention_count !== 1 ? "s" : ""}</span>
                        <span className={styles.missingMetaDot}>·</span>
                        <span>Last asked: {formatRelativeTime(reel.last_mentioned_at)}</span>
                      </div>
                    </div>
                    <span className={styles.missingTag}>No context</span>
                    <button
                      className={styles.missingAddBtnLive}
                      onClick={() => handleExpandMissing(reel)}
                    >
                      {expandedMissingId === reel.id ? "Cancel" : "Add Context"}
                    </button>
                  </div>

                  {/* Expanded: context textarea */}
                  {expandedMissingId === reel.id && (
                    <div className={styles.missingContextArea}>
                      <textarea
                        className={styles.contextTextarea}
                        placeholder="Describe what this reel shows — services, pricing, or any details your agent should know."
                        rows={3}
                        value={missingContextText}
                        onChange={(e) => setMissingContextText(e.target.value)}
                        autoFocus
                      />
                      <div className={styles.entryFooter}>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => { setExpandedMissingId(null); setMissingContextText(""); }}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveMissingContext(reel)}
                          disabled={!missingContextText.trim() || missingSaving}
                        >
                          {missingSaving ? "Saving..." : "Save Context"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className={styles.toast}>✓ {toast}</div>
      )}
    </div>
  );
}
