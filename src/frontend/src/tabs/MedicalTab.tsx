import React, { useState, useEffect, useCallback, useRef } from "react";
import { useHUD } from "../context/HUDContext";

type Vital = {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  normalMin: number;
  normalMax: number;
  cautionMin: number;
  cautionMax: number;
};

type Injury = {
  id: number;
  bodyPart: string;
  severity: "MINOR" | "MODERATE" | "SEVERE";
  timestamp: string;
};

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getVitalColor(v: Vital): string {
  if (v.value < v.cautionMin || v.value > v.cautionMax) return "#ff4444";
  if (v.value < v.normalMin || v.value > v.normalMax) return "#ffaa00";
  return "#44cc44";
}

function getVitalStatus(v: Vital): string {
  if (v.value < v.cautionMin || v.value > v.cautionMax) return "CRITICAL";
  if (v.value < v.normalMin || v.value > v.normalMax) return "CAUTION";
  return "NORMAL";
}

const initialVitals: Vital[] = [
  {
    label: "HEART RATE",
    value: 72,
    unit: "BPM",
    min: 30,
    max: 200,
    normalMin: 60,
    normalMax: 100,
    cautionMin: 45,
    cautionMax: 130,
  },
  {
    label: "SYS/DIA",
    value: 118,
    unit: "mmHg",
    min: 60,
    max: 200,
    normalMin: 90,
    normalMax: 130,
    cautionMin: 70,
    cautionMax: 160,
  },
  {
    label: "O2 SAT",
    value: 98,
    unit: "%",
    min: 70,
    max: 100,
    normalMin: 95,
    normalMax: 100,
    cautionMin: 88,
    cautionMax: 100,
  },
  {
    label: "TEMP",
    value: 37.1,
    unit: "°C",
    min: 32,
    max: 42,
    normalMin: 36.1,
    normalMax: 37.5,
    cautionMin: 35.0,
    cautionMax: 38.5,
  },
];

const initialInjuries: Injury[] = [
  { id: 1, bodyPart: "LEFT ARM", severity: "MINOR", timestamp: getTime() },
  { id: 2, bodyPart: "TORSO", severity: "MODERATE", timestamp: getTime() },
];

export default function MedicalTab() {
  const { factionColors, settings, addLogEntry, triggerScreenShake } = useHUD();
  const colors = factionColors;

  const [vitals, setVitals] = useState<Vital[]>(initialVitals);
  const [injuries, setInjuries] = useState<Injury[]>(initialInjuries);
  const [morphine, setMorphine] = useState(2);
  const [antitoxin, setAntitoxin] = useState(3);
  const [epinephrine, setEpinephrine] = useState(1);
  const [medkits, setMedkits] = useState(4);

  const [defibActive, setDefibActive] = useState(false);
  const defibRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "6px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
  };

  // Vital drift simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals((prev) =>
        prev.map((v) => {
          let delta =
            (Math.random() - 0.5) *
            (v.label === "HEART RATE" ? 4 : v.label === "TEMP" ? 0.1 : 1);
          if (defibActive && v.label === "HEART RATE")
            delta = (Math.random() - 0.3) * 20;
          const next = Math.max(v.min, Math.min(v.max, v.value + delta));
          return {
            ...v,
            value:
              v.label === "TEMP"
                ? Math.round(next * 10) / 10
                : Math.round(next),
          };
        }),
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [defibActive]);

  // Defibrillator
  const handleDefib = useCallback(() => {
    setDefibActive(true);
    triggerScreenShake();
    addLogEntry("MEDICAL: DEFIBRILLATOR ACTIVATED", "warn");
    if (defibRef.current) clearTimeout(defibRef.current);
    defibRef.current = setTimeout(() => setDefibActive(false), 3000);
  }, [addLogEntry, triggerScreenShake]);

  const treatInjury = useCallback(
    (id: number) => {
      setInjuries((prev) => prev.filter((i) => i.id !== id));
      addLogEntry("MEDICAL: INJURY TREATED", "info");
    },
    [addLogEntry],
  );

  const overallStatus = () => {
    const anyBad = vitals.some(
      (v) => v.value < v.cautionMin || v.value > v.cautionMax,
    );
    const anyCaution = vitals.some(
      (v) => v.value < v.normalMin || v.value > v.normalMax,
    );
    if (anyBad || injuries.some((i) => i.severity === "SEVERE"))
      return "CRITICAL";
    if (anyCaution || injuries.length > 0) return "CAUTION";
    return "OPTIMAL";
  };

  const status = overallStatus();
  const statusColor =
    status === "OPTIMAL"
      ? "#44cc44"
      : status === "CAUTION"
        ? "#ffaa00"
        : "#ff4444";

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
      data-ocid="medical.section"
    >
      {/* Status header */}
      <div
        style={{
          ...panelStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          padding: "5px 8px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            color: colors.dim,
            letterSpacing: "0.15em",
          }}
        >
          MEDICAL STATUS
        </div>
        <div
          style={{
            fontSize: "11px",
            color: statusColor,
            letterSpacing: "0.2em",
            textShadow: `0 0 8px ${statusColor}`,
            animation:
              status === "CRITICAL"
                ? "pulse-danger 0.8s ease-in-out infinite"
                : "none",
          }}
        >
          {status}
        </div>
      </div>

      {/* Vitals grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          flexShrink: 0,
        }}
        data-ocid="medical.vitals.panel"
      >
        {vitals.map((v, i) => {
          const vc = getVitalColor(v);
          const vs = getVitalStatus(v);
          const pct = ((v.value - v.min) / (v.max - v.min)) * 100;
          return (
            <div
              key={v.label}
              style={{ ...panelStyle, padding: "5px" }}
              data-ocid={`medical.vital.item.${i + 1}`}
            >
              <div
                style={{
                  fontSize: "7px",
                  color: colors.dim,
                  letterSpacing: "0.1em",
                }}
              >
                {v.label}
              </div>
              <div
                style={{
                  fontSize: v.label === "TEMP" ? "14px" : "18px",
                  color: vc,
                  lineHeight: 1,
                  textShadow: vs === "CRITICAL" ? `0 0 8px ${vc}` : "none",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {v.value}
                <span
                  style={{
                    fontSize: "8px",
                    color: colors.dim,
                    marginLeft: "2px",
                  }}
                >
                  {v.unit}
                </span>
              </div>
              <div
                style={{
                  height: "3px",
                  background: `${vc}20`,
                  borderRadius: "1px",
                  overflow: "hidden",
                  margin: "3px 0",
                  border: `1px solid ${vc}30`,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: vc,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: "7px", color: vc }}>{vs}</div>
            </div>
          );
        })}
      </div>

      {/* Counters */}
      <div
        style={{ ...panelStyle, flexShrink: 0 }}
        data-ocid="medical.counters.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "5px",
          }}
        >
          MEDICAL SUPPLIES
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px",
          }}
        >
          {[
            { label: "MORPHINE", val: morphine, set: setMorphine, max: 5 },
            { label: "ANTITOX", val: antitoxin, set: setAntitoxin, max: 5 },
            { label: "EPI", val: epinephrine, set: setEpinephrine, max: 3 },
            { label: "MEDKIT", val: medkits, set: setMedkits, max: 10 },
          ].map(({ label, val, set, max }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "6px",
                  color: colors.dim,
                  letterSpacing: "0.08em",
                  marginBottom: "2px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: colors.primary,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {val}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "2px",
                  justifyContent: "center",
                  marginTop: "2px",
                }}
              >
                <button
                  type="button"
                  onClick={() => set((v: number) => Math.min(max, v + 1))}
                  data-ocid={`medical.${label.toLowerCase()}.plus_button`}
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "8px",
                    padding: "1px 4px",
                    background: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}40`,
                    color: colors.primary,
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => set((v: number) => Math.max(0, v - 1))}
                  data-ocid={`medical.${label.toLowerCase()}.minus_button`}
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "8px",
                    padding: "1px 4px",
                    background: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}40`,
                    color: colors.primary,
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Injury log */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="medical.injuries.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "4px",
            flexShrink: 0,
          }}
        >
          INJURY LOG
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {injuries.length === 0 && (
            <div
              style={{
                fontSize: "8px",
                color: "#44cc44",
                textAlign: "center",
                padding: "8px",
                letterSpacing: "0.1em",
              }}
              data-ocid="medical.injuries.empty_state"
            >
              NO ACTIVE INJURIES
            </div>
          )}
          {injuries.map((inj, i) => (
            <div
              key={inj.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 0",
                borderBottom: `1px solid ${colors.primary}15`,
              }}
              data-ocid={`medical.injury.item.${i + 1}`}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "8px",
                    color: colors.primary,
                    letterSpacing: "0.05em",
                  }}
                >
                  {inj.bodyPart}
                </div>
                <div
                  style={{
                    fontSize: "7px",
                    color:
                      inj.severity === "SEVERE"
                        ? "#ff4444"
                        : inj.severity === "MODERATE"
                          ? "#ffaa00"
                          : "#88cc44",
                  }}
                >
                  {inj.severity} &bull; {inj.timestamp}
                </div>
              </div>
              <button
                type="button"
                onClick={() => treatInjury(inj.id)}
                data-ocid={`medical.treat.button.${i + 1}`}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "7px",
                  padding: "2px 5px",
                  background: "rgba(68,204,68,0.1)",
                  border: "1px solid #44cc4440",
                  color: "#44cc44",
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                TREAT
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Defibrillator */}
      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleDefib}
          disabled={defibActive}
          data-ocid="medical.defib.button"
          style={{
            width: "100%",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            padding: "6px",
            background: defibActive
              ? "rgba(255,68,68,0.2)"
              : "rgba(255,68,68,0.08)",
            border: `1px solid ${defibActive ? "#ff4444" : "#ff444450"}`,
            color: defibActive ? "#ff4444" : `${colors.primary}80`,
            borderRadius: "3px",
            cursor: defibActive ? "not-allowed" : "pointer",
            animation: defibActive
              ? "pulse-danger 0.5s ease-in-out infinite"
              : "none",
            transition: "all 0.2s",
          }}
        >
          {defibActive ? "⚡ DEFIB ACTIVE" : "⚡ DEFIBRILLATOR"}
        </button>
      </div>
    </div>
  );
}
