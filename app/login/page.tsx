"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Mode = "signin" | "signup";

export default function LoginPage() {
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

  const reset = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    reset();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
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
    <main style={s.page} className="login-page">
      <style>{`
        /* ── Mobile-only elements hidden on desktop ── */
        .login-mobile-header,
        .login-mobile-features {
          display: none;
        }

        @media (max-width: 768px) {
          /* Page — flex column so branding/card/features stack */
          .login-page {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 32px 16px !important;
            gap: 16px !important;
          }

          /* Branding above the card */
          .login-mobile-header {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
            text-align: center !important;
          }
          .login-mobile-brand {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .login-mobile-brand-name {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #fff !important;
            letter-spacing: -0.3px !important;
          }
          .login-mobile-tagline {
            font-size: 13px !important;
            color: rgba(255,255,255,0.5) !important;
            margin: 0 !important;
          }

          /* Hide in-card brand (shown above the card instead) */
          .login-brand {
            display: none !important;
          }

          /* Card — white, light theme on dark background */
          .login-card {
            background: rgba(255,255,255,0.97) !important;
            border-radius: 16px !important;
            padding: 24px !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 400px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }

          /* Restore light-theme colors inside the card */
          .login-heading       { color: #0f172a !important; }
          .login-subheading    { color: #64748b !important; }
          .login-tabs          { background: #f1f5f9 !important; }
          .login-tab           { color: #64748b !important; }
          .login-tab-active    { background: #ffffff !important; color: #0f172a !important; }
          .login-label-text    { color: #334155 !important; }
          .login-input         { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
          .login-submit        { width: 100% !important; }
          .login-switch-text   { color: #64748b !important; }
          .login-switch-link   { color: #6d28d9 !important; }

          /* Feature bullets below the card */
          .login-mobile-features {
            display: block !important;
            font-size: 12px !important;
            color: rgba(255,255,255,0.4) !important;
            text-align: center !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>

      {/* Mobile-only branding above card */}
      <div className="login-mobile-header">
        <div className="login-mobile-brand">
          <div style={s.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <span className="login-mobile-brand-name">InstaAutomate</span>
        </div>
        <p className="login-mobile-tagline">AI-powered DM &amp; comment automation for Instagram</p>
      </div>

      <div style={s.card} className="login-card">
        {/* Brand — visible on desktop, hidden on mobile (shown above instead) */}
        <div style={s.brand} className="login-brand">
          <div style={s.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <span style={s.brandName} className="login-brand-name">InstaAutomate</span>
        </div>

        <h1 style={s.heading} className="login-heading">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={s.subheading} className="login-subheading">
          {mode === "signin"
            ? "Sign in to manage your Instagram automations."
            : "Get started with AI-powered Instagram automation."}
        </p>

        {/* Tab toggle */}
        <div style={s.tabs} className="login-tabs">
          <button
            type="button"
            style={mode === "signin" ? s.tabActive : s.tabInactive}
            className={`login-tab${mode === "signin" ? " login-tab-active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            style={mode === "signup" ? s.tabActive : s.tabInactive}
            className={`login-tab${mode === "signup" ? " login-tab-active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.form} noValidate>
          <label style={s.label}>
            <span style={s.labelText} className="login-label-text">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={s.input}
              className="login-input"
            />
          </label>

          <label style={s.label}>
            <span style={s.labelText} className="login-label-text">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              style={s.input}
              className="login-input"
            />
          </label>

          {error && <p style={s.errorMsg}>{error}</p>}
          {info && <p style={s.infoMsg}>{info}</p>}

          <button type="submit" disabled={loading} style={s.submitBtn} className="login-submit">
            {loading
              ? mode === "signin" ? "Signing in..." : "Creating account..."
              : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={s.switchText} className="login-switch-text">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            style={s.switchLink}
            className="login-switch-link"
            onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>

      {/* Mobile-only feature bullets below card */}
      <p className="login-mobile-features">
        AI DM Replies&nbsp;&bull;&nbsp;Auto Comments&nbsp;&bull;&nbsp;Lead Capture
      </p>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  brandIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontWeight: "700",
    fontSize: "17px",
    color: "#0f172a",
    letterSpacing: "-0.3px",
  },
  heading: {
    margin: "0 0 6px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.4px",
  },
  subheading: {
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
    borderRadius: "8px",
    background: "transparent",
    color: "#64748b",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
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
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#f8fafc",
  },
  errorMsg: {
    margin: "0",
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#b91c1c",
    fontSize: "13px",
  },
  infoMsg: {
    margin: "0",
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
    color: "#6d28d9",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    padding: "0",
  },
};
