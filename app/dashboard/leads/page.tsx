"use client";

import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./leads.module.css";
import HelpTooltip from "../HelpTooltip";

const HELP_LEADS = (
  <>
    <p>Every lead your AI agent captures from Instagram DMs shows up here automatically.</p>
    <p><strong>What each column means:</strong></p>
    <ul>
      <li><strong>Date &amp; Time</strong> — when the lead was captured</li>
      <li><strong>Username</strong> — their Instagram handle</li>
      <li><strong>Email / Phone</strong> — contact info your agent collected (shows &lsquo;—&rsquo; if not shared)</li>
      <li><strong>Inquiry Summary</strong> — what they asked about, summarized by your AI agent</li>
      <li><strong>Score</strong> — how interested they seem: 🔥 Hot = highly interested; Warm = showed interest; ❄️ Low = casual inquiry</li>
      <li><strong>Status</strong> — New, Contacted, Converted, or Lost</li>
    </ul>
    <p><strong>What you can do:</strong></p>
    <ul>
      <li>Click the status dropdown to update a lead as you follow up</li>
      <li>Use the search bar to find leads by username or inquiry</li>
      <li>Click &lsquo;Export CSV&rsquo; to download all leads as a spreadsheet</li>
      <li>Leads are sorted by most recent first</li>
    </ul>
  </>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  username: string;
  inquiry_summary: string;
  lead_score: number;
  captured_data: Record<string, string> | null;
  source: string;
  status: string;
  created_at: string;
};

type DynamicColumn = {
  key: string;
  label: string;
};

type LeadStatus = "new" | "contacted" | "converted" | "lost";

// ── Constants ─────────────────────────────────────────────────────────────────

// Maps known collect_info labels → captured_data keys
const KNOWN_KEYS: Record<string, string | null> = {
  "Phone number": "phone_number",
  "Email": "email",
  "Name (if not clear from Instagram)": "name",
  "Preferred date / time": "preferred_date",
  "None — just send them to WhatsApp / website": null,
};

function collectInfoToColumn(label: string): DynamicColumn | null {
  const key = label in KNOWN_KEYS
    ? KNOWN_KEYS[label]
    : label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
  if (!key) return null;
  return { key, label };
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new:       { label: "New",       className: styles.statusNew },
  contacted: { label: "Contacted", className: styles.statusContacted },
  converted: { label: "Converted", className: styles.statusConverted },
  lost:      { label: "Lost",      className: styles.statusLost },
};

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "converted", "lost"];

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  if (score >= 9) return <span className={`${styles.scoreBadge} ${styles.scoreHot}`}>🔥 Hot</span>;
  if (score >= 6) return <span className={`${styles.scoreBadge} ${styles.scoreWarm}`}>🟡 Warm</span>;
  return <span className={`${styles.scoreBadge} ${styles.scoreLow}`}>❄️ Low</span>;
}

// ── Status badge with dropdown ────────────────────────────────────────────────

function StatusBadge({
  leadId,
  status,
  onChange,
}: {
  leadId: string;
  status: string;
  onChange: (id: string, newStatus: LeadStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[(status as LeadStatus) ?? "new"] ?? STATUS_CONFIG.new;

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className={styles.statusWrap} ref={ref}>
      <button
        className={`${styles.statusBadge} ${cfg.className}`}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        {cfg.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className={styles.statusDropdown}>
          {STATUS_OPTIONS.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                className={`${styles.statusOption} ${s === status ? styles.statusOptionActive : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(leadId, s);
                  setOpen(false);
                }}
              >
                <span className={`${styles.statusDot} ${c.className}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Export CSV helper ─────────────────────────────────────────────────────────

function exportCsv(leads: Lead[], dynamicColumns: DynamicColumn[]) {
  const fixedHeaders = ["Date", "Time", "Username"];
  const dynHeaders = dynamicColumns.map((c) => c.label);
  const tailHeaders = ["Inquiry Summary", "Lead Score", "Source", "Status"];
  const headers = [...fixedHeaders, ...dynHeaders, ...tailHeaders];

  const rows = leads.map((lead) => {
    const d = new Date(lead.created_at);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const fixed = [date, time, `@${lead.username}`];
    const dyn = dynamicColumns.map((c) => lead.captured_data?.[c.key] ?? "");
    const tail = [
      lead.inquiry_summary.replace(/,/g, ";"),
      String(lead.lead_score),
      lead.source ?? "dm",
      lead.status ?? "new",
    ];
    return [...fixed, ...dyn, ...tail].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }
      setAccessToken(session.access_token);

      const res = await fetch("/api/leads", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401) { router.replace("/"); return; }

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);

        // Build dynamic columns from collect_info config
        const cols: DynamicColumn[] = [];
        for (const label of (data.collectInfo ?? []) as string[]) {
          const col = collectInfoToColumn(label);
          if (col) cols.push(col);
        }
        setDynamicColumns(cols);
      }
      setLoading(false);
    };
    init();
  }, [router, supabase.auth]);

  const handleStatusChange = useCallback(async (id: string, newStatus: LeadStatus) => {
    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));

    if (!accessToken) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ status: newStatus }),
    });
  }, [accessToken, supabase.auth]);

  const filtered = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.username.toLowerCase().includes(q) ||
      l.inquiry_summary.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className={styles.loadingWrapper}>Loading...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <h1 className={styles.pageTitle}>Leads</h1>
              <HelpTooltip title="Leads" content={HELP_LEADS} />
            </div>
            <p className={styles.pageDesc}>
              Instagram users captured by your AI automation.
              {leads.length > 0 && (
                <span className={styles.leadCount}>{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
          {leads.length > 0 && (
            <div className={styles.headerActions}>
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className={styles.searchInput}
                  placeholder="Search by username or inquiry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className={styles.exportBtn} onClick={() => exportCsv(leads, dynamicColumns)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.body}>
        {leads.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className={styles.emptyText}>No leads captured yet.</p>
            <p className={styles.emptySubtext}>
              Once your AI agent starts chatting, leads will show up here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No leads match &quot;{search}&quot;</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Username</th>
                  {dynamicColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Inquiry Summary</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const d = new Date(lead.created_at);
                  const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                  const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                  const isExpanded = expandedId === lead.id;

                  return (
                    <Fragment key={lead.id}>
                      <tr
                        className={isExpanded ? styles.rowExpanded : ""}
                        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className={styles.cellMuted}>{dateStr}</td>
                        <td className={styles.cellMuted}>{timeStr}</td>
                        <td>
                          <span className={styles.username}>@{lead.username}</span>
                        </td>
                        {dynamicColumns.map((col) => (
                          <td key={col.key} className={styles.cellData}>
                            {lead.captured_data?.[col.key] || <span className={styles.cellEmpty}>—</span>}
                          </td>
                        ))}
                        <td className={styles.cellSummary}>
                          <span className={styles.summaryText}>{lead.inquiry_summary}</span>
                        </td>
                        <td>
                          <ScoreBadge score={lead.lead_score} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <StatusBadge
                            leadId={lead.id}
                            status={lead.status ?? "new"}
                            onChange={handleStatusChange}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${lead.id}-expanded`} className={styles.expandRow}>
                          <td colSpan={4 + dynamicColumns.length + 3} className={styles.expandCell}>
                            <div className={styles.expandContent}>
                              <p className={styles.expandLabel}>Full Inquiry Summary</p>
                              <p className={styles.expandText}>{lead.inquiry_summary}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
