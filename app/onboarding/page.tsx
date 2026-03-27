"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./onboarding.module.css";

// ============================================================
// Types
// ============================================================

type FormData = {
  // Step 1 — Business Basics
  business_name: string;
  owner_name: string;
  instagram_handle: string;
  business_type: string;
  location: string;
  working_hours: string;
  working_hours_other: string;
  description: string;
  what_not_offered: string;
  years_in_business: string;
  proof_points: string[];
  proof_customers_count: string;
  proof_projects_count: string;
  proof_reviews_count: string;
  proof_other: string;
  portfolio_links: string[];
  // Step 2 — Services & Pricing
  service_catalogue: { service: string; price: string }[];
  variations: string;
  custom_requests: string;
  how_it_works: string;
  duration: string;
  duration_other: string;
  pricing_depends: string[];
  pricing_depends_other: string;
  free_consultation: string;
  payment_plan: string;
  payment_plan_details: string;
  // Step 3 — Trust & Guarantees
  guarantee: string;
  guarantee_other: string;
  results_duration: string;
  aftercare: string;
  customer_worries: string[];
  customer_worries_other: string;
  worry_response: string;
  // Step 4 — Contact & Logistics
  whatsapp: string;
  phone: string;
  website: string;
  maps_link: string;
  payment_methods: string[];
  payment_methods_other: string;
  booking_methods: string[];
  booking_methods_other: string;
  service_area: string;
  cancellation_policy: string;
  cancellation_other: string;
  // Step 5 — Your Customers
  customer_types: string[];
  customer_types_other: string;
  experience_level: string;
  top_questions: string;
  // Step 6 — AI Agent Behavior
  agent_goal: string;
  agent_goal_other: string;
  qualify_questions: string[];
  qualify_other: string;
  cta_timing: string;
  cta_timing_other: string;
  tone: string[];
  languages: string[];
  languages_other: string;
  phrases: string;
  greeting: string;
  never_do: string[];
  never_do_other: string;
  unknown_response: string;
  unknown_custom: string;
  // Step 7 — Lead Capture
  collect_info: string[];
  when_to_ask: string;
  if_refuses: string;
  flow_description: string;
  // Step 8 — Comment Reply Settings
  comment_reply_style: string;
  comment_dm_push_message: string;
  comment_reply_to: string;
  comment_positive_handling: string;
  comment_negative_handling: string;
};

// ============================================================
// Constants
// ============================================================

const BUSINESS_TYPES = [
  "Walk-in store / shop",
  "Studio (salon, tattoo, photo, design, etc.)",
  "Home visit / we go to the customer",
  "Online / virtual service",
  "Clinic / office (by appointment)",
  "Hybrid (mix of above)",
];

const WORKING_HOURS = [
  "Mon–Sat, morning to evening (e.g. 10 AM – 8 PM)",
  "Mon–Fri, standard business hours (e.g. 9 AM – 6 PM)",
  "All 7 days",
  "By appointment only",
  "Flexible / varies",
  "Other",
];

const YEARS_IN_BUSINESS = [
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
];

const PROOF_POINT_OPTIONS = [
  "Happy customers count",
  "Projects / jobs completed count",
  "Featured in media / press",
  "Celebrity / influencer clients",
  "Awards or certifications",
  "Google / Instagram reviews count",
  "None yet — still growing",
  "Other",
];

const CUSTOM_REQUESTS = [
  "Yes — we do fully custom work",
  "Partially — we customize within set options",
  "No — fixed menu / packages only",
];

const DURATION = [
  "Under 1 hour",
  "1–3 hours",
  "Half day (3–5 hours)",
  "1–2 days",
  "3–7 days",
  "1–2 weeks",
  "Varies — depends on the job",
  "Other",
];

const PRICING_DEPENDS = [
  "Size of item / property / area",
  "Design or style chosen",
  "Complexity of work",
  "Number of items / sessions",
  "Condition of item / space",
  "Duration / time required",
  "Materials used",
  "Fixed pricing — doesn't vary",
  "Other",
];

const FREE_CONSULTATION = [
  "Yes — free quote via WhatsApp / call",
  "Yes — free in-person consultation",
  "Yes — free trial / sample session",
  "No — pricing is fixed and listed",
  "No — paid consultation first",
];

const GUARANTEE = [
  "We redo / fix it free if there's a problem on our end",
  "Full refund if not satisfied",
  "Partial refund or credit toward next service",
  "No formal guarantee — but we make it right case by case",
  "Other",
];

const RESULTS_DURATION = [
  "Permanent / one-time service",
  "Long-term (1+ years with care)",
  "Medium-term (few weeks to months)",
  "Short-term (days to a couple of weeks)",
  "Not applicable (repair, cleaning, event-based, etc.)",
];

const CUSTOMER_WORRIES = [
  '"Is the price worth it?"',
  '"Will it damage my item or property?"',
  '"How long will results actually last?"',
  '"Will it look as good as the photos?"',
  '"Can you handle my specific item / model / size?"',
  '"Is this business legit and trustworthy?"',
  '"What if I don\'t like the result?"',
  '"Is it safe?"',
  '"Will it take too long?"',
  "Other",
];

const PAYMENT_METHODS = [
  "Cash",
  "UPI (GPay, PhonePe, etc.)",
  "Bank transfer / NEFT",
  "Credit / debit card",
  "Online payment (Razorpay, PayPal, etc.)",
  "EMI / installments",
  "Other",
];

const BOOKING_METHODS = [
  "Message on WhatsApp",
  "DM on Instagram",
  "Call to schedule",
  "Book on website",
  "Walk in directly (no booking needed)",
  "Fill a form online",
  "Other",
];

const SERVICE_AREA = [
  "Local only — customer must visit us",
  "Local only — we visit the customer",
  "City-wide coverage",
  "Customers can ship / courier items to us",
  "We offer online / virtual service (pan-India or global)",
  "We travel to other cities for certain jobs",
  "Case by case — they should ask",
];

const CANCELLATION_POLICY = [
  "Full refund anytime before work starts",
  "Full refund if cancelled 24+ hours before appointment",
  "Partial refund or credit only",
  "No refunds once booked",
  "No formal policy — handled case by case",
  "Other",
];

const CUSTOMER_TYPES = [
  "Young adults (18–30) who care about aesthetics / style",
  "Working professionals with limited time",
  "Families / homeowners",
  "Vehicle / car / bike enthusiasts",
  "Brides, grooms, or event-related customers",
  "Small business owners",
  "Health / fitness / wellness seekers",
  "Students on a budget",
  "Parents looking for services for their kids",
  "Corporates / offices",
  "Other",
];

const EXPERIENCE_LEVELS = [
  "Most know exactly what they want",
  "Most are beginners / first-timers",
  "Mixed — some know, some don't",
];

const AGENT_GOALS = [
  "Qualify the customer and send them to WhatsApp",
  "Book an appointment or schedule a call",
  "Send them to a website or booking page",
  "Collect their info — someone from the team follows up",
  "Answer questions and build interest (no hard push)",
  "Other",
];

const QUALIFY_QUESTIONS = [
  "What service they need",
  "What item / area / body part they want serviced",
  "What style / design / variant they prefer",
  "Size / quantity / number of items",
  "Preferred date or time",
  "Budget",
  "Location (if home visit or travel)",
  "Other",
];

const CTA_TIMING = [
  "After qualifying — once the agent knows what they want",
  "After sharing pricing info",
  "After 2–3 messages of conversation",
  "Only when the customer seems clearly interested",
  "At the end of every conversation",
  "Other",
];

const TONE_OPTIONS = [
  "Casual and friendly",
  "Professional and polished",
  "Warm and supportive",
  "Fun and energetic",
  "Straightforward / no-BS",
  "Respectful and formal",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Hinglish (mixed Hindi-English)",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Malayalam",
  "Other",
];

const NEVER_DO = [
  "Never guess prices for items / services not listed",
  "Never confirm details about Instagram posts or reels it hasn't seen",
  "Never confirm compatibility with specific models without checking",
  "Never discuss competitors",
  "Never make income, ROI, or resale value claims",
  "Never make up timelines or availability",
  "Never promise specific results without verification",
  "Never share personal info about the owner",
  "Other",
];

const UNKNOWN_RESPONSE_OPTIONS = [
  "Can't confirm this — best to WhatsApp the team for exact details.",
  "Hmm not sure on that — drop a message on WhatsApp and they'll sort you out.",
  "Let me connect you with the team — WhatsApp karo, they'll help.",
  "Custom",
];

const COLLECT_INFO = [
  "Phone number",
  "Email",
  "Name (if not clear from Instagram)",
  "Preferred date / time",
  "None — just send them to WhatsApp / website",
];

const WHEN_TO_ASK = [
  "After 2–3 messages, once the conversation is warm",
  "After qualifying (agent knows what they want)",
  "After sharing pricing",
  "Only if the customer seems very interested",
  "Never ask — just redirect to WhatsApp / website",
];

const IF_REFUSES = [
  "No pressure — tell them to message on WhatsApp whenever ready",
  "Offer an alternative (e.g. \"I can send info on email instead?\")",
  "Share the website / booking link and move on",
  "Just continue the conversation normally",
];

// ============================================================
// Initial form state
// ============================================================

const INITIAL_FORM: FormData = {
  business_name: "", owner_name: "", instagram_handle: "", business_type: "",
  location: "", working_hours: "", working_hours_other: "", description: "",
  what_not_offered: "", years_in_business: "", proof_points: [],
  proof_customers_count: "", proof_projects_count: "", proof_reviews_count: "",
  proof_other: "", portfolio_links: ["", "", ""],
  service_catalogue: [{ service: "", price: "" }, { service: "", price: "" }, { service: "", price: "" }],
  variations: "", custom_requests: "", how_it_works: "", duration: "", duration_other: "",
  pricing_depends: [], pricing_depends_other: "", free_consultation: "",
  payment_plan: "", payment_plan_details: "",
  guarantee: "", guarantee_other: "", results_duration: "", aftercare: "",
  customer_worries: [], customer_worries_other: "", worry_response: "",
  whatsapp: "", phone: "", website: "", maps_link: "",
  payment_methods: [], payment_methods_other: "",
  booking_methods: [], booking_methods_other: "",
  service_area: "", cancellation_policy: "", cancellation_other: "",
  customer_types: [], customer_types_other: "", experience_level: "", top_questions: "",
  agent_goal: "", agent_goal_other: "", qualify_questions: [], qualify_other: "",
  cta_timing: "", cta_timing_other: "", tone: [], languages: [], languages_other: "",
  phrases: "", greeting: "", never_do: [], never_do_other: "",
  unknown_response: "", unknown_custom: "",
  collect_info: [], when_to_ask: "", if_refuses: "", flow_description: "",
  comment_reply_style: "short_push_to_dm",
  comment_dm_push_message: "",
  comment_reply_to: "questions_and_compliments",
  comment_positive_handling: "thank_and_engage",
  comment_negative_handling: "address_politely",
};

// ============================================================
// Helper sub-components (all defined OUTSIDE main component)
// ============================================================

function Field({
  label, required, error, shake, helper, children,
}: {
  label: string; required?: boolean; error?: boolean; shake?: boolean; helper?: string; children: React.ReactNode;
}) {
  return (
    <div className={`${styles.fieldGroup} ${shake ? styles.shake : ""}`}>
      <label className={styles.fieldLabel}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
      {helper && <p className={styles.helperText}>{helper}</p>}
      {error && <p className={styles.errorText}>This field is required</p>}
    </div>
  );
}

function SingleChips({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <button
          key={opt} type="button"
          className={`${styles.chip} ${value === opt ? styles.selected : ""}`}
          onClick={() => onChange(value === opt ? "" : opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiChips({ options, value, onChange, maxSelect }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; maxSelect?: number;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) { onChange(value.filter((s) => s !== opt)); }
    else { if (maxSelect && value.length >= maxSelect) return; onChange([...value, opt]); }
  };
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <button
          key={opt} type="button"
          className={`${styles.chip} ${value.includes(opt) ? styles.selected : ""}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function OtherInput({ value, onChange, placeholder = "Please specify..." }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      className={styles.input}
      style={{ marginTop: 8 }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ServiceCatalogueBuilder({ items, onChange }: {
  items: { service: string; price: string }[];
  onChange: (items: { service: string; price: string }[]) => void;
}) {
  const update = (i: number, field: "service" | "price", val: string) =>
    onChange(items.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => { if (items.length < 20) onChange([...items, { service: "", price: "" }]); };
  return (
    <div>
      {items.map((row, i) => (
        <div key={i} className={styles.itemRow}>
          <div className={styles.itemRowFields}>
            <div className={styles.itemRowField}>
              <label className={styles.itemRowLabel}>Service / Item</label>
              <input className={styles.input} placeholder="e.g. Helmet dipping" value={row.service} onChange={(e) => update(i, "service", e.target.value)} />
            </div>
            <div className={styles.itemRowField}>
              <label className={styles.itemRowLabel}>Price Range</label>
              <input className={styles.input} placeholder="e.g. ₹1,500 – ₹3,500" value={row.price} onChange={(e) => update(i, "price", e.target.value)} />
            </div>
          </div>
          {i > 0 && <button type="button" className={styles.itemRowDelete} onClick={() => remove(i)}>×</button>}
        </div>
      ))}
      <button type="button" className={styles.addRowBtn} onClick={add} disabled={items.length >= 20}>+ Add Service</button>
    </div>
  );
}

function LinkListBuilder({ links, onChange, placeholder }: {
  links: string[]; onChange: (links: string[]) => void; placeholder?: string;
}) {
  const update = (i: number, val: string) => onChange(links.map((l, idx) => (idx === i ? val : l)));
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const add = () => { if (links.length < 5) onChange([...links, ""]); };
  return (
    <div>
      {links.map((link, i) => (
        <div key={i} className={styles.itemRow} style={{ marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <input className={styles.input} placeholder={placeholder || "https://instagram.com/p/..."} value={link} onChange={(e) => update(i, e.target.value)} />
          </div>
          {links.length > 1 && <button type="button" className={styles.itemRowDelete} onClick={() => remove(i)}>×</button>}
        </div>
      ))}
      {links.length < 5 && (
        <button type="button" className={styles.addRowBtn} onClick={add}>+ Add Link</button>
      )}
    </div>
  );
}

// ============================================================
// buildPayload
// ============================================================

function buildPayload(form: FormData): Record<string, unknown> {
  return {
    identity: {
      business_name: form.business_name,
      owner_name: form.owner_name,
      instagram_handle: form.instagram_handle,
      business_type: form.business_type,
      location: form.location,
      working_hours: form.working_hours === "Other" ? form.working_hours_other : form.working_hours,
      description: form.description,
      what_not_offered: form.what_not_offered,
      years_in_business: form.years_in_business,
      proof_points: form.proof_points,
      proof_customers_count: form.proof_customers_count,
      proof_projects_count: form.proof_projects_count,
      proof_reviews_count: form.proof_reviews_count,
      proof_other: form.proof_other,
      portfolio_links: form.portfolio_links.filter(Boolean),
    },
    services: {
      catalogue: form.service_catalogue.filter((r) => r.service.trim()),
      variations: form.variations,
      custom_requests: form.custom_requests,
      how_it_works: form.how_it_works,
      duration: form.duration === "Other" ? form.duration_other : form.duration,
      pricing_depends: form.pricing_depends,
      pricing_depends_other: form.pricing_depends_other,
      free_consultation: form.free_consultation,
      payment_plan: form.payment_plan,
      payment_plan_details: form.payment_plan === "Yes" ? form.payment_plan_details : "",
    },
    trust: {
      guarantee: form.guarantee === "Other" ? form.guarantee_other : form.guarantee,
      results_duration: form.results_duration,
      aftercare: form.aftercare,
      customer_worries: form.customer_worries,
      customer_worries_other: form.customer_worries_other,
      worry_response: form.worry_response,
    },
    contact: {
      whatsapp: form.whatsapp,
      phone: form.phone,
      website: form.website,
      maps_link: form.maps_link,
      payment_methods: form.payment_methods,
      payment_methods_other: form.payment_methods_other,
      booking_methods: form.booking_methods,
      booking_methods_other: form.booking_methods_other,
      service_area: form.service_area,
      cancellation_policy: form.cancellation_policy === "Other" ? form.cancellation_other : form.cancellation_policy,
    },
    customers: {
      customer_types: form.customer_types,
      customer_types_other: form.customer_types_other,
      experience_level: form.experience_level,
      top_questions: form.top_questions,
    },
    agent: {
      primary_goal: form.agent_goal === "Other" ? form.agent_goal_other : form.agent_goal,
      qualify_questions: form.qualify_questions,
      qualify_other: form.qualify_other,
      cta_timing: form.cta_timing === "Other" ? form.cta_timing_other : form.cta_timing,
      tone: form.tone,
      languages: form.languages,
      languages_other: form.languages_other,
      phrases: form.phrases,
      greeting: form.greeting,
      never_do: form.never_do,
      never_do_other: form.never_do_other,
      unknown_response: form.unknown_response === "Custom" ? form.unknown_custom : form.unknown_response,
    },
    lead_capture: {
      collect_info: form.collect_info,
      when_to_ask: form.when_to_ask,
      if_refuses: form.if_refuses,
      flow_description: form.flow_description,
    },
  };
}

// ============================================================
// Step props
// ============================================================

type StepProps = {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  errors: Record<string, boolean>;
  shakeFields: Record<string, boolean>;
};

// ============================================================
// Step 1 — Business Basics
// ============================================================

function Step1({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Business Basics</h1>
      <p className={styles.stepSubheading}>Tell us about your business so your AI agent can represent you accurately.</p>

      <Field label="Business name" required error={errors.business_name} shake={shakeFields.business_name}>
        <input className={`${styles.input} ${errors.business_name ? styles.error : ""}`} placeholder="e.g. Hydro Customs / Glow Studio / FixIt Repairs" value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
      </Field>

      <Field label="Your name (owner or manager)" required error={errors.owner_name} shake={shakeFields.owner_name}>
        <input className={`${styles.input} ${errors.owner_name ? styles.error : ""}`} placeholder="e.g. Ali Masood" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
      </Field>

      <Field label="Instagram handle" required error={errors.instagram_handle} shake={shakeFields.instagram_handle}>
        <input className={`${styles.input} ${errors.instagram_handle ? styles.error : ""}`} placeholder="e.g. @hydrocustoms" value={form.instagram_handle} onChange={(e) => set("instagram_handle", e.target.value)} />
      </Field>

      <Field label="What type of business do you run?" required error={errors.business_type} shake={shakeFields.business_type}>
        <SingleChips options={BUSINESS_TYPES} value={form.business_type} onChange={(v) => set("business_type", v)} />
        {errors.business_type && <p className={styles.errorText}>Please select a business type</p>}
      </Field>

      <Field label="Where are you located?" required error={errors.location} shake={shakeFields.location} helper="Short address + city — e.g. Grant Road, Mumbai">
        <input className={`${styles.input} ${errors.location ? styles.error : ""}`} placeholder="e.g. Grant Road, Mumbai" value={form.location} onChange={(e) => set("location", e.target.value)} />
      </Field>

      <Field label="Working hours" required error={errors.working_hours} shake={shakeFields.working_hours}>
        <SingleChips options={WORKING_HOURS} value={form.working_hours} onChange={(v) => set("working_hours", v)} />
        {errors.working_hours && <p className={styles.errorText}>Please select working hours</p>}
        <AnimatePresence>
          {form.working_hours === "Other" && (
            <motion.div key="hours-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.working_hours_other} onChange={(v) => set("working_hours_other", v)} placeholder="Describe your working hours" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="Describe what you do in 1–2 lines" required error={errors.description} shake={shakeFields.description} helper={"Write like you're explaining to a friend. e.g. \"We do hydro dipping for helmets, bike tanks, car parts, and full bikes. Custom designs available.\""}>
        <textarea className={`${styles.textarea} ${errors.description ? styles.error : ""}`} placeholder='e.g. "Home deep-cleaning for apartments — we come to you with all equipment."' rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <Field label="What do you NOT offer?" helper="Things people commonly ask but you don't do. Leave blank if nothing specific.">
        <textarea className={styles.textarea} placeholder={'e.g. "No vinyl wrapping, painting, or ceramic coating"\ne.g. "No permanent tattoos — only henna and temporary art"'} rows={2} value={form.what_not_offered} onChange={(e) => set("what_not_offered", e.target.value)} />
      </Field>

      <Field label="How long have you been in business?" required error={errors.years_in_business} shake={shakeFields.years_in_business}>
        <SingleChips options={YEARS_IN_BUSINESS} value={form.years_in_business} onChange={(v) => set("years_in_business", v)} />
        {errors.years_in_business && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="Any proof points your agent can mention?" helper="Pick all that apply.">
        <MultiChips options={PROOF_POINT_OPTIONS} value={form.proof_points} onChange={(v) => set("proof_points", v)} />
        <AnimatePresence>
          {form.proof_points.includes("Happy customers count") && (
            <motion.div key="pp-customers" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <input className={styles.input} style={{ marginTop: 8 }} placeholder="Approx. number of happy customers" value={form.proof_customers_count} onChange={(e) => set("proof_customers_count", e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {form.proof_points.includes("Projects / jobs completed count") && (
            <motion.div key="pp-projects" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <input className={styles.input} style={{ marginTop: 8 }} placeholder="Approx. number of projects / jobs completed" value={form.proof_projects_count} onChange={(e) => set("proof_projects_count", e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {form.proof_points.includes("Google / Instagram reviews count") && (
            <motion.div key="pp-reviews" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <input className={styles.input} style={{ marginTop: 8 }} placeholder="Approx. review count (Google / Instagram)" value={form.proof_reviews_count} onChange={(e) => set("proof_reviews_count", e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {form.proof_points.includes("Other") && (
            <motion.div key="pp-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.proof_other} onChange={(v) => set("proof_other", v)} placeholder="Describe your proof point" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="Share 3–5 links to Instagram posts or reels that best represent your work" helper="These help your AI agent reference real examples when customers ask 'show me your work.' Leave blank if you'd rather not share.">
        <LinkListBuilder
          links={form.portfolio_links}
          onChange={(v) => set("portfolio_links", v)}
          placeholder="https://instagram.com/p/abc123"
        />
      </Field>
    </div>
  );
}

// ============================================================
// Step 2 — Services & Pricing
// ============================================================

function Step2({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Services &amp; Pricing</h1>
      <p className={styles.stepSubheading}>Help your agent answer pricing and service questions accurately.</p>

      <Field label="List your services with price ranges" required error={errors.service_catalogue} shake={shakeFields.service_catalogue}
        helper="Add as many as you need. e.g. Helmet dipping → ₹1,500 – ₹3,500 / Full bike → ₹20,000 – ₹30,000">
        <ServiceCatalogueBuilder items={form.service_catalogue} onChange={(v) => set("service_catalogue", v)} />
        {errors.service_catalogue && <p className={styles.errorText}>Please add at least one service</p>}
        <p className={styles.catalogueHint}>
          <svg className={styles.catalogueHintIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Have a lot of products? No need to list all of them. Just add your top 10–15 most popular items — the ones customers ask about the most. Your agent will handle these and redirect anything else to your contact.
        </p>
      </Field>

      <Field label="What options or variations can the customer choose from?" helper='e.g. "Carbon fiber, chrome, camo, flames, skulls, custom designs" — leave blank if no variations.'>
        <textarea className={styles.textarea} placeholder='e.g. "Swedish massage, deep tissue, aromatherapy, hot stone"' rows={2} value={form.variations} onChange={(e) => set("variations", e.target.value)} />
      </Field>

      <Field label="Do you accept custom or personalized requests?" required error={errors.custom_requests} shake={shakeFields.custom_requests}>
        <SingleChips options={CUSTOM_REQUESTS} value={form.custom_requests} onChange={(v) => set("custom_requests", v)} />
        {errors.custom_requests && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="How does your service work?" required error={errors.how_it_works} shake={shakeFields.how_it_works} helper="Explain in 1–2 lines like the customer has never heard of it.">
        <textarea className={`${styles.textarea} ${errors.how_it_works ? styles.error : ""}`} placeholder='e.g. "Hydro dipping uses water transfer printing — design film floats on water, wraps your part when dipped. Bonds permanently."' rows={3} value={form.how_it_works} onChange={(e) => set("how_it_works", e.target.value)} />
      </Field>

      <Field label="How long does your service usually take?" required error={errors.duration} shake={shakeFields.duration}>
        <SingleChips options={DURATION} value={form.duration} onChange={(v) => set("duration", v)} />
        {errors.duration && <p className={styles.errorText}>Please select an option</p>}
        <AnimatePresence>
          {form.duration === "Other" && (
            <motion.div key="dur-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.duration_other} onChange={(v) => set("duration_other", v)} placeholder="Describe the typical duration" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="What does pricing depend on?" required error={errors.pricing_depends} shake={shakeFields.pricing_depends}>
        <MultiChips options={PRICING_DEPENDS} value={form.pricing_depends} onChange={(v) => set("pricing_depends", v)} />
        {errors.pricing_depends && <p className={styles.errorText}>Please select at least one option</p>}
        <AnimatePresence>
          {form.pricing_depends.includes("Other") && (
            <motion.div key="pd-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.pricing_depends_other} onChange={(v) => set("pricing_depends_other", v)} placeholder="What else affects your pricing?" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="Do you offer a free consultation or estimate?" required error={errors.free_consultation} shake={shakeFields.free_consultation}>
        <SingleChips options={FREE_CONSULTATION} value={form.free_consultation} onChange={(v) => set("free_consultation", v)} />
        {errors.free_consultation && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="Do you offer any payment plan or EMI?" required error={errors.payment_plan} shake={shakeFields.payment_plan}>
        <SingleChips options={["Yes", "No"]} value={form.payment_plan} onChange={(v) => set("payment_plan", v)} />
        {errors.payment_plan && <p className={styles.errorText}>Please select an option</p>}
        <AnimatePresence>
          {form.payment_plan === "Yes" && (
            <motion.div key="pp-details" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <input className={styles.input} style={{ marginTop: 8 }} placeholder="Briefly describe the plan — e.g. 50% upfront, rest on delivery" value={form.payment_plan_details} onChange={(e) => set("payment_plan_details", e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>
    </div>
  );
}

// ============================================================
// Step 3 — Trust & Guarantees
// ============================================================

function Step3({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Trust &amp; Guarantees</h1>
      <p className={styles.stepSubheading}>Help your agent handle concerns and build confidence before the sale.</p>

      <Field label="Do you offer any guarantee?" required error={errors.guarantee} shake={shakeFields.guarantee}>
        <SingleChips options={GUARANTEE} value={form.guarantee} onChange={(v) => set("guarantee", v)} />
        {errors.guarantee && <p className={styles.errorText}>Please select an option</p>}
        <AnimatePresence>
          {form.guarantee === "Other" && (
            <motion.div key="guar-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.guarantee_other} onChange={(v) => set("guarantee_other", v)} placeholder="Describe your guarantee" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="How long do results last?" required error={errors.results_duration} shake={shakeFields.results_duration}>
        <SingleChips options={RESULTS_DURATION} value={form.results_duration} onChange={(v) => set("results_duration", v)} />
        {errors.results_duration && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="Any aftercare tips you give customers?" helper='e.g. "Avoid harsh chemicals, use mild soap, wax periodically." Leave blank if not applicable.'>
        <input className={styles.input} placeholder='e.g. "Avoid sun exposure for 24 hours. Apply provided moisturizer daily."' value={form.aftercare} onChange={(e) => set("aftercare", e.target.value)} />
      </Field>

      <Field label="What worries customers most before buying?" required error={errors.customer_worries} shake={shakeFields.customer_worries} helper="Pick all that apply.">
        <MultiChips options={CUSTOMER_WORRIES} value={form.customer_worries} onChange={(v) => set("customer_worries", v)} />
        {errors.customer_worries && <p className={styles.errorText}>Please select at least one</p>}
        <AnimatePresence>
          {form.customer_worries.includes("Other") && (
            <motion.div key="cw-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.customer_worries_other} onChange={(v) => set("customer_worries_other", v)} placeholder="What else do customers worry about?" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="How do you usually handle their biggest worry?" required error={errors.worry_response} shake={shakeFields.worry_response} helper='e.g. "We clear-coat every piece — no damage to the original part."'>
        <textarea className={`${styles.textarea} ${errors.worry_response ? styles.error : ""}`} placeholder='e.g. "We are fully insured and photograph everything before starting."' rows={2} value={form.worry_response} onChange={(e) => set("worry_response", e.target.value)} />
      </Field>
    </div>
  );
}

// ============================================================
// Step 4 — Contact & Logistics
// ============================================================

function Step4({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Contact &amp; Logistics</h1>
      <p className={styles.stepSubheading}>Your agent uses this to direct customers at the right moment.</p>

      <Field label="WhatsApp number (with country code)" required error={errors.whatsapp} shake={shakeFields.whatsapp} helper="e.g. 918850231886">
        <input className={`${styles.input} ${errors.whatsapp ? styles.error : ""}`} placeholder="e.g. 918850231886" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
      </Field>

      <Field label="Phone / call number" helper="Leave blank if same as WhatsApp.">
        <input className={styles.input} placeholder="e.g. 7045430451" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>

      <Field label="Website or portfolio link" helper="Optional — leave blank if you don't have one.">
        <input className={styles.input} placeholder="e.g. https://hydrocustoms.com" value={form.website} onChange={(e) => set("website", e.target.value)} />
      </Field>

      <Field label="Google Maps link" helper="Optional — helps customers find you easily.">
        <input className={styles.input} placeholder="e.g. https://maps.app.goo.gl/xyz" value={form.maps_link} onChange={(e) => set("maps_link", e.target.value)} />
      </Field>

      <Field label="What payment methods do you accept?" required error={errors.payment_methods} shake={shakeFields.payment_methods}>
        <MultiChips options={PAYMENT_METHODS} value={form.payment_methods} onChange={(v) => set("payment_methods", v)} />
        {errors.payment_methods && <p className={styles.errorText}>Please select at least one</p>}
        <AnimatePresence>
          {form.payment_methods.includes("Other") && (
            <motion.div key="pm-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.payment_methods_other} onChange={(v) => set("payment_methods_other", v)} placeholder="Specify other payment method" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="How do customers book or get started?" required error={errors.booking_methods} shake={shakeFields.booking_methods}>
        <MultiChips options={BOOKING_METHODS} value={form.booking_methods} onChange={(v) => set("booking_methods", v)} />
        {errors.booking_methods && <p className={styles.errorText}>Please select at least one</p>}
        <AnimatePresence>
          {form.booking_methods.includes("Other") && (
            <motion.div key="bm-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.booking_methods_other} onChange={(v) => set("booking_methods_other", v)} placeholder="Describe how customers get started" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="Your service area" required error={errors.service_area} shake={shakeFields.service_area}>
        <SingleChips options={SERVICE_AREA} value={form.service_area} onChange={(v) => set("service_area", v)} />
        {errors.service_area && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="Cancellation / refund policy" required error={errors.cancellation_policy} shake={shakeFields.cancellation_policy}>
        <SingleChips options={CANCELLATION_POLICY} value={form.cancellation_policy} onChange={(v) => set("cancellation_policy", v)} />
        {errors.cancellation_policy && <p className={styles.errorText}>Please select an option</p>}
        <AnimatePresence>
          {form.cancellation_policy === "Other" && (
            <motion.div key="cp-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.cancellation_other} onChange={(v) => set("cancellation_other", v)} placeholder="Describe your cancellation policy" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>
    </div>
  );
}

// ============================================================
// Step 5 — Your Customers
// ============================================================

function Step5({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Your Customers</h1>
      <p className={styles.stepSubheading}>The more your agent knows about who it is talking to, the better it performs.</p>

      <Field label="Who is your typical customer?" required error={errors.customer_types} shake={shakeFields.customer_types} helper="Pick all that apply.">
        <MultiChips options={CUSTOMER_TYPES} value={form.customer_types} onChange={(v) => set("customer_types", v)} />
        {errors.customer_types && <p className={styles.errorText}>Please select at least one</p>}
        <AnimatePresence>
          {form.customer_types.includes("Other") && (
            <motion.div key="ct-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.customer_types_other} onChange={(v) => set("customer_types_other", v)} placeholder="Describe your typical customer" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="How experienced are your customers with your type of service?" required error={errors.experience_level} shake={shakeFields.experience_level}>
        <SingleChips options={EXPERIENCE_LEVELS} value={form.experience_level} onChange={(v) => set("experience_level", v)} />
        {errors.experience_level && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="What are the top 5–10 questions customers ask you most often?" required error={errors.top_questions} shake={shakeFields.top_questions}
        helper="Just list them as they come — short is fine. e.g. How much for a helmet? / What designs do you have? / How long does it take?">
        <textarea className={`${styles.textarea} ${errors.top_questions ? styles.error : ""}`} placeholder={"How much for a helmet?\nWhat designs do you have?\nHow long does it take?\nWhere are you located?\nCan you do my specific bike?"} rows={6} value={form.top_questions} onChange={(e) => set("top_questions", e.target.value)} />
      </Field>
    </div>
  );
}

// ============================================================
// Step 6 — AI Agent Behavior
// ============================================================

function Step6({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>AI Agent Behavior</h1>
      <p className={styles.stepSubheading}>Define exactly how your agent handles conversations, when to push, and what to avoid.</p>

      <Field label="What is the main goal of your AI agent?" required error={errors.agent_goal} shake={shakeFields.agent_goal}>
        <SingleChips options={AGENT_GOALS} value={form.agent_goal} onChange={(v) => set("agent_goal", v)} />
        {errors.agent_goal && <p className={styles.errorText}>Please select a goal</p>}
        <AnimatePresence>
          {form.agent_goal === "Other" && (
            <motion.div key="ag-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.agent_goal_other} onChange={(v) => set("agent_goal_other", v)} placeholder="Describe the agent's main goal" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="What should the agent find out before pushing the next step?" helper="Pick all that apply.">
        <MultiChips options={QUALIFY_QUESTIONS} value={form.qualify_questions} onChange={(v) => set("qualify_questions", v)} />
        <AnimatePresence>
          {form.qualify_questions.includes("Other") && (
            <motion.div key="qq-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.qualify_other} onChange={(v) => set("qualify_other", v)} placeholder="What else should the agent find out?" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="When should the agent push the CTA (next step)?" required error={errors.cta_timing} shake={shakeFields.cta_timing}>
        <SingleChips options={CTA_TIMING} value={form.cta_timing} onChange={(v) => set("cta_timing", v)} />
        {errors.cta_timing && <p className={styles.errorText}>Please select an option</p>}
        <AnimatePresence>
          {form.cta_timing === "Other" && (
            <motion.div key="ct-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.cta_timing_other} onChange={(v) => set("cta_timing_other", v)} placeholder="Describe when to push the CTA" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="What tone should the agent use?" required error={errors.tone} shake={shakeFields.tone} helper="Pick 2–3 that best fit your brand.">
        <MultiChips options={TONE_OPTIONS} value={form.tone} onChange={(v) => set("tone", v)} maxSelect={3} />
        {errors.tone && <p className={styles.errorText}>Please select at least one tone</p>}
      </Field>

      <Field label="What languages do your customers message in?" required error={errors.languages} shake={shakeFields.languages} helper="Pick all that apply.">
        <MultiChips options={LANGUAGES} value={form.languages} onChange={(v) => set("languages", v)} />
        {errors.languages && <p className={styles.errorText}>Please select at least one language</p>}
        <AnimatePresence>
          {form.languages.includes("Other") && (
            <motion.div key="lang-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.languages_other} onChange={(v) => set("languages_other", v)} placeholder="Specify other language(s)" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="Any specific words or phrases to use or avoid?" helper='Optional. e.g. "Use aap/batao, never tereko. Only say bhai if customer says it first."'>
        <input className={styles.input} placeholder='e.g. "Use aap/batao, never tereko."' value={form.phrases} onChange={(e) => set("phrases", e.target.value)} />
      </Field>

      <Field label="What should the agent first DM greeting be?" helper='Optional. Write 1–2 versions. e.g. "Hey! Kya customize karna hai?" / "Hey! What are you looking to customize?"'>
        <textarea className={styles.textarea} placeholder={'e.g. "Hey! Kya customize karna hai?"\ne.g. "Hi! Looking to book a cleaning?"'} rows={2} value={form.greeting} onChange={(e) => set("greeting", e.target.value)} />
      </Field>

      <Field label="What should the agent NEVER do?" required error={errors.never_do} shake={shakeFields.never_do} helper="Pick all that apply.">
        <MultiChips options={NEVER_DO} value={form.never_do} onChange={(v) => set("never_do", v)} />
        {errors.never_do && <p className={styles.errorText}>Please select at least one</p>}
        <AnimatePresence>
          {form.never_do.includes("Other") && (
            <motion.div key="nd-other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <OtherInput value={form.never_do_other} onChange={(v) => set("never_do_other", v)} placeholder="What else should the agent never do?" />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>

      <Field label="When the agent doesn't know something, what should it say?" required error={errors.unknown_response} shake={shakeFields.unknown_response}>
        <SingleChips options={UNKNOWN_RESPONSE_OPTIONS} value={form.unknown_response} onChange={(v) => set("unknown_response", v)} />
        {errors.unknown_response && <p className={styles.errorText}>Please select an option</p>}
        <AnimatePresence>
          {form.unknown_response === "Custom" && (
            <motion.div key="ur-custom" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <textarea className={styles.textarea} style={{ marginTop: 8 }} placeholder="Write the exact message the agent should say when it doesn't know something" rows={2} value={form.unknown_custom} onChange={(e) => set("unknown_custom", e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
      </Field>
    </div>
  );
}

// ============================================================
// Step 7 — Lead Capture Strategy
// ============================================================

function Step7({ form, set, errors, shakeFields }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Lead Capture Strategy</h1>
      <p className={styles.stepSubheading}>Tell your agent how to collect leads and what to do with them.</p>

      <Field label="What contact info should the agent collect?" required error={errors.collect_info} shake={shakeFields.collect_info} helper="Pick all that apply.">
        <MultiChips options={COLLECT_INFO} value={form.collect_info} onChange={(v) => set("collect_info", v)} />
        {errors.collect_info && <p className={styles.errorText}>Please select at least one option</p>}
      </Field>

      <Field label="When should the agent ask for contact info?" required error={errors.when_to_ask} shake={shakeFields.when_to_ask}>
        <SingleChips options={WHEN_TO_ASK} value={form.when_to_ask} onChange={(v) => set("when_to_ask", v)} />
        {errors.when_to_ask && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="If the customer doesn't want to share their info, what should the agent do?" required error={errors.if_refuses} shake={shakeFields.if_refuses}>
        <SingleChips options={IF_REFUSES} value={form.if_refuses} onChange={(v) => set("if_refuses", v)} />
        {errors.if_refuses && <p className={styles.errorText}>Please select an option</p>}
      </Field>

      <Field label="Describe your ideal lead capture flow in your own words" helper='Optional — this overrides the selections above if you have a specific way you want it done. e.g. "After knowing what they want, ask for their number to send pricing on WhatsApp. If they refuse, no push — just say to WhatsApp whenever ready."'>
        <textarea className={styles.textarea} placeholder='e.g. "Ask for email to send the brochure. If they say no, share the website link."' rows={3} value={form.flow_description} onChange={(e) => set("flow_description", e.target.value)} />
      </Field>

      <div className={styles.reviewCard} style={{ marginTop: 32 }}>
        <div className={styles.reviewCardHeader}>
          <p className={styles.reviewCardTitle}>🎉 Almost done!</p>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewKey}>Business</span>
          <span className={styles.reviewVal}>{form.business_name || "—"}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewKey}>Type</span>
          <span className={styles.reviewVal}>{form.business_type || "—"}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewKey}>Services</span>
          <span className={styles.reviewVal}>{form.service_catalogue.filter((r) => r.service.trim()).length} added</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewKey}>Agent goal</span>
          <span className={styles.reviewVal}>{form.agent_goal === "Other" ? form.agent_goal_other : (form.agent_goal || "—")}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewKey}>Languages</span>
          <span className={styles.reviewVal}>{form.languages.length > 0 ? form.languages.join(", ") : "—"}</span>
        </div>
      </div>
    </div>

  );
}

// ── Step 8 constants ──────────────────────────────────────────────────────────

const COMMENT_REPLY_STYLES = [
  { value: "short_push_to_dm", label: "Short reply + push to DMs", recommended: true },
  { value: "detailed", label: "Answer in detail in comments" },
  { value: "questions_only", label: "Only reply to questions" },
];

const COMMENT_REPLY_TO = [
  { value: "all", label: "All comments" },
  { value: "questions_and_compliments", label: "Questions and compliments only", recommended: true },
  { value: "questions_only", label: "Questions only" },
];

const COMMENT_POSITIVE_OPTIONS = [
  { value: "thank_and_engage", label: "Thank them and engage — reply warmly and invite them to DM" },
  { value: "thank_briefly", label: "Just say thanks briefly" },
  { value: "ignore_positive", label: "Don't reply to compliments" },
];

const COMMENT_NEGATIVE_OPTIONS = [
  { value: "address_politely", label: "Address it politely — respond calmly and handle the concern" },
  { value: "brief_response", label: "Acknowledge briefly and move on" },
  { value: "ignore_negative", label: "Don't reply to negative comments" },
];

const COMMENT_DM_SUGGESTIONS = [
  "DM karo, details bhejta hoon!",
  "Check DM! Sent you the details.",
  "DM me for pricing and info!",
];

// ============================================================
// Step 8 — Comment Reply Settings
// ============================================================

function Step8({ form, set }: StepProps) {
  return (
    <div>
      <h1 className={styles.stepHeading}>Comment Reply Settings</h1>
      <p className={styles.stepSubheading}>Configure how your AI agent handles and responds to comments on your posts and reels.</p>

      <Field label="How should your agent reply to comments?">
        <div className={styles.chipGroup}>
          {COMMENT_REPLY_STYLES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${form.comment_reply_style === opt.value ? styles.selected : ""}`}
              onClick={() => set("comment_reply_style", opt.value)}
            >
              {opt.label}
              {opt.recommended && <span className={styles.recommendedTag}>Recommended</span>}
            </button>
          ))}
        </div>
      </Field>

      {form.comment_reply_style === "short_push_to_dm" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="dm-msg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Field label="What should the agent say when pushing to DMs?" helper="The message posted as a public comment reply to redirect users to your DM.">
              <input
                className={styles.input}
                placeholder="DM karo, details bhejta hoon!"
                value={form.comment_dm_push_message}
                onChange={(e) => set("comment_dm_push_message", e.target.value)}
              />
              <div className={styles.exampleChips}>
                {COMMENT_DM_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.exampleChip}
                    onClick={() => set("comment_dm_push_message", s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </motion.div>
        </AnimatePresence>
      )}

      <Field label="Which comments should the agent reply to?">
        <div className={styles.chipGroup}>
          {COMMENT_REPLY_TO.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${form.comment_reply_to === opt.value ? styles.selected : ""}`}
              onClick={() => set("comment_reply_to", opt.value)}
            >
              {opt.label}
              {opt.recommended && <span className={styles.recommendedTag}>Recommended</span>}
            </button>
          ))}
        </div>
      </Field>

      <Field label="When someone leaves a positive comment or compliment..." helper='e.g. "amazing work!", "🔥", "love this"'>
        <div className={styles.chipGroup}>
          {COMMENT_POSITIVE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${form.comment_positive_handling === opt.value ? styles.selected : ""}`}
              onClick={() => set("comment_positive_handling", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="When someone leaves a negative or critical comment..." helper='e.g. "too expensive", "not worth it", "looks bad"'>
        <div className={styles.chipGroup}>
          {COMMENT_NEGATIVE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${form.comment_negative_handling === opt.value ? styles.selected : ""}`}
              onClick={() => set("comment_negative_handling", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ============================================================
// Main page
// ============================================================

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [configuringToast, setConfiguringToast] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }
      setAccessToken(session.access_token);

      // ?mode=edit skips the intro and goes straight to the form
      const isEditMode = new URLSearchParams(window.location.search).get("mode") === "edit";

      try {
        const saved = localStorage.getItem("onboarding_form_v2");
        if (saved) setForm(JSON.parse(saved));
        const savedStep = localStorage.getItem("onboarding_step_v2");
        const parsed = savedStep ? parseInt(savedStep, 10) : 0;
        // If edit mode or they already started the form, skip intro
        if (isEditMode || parsed >= 1) {
          setStep(parsed >= 1 ? parsed : 1);
        }
        // else stay at step 0 (intro)
      } catch {
        if (isEditMode) setStep(1);
      }

      setReady(true);
    };
    init();
  }, [router, supabase.auth]);

  useEffect(() => {
    if (ready) localStorage.setItem("onboarding_form_v2", JSON.stringify(form));
  }, [form, ready]);

  useEffect(() => {
    if (ready && step >= 1) localStorage.setItem("onboarding_step_v2", String(step));
  }, [step, ready]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const triggerShake = (fields: string[]) => {
    const shake: Record<string, boolean> = {};
    fields.forEach((f) => (shake[f] = true));
    setShakeFields(shake);
    setTimeout(() => setShakeFields({}), 600);
  };

  const validate = (): boolean => {
    const errs: Record<string, boolean> = {};
    const missing: string[] = [];

    const req = (key: string, val: string | string[]) => {
      const empty = Array.isArray(val) ? val.length === 0 : !val.trim();
      if (empty) { errs[key] = true; missing.push(key); }
    };

    if (step === 1) {
      req("business_name", form.business_name);
      req("owner_name", form.owner_name);
      req("instagram_handle", form.instagram_handle);
      req("business_type", form.business_type);
      req("location", form.location);
      req("working_hours", form.working_hours);
      req("description", form.description);
      req("years_in_business", form.years_in_business);
    }
    if (step === 2) {
      const hasCatalogue = form.service_catalogue.some((r) => r.service.trim());
      if (!hasCatalogue) { errs.service_catalogue = true; missing.push("service_catalogue"); }
      req("how_it_works", form.how_it_works);
      req("duration", form.duration);
      req("custom_requests", form.custom_requests);
      req("free_consultation", form.free_consultation);
      req("payment_plan", form.payment_plan);
      req("pricing_depends", form.pricing_depends);
    }
    if (step === 3) {
      req("guarantee", form.guarantee);
      req("results_duration", form.results_duration);
      req("customer_worries", form.customer_worries);
      req("worry_response", form.worry_response);
    }
    if (step === 4) {
      req("whatsapp", form.whatsapp);
      req("payment_methods", form.payment_methods);
      req("booking_methods", form.booking_methods);
      req("service_area", form.service_area);
      req("cancellation_policy", form.cancellation_policy);
    }
    if (step === 5) {
      req("customer_types", form.customer_types);
      req("experience_level", form.experience_level);
      req("top_questions", form.top_questions);
    }
    if (step === 6) {
      req("agent_goal", form.agent_goal);
      req("cta_timing", form.cta_timing);
      req("tone", form.tone);
      req("languages", form.languages);
      req("never_do", form.never_do);
      req("unknown_response", form.unknown_response);
    }
    if (step === 7) {
      req("collect_info", form.collect_info);
      req("when_to_ask", form.when_to_ask);
      req("if_refuses", form.if_refuses);
    }

    setErrors(errs);
    if (missing.length > 0) triggerShake(missing);
    return missing.length === 0;
  };

  const goNext = () => {
    if (!validate()) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validate() || !accessToken) return;
    setSubmitting(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        ...buildPayload(form),
        comment_config: {
          reply_style: form.comment_reply_style,
          dm_push_message: form.comment_dm_push_message,
          reply_to: form.comment_reply_to,
          positive_handling: form.comment_positive_handling,
          negative_handling: form.comment_negative_handling,
        },
      }),
    });

    if (res.ok) {
      localStorage.removeItem("onboarding_form_v2");
      localStorage.removeItem("onboarding_step_v2");
      setConfiguringToast(true);
      setTimeout(() => router.replace("/dashboard"), 1800);
    } else {
      setSubmitting(false);
    }
  };

  if (!ready) return <div className={styles.loading}>Loading...</div>;

  // ── Intro page (step 0) ────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.introContainer}>
          <div className={styles.introBrand}>
            <div className={styles.introBrandIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
              </svg>
            </div>
            <span className={styles.introBrandName}>InstaAutomate</span>
          </div>

          <h1 className={styles.introHeading}>Let&apos;s set up your AI assistant</h1>
          <p className={styles.introSubheading}>
            Answer a few simple questions about your business — your services, pricing, how you talk to customers, and what your agent should and shouldn&apos;t say. This helps your AI assistant handle DMs and comments just like you would.
          </p>

          <div className={styles.introFeatures}>
            <div className={styles.introFeatureItem}>
              <div className={styles.introFeatureIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className={styles.introFeatureTitle}>Your business details</p>
                <p className={styles.introFeatureDesc}>Name, location, hours, and what you do</p>
              </div>
            </div>
            <div className={styles.introFeatureItem}>
              <div className={styles.introFeatureIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className={styles.introFeatureTitle}>Services &amp; pricing</p>
                <p className={styles.introFeatureDesc}>What you offer and how much it costs</p>
              </div>
            </div>
            <div className={styles.introFeatureItem}>
              <div className={styles.introFeatureIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
              </div>
              <div>
                <p className={styles.introFeatureTitle}>How your agent should talk</p>
                <p className={styles.introFeatureDesc}>Tone, language, what to say and avoid</p>
              </div>
            </div>
            <div className={styles.introFeatureItem}>
              <div className={styles.introFeatureIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <p className={styles.introFeatureTitle}>Lead capture preferences</p>
                <p className={styles.introFeatureDesc}>What info to collect and when to ask</p>
              </div>
            </div>
          </div>

          <div className={styles.introActions}>
            <button className={styles.introStartBtn} onClick={() => setStep(1)}>
              Let&apos;s Go →
            </button>
            <p className={styles.introTimeNote}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Takes about 5–10 minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const STEP_LABELS = [
    "Business Basics",
    "Services & Pricing",
    "Trust & Guarantees",
    "Contact & Logistics",
    "Your Customers",
    "AI Agent Behavior",
    "Lead Capture",
    "Comment Reply Settings",
  ];

  return (
    <>
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressLabel}>
            Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {step === 1 && <Step1 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 2 && <Step2 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 3 && <Step3 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 4 && <Step4 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 5 && <Step5 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 6 && <Step6 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 7 && <Step7 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
            {step === 8 && <Step8 form={form} set={set} errors={errors} shakeFields={shakeFields} />}
          </motion.div>
        </AnimatePresence>

        <div className={styles.nav}>
          {step > 1 ? (
            <button className={styles.backBtn} onClick={goBack}>← Back</button>
          ) : <div />}
          {step < TOTAL_STEPS ? (
            <button className={styles.nextBtn} onClick={goNext}>Continue →</button>
          ) : (
            <button className={styles.launchBtn} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Configuring..." : "Configure Agent →"}
            </button>
          )}
        </div>

        {step === TOTAL_STEPS && (
          <p className={styles.launchNote}>
            Your agent will be configured from these answers. You can update them anytime from the dashboard.
          </p>
        )}
      </div>
    </div>

    {/* Configuring toast */}
    <AnimatePresence>
      {configuringToast && (
        <motion.div
          key="configuring-toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className={styles.configuringToast}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Settings saved! Agent is being configured...
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
