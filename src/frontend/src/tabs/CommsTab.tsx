import React, { useState, useEffect, useCallback } from "react";
import { useHUD } from "../context/HUDContext";

type Channel = {
  id: number;
  name: string;
  freq: string;
  active: boolean;
};

type SquadMember = {
  id: number;
  name: string;
  role: string;
  status: "ACTIVE" | "WIA" | "KIA";
  position: string;
};

type Intel = {
  id: number;
  time: string;
  content: string;
  priority: "LOW" | "MED" | "HIGH";
};

const INITIAL_CHANNELS: Channel[] = [
  { id: 1, name: "COMMAND", freq: "168.425", active: true },
  { id: 2, name: "FIRE SUPPORT", freq: "169.230", active: false },
  { id: 3, name: "MEDEVAC", freq: "166.900", active: false },
  { id: 4, name: "RECON", freq: "167.550", active: false },
  { id: 5, name: "LOGISTICS", freq: "170.025", active: false },
  { id: 6, name: "ENCRYPTED", freq: "[CRYPT]", active: false },
];

const SQUAD: SquadMember[] = [
  {
    id: 1,
    name: "SGT. HAYES",
    role: "TEAM LEAD",
    status: "ACTIVE",
    position: "GRID A-3",
  },
  {
    id: 2,
    name: "CPL. TORRES",
    role: "HEAVY WEAPONS",
    status: "ACTIVE",
    position: "GRID A-3",
  },
  {
    id: 3,
    name: "PFC. CHEN",
    role: "MEDIC",
    status: "WIA",
    position: "GRID B-1",
  },
  {
    id: 4,
    name: "PVT. RAMOS",
    role: "RIFLEMAN",
    status: "KIA",
    position: "GRID D-7",
  },
  {
    id: 5,
    name: "CPL. WALSH",
    role: "DEMO",
    status: "ACTIVE",
    position: "GRID A-4",
  },
  {
    id: 6,
    name: "SGT. DAVIS",
    role: "SNIPER",
    status: "ACTIVE",
    position: "GRID C-2",
  },
];

const INTEL_FEED: Intel[] = [
  {
    id: 1,
    time: "14:22",
    content: "HEV operator spotted near Lambda Complex",
    priority: "HIGH",
  },
  {
    id: 2,
    time: "14:05",
    content: "Xen creatures breaching north perimeter",
    priority: "HIGH",
  },
  {
    id: 3,
    time: "13:47",
    content: "Supply drop confirmed at LZ-2",
    priority: "LOW",
  },
];

export default function CommsTab() {
  const { factionColors, settings, addLogEntry } = useHUD();
  const colors = factionColors;
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [waveActive, setWaveActive] = useState(false);

  // Static waveform for active channel
  useEffect(() => {
    const interval = setInterval(() => setWaveActive((v) => !v), 300);
    return () => clearInterval(interval);
  }, []);

  const tuneIn = useCallback(
    (id: number) => {
      setChannels((prev) => prev.map((c) => ({ ...c, active: c.id === id })));
      const ch = INITIAL_CHANNELS.find((c) => c.id === id);
      if (ch) addLogEntry(`COMMS: TUNED TO ${ch.name} (${ch.freq})`, "info");
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

  const statusColor = (s: string) =>
    s === "ACTIVE" ? "#44cc44" : s === "WIA" ? "#ffaa00" : "#ff4444";

  const priorityColor = (p: string) =>
    p === "HIGH" ? "#ff4444" : p === "MED" ? "#ffaa00" : colors.dim;

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
      data-ocid="comms.section"
    >
      {/* Radio channels */}
      <div style={panelStyle} data-ocid="comms.channels.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.2em",
            marginBottom: "4px",
          }}
        >
          RADIO CHANNELS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3px",
          }}
        >
          {channels.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => tuneIn(c.id)}
              data-ocid={`comms.channel.tab.${i + 1}`}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "4px 6px",
                background: c.active ? `${colors.primary}18` : "transparent",
                border: `1px solid ${c.active ? colors.primary : `${colors.primary}25`}`,
                color: c.active ? colors.primary : `${colors.primary}60`,
                borderRadius: "3px",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: "8px", letterSpacing: "0.08em" }}>
                {c.name}
              </span>
              <span
                style={{
                  fontSize: "7px",
                  color: c.active ? colors.accent : `${colors.dim}60`,
                }}
              >
                {c.freq}
              </span>
              {c.active && (
                <div style={{ display: "flex", gap: "1px", marginTop: "2px" }}>
                  {Array.from({ length: 8 }, (_, j) => j).map((j) => (
                    <div
                      key={j}
                      style={{
                        width: "2px",
                        height: `${waveActive ? 3 + Math.abs(Math.sin(j * 1.2)) * 6 : 2 + (j % 3)}px`,
                        background: colors.primary,
                        transition: "height 0.15s",
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mission briefing */}
      <div style={panelStyle} data-ocid="comms.mission.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.2em",
            marginBottom: "4px",
          }}
        >
          MISSION BRIEF
        </div>
        <div
          style={{
            fontSize: "9px",
            color: colors.primary,
            letterSpacing: "0.1em",
            marginBottom: "3px",
          }}
        >
          OP: CLEAN SWEEP
        </div>
        {[
          "1. SECURE LAMBDA PERIMETER",
          "2. NEUTRALIZE HEV OPERATOR",
          "3. DESTROY SATELLITE UPLINK",
          "4. WITHDRAW BEFORE AIRSTRIKE",
        ].map((obj) => (
          <div
            key={obj}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "2px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                border: `1px solid ${colors.primary}50`,
                borderRadius: "1px",
              }}
            />
            <span
              style={{
                fontSize: "7.5px",
                color: colors.dim,
                letterSpacing: "0.04em",
              }}
            >
              {obj}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "4px",
            fontSize: "7px",
            color: colors.dim,
          }}
        >
          <span>LZ-2: CLEAR</span>
          <span>ETA: T-00:47</span>
        </div>
      </div>

      {/* Squad status */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="comms.squad.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.2em",
            marginBottom: "3px",
            flexShrink: 0,
          }}
        >
          UNIT STATUS
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {SQUAD.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: "5px",
                padding: "2px 0",
                borderBottom: `1px solid ${colors.primary}15`,
                alignItems: "center",
              }}
              data-ocid={`comms.squad.item.${i + 1}`}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: statusColor(m.status),
                  boxShadow: `0 0 4px ${statusColor(m.status)}`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "8px",
                    color:
                      m.status === "KIA" ? `${colors.dim}60` : colors.primary,
                    textDecoration:
                      m.status === "KIA" ? "line-through" : "none",
                  }}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: "6px", color: colors.dim }}>
                  {m.role} &bull; {m.position}
                </div>
              </div>
              <span style={{ fontSize: "7px", color: statusColor(m.status) }}>
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Intel */}
      <div style={panelStyle} data-ocid="comms.intel.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "3px",
          }}
        >
          INTEL FEED
        </div>
        {INTEL_FEED.map((intel, i) => (
          <div
            key={intel.id}
            style={{
              display: "flex",
              gap: "5px",
              padding: "2px 0",
              borderBottom: `1px solid ${colors.primary}15`,
            }}
            data-ocid={`comms.intel.item.${i + 1}`}
          >
            <span style={{ fontSize: "7px", color: colors.dim, flexShrink: 0 }}>
              {intel.time}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.04em",
              }}
            >
              {intel.content}
            </span>
            <span
              style={{
                fontSize: "6px",
                color: priorityColor(intel.priority),
                flexShrink: 0,
              }}
            >
              [{intel.priority}]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
