import React, { useState, useEffect } from "react";
import { useHUD } from "../context/HUDContext";

type Reading = {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: "STABLE" | "FLUCTUATING" | "CRITICAL";
};

type Anomaly = {
  id: number;
  time: string;
  location: string;
  type: string;
  magnitude: number;
};

type PortalStorm = {
  id: number;
  location: string;
  count: number;
  eta: string;
};

const INITIAL_READINGS: Reading[] = [
  {
    label: "XEN ENERGY",
    value: 47.3,
    unit: "KeV",
    min: 0,
    max: 100,
    status: "STABLE",
  },
  {
    label: "CASCADE IDX",
    value: 8.9,
    unit: "CI",
    min: 0,
    max: 100,
    status: "STABLE",
  },
  {
    label: "PORTAL INST",
    value: 23.1,
    unit: "PI%",
    min: 0,
    max: 100,
    status: "STABLE",
  },
  {
    label: "ANTIMASS",
    value: 61.4,
    unit: "Mg/m³",
    min: 0,
    max: 100,
    status: "FLUCTUATING",
  },
];

const INITIAL_ANOMALIES: Anomaly[] = [
  {
    id: 1,
    time: "07:49:32",
    location: "ANOMALOUS MATERIALS LAB",
    type: "PORTAL TEAR",
    magnitude: 8.7,
  },
  {
    id: 2,
    time: "08:12:05",
    location: "SECTOR E SURFACE",
    type: "XEN INCURSION",
    magnitude: 5.2,
  },
  {
    id: 3,
    time: "09:33:18",
    location: "LAMBDA CORE B",
    type: "ANTIMASS SPIKE",
    magnitude: 7.4,
  },
  {
    id: 4,
    time: "11:02:44",
    location: "RAIL ACCESS ALPHA",
    type: "ENERGY SURGE",
    magnitude: 3.1,
  },
  {
    id: 5,
    time: "12:28:57",
    location: "SECTOR C SUBSURFACE",
    type: "CASCADE ECHO",
    magnitude: 6.8,
  },
];

const PORTAL_STORMS: PortalStorm[] = [
  { id: 1, location: "SECTOR G-7", count: 3, eta: "00:42" },
  { id: 2, location: "LAMBDA CORE", count: 1, eta: "01:17" },
];

const GRID_ROWS = 4;
const GRID_COLS = 6;

export default function LambdaTab() {
  const { factionColors, settings } = useHUD();
  const colors = factionColors;

  const [readings, setReadings] = useState<Reading[]>(INITIAL_READINGS);
  const [anomalies] = useState<Anomaly[]>(INITIAL_ANOMALIES);
  const [storms] = useState<PortalStorm[]>(PORTAL_STORMS);
  const [grid, setGrid] = useState<boolean[][]>(
    Array.from({ length: GRID_ROWS }, () =>
      Array(GRID_COLS)
        .fill(false)
        .map(() => Math.random() > 0.85),
    ),
  );

  // Drift readings
  useEffect(() => {
    const interval = setInterval(() => {
      setReadings((prev) =>
        prev.map((r) => {
          const delta = (Math.random() - 0.5) * 3;
          const next = Math.max(r.min, Math.min(r.max, r.value + delta));
          const val = Math.round(next * 10) / 10;
          let status: Reading["status"] = "STABLE";
          if (val > 75) status = "CRITICAL";
          else if (val > 50) status = "FLUCTUATING";
          return { ...r, value: val, status };
        }),
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Grid anomaly blink
  useEffect(() => {
    const interval = setInterval(() => {
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) => (cell ? Math.random() > 0.3 : Math.random() > 0.9)),
        ),
      );
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const coreStatus = readings.find((r) => r.status === "CRITICAL")
    ? "CRITICAL"
    : readings.find((r) => r.status === "FLUCTUATING")
      ? "FLUCTUATING"
      : "STABLE";

  const coreColor =
    coreStatus === "CRITICAL"
      ? "#ff4444"
      : coreStatus === "FLUCTUATING"
        ? "#ffaa00"
        : "#44cc44";

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
      data-ocid="lambda.section"
    >
      {/* Lambda Core status */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "14px",
              color: colors.primary,
              textShadow: `0 0 8px ${colors.primary}`,
            }}
          >
            Λ
          </span>
          <span
            style={{
              fontSize: "9px",
              color: colors.dim,
              letterSpacing: "0.15em",
            }}
          >
            LAMBDA CORE
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            color: coreColor,
            letterSpacing: "0.2em",
            textShadow: `0 0 6px ${coreColor}`,
            animation:
              coreStatus === "CRITICAL"
                ? "pulse-danger 0.8s ease-in-out infinite"
                : "none",
          }}
        >
          {coreStatus}
        </span>
      </div>

      {/* Resonance readings */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          flexShrink: 0,
        }}
        data-ocid="lambda.readings.panel"
      >
        {readings.map((r, i) => {
          const rc =
            r.status === "CRITICAL"
              ? "#ff4444"
              : r.status === "FLUCTUATING"
                ? "#ffaa00"
                : colors.primary;
          const pct = ((r.value - r.min) / (r.max - r.min)) * 100;
          return (
            <div
              key={r.label}
              style={{ ...panelStyle, padding: "5px" }}
              data-ocid={`lambda.reading.item.${i + 1}`}
            >
              <div
                style={{
                  fontSize: "7px",
                  color: colors.dim,
                  letterSpacing: "0.08em",
                }}
              >
                {r.label}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: rc,
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.value}
                <span
                  style={{
                    fontSize: "7px",
                    color: `${rc}80`,
                    marginLeft: "2px",
                  }}
                >
                  {r.unit}
                </span>
              </div>
              <div
                style={{
                  height: "3px",
                  background: `${rc}20`,
                  borderRadius: "1px",
                  overflow: "hidden",
                  border: `1px solid ${rc}30`,
                  margin: "2px 0",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: rc,
                    transition: "width 0.5s",
                  }}
                />
              </div>
              <div style={{ fontSize: "6px", color: rc }}>{r.status}</div>
            </div>
          );
        })}
      </div>

      {/* Portal storms + grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5px",
          flexShrink: 0,
        }}
      >
        {/* Portal storms */}
        <div style={panelStyle} data-ocid="lambda.storms.panel">
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            PORTAL STORMS
          </div>
          {storms.map((s, i) => (
            <div
              key={s.id}
              style={{ marginBottom: "3px" }}
              data-ocid={`lambda.storm.item.${i + 1}`}
            >
              <div style={{ fontSize: "8px", color: "#ffaa00" }}>
                {s.location}
              </div>
              <div style={{ fontSize: "7px", color: colors.dim }}>
                {s.count} STORM(S) ETA {s.eta}
              </div>
            </div>
          ))}
          {storms.length === 0 && (
            <div
              style={{ fontSize: "8px", color: "#44cc44" }}
              data-ocid="lambda.storms.empty_state"
            >
              NO ACTIVE STORMS
            </div>
          )}
        </div>

        {/* BM Research grid */}
        <div style={panelStyle} data-ocid="lambda.grid.panel">
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            BM RESEARCH GRID
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {grid.map((row, ri) => (
              <div
                key={`grid-row-${GRID_COLS * ri}`}
                style={{ display: "flex", gap: "2px" }}
              >
                {row.map((cell, ci) => {
                  const cellKey = ri * GRID_COLS + ci;
                  return (
                    <div
                      key={cellKey}
                      style={{
                        width: "12px",
                        height: "10px",
                        background: cell
                          ? colors.primary
                          : `${colors.primary}15`,
                        border: `1px solid ${cell ? colors.primary : `${colors.primary}20`}`,
                        borderRadius: "1px",
                        boxShadow: cell ? `0 0 4px ${colors.primary}` : "none",
                        transition: "all 0.4s",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomaly log */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="lambda.anomalies.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "3px",
            flexShrink: 0,
          }}
        >
          XEN ANOMALY LOG
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {anomalies.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                gap: "5px",
                padding: "2px 0",
                borderBottom: `1px solid ${colors.primary}15`,
              }}
              data-ocid={`lambda.anomaly.item.${i + 1}`}
            >
              <span
                style={{ fontSize: "7px", color: colors.dim, flexShrink: 0 }}
              >
                {a.time}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "8px",
                    color: colors.primary,
                    letterSpacing: "0.05em",
                  }}
                >
                  {a.type}
                </div>
                <div style={{ fontSize: "7px", color: colors.dim }}>
                  {a.location} M:{a.magnitude}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
