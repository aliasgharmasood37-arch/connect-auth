"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./knowledge-base.module.css";
import HelpTooltip from "../HelpTooltip";

const HELP_KB = (
  <>
    <p>Your knowledge base is everything your AI agent knows about your business. It uses this information to answer customer questions in DMs and comments.</p>
    <p><strong>How to fill it well:</strong></p>
    <ul>
      <li>Be specific with pricing — give exact ranges, not vague answers</li>
      <li>Write your description like you&apos;d explain to a friend, not formally</li>
      <li>Fill in what you <em>don&apos;t</em> offer — this stops your agent from making things up</li>
      <li>Add your common customer questions — these are the ones your agent handles most</li>
      <li>Set your agent&apos;s tone to match how you actually talk to customers</li>
    </ul>
    <p><strong>How it helps your AI agent:</strong></p>
    <ul>
      <li>More complete = more accurate replies</li>
      <li>Missing fields = your agent might guess or redirect to contact</li>
      <li>You can edit anytime — changes take effect immediately</li>
    </ul>
    <p>Tip: Use the AI Assistant on the right to ask what&apos;s missing or what to improve. It can make changes directly.</p>
  </>
);

const HELP_ASSISTANT = (
  <>
    <p>Your personal knowledge base advisor. Tell it what&apos;s going wrong with your AI agent and it will suggest exactly what to change.</p>
    <p><strong>What you can ask:</strong></p>
    <ul>
      <li>&ldquo;My agent replies are too short&rdquo; — it will suggest which fields to expand</li>
      <li>&ldquo;Agent is giving wrong prices&rdquo; — it will find and fix the pricing fields</li>
      <li>&ldquo;Make my agent sound more casual&rdquo; — it will update your tone settings</li>
      <li>&ldquo;What&apos;s missing from my knowledge base?&rdquo; — it will audit your fields</li>
    </ul>
    <p>It can also make changes directly — just agree to its suggestion and it updates your knowledge base automatically.</p>
  </>
);

const HELP_TEST = (
  <>
    <p>Test how your AI agent actually replies before going live. Send it a message like a real customer would and see the response.</p>
    <p><strong>How to use it:</strong></p>
    <ul>
      <li>Try different types of questions — pricing, location, services, availability</li>
      <li>Test in different languages if your customers message in Hindi or Hinglish</li>
      <li>After editing your knowledge base, test again to see if the reply improved</li>
    </ul>
    <p><strong>Tips:</strong></p>
    <ul>
      <li>If a reply is wrong, switch to the AI Assistant tab and tell it what went wrong — it will fix the knowledge base for you</li>
      <li>Test edge cases like &ldquo;do you do X?&rdquo; (something you don&apos;t offer) to make sure your agent handles it correctly</li>
    </ul>
  </>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; content: string; applied?: string };

type CommentConfig = {
  reply_style: string;
  dm_push_message: string;
  reply_to: string;
  positive_handling: string;
  negative_handling: string;
};

const DEFAULT_COMMENT_CONFIG: CommentConfig = {
  reply_style: "short_push_to_dm",
  dm_push_message: "",
  reply_to: "questions_and_compliments",
  positive_handling: "thank_and_engage",
  negative_handling: "address_politely",
};

const CC_REPLY_STYLES = [
  { value: "short_push_to_dm", label: "Short reply + push to DMs", recommended: true },
  { value: "detailed", label: "Answer in detail in comments" },
  { value: "questions_only", label: "Only reply to questions" },
];
const CC_REPLY_TO = [
  { value: "all", label: "All comments" },
  { value: "questions_and_compliments", label: "Questions and compliments only", recommended: true },
  { value: "questions_only", label: "Questions only" },
];
const CC_POSITIVE = [
  { value: "thank_and_engage", label: "Thank them and engage — reply warmly and invite them to DM" },
  { value: "thank_briefly", label: "Just say thanks briefly" },
  { value: "ignore_positive", label: "Don't reply to compliments" },
];
const CC_NEGATIVE = [
  { value: "address_politely", label: "Address it politely — respond calmly and handle the concern" },
  { value: "brief_response", label: "Acknowledge briefly and move on" },
  { value: "ignore_negative", label: "Don't reply to negative comments" },
];
const CC_DM_SUGGESTIONS = [
  "DM karo, details bhejta hoon!",
  "Check DM! Sent you the details.",
  "DM me for pricing and info!",
];
type FieldType = "text" | "textarea" | "chips" | "service_catalogue" | "link_list";

type FieldDef = {
  key: string;       // dot-path relative to section root, e.g. "business_name"
  label: string;
  type: FieldType;
};

type SectionDef = {
  key: string;       // top-level key in answers object
  title: string;
  icon: React.ReactNode;
  fields: FieldDef[];
};

// ── Section + field config ────────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    key: "identity",
    title: "Business Basics",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    fields: [
      { key: "business_name", label: "Business Name", type: "text" },
      { key: "owner_name", label: "Owner / Manager", type: "text" },
      { key: "instagram_handle", label: "Instagram Handle", type: "text" },
      { key: "business_type", label: "Business Type", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "working_hours", label: "Working Hours", type: "text" },
      { key: "description", label: "What You Do", type: "textarea" },
      { key: "what_not_offered", label: "What You Don't Offer", type: "textarea" },
      { key: "years_in_business", label: "Years in Business", type: "text" },
      { key: "proof_points", label: "Proof Points", type: "chips" },
      { key: "proof_customers_count", label: "Customers Count", type: "text" },
      { key: "proof_projects_count", label: "Projects Count", type: "text" },
      { key: "proof_reviews_count", label: "Reviews Count", type: "text" },
      { key: "proof_other", label: "Other Proof", type: "text" },
      { key: "portfolio_links", label: "Portfolio Links", type: "link_list" },
    ],
  },
  {
    key: "services",
    title: "Services & Pricing",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    fields: [
      { key: "catalogue", label: "Services & Prices", type: "service_catalogue" },
      { key: "variations", label: "Options / Variants", type: "textarea" },
      { key: "custom_requests", label: "Custom Requests", type: "text" },
      { key: "how_it_works", label: "How It Works", type: "textarea" },
      { key: "duration", label: "Typical Duration", type: "text" },
      { key: "pricing_depends", label: "Pricing Depends On", type: "chips" },
      { key: "pricing_depends_other", label: "Pricing Depends (custom)", type: "text" },
      { key: "free_consultation", label: "Free Consultation", type: "text" },
      { key: "payment_plan", label: "Payment Plan", type: "text" },
      { key: "payment_plan_details", label: "Payment Plan Details", type: "textarea" },
    ],
  },
  {
    key: "trust",
    title: "Trust & Guarantees",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    fields: [
      { key: "guarantee", label: "Guarantee", type: "text" },
      { key: "results_duration", label: "How Long Results Last", type: "text" },
      { key: "aftercare", label: "Aftercare", type: "textarea" },
      { key: "customer_worries", label: "Common Customer Worries", type: "chips" },
      { key: "customer_worries_other", label: "Other Concern", type: "text" },
      { key: "worry_response", label: "How You Handle Worries", type: "textarea" },
    ],
  },
  {
    key: "contact",
    title: "Contact & Logistics",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.5 5.5l.91-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
      </svg>
    ),
    fields: [
      { key: "whatsapp", label: "WhatsApp", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "website", label: "Website", type: "text" },
      { key: "maps_link", label: "Maps Link", type: "text" },
      { key: "payment_methods", label: "Payment Methods", type: "chips" },
      { key: "payment_methods_other", label: "Other Payment Method", type: "text" },
      { key: "booking_methods", label: "Booking Methods", type: "chips" },
      { key: "booking_methods_other", label: "Other Booking Method", type: "text" },
      { key: "service_area", label: "Service Area", type: "text" },
      { key: "cancellation_policy", label: "Cancellation Policy", type: "text" },
    ],
  },
  {
    key: "customers",
    title: "Your Customers",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    fields: [
      { key: "customer_types", label: "Customer Types", type: "chips" },
      { key: "customer_types_other", label: "Other Customer Type", type: "text" },
      { key: "experience_level", label: "Experience Level", type: "text" },
      { key: "top_questions", label: "Top Questions Customers Ask", type: "textarea" },
    ],
  },
  {
    key: "agent",
    title: "AI Agent Behavior",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
    fields: [
      { key: "primary_goal", label: "Primary Goal", type: "text" },
      { key: "qualify_questions", label: "Qualifying Questions", type: "chips" },
      { key: "qualify_other", label: "Other Qualifying Question", type: "text" },
      { key: "cta_timing", label: "When to Push CTA", type: "text" },
      { key: "tone", label: "Tone of Voice", type: "chips" },
      { key: "languages", label: "Languages", type: "chips" },
      { key: "languages_other", label: "Other Language", type: "text" },
      { key: "phrases", label: "Phrases to Use", type: "textarea" },
      { key: "greeting", label: "Greeting Message", type: "textarea" },
      { key: "never_do", label: "Never Do", type: "chips" },
      { key: "never_do_other", label: "Never Do (custom)", type: "text" },
      { key: "unknown_response", label: "When Agent Doesn't Know", type: "text" },
    ],
  },
  {
    key: "lead_capture",
    title: "Lead Capture",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    fields: [
      { key: "collect_info", label: "Information to Collect", type: "chips" },
      { key: "when_to_ask", label: "When to Ask", type: "text" },
      { key: "if_refuses", label: "If They Refuse", type: "text" },
      { key: "flow_description", label: "Custom Flow Description", type: "textarea" },
    ],
  },
];

// ── Value helpers ─────────────────────────────────────────────────────────────

function getIn(obj: Record<string, unknown>, sectionKey: string, fieldKey: string): unknown {
  const section = obj[sectionKey] as Record<string, unknown> | undefined;
  return section?.[fieldKey];
}

function setIn(
  obj: Record<string, unknown>,
  sectionKey: string,
  fieldKey: string,
  value: unknown
): Record<string, unknown> {
  return {
    ...obj,
    [sectionKey]: {
      ...(obj[sectionKey] as Record<string, unknown>),
      [fieldKey]: value,
    },
  };
}

// Apply a dot-path update like "identity.business_name"
function applyDotPath(
  obj: Record<string, unknown>,
  dotPath: string,
  value: unknown
): Record<string, unknown> {
  const parts = dotPath.split(".");
  if (parts.length === 2) return setIn(obj, parts[0], parts[1], value);
  // fallback for deeper paths
  const newObj = { ...obj };
  let cur = newObj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = { ...(cur[parts[i]] as Record<string, unknown>) };
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return newObj;
}

function formatForEdit(type: FieldType, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (type === "chips" || type === "link_list") {
    return Array.isArray(value) ? (value as string[]).join("\n") : String(value);
  }
  if (type === "service_catalogue") {
    return Array.isArray(value)
      ? (value as { service: string; price: string }[])
          .map((r) => `${r.service}: ${r.price}`)
          .join("\n")
      : "";
  }
  return String(value);
}

function parseFromEdit(type: FieldType, raw: string): unknown {
  if (type === "chips" || type === "link_list") {
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  if (type === "service_catalogue") {
    return raw
      .split("\n")
      .map((line) => {
        const idx = line.lastIndexOf(":");
        if (idx === -1) return { service: line.trim(), price: "" };
        return { service: line.slice(0, idx).trim(), price: line.slice(idx + 1).trim() };
      })
      .filter((r) => r.service);
  }
  return raw.trim();
}

function countNonEmpty(section: Record<string, unknown>): number {
  return Object.values(section).filter((v) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
}

// ── Field display ─────────────────────────────────────────────────────────────

function FieldDisplay({ type, value }: { type: FieldType; value: unknown }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return <span className={styles.fieldEmpty}>Not set</span>;
  }
  if (type === "text") return <span className={styles.fieldValue}>{String(value)}</span>;
  if (type === "textarea") return <p className={styles.fieldTextBlock}>{String(value)}</p>;
  if (type === "chips") {
    return (
      <div className={styles.chipsView}>
        {(value as string[]).map((c, i) => (
          <span key={i} className={styles.chipView}>{c}</span>
        ))}
      </div>
    );
  }
  if (type === "link_list") {
    return (
      <div className={styles.linksList}>
        {(value as string[]).map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
            {url}
          </a>
        ))}
      </div>
    );
  }
  if (type === "service_catalogue") {
    const rows = value as { service: string; price: string }[];
    return (
      <div className={styles.catalogueList}>
        {rows.map((r, i) => (
          <div key={i} className={styles.catalogueRow}>
            <span>{r.service}</span>
            <span className={styles.cataloguePrice}>{r.price}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span className={styles.fieldValue}>{String(value)}</span>;
}

// ── Edit hints ────────────────────────────────────────────────────────────────

const EDIT_HINTS: Record<FieldType, string> = {
  text: "Press Enter to save, Escape to cancel.",
  textarea: "Press Ctrl+Enter to save, Escape to cancel.",
  chips: "One item per line. Press Ctrl+Enter to save.",
  service_catalogue: "One service per line: Service Name: Price. Press Ctrl+Enter to save.",
  link_list: "One URL per line. Press Ctrl+Enter to save.",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  // Comment config section
  const [commentConfig, setCommentConfig] = useState<CommentConfig>(DEFAULT_COMMENT_CONFIG);
  const [commentSectionOpen, setCommentSectionOpen] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentToast, setCommentToast] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null); // "sectionKey.fieldKey"
  const [editValue, setEditValue] = useState("");

  // Right-panel tab
  const [activeTab, setActiveTab] = useState<"assistant" | "test">("assistant");

  // Mobile drawer
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // AI assistant chat
  const [assistantHistory, setAssistantHistory] = useState<ChatMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantSending, setAssistantSending] = useState(false);
  const assistantEndRef = useRef<HTMLDivElement>(null);

  // Test agent chat
  const [testHistory, setTestHistory] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testSending, setTestSending] = useState(false);
  const testEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }
      setAccessToken(session.access_token);

      const [kbRes, cfgRes] = await Promise.all([
        fetch("/api/knowledge-base", { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch("/api/comment-config", { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);

      if (kbRes.ok) {
        const data = await kbRes.json();
        setAnswers(data.answers ?? null);
        // open all sections by default
        setOpenSections(SECTIONS.reduce<Record<string, boolean>>((acc, s) => ({ ...acc, [s.key]: false }), {}));
      }
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) setCommentConfig({ ...DEFAULT_COMMENT_CONFIG, ...cfgData.config });
      }
      setReady(true);
    };
    init();
  }, [router, supabase.auth]);

  useEffect(() => {
    assistantEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantHistory, assistantSending]);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testHistory, testSending]);

  // ── Save helpers ─────────────────────────────────────────────────────────────

  const saveAnswers = async (updated: Record<string, unknown>) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await fetch("/api/knowledge-base", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(updated),
      });
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const saveCommentConfig = async () => {
    if (!accessToken) return;
    setCommentSaving(true);
    try {
      await fetch("/api/comment-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(commentConfig),
      });
      setCommentToast(true);
      setTimeout(() => setCommentToast(false), 3000);
    } finally {
      setCommentSaving(false);
    }
  };

  // ── Field edit handlers ───────────────────────────────────────────────────────

  const startEdit = (sectionKey: string, field: FieldDef) => {
    const fieldPath = `${sectionKey}.${field.key}`;
    const currentValue = answers ? getIn(answers, sectionKey, field.key) : undefined;
    setEditingField(fieldPath);
    setEditValue(formatForEdit(field.type, currentValue));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const confirmEdit = async (sectionKey: string, field: FieldDef) => {
    if (!answers) return;
    const parsed = parseFromEdit(field.type, editValue);
    const updated = setIn(answers, sectionKey, field.key, parsed);
    setAnswers(updated);
    setEditingField(null);
    setEditValue("");
    await saveAnswers(updated);
  };

  // ── AI assistant ─────────────────────────────────────────────────────────────

  const sendAssistantMessage = async (overrideText?: string) => {
    const msg = (overrideText ?? assistantInput).trim();
    if (!msg || assistantSending || !answers) return;
    setAssistantInput("");
    setAssistantSending(true);

    const apiHistory = assistantHistory
      .filter((m) => !m.applied)
      .map(({ role, content }) => ({ role, content }));

    const updatedHistory: ChatMessage[] = [...assistantHistory, { role: "user", content: msg }];
    setAssistantHistory(updatedHistory);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("not authenticated");

      const res = await fetch("/api/knowledge-base/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: msg, history: apiHistory, onboardingAnswers: answers }),
      });
      if (!res.ok) throw new Error("AI call failed");

      const data = await res.json();
      const { reply, fieldUpdate } = data;

      if (fieldUpdate?.field && fieldUpdate?.value !== undefined) {
        const updated = applyDotPath(answers, fieldUpdate.field, fieldUpdate.value);
        setAnswers(updated);
        await saveAnswers(updated);
        setAssistantHistory([
          ...updatedHistory,
          {
            role: "assistant",
            content: reply || `Updated "${fieldUpdate.field}".`,
            applied: fieldUpdate.field,
          },
        ]);
      } else {
        setAssistantHistory([...updatedHistory, { role: "assistant", content: reply }]);
      }
    } catch {
      setAssistantHistory([
        ...updatedHistory,
        { role: "assistant", content: "Failed to get a response. Please try again." },
      ]);
    } finally {
      setAssistantSending(false);
    }
  };

  // ── Test agent ────────────────────────────────────────────────────────────────

  const sendTestMessage = async () => {
    if (!testInput.trim() || testSending) return;
    const msg = testInput.trim();
    setTestInput("");
    setTestSending(true);

    const updated: ChatMessage[] = [...testHistory, { role: "user", content: msg }];
    setTestHistory(updated);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("not authenticated");

      const res = await fetch("/api/ai/test-dm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTestHistory([...updated, { role: "assistant", content: data.reply }]);
    } catch {
      setTestHistory([...updated, { role: "assistant", content: "Failed to get a response. Please try again." }]);
    } finally {
      setTestSending(false);
    }
  };

  const resetTestAgent = async () => {
    setTestHistory([]);
    if (accessToken) {
      await fetch("/api/ai/reset-dm", {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!ready) return <div className={styles.loadingWrapper}>Loading...</div>;

  if (!answers) {
    return (
      <div className={styles.emptyWrapper}>
        <div className={styles.emptyIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>No knowledge base yet</p>
        <p className={styles.emptyDesc}>
          Complete the onboarding form to set up your AI agent&apos;s knowledge base.
        </p>
        <button className={styles.emptyBtn} onClick={() => router.push("/onboarding")}>
          Set Up Agent →
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <h1 className={styles.pageTitle}>Knowledge Base</h1>
            <HelpTooltip title="Knowledge Base" content={HELP_KB} />
          </div>
          <p className={styles.pageDesc}>
            View and edit what your AI agent knows about your business.
            {saving && " Saving..."}
          </p>
        </div>
        <button
          className={styles.emptyBtn}
          style={{ marginTop: 0 }}
          onClick={() => router.push("/onboarding?mode=edit")}
        >
          Re-run Full Form
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setMobileDrawerOpen(false)} />
      )}

      <div className={styles.body}>
        {/* ── Left panel: KB viewer/editor ── */}
        <div className={styles.leftPanel}>
          {SECTIONS.map((section) => {
            const sectionData = (answers[section.key] as Record<string, unknown>) ?? {};
            const filledCount = countNonEmpty(sectionData);
            const isOpen = openSections[section.key] ?? false;

            return (
              <div key={section.key} className={styles.section}>
                <div
                  className={styles.sectionHeader}
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                  }
                >
                  <div className={styles.sectionLeft}>
                    <div className={styles.sectionIcon}>{section.icon}</div>
                    <div>
                      <p className={styles.sectionTitle}>{section.title}</p>
                      <p className={styles.sectionCount}>{filledCount} of {section.fields.length} fields filled</p>
                    </div>
                  </div>
                  <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                <div className={`${styles.sectionBodyWrapper} ${isOpen ? styles.sectionBodyWrapperOpen : ""}`}>
                  <div className={styles.sectionBody}>
                    {section.fields.map((field) => {
                      const fieldPath = `${section.key}.${field.key}`;
                      const value = getIn(answers, section.key, field.key);
                      const isEditing = editingField === fieldPath;
                      const isMultiLine =
                        field.type === "textarea" ||
                        field.type === "chips" ||
                        field.type === "service_catalogue" ||
                        field.type === "link_list";

                      return (
                        <div key={field.key} className={styles.fieldRow}>
                          <span className={styles.fieldLabel}>{field.label}</span>

                          {isEditing ? (
                            <div className={styles.editArea}>
                              {isMultiLine ? (
                                <textarea
                                  className={styles.editTextarea}
                                  rows={field.type === "service_catalogue" ? 5 : 3}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") cancelEdit();
                                    if (e.key === "Enter" && e.ctrlKey) confirmEdit(section.key, field);
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <input
                                  className={styles.editInput}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") cancelEdit();
                                    if (e.key === "Enter") confirmEdit(section.key, field);
                                  }}
                                  autoFocus
                                />
                              )}
                              <p className={styles.editHint}>{EDIT_HINTS[field.type]}</p>
                              <div className={styles.editActions}>
                                <button className={styles.cancelEditBtn} onClick={cancelEdit}>
                                  Cancel
                                </button>
                                <button
                                  className={styles.saveFieldBtn}
                                  onClick={() => confirmEdit(section.key, field)}
                                  disabled={saving}
                                >
                                  {saving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.fieldValueRow}>
                              <FieldDisplay type={field.type} value={value} />
                              <button
                                className={styles.editFieldBtn}
                                onClick={() => startEdit(section.key, field)}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {/* ── Comment Reply Settings section ── */}
          <div className={styles.commentDivider}>
            <span className={styles.commentDividerLabel}>Comment Agent</span>
          </div>

          <div id="comment-config-section" className={styles.commentSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => setCommentSectionOpen((v) => !v)}
            >
              <div className={styles.sectionLeft}>
                <div className={`${styles.sectionIcon} ${styles.commentSectionIcon}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className={styles.sectionTitle}>Comment Reply Settings</p>
                  <p className={styles.sectionCount}>How the agent handles comments on your posts</p>
                </div>
              </div>
              <svg
                className={`${styles.chevron} ${commentSectionOpen ? styles.chevronOpen : ""}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div className={`${styles.sectionBodyWrapper} ${commentSectionOpen ? styles.sectionBodyWrapperOpen : ""}`}>
              <div className={styles.sectionBody}>

                {/* C1 — Reply Style */}
                <div className={styles.ccField}>
                  <p className={styles.ccLabel}>How should your agent reply to comments?</p>
                  <div className={styles.ccPills}>
                    {CC_REPLY_STYLES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.ccPill} ${commentConfig.reply_style === opt.value ? styles.ccPillActive : ""}`}
                        onClick={() => setCommentConfig((c) => ({ ...c, reply_style: opt.value }))}
                      >
                        {opt.label}
                        {opt.recommended && <span className={styles.ccRecommended}>Recommended</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* C2 — DM Push Message (conditional) */}
                {commentConfig.reply_style === "short_push_to_dm" && (
                  <div className={styles.ccField}>
                    <p className={styles.ccLabel}>What should the agent say when pushing to DMs?</p>
                    <input
                      className={styles.ccInput}
                      placeholder="DM karo, details bhejta hoon!"
                      value={commentConfig.dm_push_message}
                      onChange={(e) => setCommentConfig((c) => ({ ...c, dm_push_message: e.target.value }))}
                    />
                    <div className={styles.ccSuggestions}>
                      {CC_DM_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.ccSuggestionChip}
                          onClick={() => setCommentConfig((c) => ({ ...c, dm_push_message: s }))}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* C3 — Reply To */}
                <div className={styles.ccField}>
                  <p className={styles.ccLabel}>Which comments should the agent reply to?</p>
                  <div className={styles.ccPills}>
                    {CC_REPLY_TO.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.ccPill} ${commentConfig.reply_to === opt.value ? styles.ccPillActive : ""}`}
                        onClick={() => setCommentConfig((c) => ({ ...c, reply_to: opt.value }))}
                      >
                        {opt.label}
                        {opt.recommended && <span className={styles.ccRecommended}>Recommended</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* C4 — Positive Comments */}
                <div className={styles.ccField}>
                  <p className={styles.ccLabel}>When someone leaves a positive comment or compliment...</p>
                  <p className={styles.ccHelper}>e.g. &quot;amazing work!&quot;, &quot;🔥&quot;, &quot;love this&quot;</p>
                  <div className={styles.ccPills}>
                    {CC_POSITIVE.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.ccPill} ${commentConfig.positive_handling === opt.value ? styles.ccPillActive : ""}`}
                        onClick={() => setCommentConfig((c) => ({ ...c, positive_handling: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* C5 — Negative Comments */}
                <div className={styles.ccField}>
                  <p className={styles.ccLabel}>When someone leaves a negative or critical comment...</p>
                  <p className={styles.ccHelper}>e.g. &quot;too expensive&quot;, &quot;not worth it&quot;, &quot;looks bad&quot;</p>
                  <div className={styles.ccPills}>
                    {CC_NEGATIVE.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.ccPill} ${commentConfig.negative_handling === opt.value ? styles.ccPillActive : ""}`}
                        onClick={() => setCommentConfig((c) => ({ ...c, negative_handling: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.ccSaveRow}>
                  {commentToast && (
                    <span className={styles.ccSavedBadge}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Comment settings updated!
                    </span>
                  )}
                  <button
                    className={styles.saveFieldBtn}
                    onClick={saveCommentConfig}
                    disabled={commentSaving}
                  >
                    {commentSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: AI Assistant + Test Agent ── */}
        <div className={`${styles.rightPanel} ${mobileDrawerOpen ? styles.rightPanelDrawerOpen : ""}`}>
          <div className={styles.rightCard}>
            <div className={styles.tabs}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  className={`${styles.tab} ${activeTab === "assistant" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("assistant")}
                >
                  AI Assistant
                </button>
                <HelpTooltip title="AI Assistant" content={HELP_ASSISTANT} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  className={`${styles.tab} ${activeTab === "test" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("test")}
                >
                  Test Agent
                </button>
                <HelpTooltip title="Test Agent" content={HELP_TEST} />
              </div>
              <button
                className={styles.drawerCloseBtn}
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* AI Assistant tab */}
            {activeTab === "assistant" && (
              <div className={styles.chatWrap}>
                <div className={styles.chatHeader}>
                  <p className={styles.chatTitle}>Knowledge Base Assistant</p>
                  <button className={styles.resetBtn} onClick={() => setAssistantHistory([])}>
                    Clear
                  </button>
                </div>
                <div className={styles.messages}>
                  {assistantHistory.length === 0 && !assistantSending && (
                    <div className={styles.chatWelcome}>
                      <p className={styles.chatWelcomeTitle}>Knowledge Base Assistant</p>
                      <p className={styles.chatWelcomeDesc}>
                        Tell me what&apos;s going wrong with your AI agent — replies too short, too long, wrong tone, missing info, or anything else. I&apos;ll tell you exactly what to change in your knowledge base to fix it.
                      </p>
                      <p className={styles.chatWelcomeSub}>I can also make the changes directly if you want.</p>
                      <div className={styles.chatChips}>
                        {[
                          "My agent replies are too short",
                          "Agent is giving wrong prices",
                          "Make my agent sound more friendly",
                        ].map((chip) => (
                          <button
                            key={chip}
                            className={styles.chatChip}
                            onClick={() => {
                              setAssistantInput(chip);
                              sendAssistantMessage(chip);
                            }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {assistantHistory.map((msg, i) => (
                    <div key={i}>
                      <div className={msg.role === "user" ? styles.bubbleUser : styles.bubbleAI}>
                        {msg.content}
                      </div>
                      {msg.applied && (
                        <div className={styles.appliedPill}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Applied — {msg.applied}
                        </div>
                      )}
                    </div>
                  ))}
                  {assistantSending && (
                    <div className={styles.bubbleAI}>
                      <span className={styles.typingDots}><span /><span /><span /></span>
                    </div>
                  )}
                  <div ref={assistantEndRef} />
                </div>
                <div className={styles.inputRow}>
                  <input
                    className={styles.chatInput}
                    placeholder="Ask about your knowledge base..."
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAssistantMessage();
                      }
                    }}
                    disabled={assistantSending}
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={sendAssistantMessage}
                    disabled={assistantSending || !assistantInput.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Test Agent tab */}
            {activeTab === "test" && (
              <div className={styles.chatWrap}>
                <div className={styles.chatHeader}>
                  <p className={styles.chatTitle}>Live Agent Preview</p>
                  <button className={styles.resetBtn} onClick={resetTestAgent} disabled={testSending}>
                    Reset
                  </button>
                </div>
                <div className={styles.messages}>
                  {testHistory.length === 0 && !testSending && (
                    <p className={styles.chatEmpty}>
                      Simulate how your AI agent will respond to customer DMs.
                    </p>
                  )}
                  {testHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={msg.role === "user" ? styles.bubbleUser : styles.bubbleAI}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {testSending && (
                    <div className={styles.bubbleAI}>
                      <span className={styles.typingDots}><span /><span /><span /></span>
                    </div>
                  )}
                  <div ref={testEndRef} />
                </div>
                <div className={styles.inputRow}>
                  <input
                    className={styles.chatInput}
                    placeholder="Type a message..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendTestMessage();
                      }
                    }}
                    disabled={testSending}
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={sendTestMessage}
                    disabled={testSending || !testInput.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        className={styles.fab}
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Open AI Assistant"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Toasts */}
      {toast && (
        <div className={styles.toast}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Knowledge base updated! Agent is reconfiguring...
        </div>
      )}
    </div>
  );
}
