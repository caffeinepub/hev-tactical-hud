import React, { useState, useRef, useEffect, useCallback } from "react";
import { Faction, GameMode, TabNavStyle } from "../backend";
import { useHUD } from "../context/HUDContext";
import BasicsTab from "../tabs/BasicsTab";
import CommsTab from "../tabs/CommsTab";
import HazardsTab from "../tabs/HazardsTab";
import InfoTab from "../tabs/InfoTab";
import LambdaTab from "../tabs/LambdaTab";
import MedicalTab from "../tabs/MedicalTab";
import NexusTab from "../tabs/NexusTab";
import PatrolTab from "../tabs/PatrolTab";
import SettingsTab from "../tabs/SettingsTab";
import TacticalTab from "../tabs/TacticalTab";
import UtilitiesTab from "../tabs/UtilitiesTab";
import VehiclesTab from "../tabs/VehiclesTab";
import WeaponsTab from "../tabs/WeaponsTab";

const TABS_HEV_HL1 = [
  "BASICS",
  "TACTICAL",
  "MEDICAL",
  "INFO",
  "WEAPONS",
  "UTILITIES",
  "HAZARDS",
  "SETTINGS",
  "LAMBDA",
];
const TABS_HEV_HL2 = [
  "BASICS",
  "TACTICAL",
  "MEDICAL",
  "INFO",
  "WEAPONS",
  "UTILITIES",
  "HAZARDS",
  "VEHICLES",
  "SETTINGS",
  "LAMBDA",
];
const TABS_HECU = [
  "BASICS",
  "TACTICAL",
  "MEDICAL",
  "INFO",
  "WEAPONS",
  "UTILITIES",
  "HAZARDS",
  "SETTINGS",
  "COMMS",
];
const TABS_SECURITY = [
  "BASICS",
  "TACTICAL",
  "MEDICAL",
  "INFO",
  "WEAPONS",
  "UTILITIES",
  "HAZARDS",
  "SETTINGS",
  "PATROL",
];
const TABS_COMBINE_HL2 = [
  "BASICS",
  "TACTICAL",
  "MEDICAL",
  "INFO",
  "WEAPONS",
  "UTILITIES",
  "HAZARDS",
  "VEHICLES",
  "SETTINGS",
  "NEXUS",
];
const TABS_COMBINE_HL1 = [
  "BASICS",
  "TACTICAL",
  "MEDICAL",
  "INFO",
  "WEAPONS",
  "UTILITIES",
  "HAZARDS",
  "SETTINGS",
  "NEXUS",
];

function getTabList(faction: Faction, gameMode: GameMode): string[] {
  if (faction === Faction.hev && gameMode === GameMode.hl2) return TABS_HEV_HL2;
  if (faction === Faction.hev) return TABS_HEV_HL1;
  if (faction === Faction.hecu) return TABS_HECU;
  if (faction === Faction.security) return TABS_SECURITY;
  if (faction === Faction.combine && gameMode === GameMode.hl2)
    return TABS_COMBINE_HL2;
  if (faction === Faction.combine) return TABS_COMBINE_HL1;
  return TABS_HEV_HL1;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `UP: ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HUDFrame() {
  const {
    settings,
    factionColors,
    designation,
    factionLabel,
    uptimeSeconds,
    panicActive,
    hudLocked,
    unlockHUD,
    screenShake,
    addLogEntry,
    updateSettings,
  } = useHUD();
  const [activeTab, setActiveTab] = useState("BASICS");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs = getTabList(settings.faction, settings.gameMode);
  const colors = factionColors;
  const hudScale = Number(settings.hudSize) / 100;

  // Close menu when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  // Ensure active tab is valid when tabs change
  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab("BASICS");
  }, [tabs, activeTab]);

  function handleTabSelect(tab: string) {
    setActiveTab(tab);
    setMenuOpen(false);
    addLogEntry(`NAV: ${tab} MODULE ACTIVATED`, "system");
  }

  const handlePinKey = useCallback(
    (key: string) => {
      if (key === "DEL") {
        setPinEntry((p) => p.slice(0, -1));
        setPinError(false);
        return;
      }
      if (key === "ENT") {
        const ok = unlockHUD(pinEntry);
        if (!ok) {
          setPinError(true);
          setPinEntry("");
          setTimeout(() => setPinError(false), 1500);
        }
        return;
      }
      if (pinEntry.length < 4) {
        setPinEntry((p) => p + key);
        setPinError(false);
      }
    },
    [pinEntry, unlockHUD],
  );

  // Quick-action bar handlers
  const handleQuickReload = useCallback(() => {
    addLogEntry("QUICK ACTION: RELOAD INITIATED", "info");
  }, [addLogEntry]);

  const handleQuickLight = useCallback(() => {
    addLogEntry("QUICK ACTION: FLASHLIGHT TOGGLED", "info");
  }, [addLogEntry]);

  const handleQuickAlert = useCallback(() => {
    addLogEntry("QUICK ACTION: MANUAL ALERT TRIGGERED", "warn");
  }, [addLogEntry]);

  const handleQuickMedkit = useCallback(() => {
    addLogEntry("QUICK ACTION: MEDKIT ADMINISTERED +10 HP", "info");
  }, [addLogEntry]);

  function renderTabContent() {
    switch (activeTab) {
      case "BASICS":
        return <BasicsTab />;
      case "TACTICAL":
        return <TacticalTab />;
      case "MEDICAL":
        return <MedicalTab />;
      case "INFO":
        return <InfoTab />;
      case "WEAPONS":
        return <WeaponsTab />;
      case "HAZARDS":
        return <HazardsTab />;
      case "UTILITIES":
        return <UtilitiesTab />;
      case "VEHICLES":
        return <VehiclesTab />;
      case "SETTINGS":
        return <SettingsTab />;
      case "LAMBDA":
        return <LambdaTab />;
      case "COMMS":
        return <CommsTab />;
      case "PATROL":
        return <PatrolTab />;
      case "NEXUS":
        return <NexusTab />;
      default:
        return null;
    }
  }

  const quickBtnStyle = {
    flex: 1,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "8px",
    letterSpacing: "0.1em",
    padding: "4px 2px",
    background: `${colors.primary}10`,
    border: `1px solid ${colors.primary}40`,
    color: colors.primary,
    borderRadius: "3px",
    cursor: "pointer",
    transition: "background 0.12s",
    minHeight: "26px",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  // Apply glitch to body if needed
  useEffect(() => {
    if (settings.glitchEffects) {
      // Already handled by GlitchOverlay
    }
  }, [settings.glitchEffects]);

  return (
    <div
      className="relative"
      style={{
        width: "100%",
        height: "100%",
        background: colors.bg,
        color: colors.text,
        fontFamily: "'Share Tech Mono', monospace",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        animation: screenShake ? "screen-shake 0.6s ease-in-out" : "none",
      }}
    >
      {/* CRT + vignette overlays */}
      {settings.scanlines && <div className="crt-overlay" />}
      <div className="vignette" />

      {/* Glitch overlay - random trigger */}
      {settings.glitchEffects && <GlitchOverlay primary={colors.primary} />}

      {/* Panic overlay */}
      {panicActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9996,
            pointerEvents: "none",
            border: "4px solid #ff0000",
            animation: "hud-border-pulse 0.5s ease-in-out infinite",
            boxSizing: "border-box",
          }}
        />
      )}
      {panicActive && (
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: 0,
            right: 0,
            zIndex: 9996,
            pointerEvents: "none",
            textAlign: "center",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "14px",
            color: "#ff0000",
            letterSpacing: "0.3em",
            textShadow: "0 0 20px #ff0000",
            animation: "panic-overlay 0.5s ease-in-out infinite",
          }}
        >
          &#9888; CRITICAL FAILURE &#9888;
          <br />
          <span style={{ fontSize: "10px" }}>EMERGENCY PROTOCOLS ENGAGED</span>
        </div>
      )}

      {/* HUD Lock overlay */}
      {hudLocked && (
        <PinLockOverlay
          colors={colors}
          pinEntry={pinEntry}
          pinError={pinError}
          onKey={handlePinKey}
        />
      )}

      {/* ================================================================
          HEADER BAR
      ================================================================ */}
      <div
        style={{
          flexShrink: 0,
          padding: "6px 10px",
          borderBottom: `1px solid ${colors.primary}50`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.7)",
          position: "relative",
          zIndex: 100,
        }}
        data-ocid="hud.header.section"
      >
        {/* Lambda badge */}
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: `1.5px solid ${colors.primary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: colors.primary,
            textShadow: `0 0 6px ${colors.primary}`,
            boxShadow: `0 0 6px ${colors.primary}60, inset 0 0 4px ${colors.primary}20`,
            flexShrink: 0,
          }}
        >
          Λ
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "10px",
              color: colors.primary,
              letterSpacing: "0.2em",
              fontWeight: 700,
              textShadow: `0 0 6px ${colors.primary}60`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            H.E.V TACTICAL
          </div>
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.15em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {factionLabel}
          </div>
        </div>

        {/* Designation */}
        <div
          style={{
            fontSize: "8px",
            color: `${colors.primary}80`,
            letterSpacing: "0.12em",
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div>{settings.operatorName}</div>
          <div style={{ color: colors.dim, fontSize: "7px" }}>
            {designation}
          </div>
        </div>

        {/* Hamburger menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          data-ocid="hud.menu.button"
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            background: menuOpen ? `${colors.primary}20` : "transparent",
            border: `1px solid ${colors.primary}50`,
            borderRadius: "4px",
            cursor: "pointer",
            padding: "5px",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "14px",
                height: "1.5px",
                background: colors.primary,
                boxShadow: `0 0 4px ${colors.primary}`,
                borderRadius: "1px",
                transition: "all 0.15s",
                transform:
                  menuOpen && i === 0
                    ? "rotate(45deg) translate(4px, 4px)"
                    : menuOpen && i === 2
                      ? "rotate(-45deg) translate(4px, -4px)"
                      : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      {/* ================================================================
          TAB NAVIGATION - DROPDOWN
      ================================================================ */}
      {settings.tabNavStyle === TabNavStyle.dropdown && menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: "44px",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.97)",
            border: `1px solid ${colors.primary}50`,
            borderTop: "none",
            animation: "dropdown-in 0.18s ease-out",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
          data-ocid="hud.nav.dropdown_menu"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabSelect(tab)}
              data-ocid={`hud.nav.${tab.toLowerCase()}.tab`}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 14px",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.18em",
                color:
                  activeTab === tab ? colors.primary : `${colors.primary}70`,
                background:
                  activeTab === tab ? `${colors.primary}15` : "transparent",
                border: "none",
                borderBottom: `1px solid ${colors.primary}20`,
                cursor: "pointer",
                textShadow:
                  activeTab === tab ? `0 0 6px ${colors.primary}` : "none",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              {activeTab === tab && (
                <span style={{ marginRight: "8px", color: colors.primary }}>
                  &#9658;
                </span>
              )}
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* ================================================================
          TAB NAVIGATION - DRAWER
      ================================================================ */}
      {settings.tabNavStyle === TabNavStyle.drawer && menuOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "160px",
            zIndex: 1000,
            background: "rgba(0,0,0,0.97)",
            borderRight: `1px solid ${colors.primary}50`,
            animation: "slide-in-left 0.22s ease-out",
            display: "flex",
            flexDirection: "column",
          }}
          data-ocid="hud.nav.drawer"
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: `1px solid ${colors.primary}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                color: colors.dim,
                letterSpacing: "0.2em",
              }}
            >
              NAVIGATION
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              data-ocid="hud.drawer.close_button"
              style={{
                fontSize: "14px",
                color: `${colors.primary}80`,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              &#10005;
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabSelect(tab)}
                data-ocid={`hud.nav.${tab.toLowerCase()}.tab`}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  color:
                    activeTab === tab ? colors.primary : `${colors.primary}70`,
                  background:
                    activeTab === tab ? `${colors.primary}15` : "transparent",
                  border: "none",
                  borderBottom: `1px solid ${colors.primary}15`,
                  cursor: "pointer",
                  textShadow:
                    activeTab === tab ? `0 0 6px ${colors.primary}` : "none",
                  transition: "all 0.12s",
                }}
              >
                {activeTab === tab && (
                  <span style={{ marginRight: "8px" }}>&#9658;</span>
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drawer backdrop */}
      {settings.tabNavStyle === TabNavStyle.drawer && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* ================================================================
          ACTIVE TAB INDICATOR
      ================================================================ */}
      <div
        style={{
          flexShrink: 0,
          padding: "3px 10px",
          background: `${colors.primary}10`,
          borderBottom: `1px solid ${colors.primary}30`,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          position: "relative",
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: colors.primary,
            boxShadow: `0 0 4px ${colors.primary}`,
            animation: "glow-pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: "9px",
            color: colors.primary,
            letterSpacing: "0.2em",
            textShadow: `0 0 4px ${colors.primary}60`,
          }}
        >
          {activeTab}
        </span>
        <span
          style={{
            fontSize: "8px",
            color: colors.dim,
            marginLeft: "auto",
            letterSpacing: "0.1em",
          }}
        >
          MK.{settings.markLevel.toUpperCase()}
        </span>
      </div>

      {/* ================================================================
          TAB CONTENT
      ================================================================ */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${hudScale})`,
            transformOrigin: "top center",
          }}
        >
          {renderTabContent()}
        </div>
      </div>

      {/* ================================================================
          QUICK ACTION BAR
      ================================================================ */}
      <div
        style={{
          flexShrink: 0,
          padding: "3px 6px",
          borderTop: `1px solid ${colors.primary}20`,
          borderBottom: `1px solid ${colors.primary}20`,
          display: "flex",
          gap: "4px",
          background: "rgba(0,0,0,0.5)",
        }}
        data-ocid="hud.quickbar.panel"
      >
        <button
          type="button"
          style={quickBtnStyle}
          onClick={handleQuickReload}
          data-ocid="hud.quickbar.reload.button"
        >
          ↺ RELOAD
        </button>
        <button
          type="button"
          style={quickBtnStyle}
          onClick={handleQuickLight}
          data-ocid="hud.quickbar.light.button"
        >
          ★ LIGHT
        </button>
        <button
          type="button"
          style={{
            ...quickBtnStyle,
            color: "#ffaa00",
            borderColor: "#ffaa0040",
          }}
          onClick={handleQuickAlert}
          data-ocid="hud.quickbar.alert.button"
        >
          ⚠ ALERT
        </button>
        <button
          type="button"
          style={{
            ...quickBtnStyle,
            color: "#44cc44",
            borderColor: "#44cc4440",
          }}
          onClick={handleQuickMedkit}
          data-ocid="hud.quickbar.medkit.button"
        >
          ✚ MEDKIT
        </button>
        <button
          type="button"
          style={{
            ...quickBtnStyle,
            color: "#ff4444",
            borderColor: "#ff444440",
          }}
          onClick={() =>
            updateSettings({ glitchEffects: !settings.glitchEffects })
          }
          data-ocid="hud.quickbar.glitch.toggle"
        >
          ≈ FX
        </button>
      </div>

      {/* ================================================================
          BOTTOM STATUS BAR
      ================================================================ */}
      <div
        style={{
          flexShrink: 0,
          padding: "3px 10px",
          borderTop: `1px solid ${colors.primary}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.7)",
          position: "relative",
          zIndex: 50,
        }}
      >
        <span
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.12em",
          }}
        >
          H.E.V v5.0
        </span>
        <span
          style={{
            fontSize: "7px",
            color: `${colors.primary}70`,
            letterSpacing: "0.08em",
          }}
        >
          {formatUptime(uptimeSeconds)}
        </span>
        <span
          style={{
            fontSize: "7px",
            color: `${colors.primary}50`,
            letterSpacing: "0.1em",
          }}
        >
          {new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span
          style={{ fontSize: "7px", color: colors.dim, letterSpacing: "0.1em" }}
        >
          © BLACK MESA
        </span>
      </div>
    </div>
  );
}

// ============================================================
// PIN LOCK OVERLAY
// ============================================================
function PinLockOverlay({
  colors,
  pinEntry,
  pinError,
  onKey,
}: {
  colors: { primary: string; dim: string; bg: string; text: string };
  pinEntry: string;
  pinError: boolean;
  onKey: (key: string) => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "ENT"];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") onKey(e.key);
      else if (e.key === "Backspace") onKey("DEL");
      else if (e.key === "Enter") onKey("ENT");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKey]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        background: "rgba(0,0,0,0.96)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Share Tech Mono', monospace",
        gap: "16px",
      }}
      data-ocid="hud.lock.modal"
    >
      <div
        style={{
          fontSize: "10px",
          color: colors.dim,
          letterSpacing: "0.3em",
          textAlign: "center",
        }}
      >
        H.E.V SECURITY LOCK
      </div>
      <div
        style={{
          fontSize: "28px",
          color: colors.primary,
          textShadow: `0 0 12px ${colors.primary}`,
          letterSpacing: "0.5em",
        }}
      >
        Λ
      </div>
      {/* PIN dots */}
      <div style={{ display: "flex", gap: "10px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: `2px solid ${pinError ? "#ff4444" : colors.primary}`,
              background:
                i < pinEntry.length
                  ? pinError
                    ? "#ff4444"
                    : colors.primary
                  : "transparent",
              boxShadow:
                i < pinEntry.length
                  ? `0 0 8px ${pinError ? "#ff4444" : colors.primary}`
                  : "none",
              transition: "all 0.15s",
            }}
          />
        ))}
      </div>
      {pinError && (
        <div
          style={{
            fontSize: "9px",
            color: "#ff4444",
            letterSpacing: "0.2em",
            animation: "damage-flash 0.4s ease-out",
          }}
          data-ocid="hud.lock.error_state"
        >
          ACCESS DENIED
        </div>
      )}
      {/* Keypad */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 52px)",
          gap: "6px",
        }}
        data-ocid="hud.lock.panel"
      >
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onKey(k)}
            data-ocid={`hud.lock.${k.toLowerCase()}.button`}
            style={{
              height: "44px",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: k === "ENT" || k === "DEL" ? "8px" : "16px",
              letterSpacing: "0.05em",
              background:
                k === "ENT" ? `${colors.primary}30` : "rgba(0,0,0,0.8)",
              border: `1px solid ${k === "ENT" ? colors.primary : `${colors.primary}50`}`,
              color: k === "ENT" ? colors.primary : `${colors.primary}cc`,
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// Glitch overlay component
function GlitchOverlay({ primary }: { primary: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    function triggerGlitch() {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
      const next = 10000 + Math.random() * 20000;
      setTimeout(triggerGlitch, next);
    }
    const initial = 8000 + Math.random() * 5000;
    const t = setTimeout(triggerGlitch, initial);
    return () => clearTimeout(t);
  }, []);

  if (!glitching) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9997,
        pointerEvents: "none",
        animation: "glitch 0.2s steps(1) forwards",
        background: `linear-gradient(
          90deg,
          transparent 0%,
          ${primary}08 50%,
          transparent 100%
        )`,
        mixBlendMode: "screen",
      }}
    />
  );
}
