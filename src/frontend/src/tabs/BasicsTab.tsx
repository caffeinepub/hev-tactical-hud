import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHUD } from "../context/HUDContext";
import { useDeviceDiagnostics } from "../hooks/useDeviceDiagnostics";

// Hazard definitions
const HAZARDS = [
  { key: "fire", label: "FIRE", symbol: "▲", desc: "TEMP" },
  { key: "temp", label: "TEMP", symbol: "│", desc: "ENV" },
  { key: "gas", label: "GAS", symbol: "●", desc: "TOX" },
  { key: "rad", label: "RAD", symbol: "☢", desc: "ION" },
  { key: "elec", label: "ELEC", symbol: "⚡", desc: "ELC" },
  { key: "bio", label: "BIO", symbol: "☣", desc: "BIO" },
] as const;

type HazardKey = (typeof HAZARDS)[number]["key"];

function getHazardColor(pct: number): string {
  if (pct >= 80) return "#ff2200";
  if (pct >= 60) return "#ff6600";
  if (pct >= 40) return "#ffaa00";
  return "#44cc44";
}

function getHealthColor(val: number): string {
  if (val < 25) return "#ff2200";
  if (val < 50) return "#ffaa00";
  return "#33dd33";
}

interface HazardValues {
  fire: number;
  temp: number;
  gas: number;
  rad: number;
  elec: number;
  bio: number;
}

const INITIAL_HAZARDS: HazardValues = {
  fire: 12,
  temp: 34,
  gas: 8,
  rad: 22,
  elec: 15,
  bio: 5,
};

export default function BasicsTab() {
  const { settings, factionColors, addLogEntry, triggerScreenShake } = useHUD();
  const diag = useDeviceDiagnostics();
  const colors = factionColors;

  // State
  const [health, setHealth] = useState(85);
  const [armor, setArmor] = useState(75);
  const [ammoClip, setAmmoClip] = useState(30);
  const [ammoReserve, setAmmoReserve] = useState(90);
  const [hazards, setHazards] = useState<HazardValues>({ ...INITIAL_HAZARDS });
  const [armorFlashing, setArmorFlashing] = useState(false);
  const [healthFlashing, setHealthFlashing] = useState(false);
  const prevArmorRef = useRef(armor);
  const prevHealthRef = useRef(health);
  const prevHealthForLog = useRef(health);

  // Simulated battery (fallback if no Battery API)
  const auxPower = diag.batteryLevel ?? 87;
  const isCharging = diag.batteryCharging;

  // Simulate slow hazard drift for "live" feel
  useEffect(() => {
    const interval = setInterval(() => {
      setHazards((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next) as HazardKey[]) {
          const delta = (Math.random() - 0.5) * 3;
          next[k] = Math.max(0, Math.min(100, next[k] + delta));
        }
        // Check for critical hazards
        for (const k of Object.keys(next) as HazardKey[]) {
          if (next[k] >= 80 && prev[k] < 80) {
            addLogEntry(
              `HAZARD ALERT: ${k.toUpperCase()} CRITICAL (${Math.round(next[k])}%)`,
              "warn",
            );
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [addLogEntry]);

  // Armor damage flash
  useEffect(() => {
    if (armor < prevArmorRef.current) {
      setArmorFlashing(true);
      const t = setTimeout(() => setArmorFlashing(false), 600);
      return () => clearTimeout(t);
    }
    prevArmorRef.current = armor;
  }, [armor]);

  // Health flash + log + screen shake
  useEffect(() => {
    if (health < prevHealthRef.current) {
      setHealthFlashing(true);
      const t = setTimeout(() => setHealthFlashing(false), 600);

      // Log significant drops
      const drop = prevHealthForLog.current - health;
      if (drop >= 10) {
        addLogEntry(
          `HEALTH: DAMAGE TAKEN -${drop}HP (${health}% remaining)`,
          "warn",
        );
        prevHealthForLog.current = health;
      }

      // Screen shake + log when critical
      if (health < 25 && prevHealthRef.current >= 25) {
        triggerScreenShake();
        addLogEntry("HEALTH: CRITICAL - SEEK MEDICAL ATTENTION", "error");
      }

      return () => clearTimeout(t);
    }
    prevHealthRef.current = health;
  }, [health, addLogEntry, triggerScreenShake]);

  // Ammo low warning
  useEffect(() => {
    if (ammoClip < 10 && ammoClip > 0) {
      addLogEntry(`AMMO: LOW CLIP WARNING (${ammoClip} rounds)`, "warn");
    } else if (ammoClip === 0) {
      addLogEntry("AMMO: MAGAZINE EMPTY - RELOAD REQUIRED", "error");
    }
  }, [ammoClip, addLogEntry]);

  const handleFire = useCallback(() => {
    setAmmoClip((c) => Math.max(0, c - 1));
  }, []);

  const handleReload = useCallback(() => {
    const needed = 30 - ammoClip;
    const take = Math.min(needed, ammoReserve);
    setAmmoClip((c) => c + take);
    setAmmoReserve((r) => r - take);
    if (take > 0) addLogEntry(`AMMO: RELOADED +${take} ROUNDS`, "info");
  }, [ammoClip, ammoReserve, addLogEntry]);

  const lowAmmo = ammoClip < 10;
  const criticalHealth = health < 25;
  const isGlowing = settings.glowEffect;

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "6px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "8px",
    position: "relative" as const,
    overflow: "hidden" as const,
    boxShadow: isGlowing
      ? `0 0 6px ${colors.primary}60, inset 0 0 4px ${colors.primary}05`
      : "none",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        padding: "6px",
        height: "100%",
        overflow: "hidden",
      }}
      data-ocid="basics.section"
    >
      {/* 2x2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* === HEALTH PANEL === */}
        <div
          style={{
            ...panelStyle,
            animation: criticalHealth
              ? "pulse-danger 0.8s ease-in-out infinite"
              : "none",
          }}
          data-ocid="basics.health.panel"
        >
          {/* Top bar line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
              opacity: 0.6,
            }}
          />
          {/* Corner notch */}
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              borderTop: `1px solid ${colors.primary}`,
              borderRight: `1px solid ${colors.primary}`,
              opacity: 0.5,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "3px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: getHealthColor(health),
                textShadow: criticalHealth
                  ? `0 0 8px ${getHealthColor(health)}`
                  : "none",
              }}
            >
              &#10010;
            </span>
            <span
              style={{
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.15em",
              }}
            >
              HEALTH
            </span>
          </div>

          <div
            style={{
              fontSize: "28px",
              color: getHealthColor(health),
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              textShadow: criticalHealth
                ? `0 0 10px ${getHealthColor(health)}`
                : `0 0 6px ${getHealthColor(health)}60`,
              animation: healthFlashing ? "damage-flash 0.4s ease-out" : "none",
            }}
            data-ocid="basics.health.value"
          >
            {health}
          </div>

          {/* Health bar */}
          <div
            style={{
              height: "5px",
              background: `${getHealthColor(health)}20`,
              borderRadius: "2px",
              overflow: "hidden",
              margin: "4px 0",
              border: `1px solid ${getHealthColor(health)}30`,
            }}
          >
            <div
              style={{
                width: `${health}%`,
                height: "100%",
                background: getHealthColor(health),
                borderRadius: "1px",
                transition: "width 0.4s ease, background 0.4s ease",
                boxShadow: `0 0 4px ${getHealthColor(health)}`,
              }}
            />
          </div>

          {/* +/- buttons */}
          <div style={{ display: "flex", gap: "3px" }}>
            <button
              type="button"
              onClick={() => setHealth((h) => Math.min(100, h + 5))}
              data-ocid="basics.health.plus_button"
              className="hud-btn-sm"
              style={{
                flex: 1,
                fontSize: "9px",
                borderColor: `${colors.primary}50`,
                color: colors.primary,
              }}
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => setHealth((h) => Math.max(0, h - 5))}
              data-ocid="basics.health.minus_button"
              className="hud-btn-sm"
              style={{
                flex: 1,
                fontSize: "9px",
                borderColor: `${colors.primary}50`,
                color: colors.primary,
              }}
            >
              -5
            </button>
          </div>
        </div>

        {/* === ARMOR PANEL === */}
        <div
          style={{
            ...panelStyle,
            animation: armorFlashing ? "damage-flash 0.5s ease-out" : "none",
          }}
          data-ocid="basics.armor.panel"
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              borderTop: `1px solid ${colors.accent}`,
              borderRight: `1px solid ${colors.accent}`,
              opacity: 0.5,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "3px",
            }}
          >
            <span style={{ fontSize: "10px", color: colors.accent }}>
              &#9776;
            </span>
            <span
              style={{
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.15em",
              }}
            >
              ARMOR
            </span>
          </div>

          <div
            style={{
              fontSize: "28px",
              color: colors.accent,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 6px ${colors.accent}60`,
            }}
            data-ocid="basics.armor.value"
          >
            {armor}
          </div>

          {/* Armor bar */}
          <div
            style={{
              height: "5px",
              background: `${colors.accent}20`,
              borderRadius: "2px",
              overflow: "hidden",
              margin: "4px 0",
              border: `1px solid ${colors.accent}30`,
            }}
          >
            <div
              style={{
                width: `${armor}%`,
                height: "100%",
                background: colors.accent,
                borderRadius: "1px",
                transition: "width 0.4s ease",
                boxShadow: `0 0 4px ${colors.accent}`,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "3px" }}>
            <button
              type="button"
              onClick={() => setArmor((a) => Math.min(100, a + 5))}
              data-ocid="basics.armor.plus_button"
              className="hud-btn-sm"
              style={{
                flex: 1,
                fontSize: "9px",
                borderColor: `${colors.accent}50`,
                color: colors.accent,
              }}
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => setArmor((a) => Math.max(0, a - 5))}
              data-ocid="basics.armor.minus_button"
              className="hud-btn-sm"
              style={{
                flex: 1,
                fontSize: "9px",
                borderColor: `${colors.accent}50`,
                color: colors.accent,
              }}
            >
              -5
            </button>
          </div>
        </div>

        {/* === AUX POWER PANEL === */}
        <div style={panelStyle} data-ocid="basics.auxpower.panel">
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              borderTop: `1px solid ${colors.primary}`,
              borderRight: `1px solid ${colors.primary}`,
              opacity: 0.5,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "3px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: isCharging ? "#44ff44" : colors.primary,
                animation: isCharging
                  ? "charging-pulse 1.5s ease-in-out infinite"
                  : "none",
              }}
            >
              &#9889;
            </span>
            <span
              style={{
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.15em",
              }}
            >
              AUX PWR
            </span>
          </div>

          <div
            style={{
              fontSize: "24px",
              color: auxPower < 20 ? "#ff4400" : colors.primary,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 6px ${auxPower < 20 ? "#ff4400" : colors.primary}60`,
              animation:
                auxPower < 20 ? "ammo-flash 0.8s ease-in-out infinite" : "none",
            }}
            data-ocid="basics.auxpower.value"
          >
            {auxPower}%
          </div>

          {/* Battery bar */}
          <div
            style={{
              height: "4px",
              background: `${colors.primary}20`,
              borderRadius: "2px",
              overflow: "hidden",
              margin: "3px 0",
              border: `1px solid ${colors.primary}30`,
            }}
          >
            <div
              style={{
                width: `${auxPower}%`,
                height: "100%",
                background:
                  auxPower < 20
                    ? "#ff4400"
                    : auxPower < 50
                      ? "#ffaa00"
                      : colors.primary,
                borderRadius: "1px",
                transition: "width 0.8s ease",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "8px",
              color: isCharging ? "#44cc44" : colors.dim,
              letterSpacing: "0.08em",
              animation: isCharging
                ? "charging-pulse 1.5s ease-in-out infinite"
                : "none",
            }}
          >
            {isCharging ? "CHARGING" : "DISCHARGING"}
          </div>
          <div
            style={{
              fontSize: "7px",
              color: `${colors.dim}70`,
              marginTop: "2px",
              letterSpacing: "0.06em",
            }}
          >
            {diag.batteryLevel !== null ? "DEVICE BATTERY" : "SIMULATED"}
          </div>
        </div>

        {/* === AMMO COUNTER PANEL === */}
        <div style={panelStyle} data-ocid="basics.ammo.panel">
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              borderTop: `1px solid ${colors.primary}`,
              borderRight: `1px solid ${colors.primary}`,
              opacity: 0.5,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "2px",
            }}
          >
            <span style={{ fontSize: "9px", color: colors.primary }}>
              &#9679;
            </span>
            <span
              style={{
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.15em",
              }}
            >
              AMMO
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "26px",
                color: lowAmmo ? "#ff3300" : colors.primary,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 6px ${lowAmmo ? "#ff3300" : colors.primary}60`,
                animation: lowAmmo
                  ? "ammo-flash 0.5s ease-in-out infinite"
                  : "none",
              }}
              data-ocid="basics.ammo.clip_value"
            >
              {ammoClip}
            </span>
            <span style={{ fontSize: "10px", color: colors.dim }}>/</span>
            <span
              style={{
                fontSize: "14px",
                color: colors.dim,
                fontVariantNumeric: "tabular-nums",
              }}
              data-ocid="basics.ammo.reserve_value"
            >
              {ammoReserve}
            </span>
          </div>

          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.08em",
              marginBottom: "3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            GLOCK 17 9MM
          </div>

          <div style={{ display: "flex", gap: "3px" }}>
            <button
              type="button"
              onClick={handleFire}
              data-ocid="basics.ammo.fire_button"
              className="hud-btn-sm"
              style={{
                flex: 1,
                fontSize: "8px",
                borderColor: `${colors.primary}50`,
                color: colors.primary,
              }}
            >
              FIRE
            </button>
            <button
              type="button"
              onClick={handleReload}
              data-ocid="basics.ammo.reload_button"
              className="hud-btn-sm"
              style={{
                flex: 1,
                fontSize: "8px",
                borderColor: `${colors.primary}50`,
                color: colors.primary,
              }}
              disabled={ammoReserve === 0}
            >
              RELOAD
            </button>
          </div>
        </div>
      </div>

      {/* === HAZARDS MINI PANEL === */}
      <div
        style={{
          flexShrink: 0,
          border: `1px solid ${colors.primary}60`,
          borderRadius: "5px",
          background: "rgba(14, 10, 4, 0.92)",
          padding: "5px 7px",
          boxShadow: isGlowing ? `0 0 5px ${colors.primary}40` : "none",
        }}
        data-ocid="basics.hazards.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.18em",
            marginBottom: "4px",
          }}
        >
          ENV HAZARDS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "3px",
          }}
        >
          {HAZARDS.map((h) => {
            const pct = Math.round(hazards[h.key]);
            const hColor = getHazardColor(pct);
            const isAlert = pct >= 80;
            return (
              <div
                key={h.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  animation: isAlert
                    ? "hazard-flash 0.7s ease-in-out infinite"
                    : "none",
                  border: `1px solid ${isAlert ? hColor : "transparent"}`,
                  borderRadius: "3px",
                  padding: "2px 1px",
                }}
                data-ocid={`basics.hazard.${h.key}.item`}
              >
                <div
                  style={{
                    fontSize: "9px",
                    color: hColor,
                    textShadow: isAlert ? `0 0 6px ${hColor}` : "none",
                    lineHeight: 1,
                  }}
                >
                  {h.symbol}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    background: `${hColor}20`,
                    borderRadius: "1px",
                    overflow: "hidden",
                    border: `1px solid ${hColor}30`,
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: hColor,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "6px",
                    color: hColor,
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                >
                  {h.label}
                </div>
                <div
                  style={{
                    fontSize: "7px",
                    color: hColor,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert messages */}
        {Object.entries(hazards).some(([, v]) => v >= 80) && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "8px",
              color: "#ff2200",
              letterSpacing: "0.1em",
              animation: "ammo-flash 0.6s ease-in-out infinite",
              textAlign: "center",
            }}
          >
            &#9888; HAZARD ALERT - SEEK SHELTER
          </div>
        )}
      </div>

      {/* === NETWORK STATUS MICRO BAR === */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "3px 4px",
          borderTop: `1px solid ${colors.primary}20`,
        }}
        data-ocid="basics.status.panel"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background:
                diag.networkStatus === "online" ? "#44cc44" : "#cc4444",
              boxShadow: `0 0 4px ${diag.networkStatus === "online" ? "#44cc44" : "#cc4444"}`,
            }}
          />
          <span
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.1em",
            }}
          >
            {diag.networkStatus.toUpperCase()}
          </span>
        </div>
        {diag.connectionType !== "unknown" && (
          <span
            style={{
              fontSize: "7px",
              color: `${colors.dim}70`,
              letterSpacing: "0.08em",
            }}
          >
            {diag.connectionType.toUpperCase()}
          </span>
        )}
        {diag.deviceMemory !== null && (
          <span
            style={{
              fontSize: "7px",
              color: `${colors.dim}70`,
              letterSpacing: "0.08em",
              marginLeft: "auto",
            }}
          >
            {diag.deviceMemory}GB RAM
          </span>
        )}
        <span
          style={{
            fontSize: "7px",
            color: `${colors.dim}70`,
            letterSpacing: "0.08em",
            marginLeft: diag.deviceMemory !== null ? "0" : "auto",
          }}
        >
          {diag.hardwareConcurrency}C
        </span>
      </div>
    </div>
  );
}
