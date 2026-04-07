import React, { useState, useCallback } from "react";
import { useHUD } from "../context/HUDContext";

type Checkpoint = {
  id: string;
  label: string;
  status: "SECURE" | "COMPROMISED" | "UNKNOWN";
};

type Guard = {
  id: number;
  name: string;
  post: string;
  lastCheckIn: string;
  active: boolean;
};

type Incident = {
  id: number;
  time: string;
  location: string;
  description: string;
  resolved: boolean;
};

const INITIAL_CHECKPOINTS: Checkpoint[] = [
  { id: "A1", label: "CHECKPOINT A1", status: "SECURE" },
  { id: "A2", label: "CHECKPOINT A2", status: "SECURE" },
  { id: "A3", label: "CHECKPOINT A3", status: "COMPROMISED" },
  { id: "A4", label: "CHECKPOINT A4", status: "UNKNOWN" },
  { id: "B1", label: "CHECKPOINT B1", status: "SECURE" },
  { id: "B2", label: "CHECKPOINT B2", status: "SECURE" },
  { id: "B3", label: "CHECKPOINT B3", status: "UNKNOWN" },
  { id: "B4", label: "CHECKPOINT B4", status: "COMPROMISED" },
];

const GUARDS: Guard[] = [
  {
    id: 1,
    name: "BARNEY CALHOUN",
    post: "LOBBY A",
    lastCheckIn: "14:30",
    active: true,
  },
  {
    id: 2,
    name: "D. SHEPHARD",
    post: "SURFACE",
    lastCheckIn: "14:15",
    active: true,
  },
  {
    id: 3,
    name: "O. SIMMONS",
    post: "LAB ACCESS",
    lastCheckIn: "13:58",
    active: false,
  },
  {
    id: 4,
    name: "R. JENKINS",
    post: "CAFETERIA",
    lastCheckIn: "14:22",
    active: true,
  },
  {
    id: 5,
    name: "T. BRADLEY",
    post: "LOADING DOCK",
    lastCheckIn: "14:05",
    active: false,
  },
  {
    id: 6,
    name: "M. HAYES",
    post: "ELEVATOR CTRL",
    lastCheckIn: "14:28",
    active: true,
  },
  {
    id: 7,
    name: "K. YOUNG",
    post: "GATE C",
    lastCheckIn: "14:10",
    active: true,
  },
  {
    id: 8,
    name: "L. MORGAN",
    post: "ROOF ACCESS",
    lastCheckIn: "13:45",
    active: false,
  },
];

const INCIDENTS: Incident[] = [
  {
    id: 1,
    time: "14:28",
    location: "CHECKPOINT A3",
    description: "Perimeter breach detected",
    resolved: false,
  },
  {
    id: 2,
    time: "14:12",
    location: "SECTOR E",
    description: "Unknown entities observed",
    resolved: false,
  },
  {
    id: 3,
    time: "13:50",
    location: "LAB ACCESS",
    description: "Guard unresponsive",
    resolved: false,
  },
  {
    id: 4,
    time: "13:22",
    location: "GATE B",
    description: "Equipment malfunction",
    resolved: true,
  },
  {
    id: 5,
    time: "12:47",
    location: "LOBBY A",
    description: "Unauthorized access attempt",
    resolved: true,
  },
];

function cpStatusColor(s: string): string {
  if (s === "SECURE") return "#44cc44";
  if (s === "COMPROMISED") return "#ff4444";
  return "#ffaa00";
}

export default function PatrolTab() {
  const { factionColors, settings, addLogEntry } = useHUD();
  const colors = factionColors;
  const [checkpoints, setCheckpoints] = useState(INITIAL_CHECKPOINTS);

  const cycleStatus = useCallback(
    (id: string) => {
      setCheckpoints((prev) =>
        prev.map((cp) => {
          if (cp.id !== id) return cp;
          const next =
            cp.status === "SECURE"
              ? "COMPROMISED"
              : cp.status === "COMPROMISED"
                ? "UNKNOWN"
                : "SECURE";
          addLogEntry(`PATROL: ${cp.label} STATUS -> ${next}`, "info");
          return { ...cp, status: next } as Checkpoint;
        }),
      );
    },
    [addLogEntry],
  );

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "6px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
  };

  const secureCount = checkpoints.filter((c) => c.status === "SECURE").length;
  const compCount = checkpoints.filter(
    (c) => c.status === "COMPROMISED",
  ).length;

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
      data-ocid="patrol.section"
    >
      {/* Summary */}
      <div
        style={{
          ...panelStyle,
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexShrink: 0,
          padding: "5px 8px",
        }}
        data-ocid="patrol.summary.panel"
      >
        <span
          style={{
            flex: 1,
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.1em",
          }}
        >
          SECTOR OVERVIEW
        </span>
        <span style={{ fontSize: "9px", color: "#44cc44" }}>
          ● {secureCount} SECURE
        </span>
        <span style={{ fontSize: "9px", color: "#ff4444" }}>
          ● {compCount} COMP
        </span>
        <span style={{ fontSize: "9px", color: "#ffaa00" }}>
          ● {8 - secureCount - compCount} UNK
        </span>
      </div>

      {/* Checkpoint grid */}
      <div
        style={{ ...panelStyle, flexShrink: 0 }}
        data-ocid="patrol.checkpoints.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "4px",
          }}
        >
          CHECKPOINTS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px",
          }}
        >
          {checkpoints.map((cp, i) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => cycleStatus(cp.id)}
              data-ocid={`patrol.checkpoint.button.${i + 1}`}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                padding: "5px 4px",
                background: `${cpStatusColor(cp.status)}12`,
                border: `1px solid ${cpStatusColor(cp.status)}50`,
                color: cpStatusColor(cp.status),
                borderRadius: "3px",
                cursor: "pointer",
                textAlign: "center" as const,
                fontSize: "8px",
                letterSpacing: "0.05em",
                animation:
                  cp.status === "COMPROMISED"
                    ? "pulse-danger 1.5s ease-in-out infinite"
                    : "none",
              }}
            >
              <div style={{ fontSize: "10px", lineHeight: 1 }}>{cp.id}</div>
              <div style={{ fontSize: "6px", marginTop: "2px" }}>
                {cp.status.slice(0, 4)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Guard roster */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="patrol.guards.panel"
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
          GUARD ROSTER
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {GUARDS.map((g, i) => (
            <div
              key={g.id}
              style={{
                display: "flex",
                gap: "5px",
                alignItems: "center",
                padding: "2px 0",
                borderBottom: `1px solid ${colors.primary}15`,
              }}
              data-ocid={`patrol.guard.item.${i + 1}`}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: g.active ? "#44cc44" : "#ff4444",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "8px",
                    color: colors.primary,
                    letterSpacing: "0.04em",
                  }}
                >
                  {g.name}
                </div>
                <div style={{ fontSize: "6px", color: colors.dim }}>
                  {g.post}
                </div>
              </div>
              <span
                style={{
                  fontSize: "7px",
                  color: g.active ? colors.dim : "#ff444470",
                }}
              >
                {g.lastCheckIn}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Incident log */}
      <div style={panelStyle} data-ocid="patrol.incidents.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "3px",
          }}
        >
          INCIDENT LOG
        </div>
        {INCIDENTS.map((inc, i) => (
          <div
            key={inc.id}
            style={{
              display: "flex",
              gap: "4px",
              padding: "2px 0",
              borderBottom: `1px solid ${colors.primary}15`,
              alignItems: "center",
            }}
            data-ocid={`patrol.incident.item.${i + 1}`}
          >
            <span style={{ fontSize: "6px", color: colors.dim, flexShrink: 0 }}>
              {inc.time}
            </span>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: "7.5px",
                  color: inc.resolved ? `${colors.dim}60` : colors.dim,
                  textDecoration: inc.resolved ? "line-through" : "none",
                }}
              >
                {inc.description}
              </span>
              <div style={{ fontSize: "6px", color: `${colors.dim}70` }}>
                {inc.location}
              </div>
            </div>
            <span
              style={{
                fontSize: "6px",
                color: inc.resolved ? "#44cc44" : "#ffaa00",
                flexShrink: 0,
              }}
            >
              {inc.resolved ? "CLR" : "ACT"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
