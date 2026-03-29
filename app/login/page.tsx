"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [authChecking, setAuthChecking] = useState(true);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setAuthChecking(false);
      }
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

  if (authChecking) {
    return <div style={{ minHeight: "100vh", background: "#0f172a" }} />;
  }

  return (
    <main style={s.page} className="login-page">
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(14px) scale(0.97); }
        }

        /* ── Mobile-only elements hidden on desktop ── */
        .login-mobile-header,
        .login-mobile-features {
          display: none;
        }
        /* Left panel hidden on mobile */
        .login-left-panel {
          display: flex;
        }

        @media (max-width: 768px) {
          /* Left panel gone on mobile */
          .login-left-panel {
            display: none !important;
          }

          /* Right panel becomes the full page */
          .login-right-panel {
            flex: 1 !important;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
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

          /* Hide in-card brand on mobile (shown above instead) */
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

      {/* ── Left panel (desktop only) ── */}
      <div style={s.leftPanel} className="login-left-panel">
        {/* Animated background orbs */}
        <div style={{ ...s.orb, ...s.orbA }} />
        <div style={{ ...s.orb, ...s.orbB }} />

        <div style={s.leftContent}>
          <div style={s.leftBrand}>
            <div style={s.brandIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
              </svg>
            </div>
            <span style={s.leftBrandName}>InstaAutomate</span>
          </div>

          <h2 style={s.leftHeading}>
            Your Instagram,<br />on autopilot.
          </h2>
          <p style={s.leftSub}>
            AI replies to every DM and comment while you focus on what matters.
          </p>

          <ul style={s.featureList}>
            {[
              "AI-powered DM replies 24/7",
              "Auto-reply to comments",
              "Lead capture & scoring",
              "Train your own knowledge base",
            ].map((f) => (
              <li key={f} style={s.featureItem}>
                <span style={s.featureCheck}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={s.rightPanel} className="login-right-panel">
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
          {/* Brand row inside card — visible on desktop, hidden on mobile */}
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
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  /* ── Outer shell ── */
  page: {
    display: "flex",
    minHeight: "100vh",
  },

  /* ── Left dark panel ── */
  leftPanel: {
    flex: "0 0 52%",
    position: "relative",
    background: "linear-gradient(160deg, #0c1120 0%, #0f172a 45%, #1a1035 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 56px",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(72px)",
    pointerEvents: "none",
  },
  orbA: {
    width: "340px",
    height: "340px",
    background: "radial-gradient(circle, rgba(131,58,180,0.35) 0%, transparent 70%)",
    top: "-60px",
    right: "-40px",
    animation: "floatA 7s ease-in-out infinite",
  },
  orbB: {
    width: "280px",
    height: "280px",
    background: "radial-gradient(circle, rgba(253,29,29,0.2) 0%, transparent 70%)",
    bottom: "40px",
    left: "20px",
    animation: "floatB 9s ease-in-out infinite",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "380px",
  },
  leftBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "48px",
  },
  leftBrandName: {
    fontWeight: "700",
    fontSize: "16px",
    color: "#f1f5f9",
    letterSpacing: "-0.2px",
  },
  leftHeading: {
    margin: "0 0 16px",
    fontSize: "36px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.18",
    letterSpacing: "-0.8px",
  },
  leftSub: {
    margin: "0 0 40px",
    fontSize: "15px",
    color: "rgba(255,255,255,0.5)",
    lineHeight: "1.6",
  },
  featureList: {
    listStyle: "none",
    margin: "0",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  featureCheck: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #833ab4, #fd1d1d)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  /* ── Right form panel ── */
  rightPanel: {
    flex: 1,
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
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
    flexShrink: 0,
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
