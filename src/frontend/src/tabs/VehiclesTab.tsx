import React, { useState, useEffect, useCallback, useRef } from "react";
import { GameMode } from "../backend";
import { useHUD } from "../context/HUDContext";

type Vehicle = {
  id: string;
  name: string;
  art: string;
  ignition: boolean;
  fuel: number;
  hull: number;
  speed: number;
  engineTemp: number;
  status: "OFFLINE" | "STANDBY" | "ACTIVE";
};

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "airboat",
    name: "AIRBOAT",
    art: "   __________\n  |  HEV\u25a0\u25a0\u25a0\u25a0  |\n  _____[====]/",
    ignition: false,
    fuel: 78,
    hull: 95,
    speed: 0,
    engineTemp: 32,
    status: "OFFLINE",
  },
  {
    id: "buggy",
    name: "SCOUT CAR",
    art: "   [----]\n  /|     |\\\n o+-------+o",
    ignition: false,
    fuel: 52,
    hull: 88,
    speed: 0,
    engineTemp: 28,
    status: "OFFLINE",
  },
  {
    id: "jalopy",
    name: "JALOPY",
    art: "  [__===__]\n |         |\n o---------o",
    ignition: false,
    fuel: 35,
    hull: 72,
    speed: 0,
    engineTemp: 22,
    status: "OFFLINE",
  },
];

export default function VehiclesTab() {
  const { factionColors, settings, addLogEntry } = useHUD();
  const colors = factionColors;
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHL2 = settings.gameMode === GameMode.hl2;

  // Physics simulation
  useEffect(() => {
    if (!isHL2) return;
    tickRef.current = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (!v.ignition) return v;
          const fuel = Math.max(0, v.fuel - 0.08);
          const targetSpeed = fuel > 0 ? 60 + Math.random() * 30 : 0;
          const speed = Math.round(
            v.speed + (targetSpeed - v.speed) * 0.1 + (Math.random() - 0.5) * 5,
          );
          const engineTemp = Math.min(
            120,
            v.engineTemp + 0.5 + Math.random() * 0.5,
          );
          const status: Vehicle["status"] = fuel <= 0 ? "STANDBY" : "ACTIVE";
          return {
            ...v,
            fuel,
            speed: Math.max(0, speed),
            engineTemp: Math.round(engineTemp),
            status,
          };
        }),
      );
    }, 500);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isHL2]);

  const toggleIgnition = useCallback(
    (id: string) => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id !== id) return v;
          const next = !v.ignition;
          const status: Vehicle["status"] = next ? "ACTIVE" : "STANDBY";
          addLogEntry(
            `VEHICLE: ${v.name} ${next ? "STARTED" : "STOPPED"}`,
            "info",
          );
          return {
            ...v,
            ignition: next,
            status,
            speed: next ? v.speed : 0,
            engineTemp: next ? v.engineTemp : Math.max(22, v.engineTemp - 5),
          };
        }),
      );
    },
    [addLogEntry],
  );

  const refuel = useCallback((id: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, fuel: Math.min(100, v.fuel + 25) } : v,
      ),
    );
  }, []);

  const repair = useCallback((id: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, hull: Math.min(100, v.hull + 20) } : v,
      ),
    );
  }, []);

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "6px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
  };

  if (!isHL2) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "8px",
          fontFamily: "'Share Tech Mono', monospace",
          padding: "20px",
          textAlign: "center",
        }}
        data-ocid="vehicles.unavailable.section"
      >
        <div style={{ fontSize: "24px", color: `${colors.primary}40` }}>□</div>
        <div
          style={{
            fontSize: "11px",
            color: `${colors.primary}60`,
            letterSpacing: "0.2em",
          }}
        >
          VEHICLES UNAVAILABLE
        </div>
        <div
          style={{
            fontSize: "8px",
            color: colors.dim,
            letterSpacing: "0.1em",
            maxWidth: "200px",
          }}
        >
          VEHICLE TRACKING REQUIRES HL2 MODE. ENABLE IN SETTINGS.
        </div>
      </div>
    );
  }

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
      data-ocid="vehicles.section"
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {vehicles.map((v, i) => (
          <div
            key={v.id}
            style={panelStyle}
            data-ocid={`vehicles.item.${i + 1}`}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "5px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: v.ignition ? colors.primary : `${colors.primary}60`,
                    letterSpacing: "0.15em",
                  }}
                >
                  {v.name}
                </div>
                <div
                  style={{
                    fontSize: "7px",
                    color:
                      v.status === "ACTIVE"
                        ? "#44cc44"
                        : v.status === "STANDBY"
                          ? "#ffaa00"
                          : `${colors.dim}60`,
                    letterSpacing: "0.1em",
                    marginTop: "1px",
                  }}
                >
                  {v.status}
                </div>
              </div>
              {/* ASCII art */}
              <pre
                style={{
                  fontSize: "6px",
                  color: v.ignition
                    ? `${colors.primary}60`
                    : `${colors.primary}25`,
                  lineHeight: 1.3,
                  margin: 0,
                  fontFamily: "'Share Tech Mono', monospace",
                  textAlign: "right",
                }}
              >
                {v.art}
              </pre>
            </div>

            {/* Gauges */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px",
                marginBottom: "5px",
              }}
            >
              {[
                {
                  label: "FUEL",
                  val: Math.round(v.fuel),
                  color:
                    v.fuel < 20
                      ? "#ff4444"
                      : v.fuel < 50
                        ? "#ffaa00"
                        : "#44cc44",
                },
                {
                  label: "HULL",
                  val: Math.round(v.hull),
                  color:
                    v.hull < 30
                      ? "#ff4444"
                      : v.hull < 60
                        ? "#ffaa00"
                        : colors.primary,
                },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "2px",
                    }}
                  >
                    <span style={{ fontSize: "7px", color: colors.dim }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "8px",
                        color,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: `${color}20`,
                      borderRadius: "1px",
                      overflow: "hidden",
                      border: `1px solid ${color}30`,
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
                </div>
              ))}
            </div>

            {/* Speed + temp */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "7px", color: colors.dim }}>SPEED</div>
                <div
                  style={{
                    fontSize: "18px",
                    color: colors.primary,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {v.ignition ? v.speed : 0}
                  <span
                    style={{
                      fontSize: "7px",
                      color: colors.dim,
                      marginLeft: "2px",
                    }}
                  >
                    kph
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "7px", color: colors.dim }}>
                  ENG TEMP
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    color:
                      v.engineTemp > 95
                        ? "#ff4444"
                        : v.engineTemp > 80
                          ? "#ffaa00"
                          : colors.primary,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {v.engineTemp}
                  <span
                    style={{
                      fontSize: "7px",
                      color: colors.dim,
                      marginLeft: "2px",
                    }}
                  >
                    °C
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => toggleIgnition(v.id)}
                data-ocid={`vehicles.ignition.toggle.${i + 1}`}
                style={{
                  flex: 2,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "8px",
                  padding: "4px",
                  background: v.ignition
                    ? "rgba(255,68,68,0.15)"
                    : `${colors.primary}12`,
                  border: `1px solid ${v.ignition ? "#ff4444" : colors.primary}50`,
                  color: v.ignition ? "#ff4444" : colors.primary,
                  borderRadius: "3px",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                {v.ignition ? "■ STOP" : "► START"}
              </button>
              <button
                type="button"
                onClick={() => refuel(v.id)}
                data-ocid={`vehicles.refuel.button.${i + 1}`}
                style={{
                  flex: 1,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "7px",
                  padding: "4px",
                  background: "rgba(68,204,68,0.08)",
                  border: "1px solid #44cc4430",
                  color: "#44cc44",
                  borderRadius: "3px",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                REFUEL
              </button>
              <button
                type="button"
                onClick={() => repair(v.id)}
                data-ocid={`vehicles.repair.button.${i + 1}`}
                style={{
                  flex: 1,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "7px",
                  padding: "4px",
                  background: "rgba(255,170,0,0.08)",
                  border: "1px solid #ffaa0030",
                  color: "#ffaa00",
                  borderRadius: "3px",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                REPAIR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
