"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Mode = "signin" | "signup";

export default function HomePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router, supabase.auth]);

  const reset = () => { setError(null); setInfo(null); };

  const switchMode = (next: Mode) => { setMode(next); reset(); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    reset();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        return;
      }

      setInfo("Check your email to confirm your account before signing in.");
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>
            <div style={s.brandIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
              </svg>
            </div>
            <span style={s.brandName}>InstaAutomate</span>
          </div>

          <h1 style={s.headline}>
            Automate your Instagram.<br />
            <span style={s.headlineAccent}>Grow on autopilot.</span>
          </h1>

          <p style={s.tagline}>
            Connect your Instagram Business account and let AI handle your DMs and comments — 24/7.
          </p>

          <ul style={s.features}>
            {[
              ["AI-powered DM replies", "Respond to every message instantly."],
              ["Auto comment responses", "Never miss a comment on your posts."],
              ["60-day secure tokens", "Long-lived access, safely stored."],
              ["Real-time webhooks", "Automation that fires the moment it happens."],
            ].map(([title, desc]) => (
              <li key={title} style={s.featureItem}>
                <div style={s.featureDot} />
                <div>
                  <p style={s.featureTitle}>{title}</p>
                  <p style={s.featureDesc}>{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.card}>
          <h2 style={s.cardHeading}>
            {mode === "signin" ? "Welcome back" : "Get started free"}
          </h2>
          <p style={s.cardSub}>
            {mode === "signin"
              ? "Sign in to your account to continue."
              : "Create your account — no credit card required."}
          </p>

          {/* Tabs */}
          <div style={s.tabs}>
            <button
              type="button"
              style={mode === "signin" ? s.tabActive : s.tabInactive}
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              style={mode === "signup" ? s.tabActive : s.tabInactive}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} style={s.form} noValidate>
            <label style={s.label}>
              <span style={s.labelText}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                style={s.input}
              />
            </label>

            <label style={s.label}>
              <span style={s.labelText}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                style={s.input}
              />
            </label>

            {error && <p style={s.errorMsg}>{error}</p>}
            {info && <p style={s.infoMsg}>{info}</p>}

            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading
                ? mode === "signin" ? "Signing in..." : "Creating account..."
                : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p style={s.switchText}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              style={s.switchLink}
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
  },

  // Left
  left: {
    background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
  },
  leftInner: {
    maxWidth: "440px",
    width: "100%",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "48px",
  },
  brandIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "18px",
    letterSpacing: "-0.3px",
  },
  headline: {
    color: "#ffffff",
    fontSize: "36px",
    fontWeight: "800",
    lineHeight: "1.2",
    margin: "0 0 16px",
    letterSpacing: "-0.8px",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #a78bfa, #f472b6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  tagline: {
    color: "#94a3b8",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 40px",
  },
  features: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "20px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  featureDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #a78bfa, #f472b6)",
    marginTop: "5px",
    flexShrink: 0,
  },
  featureTitle: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: "14px",
    margin: "0 0 2px",
  },
  featureDesc: {
    color: "#64748b",
    fontSize: "13px",
    margin: 0,
  },

  // Right
  right: {
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
  },
  cardHeading: {
    margin: "0 0 6px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.4px",
  },
  cardSub: {
    margin: "0 0 24px",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#f1f5f9",
    borderRadius: "10px",
    padding: "4px",
    marginBottom: "24px",
  },
  tabActive: {
    padding: "8px",
    border: "none",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  tabInactive: {
    padding: "8px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
    borderRadius: "8px",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  label: {
    display: "grid",
    gap: "6px",
  },
  labelText: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
  },
  input: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#f8fafc",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  errorMsg: {
    margin: 0,
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#b91c1c",
    fontSize: "13px",
  },
  infoMsg: {
    margin: 0,
    padding: "10px 14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    color: "#15803d",
    fontSize: "13px",
  },
  submitBtn: {
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #833ab4, #fd1d1d)",
    color: "#ffffff",
    padding: "12px 16px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "4px",
  },
  switchText: {
    margin: "20px 0 0",
    textAlign: "center",
    fontSize: "13px",
    color: "#64748b",
  },
  switchLink: {
    background: "none",
    border: "none",
    color: "#7c3aed",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
  },
};
