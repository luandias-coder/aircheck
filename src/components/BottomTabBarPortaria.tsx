"use client";
import { useEffect, useState } from "react";

const B = { primary: "#3B5FE5", g1: "#3B5FE5", g2: "#5E4FE5" };

type TabId = "checkins" | "settings";

interface Props {
  tab: TabId;
  onTabChange: (t: TabId) => void;
  isAdmin: boolean;
}

const TABS: { id: TabId; label: string; adminOnly: boolean; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "checkins", label: "Check-ins", adminOnly: false,
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? B.primary : "#525252"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "settings", label: "Configurações", adminOnly: true,
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? B.primary : "#525252"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function BottomTabBarPortaria({ tab, onTabChange, isAdmin }: Props) {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsPWA(standalone);
  }, []);

  if (!isPWA) return null;

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  // Don't show tab bar if only one tab (porteiro non-admin)
  if (visibleTabs.length < 2) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "rgba(15,15,15,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid #2A2A2A",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 500, margin: "0 auto" }}>
        {visibleTabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "10px 0 8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                position: "relative",
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "25%",
                    right: "25%",
                    height: 2,
                    borderRadius: 1,
                    background: `linear-gradient(135deg, ${B.g1}, ${B.g2})`,
                  }}
                />
              )}
              {t.icon(active)}
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? B.primary : "#525252",
                  letterSpacing: "-0.01em",
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
