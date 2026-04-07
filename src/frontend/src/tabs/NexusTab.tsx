import React, { useState, useEffect, useRef } from "react";
import { useHUD } from "../context/HUDContext";

type Directive = {
  id: number;
  text: string;
  priority: "OMEGA" | "ALPHA" | "BETA";
  active: boolean;
};

type FieldGenerator = {
  id: number;
  location: string;
  power: number;
  online: boolean;
};

type Dispatch = {
  id: number;
  time: string;
  unit: string;
  message: string;
};

const DIRECTIVES: Directive[] = [
  {
    id: 1,
    text: "Neutralize resistance network in District 7",
    priority: "OMEGA",
    active: true,
  },
  {
    id: 2,
    text: "Enforce Suppression Field Protocol 9-Alpha",
    priority: "ALPHA",
    active: true,
  },
  {
    id: 3,
    text: "Maintain citizen compliance above 87%",
    priority: "ALPHA",
    active: true,
  },
  {
    id: 4,
    text: "Locate and report Freeman sighting",
    priority: "OMEGA",
    active: true,
  },
  {
    id: 5,
    text: "Standard patrol duty - Sector C to D",
    priority: "BETA",
    active: true,
  },
];

const OVERWATCH_LINES = [
  "OVERWATCH: SECTOR 9 LOCKDOWN CONFIRMED",
  "DISPATCH: CIVIL PROTECTION UNIT 17B RESPONDING",
  "OVERWATCH: RESISTANCE CONTACT GRID D-6 NEGATIVE",
  "DISPATCH: SUPPRESSION FIELD GENERATOR 2 AT 94%",
  "OVERWATCH: CITIZEN COMPLIANCE INDEX 88.4 - NOMINAL",
  "DISPATCH: PRIORITY ALERT - FREEMAN UNCONFIRMED SIGHTING",
  "OVERWATCH: ALL UNITS MAINTAIN VISUAL ON TUNNELS",
  "DISPATCH: PATROL ROTATION ECHO ACTIVE",
  "OVERWATCH: BENEFACTOR DIRECTIVE 14 IN EFFECT",
];

const DISPATCHES: Dispatch[] = [
  {
    id: 1,
    time: "14:31",
    unit: "CP-17B",
    message: "Patrol complete, sector secure",
  },
  {
    id: 2,
    time: "14:18",
    unit: "CP-07A",
    message: "Civilian relocation in progress",
  },
  {
    id: 3,
    time: "14:02",
    unit: "OW-CMND",
    message: "Priority target sighting unconfirmed",
  },
];

function priorityColor(p: string): string {
  if (p === "OMEGA") return "#ff4444";
  if (p === "ALPHA") return "#ffaa00";
  return "#3B82F6";
}

export default function NexusTab() {
  const { factionColors, settings, addLogEntry } = useHUD();
  const colors = factionColors;
  const [generators, setGenerators] = useState<FieldGenerator[]>([
    { id: 1, location: "SECTOR-A NEXUS", power: 96, online: true },
    { id: 2, location: "DISTRICT-7 RELAY", power: 88, online: true },
    { id: 3, location: "CITADEL UPLINK", power: 100, online: true },
    { id: 4, location: "PERIMETER RING", power: 71, online: true },
  ]);
  const [compliance, setCompliance] = useState(88.4);
  const [overwatchLog, setOverwatchLog] = useState(OVERWATCH_LINES.slice(0, 4));
  const overwatchIdx = useRef(4);

  // Compliance drift
  useEffect(() => {
    const interval = setInterval(() => {
      setCompliance((c) =>
        Math.max(50, Math.min(100, c + (Math.random() - 0.5) * 0.8)),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Overwatch scroll
  useEffect(() => {
    const interval = setInterval(() => {
      const line =
        OVERWATCH_LINES[overwatchIdx.current % OVERWATCH_LINES.length];
      overwatchIdx.current++;
      setOverwatchLog((prev) => [line, ...prev.slice(0, 4)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Generator drift
  useEffect(() => {
    const interval = setInterval(() => {
      setGenerators((prev) =>
        prev.map((g) => {
          if (!g.online) return g;
          const next = Math.max(
            20,
            Math.min(100, g.power + (Math.random() - 0.5) * 2),
          );
          return { ...g, power: Math.round(next) };
        }),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleGenerator = (id: number) => {
    setGenerators((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        addLogEntry(
          `NEXUS: FIELD GENERATOR ${id} ${g.online ? "OFFLINE" : "ONLINE"}`,
          "warn",
        );
        return { ...g, online: !g.online, power: g.online ? 0 : 60 };
      }),
    );
  };

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
      data-ocid="nexus.section"
    >
      {/* Directives */}
      <div style={panelStyle} data-ocid="nexus.directives.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.2em",
            marginBottom: "4px",
          }}
        >
          ACTIVE DIRECTIVES
        </div>
        {DIRECTIVES.map((d, i) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              gap: "5px",
              alignItems: "flex-start",
              padding: "2px 0",
              borderBottom: `1px solid ${colors.primary}15`,
            }}
            data-ocid={`nexus.directive.item.${i + 1}`}
          >
            <span
              style={{
                fontSize: "7px",
                color: priorityColor(d.priority),
                flexShrink: 0,
                paddingTop: "1px",
              }}
            >
              [{d.priority}]
            </span>
            <span
              style={{
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.03em",
              }}
            >
              {d.text}
            </span>
          </div>
        ))}
      </div>

      {/* Suppression field generators */}
      <div style={panelStyle} data-ocid="nexus.generators.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "4px",
          }}
        >
          SUPPRESSION FIELD
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
          }}
        >
          {generators.map((g, i) => (
            <div
              key={g.id}
              style={{ ...panelStyle, padding: "4px", boxShadow: "none" }}
              data-ocid={`nexus.generator.item.${i + 1}`}
            >
              <div
                style={{
                  fontSize: "7px",
                  color: colors.dim,
                  letterSpacing: "0.05em",
                  marginBottom: "2px",
                }}
              >
                {g.location}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: g.online ? colors.primary : `${colors.dim}50`,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {g.power}%
                </span>
                <button
                  type="button"
                  onClick={() => toggleGenerator(g.id)}
                  data-ocid={`nexus.generator.toggle.${i + 1}`}
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "7px",
                    padding: "2px 5px",
                    background: g.online
                      ? `${colors.primary}15`
                      : "rgba(255,68,68,0.1)",
                    border: `1px solid ${g.online ? colors.primary : "#ff4444"}50`,
                    color: g.online ? colors.primary : "#ff4444",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  {g.online ? "ON" : "OFF"}
                </button>
              </div>
              <div
                style={{
                  height: "3px",
                  background: `${colors.primary}15`,
                  borderRadius: "1px",
                  overflow: "hidden",
                  marginTop: "2px",
                }}
              >
                <div
                  style={{
                    width: `${g.power}%`,
                    height: "100%",
                    background: g.online ? colors.primary : "#ff4444",
                    transition: "width 0.5s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance gauge */}
      <div
        style={{
          ...panelStyle,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
        data-ocid="nexus.compliance.panel"
      >
        <span
          style={{ fontSize: "7px", color: colors.dim, letterSpacing: "0.1em" }}
        >
          CITIZEN COMPLIANCE
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "6px",
              background: `${colors.primary}15`,
              borderRadius: "2px",
              overflow: "hidden",
              border: `1px solid ${colors.primary}30`,
            }}
          >
            <div
              style={{
                width: `${compliance}%`,
                height: "100%",
                background: compliance >= 87 ? colors.primary : "#ff4444",
                transition: "width 1s",
              }}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: "12px",
            color: compliance >= 87 ? colors.primary : "#ff4444",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {compliance.toFixed(1)}%
        </span>
      </div>

      {/* Dispatch + overwatch */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...panelStyle,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          data-ocid="nexus.dispatch.panel"
        >
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.1em",
              marginBottom: "3px",
              flexShrink: 0,
            }}
          >
            CP DISPATCH
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {DISPATCHES.map((d, i) => (
              <div
                key={d.id}
                style={{
                  padding: "2px 0",
                  borderBottom: `1px solid ${colors.primary}15`,
                }}
                data-ocid={`nexus.dispatch.item.${i + 1}`}
              >
                <div style={{ fontSize: "7px", color: colors.dim }}>
                  {d.time} [{d.unit}]
                </div>
                <div
                  style={{
                    fontSize: "7.5px",
                    color: colors.dim,
                    letterSpacing: "0.02em",
                  }}
                >
                  {d.message}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            ...panelStyle,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          data-ocid="nexus.overwatch.panel"
        >
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.1em",
              marginBottom: "3px",
              flexShrink: 0,
            }}
          >
            OVERWATCH COMMS
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {overwatchLog.map((line, i) => (
              <div
                key={line}
                style={{
                  fontSize: "7px",
                  color: i === 0 ? colors.primary : `${colors.dim}70`,
                  padding: "1.5px 0",
                  letterSpacing: "0.03em",
                  transition: "color 0.3s",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
