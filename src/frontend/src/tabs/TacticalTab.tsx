import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHUD } from "../context/HUDContext";
import { useDeviceDiagnostics } from "../hooks/useDeviceDiagnostics";

type Contact = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  bearing: number;
  visible: boolean;
  lifetime: number;
};

type ThreatEntry = {
  id: number;
  time: string;
  message: string;
  level: "info" | "warn" | "critical";
};

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function bearingToText(b: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(b / 45) % 8];
}

export default function TacticalTab() {
  const { factionColors, settings, addLogEntry } = useHUD();
  const diag = useDeviceDiagnostics();
  const colors = factionColors;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contactsRef = useRef<Contact[]>([]);
  const idRef = useRef(0);

  const [heading, setHeading] = useState(0);
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [gpsSimulated, setGpsSimulated] = useState(true);
  const [simCoords] = useState({
    lat: 43.2126 + (Math.random() - 0.5) * 0.01,
    lon: -72.4503 + (Math.random() - 0.5) * 0.01,
  });
  const [sector] = useState(
    `SECTOR ${String.fromCharCode(71 + Math.floor(Math.random() * 4))}-${Math.floor(Math.random() * 9) + 1}`,
  );
  const [threatLog, setThreatLog] = useState<ThreatEntry[]>([
    {
      id: 1,
      time: getTime(),
      message: "CONTACT AT 045° NE - UNKNOWN",
      level: "warn",
    },
    {
      id: 2,
      time: getTime(),
      message: "PERIMETER SCAN INITIATED",
      level: "info",
    },
    {
      id: 3,
      time: getTime(),
      message: "SIGNAL DETECTED 180° S",
      level: "critical",
    },
  ]);
  const threatIdRef = useRef(4);

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "6px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
  };

  // GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setGpsSimulated(false);
        },
        () => setGpsSimulated(true),
        { timeout: 5000 },
      );
    }
  }, []);

  // GPS drift simulation
  useEffect(() => {
    if (!gpsSimulated) return;
    const interval = setInterval(() => {
      setGpsCoords((prev) => {
        const base = prev ?? simCoords;
        return {
          lat: base.lat + (Math.random() - 0.5) * 0.00002,
          lon: base.lon + (Math.random() - 0.5) * 0.00002,
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [gpsSimulated, simCoords]);

  // Compass / device orientation
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const alpha = e.alpha ?? 0;
      setHeading(Math.round(alpha));
    };
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent
    ) {
      // iOS 13+ -- request permission
      (
        DeviceOrientationEvent as unknown as {
          requestPermission(): Promise<string>;
        }
      )
        .requestPermission()
        .then((perm: string) => {
          if (perm === "granted")
            window.addEventListener("deviceorientation", handler);
        })
        .catch(() => {});
    } else {
      window.addEventListener("deviceorientation", handler);
    }

    // Simulate slow heading drift if no real data after 2s
    let simActive = true;
    const simTimer = setTimeout(() => {
      const driftInterval = setInterval(() => {
        if (!simActive) return;
        setHeading(
          (h) => (h + Math.round((Math.random() - 0.5) * 3) + 360) % 360,
        );
      }, 2000);
      return () => clearInterval(driftInterval);
    }, 2000);

    return () => {
      simActive = false;
      window.removeEventListener("deviceorientation", handler);
      clearTimeout(simTimer);
    };
  }, []);

  // Initialize contacts
  useEffect(() => {
    const initial: Contact[] = [];
    for (let i = 0; i < 6; i++) {
      idRef.current++;
      const angle = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.55;
      initial.push({
        id: idRef.current,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        dx: (Math.random() - 0.5) * 0.004,
        dy: (Math.random() - 0.5) * 0.004,
        bearing:
          Math.round(
            (Math.atan2(Math.sin(angle), Math.cos(angle)) * 180) / Math.PI +
              360,
          ) % 360,
        visible: true,
        lifetime: 40 + Math.floor(Math.random() * 80),
      });
    }
    contactsRef.current = initial;
  }, []);

  // Threat event generator
  useEffect(() => {
    const generateThreat = () => {
      const bearing = Math.floor(Math.random() * 36) * 10;
      const events = [
        {
          message: `NEW CONTACT AT ${bearing}° ${bearingToText(bearing)}`,
          level: "warn" as const,
        },
        { message: "CONTACT LOST - SIGNAL FADED", level: "info" as const },
        {
          message: `HOSTILE TRACK ${bearing}° - CONFIRMED`,
          level: "critical" as const,
        },
        { message: "RADAR SWEEP COMPLETE", level: "info" as const },
        {
          message: `UNKNOWN ENTITY ${bearing}° - TRACKING`,
          level: "warn" as const,
        },
      ];
      const ev = events[Math.floor(Math.random() * events.length)];
      threatIdRef.current++;
      const entry = { id: threatIdRef.current, time: getTime(), ...ev };
      setThreatLog((prev) => [entry, ...prev.slice(0, 7)]);
      addLogEntry(
        `TACTICAL: ${ev.message}`,
        ev.level === "critical" ? "warn" : "info",
      );
      const next = 15000 + Math.random() * 15000;
      t = setTimeout(generateThreat, next);
    };
    let t = setTimeout(generateThreat, 8000 + Math.random() * 7000);
    return () => clearTimeout(t);
  }, [addLogEntry]);

  // Canvas radar animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId = 0;
    let sweepAngle = 0;

    function draw() {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(cx, cy) - 4;

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Range rings
      for (const frac of [0.33, 0.66, 1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `${colors.primary}30`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Crosshair
      ctx.strokeStyle = `${colors.primary}20`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.stroke();

      // Sweep arc
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sweepAngle - 0.5, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = `${colors.primary}50`;
      ctx.fill();

      // Update contacts
      contactsRef.current = contactsRef.current
        .map((c) => {
          let nx = c.x + c.dx;
          let ny = c.y + c.dy;
          if (Math.abs(nx) > 0.9) c.dx *= -1;
          if (Math.abs(ny) > 0.9) c.dy *= -1;
          nx = Math.max(-0.9, Math.min(0.9, nx));
          ny = Math.max(-0.9, Math.min(0.9, ny));
          return { ...c, x: nx, y: ny, lifetime: c.lifetime - 0.05 };
        })
        .filter((c) => c.lifetime > 0);

      // Replenish contacts
      while (contactsRef.current.length < 5) {
        idRef.current++;
        const angle = Math.random() * Math.PI * 2;
        const r = 0.3 + Math.random() * 0.55;
        contactsRef.current.push({
          id: idRef.current,
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          dx: (Math.random() - 0.5) * 0.004,
          dy: (Math.random() - 0.5) * 0.004,
          bearing:
            Math.round(
              (Math.atan2(Math.sin(angle), Math.cos(angle)) * 180) / Math.PI +
                360,
            ) % 360,
          visible: true,
          lifetime: 40 + Math.floor(Math.random() * 80),
        });
      }

      // Draw contacts
      for (const c of contactsRef.current) {
        const px = cx + c.x * R;
        const py = cy + c.y * R;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors.accent;
      ctx.shadowColor = colors.accent;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // North tick
      ctx.fillStyle = colors.primary;
      ctx.font = `8px 'Share Tech Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText("N", cx, cy - R + 10);

      sweepAngle = (sweepAngle + 0.03) % (Math.PI * 2);
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [colors]);

  const displayCoords = gpsCoords ?? simCoords;

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
      data-ocid="tactical.section"
    >
      {/* Top row: radar + info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5px",
          flexShrink: 0,
        }}
      >
        {/* Radar */}
        <div style={panelStyle} data-ocid="tactical.radar.panel">
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              letterSpacing: "0.2em",
              marginBottom: "4px",
            }}
          >
            RADAR
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <canvas
              ref={canvasRef}
              width={110}
              height={110}
              style={{
                borderRadius: "50%",
                border: `1px solid ${colors.primary}40`,
              }}
            />
          </div>
          <div
            style={{
              fontSize: "7px",
              color: colors.dim,
              textAlign: "center",
              marginTop: "3px",
              letterSpacing: "0.1em",
            }}
          >
            {contactsRef.current.length} CONTACTS
          </div>
        </div>

        {/* Info column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {/* Compass */}
          <div style={panelStyle} data-ocid="tactical.compass.panel">
            <div
              style={{
                fontSize: "7px",
                color: colors.dim,
                letterSpacing: "0.15em",
                marginBottom: "2px",
              }}
            >
              HEADING
            </div>
            <div
              style={{
                fontSize: "22px",
                color: colors.primary,
                textShadow: `0 0 8px ${colors.primary}`,
                lineHeight: 1,
              }}
            >
              {String(heading).padStart(3, "0")}°
            </div>
            <div
              style={{
                fontSize: "9px",
                color: colors.accent,
                letterSpacing: "0.1em",
              }}
            >
              {bearingToText(heading)}
            </div>
          </div>

          {/* GPS */}
          <div style={panelStyle} data-ocid="tactical.gps.panel">
            <div
              style={{
                fontSize: "7px",
                color: colors.dim,
                letterSpacing: "0.15em",
                marginBottom: "2px",
              }}
            >
              GPS {gpsSimulated ? "[SIM]" : "[LIVE]"}
            </div>
            <div
              style={{
                fontSize: "8px",
                color: colors.primary,
                letterSpacing: "0.05em",
                lineHeight: 1.5,
              }}
            >
              <div>{displayCoords.lat.toFixed(4)}°N</div>
              <div>{Math.abs(displayCoords.lon).toFixed(4)}°W</div>
            </div>
          </div>

          {/* Sector */}
          <div
            style={{ ...panelStyle, textAlign: "center" }}
            data-ocid="tactical.sector.panel"
          >
            <div
              style={{
                fontSize: "7px",
                color: colors.dim,
                letterSpacing: "0.15em",
              }}
            >
              SECTOR
            </div>
            <div
              style={{
                fontSize: "13px",
                color: colors.primary,
                textShadow: `0 0 6px ${colors.primary}`,
                marginTop: "2px",
                letterSpacing: "0.2em",
              }}
            >
              {sector}
            </div>
            <div
              style={{ fontSize: "7px", color: colors.dim, marginTop: "2px" }}
            >
              {diag.orientation.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Threat log */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="tactical.threats.panel"
      >
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.2em",
            marginBottom: "4px",
            flexShrink: 0,
          }}
        >
          THREAT LOG
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {threatLog.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                gap: "6px",
                padding: "2px 0",
                borderBottom: `1px solid ${colors.primary}15`,
                fontSize: "8px",
                lineHeight: 1.4,
              }}
            >
              <span
                style={{ color: colors.dim, flexShrink: 0, fontSize: "7px" }}
              >
                {entry.time}
              </span>
              <span
                style={{
                  color:
                    entry.level === "critical"
                      ? "#ff4444"
                      : entry.level === "warn"
                        ? "#ffaa00"
                        : colors.dim,
                  fontSize: "8px",
                  letterSpacing: "0.05em",
                }}
              >
                {entry.message}
              </span>
            </div>
          ))}
          {threatLog.length === 0 && (
            <div
              style={{
                fontSize: "8px",
                color: `${colors.dim}60`,
                textAlign: "center",
                padding: "8px",
              }}
              data-ocid="tactical.threats.empty_state"
            >
              NO THREATS DETECTED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
