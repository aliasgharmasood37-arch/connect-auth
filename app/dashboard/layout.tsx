"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./layout.module.css";
import guideStyles from "./guide.module.css";
import UserGuide from "./UserGuide";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/knowledge-base",
    label: "Knowledge Base",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/leads",
    label: "Leads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [missingReelCount, setMissingReelCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideFirstTime, setGuideFirstTime] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch("/api/reel-context?missing=true", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => setMissingReelCount(data.reels?.length ?? 0))
        .catch(() => {});
      fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => setUsername(data.workspace?.username ?? null))
        .catch(() => {});
    });
  }, []);

  return (
    <div className={styles.layout}>
      {/* Mobile top header */}
      <div className={styles.mobileHeader}>
        <button className={styles.hamburger} onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className={styles.mobileBrand}>InstaAutomate</span>
        {username && (
          <div className={styles.mobileBadge}>
            <span className={styles.mobileDot} />
            @{username}
          </div>
        )}
        <button
          className={guideStyles.helpIconBtn}
          onClick={() => { setGuideFirstTime(false); setGuideOpen(true); }}
          aria-label="Open help guide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
          </svg>
        </button>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${drawerOpen ? styles.sidebarDrawerOpen : ""}`}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <span className={styles.brandName}>InstaAutomate</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ""}`}
              onClick={() => setDrawerOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
              {item.href === "/dashboard" && missingReelCount > 0 && (
                <span className={styles.navDot} />
              )}
            </Link>
          ))}
        </nav>

        <button
          className={guideStyles.helpBtn}
          onClick={() => { setDrawerOpen(false); setGuideFirstTime(false); setGuideOpen(true); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
          </svg>
          Help
        </button>
      </aside>

      <div className={styles.content}>{children}</div>

      <UserGuide
        open={guideOpen}
        firstTime={guideFirstTime}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}
