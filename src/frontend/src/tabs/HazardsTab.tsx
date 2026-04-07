import React, { useState, useEffect, useCallback } from "react";
import { useHUD } from "../context/HUDContext";

type HazardKey =
  | "fire"
  | "temp"
  | "gas"
  | "rad"
  | "elec"
  | "bio"
  | "chem"
  | "sonic";

type HazardDef = {
  key: HazardKey;
  label: string;
  symbol: string;
  unit: string;
};

const HAZARD_DEFS: HazardDef[] = [
  { key: "fire", label: "FIRE", symbol: "▲", unit: "C" },
  { key: "temp", label: "TEMP", symbol: "│", unit: "K" },
  { key: "gas", label: "GAS", symbol: "●", unit: "PPM" },
  { key: "rad", label: "RAD", symbol: "☢", unit: "mSv" },
  { key: "elec", label: "ELEC", symbol: "⚡", unit: "V" },
  { key: "bio", label: "BIO", symbol: "☣", unit: "CFU" },
  { key: "chem", label: "CHEM", symbol: "⚗", unit: "mg/m³" },
  { key: "sonic", label: "SONIC", symbol: "♫", unit: "dB" },
];

type HazardValues = Record<HazardKey, number>;
type AlertHistory = Record<HazardKey, string[]>;
type DeconState = Record<HazardKey, { active: boolean; countdown: number }>;

const INITIAL: HazardValues = {
  fire: 12,
  temp: 34,
  gas: 8,
  rad: 22,
  elec: 15,
  bio: 5,
  chem: 18,
  sonic: 28,
};

function getStatusLabel(v: number): { label: string; color: string } {
  if (v >= 80) return { label: "CRITICAL", color: "#ff2200" };
  if (v >= 60) return { label: "WARNING", color: "#ff6600" };
  if (v >= 40) return { label: "ELEVATED", color: "#ffaa00" };
  return { label: "SAFE", color: "#44cc44" };
}

function getTrend(curr: number, prev: number): string {
  if (curr > prev + 1) return "↑";
  if (curr < prev - 1) return "↓";
  return "→";
}

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function HazardsTab() {
  const { factionColors, settings, addLogEntry, triggerScreenShake } = useHUD();
  const colors = factionColors;

  const [values, setValues] = useState<HazardValues>({ ...INITIAL });
  const [prevValues, setPrevValues] = useState<HazardValues>({ ...INITIAL });
  const [alertHistory, setAlertHistory] = useState<AlertHistory>(
    Object.fromEntries(
      HAZARD_DEFS.map((h) => [h.key, [] as string[]]),
    ) as AlertHistory,
  );
  const [decon, setDecon] = useState<DeconState>(
    Object.fromEntries(
      HAZARD_DEFS.map((h) => [h.key, { active: false, countdown: 0 }]),
    ) as DeconState,
  );
  const [manualValues, setManualValues] = useState<HazardValues>({
    ...INITIAL,
  });

  // Drift simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) => {
        setPrevValues({ ...prev });
        const next = { ...prev };
        for (const k of Object.keys(next) as HazardKey[]) {
          if (decon[k]?.active) continue;
          const delta = (Math.random() - 0.45) * 4;
          next[k] = Math.max(0, Math.min(100, next[k] + delta));
          // Alert when crossing 60%
          if (next[k] >= 60 && prev[k] < 60) {
            setAlertHistory((ah) => ({
              ...ah,
              [k]: [getTime(), ...ah[k].slice(0, 2)],
            }));
            addLogEntry(
              `HAZARD: ${k.toUpperCase()} ELEVATED TO ${Math.round(next[k])}%`,
              "warn",
            );
            if (next[k] >= 80) {
              triggerScreenShake();
            }
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [decon, addLogEntry, triggerScreenShake]);

  // Decon countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setDecon((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next) as HazardKey[]) {
          if (next[k].active && next[k].countdown > 0) {
            next[k] = { ...next[k], countdown: next[k].countdown - 1 };
            // Drop value during decon
            setValues((v) => ({ ...v, [k]: Math.max(0, v[k] - 10) }));
            if (next[k].countdown === 0) {
              next[k] = { active: false, countdown: 0 };
              setValues((v) => ({ ...v, [k]: 0 }));
              addLogEntry(`DECON COMPLETE: ${k.toUpperCase()}`, "info");
            }
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [addLogEntry]);

  const startDecon = useCallback(
    (key: HazardKey) => {
      setDecon((prev) => ({ ...prev, [key]: { active: true, countdown: 10 } }));
      addLogEntry(`DECON INITIATED: ${key.toUpperCase()}`, "warn");
    },
    [addLogEntry],
  );

  const applyManual = useCallback((key: HazardKey, val: number) => {
    setManualValues((prev) => ({ ...prev, [key]: val }));
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const anyAlert = Object.values(values).some((v) => v >= 80);
  const totalExposure = Math.round(
    (Object.values(values).reduce((a, b) => a + b, 0) /
      (HAZARD_DEFS.length * 100)) *
      100,
  );

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "6px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
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
        fontFamily: "'Share Tech Mono', monospace",
      }}
      data-ocid="hazards.section"
    >
      {/* Global alert strip */}
      {anyAlert && (
        <div
          style={{
            flexShrink: 0,
            padding: "4px 8px",
            background: "rgba(255,34,0,0.15)",
            border: "1px solid #ff220050",
            borderRadius: "4px",
            fontSize: "9px",
            color: "#ff2200",
            letterSpacing: "0.2em",
            textAlign: "center",
            animation: "ammo-flash 0.7s ease-in-out infinite",
          }}
          data-ocid="hazards.alert.panel"
        >
          &#9888; HAZARD ALERT - CRITICAL LEVELS DETECTED
        </div>
      )}

      {/* Hazard panels */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
        data-ocid="hazards.panels.list"
      >
        {HAZARD_DEFS.map((def, i) => {
          const val = Math.round(values[def.key]);
          const { label, color } = getStatusLabel(val);
          const trend = getTrend(values[def.key], prevValues[def.key]);
          const dc = decon[def.key];
          const alerts = alertHistory[def.key];
          return (
            <div
              key={def.key}
              style={{ ...panelStyle, padding: "5px" }}
              data-ocid={`hazards.item.${i + 1}`}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {/* Symbol */}
                <span
                  style={{
                    fontSize: "14px",
                    color,
                    textShadow: val >= 80 ? `0 0 8px ${color}` : "none",
                    width: "16px",
                    textAlign: "center",
                    animation:
                      val >= 80
                        ? "ammo-flash 0.7s ease-in-out infinite"
                        : "none",
                  }}
                >
                  {def.symbol}
                </span>
                {/* Label and value */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "8px",
                        color: colors.dim,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {def.label}
                    </span>
                    <span
                      style={{
                        fontSize: "15px",
                        color,
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val}%
                    </span>
                    <span style={{ fontSize: "9px", color, marginLeft: "2px" }}>
                      {trend}
                    </span>
                    <span
                      style={{
                        fontSize: "7px",
                        color: `${color}80`,
                        marginLeft: "2px",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {/* Bar */}
                  <div
                    style={{
                      height: "4px",
                      background: `${color}20`,
                      borderRadius: "1px",
                      overflow: "hidden",
                      border: `1px solid ${color}30`,
                      margin: "2px 0",
                    }}
                  >
                    <div
                      style={{
                        width: `${val}%`,
                        height: "100%",
                        background: color,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  {/* Alert history */}
                  {alerts.length > 0 && (
                    <div
                      style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                    >
                      {alerts.map((t) => (
                        <span
                          key={t}
                          style={{ fontSize: "6px", color: `${color}70` }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Controls */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    alignItems: "flex-end",
                  }}
                >
                  {dc.active ? (
                    <div
                      style={{
                        fontSize: "8px",
                        color: "#44cc44",
                        letterSpacing: "0.08em",
                        animation: "charging-pulse 1s ease-in-out infinite",
                      }}
                    >
                      DECON {dc.countdown}s
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startDecon(def.key)}
                      data-ocid={`hazards.decon.button.${i + 1}`}
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "7px",
                        padding: "2px 4px",
                        background: "rgba(68,204,68,0.1)",
                        border: "1px solid #44cc4440",
                        color: "#44cc44",
                        borderRadius: "2px",
                        cursor: "pointer",
                        letterSpacing: "0.06em",
                      }}
                    >
                      DECON
                    </button>
                  )}
                  {/* Manual slider */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manualValues[def.key]}
                    onChange={(e) =>
                      applyManual(def.key, Number(e.target.value))
                    }
                    data-ocid={`hazards.manual.slider.${i + 1}`}
                    style={{
                      width: "60px",
                      accentColor: color,
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total exposure */}
      <div
        style={{
          ...panelStyle,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 8px",
        }}
        data-ocid="hazards.exposure.panel"
      >
        <span
          style={{
            fontSize: "8px",
            color: colors.dim,
            letterSpacing: "0.15em",
          }}
        >
          TOTAL EXPOSURE SCORE
        </span>
        <span
          style={{
            fontSize: "14px",
            color: getStatusLabel(totalExposure).color,
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 6px ${getStatusLabel(totalExposure).color}60`,
          }}
        >
          {totalExposure}%
        </span>
      </div>
    </div>
  );
}
