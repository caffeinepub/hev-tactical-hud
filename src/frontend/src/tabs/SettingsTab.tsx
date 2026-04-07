import React, { useState, useCallback } from "react";
import {
  DisplayMode,
  Faction,
  GameMode,
  MarkLevel,
  TabNavStyle,
} from "../backend";
import { defaultSettings, useHUD } from "../context/HUDContext";
import { useDeviceDiagnostics } from "../hooks/useDeviceDiagnostics";

export default function SettingsTab() {
  const {
    settings,
    updateSettings,
    saveSettingsToBackend,
    lockHUD,
    addLogEntry,
  } = useHUD();
  const diag = useDeviceDiagnostics();
  const { factionColors } = useHUD();
  const colors = factionColors;
  const [saving, setSaving] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinEntry, setShowPinEntry] = useState(false);

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "8px",
    marginBottom: "5px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
  };

  const labelStyle = {
    fontSize: "7px",
    color: colors.dim,
    letterSpacing: "0.15em",
    marginBottom: "6px",
    display: "block" as const,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
    gap: "6px",
  };

  const inputStyle = {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "9px",
    background: "rgba(0,0,0,0.7)",
    border: `1px solid ${colors.primary}40`,
    color: colors.primary,
    borderRadius: "3px",
    padding: "3px 6px",
    outline: "none",
    letterSpacing: "0.08em",
  };

  const toggleBtn = (active: boolean) => ({
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "8px",
    padding: "2px 8px",
    background: active ? `${colors.primary}25` : `${colors.primary}08`,
    border: `1px solid ${active ? colors.primary : `${colors.primary}30`}`,
    color: active ? colors.primary : `${colors.primary}60`,
    borderRadius: "3px",
    cursor: "pointer",
    transition: "all 0.15s",
    minWidth: "38px",
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveSettingsToBackend(settings);
    addLogEntry("SETTINGS SAVED TO BACKEND", "info");
    setSaving(false);
  }, [saveSettingsToBackend, settings, addLogEntry]);

  const handleReset = useCallback(() => {
    updateSettings({ ...defaultSettings });
    addLogEntry("SETTINGS RESET TO DEFAULTS", "warn");
  }, [updateSettings, addLogEntry]);

  const handleLock = useCallback(() => {
    if (pinInput.length === 4) {
      lockHUD(pinInput);
      setPinInput("");
      setShowPinEntry(false);
      addLogEntry("HUD LOCKED", "warn");
    }
  }, [pinInput, lockHUD, addLogEntry]);

  const selectorStyle = (active: boolean) => ({
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "8px",
    padding: "3px 6px",
    background: active ? `${colors.primary}25` : `${colors.primary}05`,
    border: `1px solid ${active ? colors.primary : `${colors.primary}25`}`,
    color: active ? colors.primary : `${colors.primary}50`,
    borderRadius: "3px",
    cursor: "pointer",
    letterSpacing: "0.06em",
    transition: "all 0.12s",
  });

  return (
    <div
      style={{
        padding: "6px",
        height: "100%",
        overflowY: "auto",
        fontFamily: "'Share Tech Mono', monospace",
      }}
      data-ocid="settings.section"
    >
      {/* IDENTITY */}
      <div style={panelStyle} data-ocid="settings.identity.panel">
        <span style={labelStyle}>IDENTITY</span>
        <div style={rowStyle}>
          <span style={{ fontSize: "8px", color: colors.dim }}>OPERATOR</span>
          <input
            type="text"
            value={settings.operatorName}
            onChange={(e) =>
              updateSettings({ operatorName: e.target.value.toUpperCase() })
            }
            maxLength={20}
            data-ocid="settings.operator.input"
            style={{ ...inputStyle, width: "120px" }}
          />
        </div>
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{ fontSize: "8px", color: colors.dim, marginBottom: "4px" }}
          >
            FACTION
          </div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {(
              [
                Faction.hev,
                Faction.hecu,
                Faction.security,
                Faction.combine,
              ] as Faction[]
            ).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => updateSettings({ faction: f })}
                data-ocid={`settings.faction.${f}.tab`}
                style={selectorStyle(settings.faction === f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: "8px", color: colors.dim, marginBottom: "4px" }}
          >
            MARK LEVEL
          </div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {(
              [
                MarkLevel.I,
                MarkLevel.II,
                MarkLevel.III,
                MarkLevel.IV,
                MarkLevel.V,
                MarkLevel.prototype,
              ] as MarkLevel[]
            ).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateSettings({ markLevel: m })}
                data-ocid={`settings.mark.${m}.tab`}
                style={selectorStyle(settings.markLevel === m)}
              >
                {m === MarkLevel.prototype ? "PROTO" : `MK.${m}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DISPLAY */}
      <div style={panelStyle} data-ocid="settings.display.panel">
        <span style={labelStyle}>DISPLAY</span>
        <div style={rowStyle}>
          <span style={{ fontSize: "8px", color: colors.dim }}>
            HUD SIZE {Number(settings.hudSize)}%
          </span>
          <input
            type="range"
            min={50}
            max={150}
            value={Number(settings.hudSize)}
            onChange={(e) =>
              updateSettings({ hudSize: BigInt(e.target.value) })
            }
            data-ocid="settings.hudsize.select"
            style={{ width: "100px", accentColor: colors.primary }}
          />
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: "8px", color: colors.dim }}>
            BRIGHTNESS {Number(settings.brightness)}%
          </span>
          <input
            type="range"
            min={20}
            max={100}
            value={Number(settings.brightness)}
            onChange={(e) =>
              updateSettings({ brightness: BigInt(e.target.value) })
            }
            data-ocid="settings.brightness.select"
            style={{ width: "100px", accentColor: colors.primary }}
          />
        </div>
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{ fontSize: "8px", color: colors.dim, marginBottom: "4px" }}
          >
            DISPLAY MODE
          </div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {(
              [
                DisplayMode.standard,
                DisplayMode.tactical,
                DisplayMode.minimal,
                DisplayMode.emergency,
              ] as DisplayMode[]
            ).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateSettings({ displayMode: m })}
                data-ocid={`settings.displaymode.${m}.tab`}
                style={selectorStyle(settings.displayMode === m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VISUAL EFFECTS */}
      <div style={panelStyle} data-ocid="settings.effects.panel">
        <span style={labelStyle}>VISUAL EFFECTS</span>
        {[
          { key: "crtFilter", label: "CRT FILTER" },
          { key: "scanlines", label: "SCANLINES" },
          { key: "glowEffect", label: "GLOW EFFECT" },
          { key: "glitchEffects", label: "GLITCH EFFECTS" },
        ].map(({ key, label }) => (
          <div key={key} style={rowStyle}>
            <span style={{ fontSize: "8px", color: colors.dim }}>{label}</span>
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  [key]: !settings[key as keyof typeof settings],
                } as Partial<typeof settings>)
              }
              data-ocid={`settings.${key.toLowerCase()}.toggle`}
              style={toggleBtn(
                settings[key as keyof typeof settings] as boolean,
              )}
            >
              {settings[key as keyof typeof settings] ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>

      {/* NAVIGATION */}
      <div style={panelStyle} data-ocid="settings.nav.panel">
        <span style={labelStyle}>NAVIGATION</span>
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{ fontSize: "8px", color: colors.dim, marginBottom: "4px" }}
          >
            TAB NAV STYLE
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() =>
                updateSettings({ tabNavStyle: TabNavStyle.dropdown })
              }
              data-ocid="settings.navstyle.dropdown.tab"
              style={selectorStyle(
                settings.tabNavStyle === TabNavStyle.dropdown,
              )}
            >
              DROPDOWN
            </button>
            <button
              type="button"
              onClick={() =>
                updateSettings({ tabNavStyle: TabNavStyle.drawer })
              }
              data-ocid="settings.navstyle.drawer.tab"
              style={selectorStyle(settings.tabNavStyle === TabNavStyle.drawer)}
            >
              DRAWER
            </button>
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: "8px", color: colors.dim, marginBottom: "4px" }}
          >
            GAME MODE
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => updateSettings({ gameMode: GameMode.hl1 })}
              data-ocid="settings.gamemode.hl1.tab"
              style={selectorStyle(settings.gameMode === GameMode.hl1)}
            >
              HL1
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ gameMode: GameMode.hl2 })}
              data-ocid="settings.gamemode.hl2.tab"
              style={selectorStyle(settings.gameMode === GameMode.hl2)}
            >
              HL2
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM */}
      <div style={panelStyle} data-ocid="settings.system.panel">
        <span style={labelStyle}>SYSTEM</span>
        <div style={rowStyle}>
          <span style={{ fontSize: "8px", color: colors.dim }}>WAKE LOCK</span>
          <button
            type="button"
            onClick={() =>
              diag.wakeLockActive
                ? diag.releaseWakeLock()
                : diag.enableWakeLock()
            }
            data-ocid="settings.wakelock.toggle"
            style={toggleBtn(diag.wakeLockActive)}
          >
            {diag.wakeLockActive ? "ON" : "OFF"}
          </button>
        </div>
        <div
          style={{ fontSize: "8px", color: colors.dim, marginBottom: "4px" }}
        >
          LOCK HUD (4-DIGIT PIN)
        </div>
        {showPinEntry ? (
          <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) =>
                setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="ENTER PIN"
              maxLength={4}
              data-ocid="settings.pin.input"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={handleLock}
              disabled={pinInput.length !== 4}
              data-ocid="settings.lock.confirm_button"
              style={{ ...toggleBtn(pinInput.length === 4), minWidth: "50px" }}
            >
              LOCK
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPinEntry(false);
                setPinInput("");
              }}
              data-ocid="settings.lock.cancel_button"
              style={toggleBtn(false)}
            >
              X
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPinEntry(true)}
            data-ocid="settings.lock.open_modal_button"
            style={{
              ...toggleBtn(false),
              width: "100%",
              marginBottom: "4px",
              justifyContent: "center",
              display: "flex",
            }}
          >
            SET LOCK PIN
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          paddingBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          data-ocid="settings.save.primary_button"
          style={{
            width: "100%",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            padding: "7px",
            background: `${colors.primary}20`,
            border: `1px solid ${colors.primary}`,
            color: colors.primary,
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
            textShadow: `0 0 6px ${colors.primary}60`,
          }}
        >
          {saving ? "SAVING..." : "SAVE SETTINGS"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          data-ocid="settings.reset.delete_button"
          style={{
            width: "100%",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            padding: "6px",
            background: "rgba(255,170,0,0.08)",
            border: "1px solid #ffaa0040",
            color: "#ffaa00",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          RESET TO DEFAULTS
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("hev_setup_complete");
            window.location.reload();
          }}
          data-ocid="settings.wizard.button"
          style={{
            width: "100%",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            padding: "6px",
            background: `${colors.primary}08`,
            border: `1px solid ${colors.primary}30`,
            color: `${colors.primary}80`,
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          LAUNCH SETUP WIZARD
        </button>
      </div>
    </div>
  );
}
