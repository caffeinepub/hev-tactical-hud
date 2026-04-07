import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Faction, MarkLevel } from "../backend";
import { useHUD } from "../context/HUDContext";
import { useDeviceDiagnostics } from "../hooks/useDeviceDiagnostics";

const LORE: Record<string, string> = {
  hev: `BLACK MESA INCIDENT - CLASSIFIED TIMELINE

[MAY 16, 200-] 07:00 - Anomalous Materials Lab
Dr. Gordon Freeman reports for his shift at Black Mesa Research Facility. The Anti-Mass Spectrometer begins test cycle with an unusual sample: a crystalline compound of unknown origin.

07:47 - RESONANCE CASCADE INITIATED
Sample introduced into the beam. Energy readings exceeded containment parameters within 2 seconds. The resonance cascade ripped open portals to Xen -- the borderworld -- across the entire facility.

[08:00-18:00] - LAMBDA COMPLEX OPERATIONS
Survivor groups form around the Lambda Complex. Xen entities breach into all sectors. Emergency containment teams neutralize what they can. Satellite uplink requires reactivation.

[18:00+] - HECU DEPLOYMENT
The US Marine Corps HECU division arrives under orders to "clean up" the situation -- including witnesses. Black Mesa Security and science personnel are caught between alien incursion and military strike teams.

[+72 HRS] - XEN PORTAL DESTABILIZATION
Lambda Core team successfully opens a portal to Xen. Final mission: reach the Nihilanth and end the cascade. Mission accomplished. Borderworld portals collapse.

[STATUS: CLASSIFIED - EYES ONLY]`,
  hecu: `HECU OPERATIONAL BRIEFING - BRAVO TEAM

CLASSIFIED: OPERATION CLEAN SWEEP
Commandering Officer: General J.A. Cross
Objective: Contain the Black Mesa incident and eliminate all witnesses.

ROE: All personnel -- civilian, science, and security -- are considered hostile. No exceptions.

INTEL:
- Facility is compromised at all levels
- Alien entities active in all sectors
- Lambda team is priority target
- Communications disrupted by cascade event

BRAVO TEAM ORDERS:
1. Secure surface perimeter
2. Sweep Lambda Complex
3. Destroy satellite uplink
4. Withdraw before airstrike window

BE ADVISED: Xen entities are extremely hostile. Standard munitions effective. HEV suit operatives are armed and highly trained -- engage with caution.

[TRANSMISSION ENDS]`,
  security: `BLACK MESA SECURITY DIVISION
ROTATION BRIEFING - SECTOR C/D/E

Date: [REDACTED]
Shift: All-hands emergency protocol

SITUATION:
Facility-wide lockdown in effect. Cause: uncontrolled dimensional event in Anomalous Materials Lab. All sectors report breaches.

GUARD ASSIGNMENTS:
- Posts A1-A4: Surface checkpoint holdout
- Posts B1-B4: Lambda Complex perimeter
- Posts C1-C4: Medical sector defense

THREAT ASSESSMENT:
- Xen entities: HOSTILE - engage on sight
- HECU Marines: HOSTILE - do not approach
- Science personnel: PROTECT if possible
- HEV operators: ALLY - assist as directed

PERSONNEL DIRECTIVE:
Maintain post as long as possible. If overwhelmed, fall back to Lambda Core checkpoint. Do not use elevator shafts -- Xen entities reported in ventilation.

[SECURITY DIVISION - INTERNAL USE ONLY]`,
  combine: `CIVIL PROTECTION DIRECTIVE
OVERWATCH COMMAND - CITY 17

SUBJECT: CIVIL COMPLIANCE ENFORCEMENT PROTOCOLS

Unit Designation: CP-Div-17-Bravo
Date: [SUPPRESSED]
Classification: PRIORITY OMEGA

OBJECTIVES:
1. Maintain population suppression index above 87%
2. Enforce anti-private-reproductive protocols
3. Neutralize resistance contact networks
4. Protect benefactors' infrastructure assets

INTELLIGENCE BRIEF:
Underground resistance ("Free Man" network) has been confirmed active in sectors 7-12. Cell structure makes complete elimination difficult. Focus on asset denial and informant cultivation.

SUPPRESSION FIELD STATUS: NOMINAL
All four field generators reporting at >90% capacity.
Next maintenance cycle: 72 hours.

NEXUS PRIORITY: LOCATE FREEMAN

[OVERWATCH DIRECTIVES CLASSIFIED - VIOLATION SUBJECT TO RETRIBUTIVE ACTION]`,
};

type ConsoleLine = {
  id: number;
  text: string;
  type: "input" | "output" | "error" | "warn" | "system";
};

const BOOT_LINES = [
  { text: "H.E.V TACTICAL SYSTEM v5.0", type: "system" as const },
  { text: "OPERATOR CONSOLE READY", type: "system" as const },
  { text: "Type /help for available commands", type: "output" as const },
];

let lineId = 0;
function mkLine(text: string, type: ConsoleLine["type"]): ConsoleLine {
  return { id: ++lineId, text, type };
}

function formatUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function InfoTab() {
  const {
    factionColors,
    settings,
    updateSettings,
    addLogEntry,
    eventLog,
    uptimeSeconds,
    triggerScreenShake,
  } = useHUD();
  const diag = useDeviceDiagnostics();
  const colors = factionColors;

  const loreKey = Object.keys(LORE).includes(settings.faction)
    ? settings.faction
    : "hev";
  const loreText = LORE[loreKey];

  const [lines, setLines] = useState<ConsoleLine[]>(
    BOOT_LINES.map((l) => mkLine(l.text, l.type)),
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback((text: string, type: ConsoleLine["type"]) => {
    setLines((prev) => [...prev, mkLine(text, type)]);
  }, []);

  // Scroll to bottom on new lines - use layout effect to avoid dep warning
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed.startsWith("/")) {
        addLine(`> ${trimmed}`, "input");
        addLine("UNRECOGNIZED INPUT. Use /help for commands.", "error");
        return;
      }

      addLine(`> ${trimmed}`, "input");
      const parts = trimmed.slice(1).split(" ");
      const command = parts[0].toLowerCase();
      const arg = parts[1] ?? "";

      switch (command) {
        case "help":
          addLine("AVAILABLE COMMANDS:", "system");
          addLine("/help - List all commands", "output");
          addLine("/status - HUD status dump", "output");
          addLine("/time - Current time and uptime", "output");
          addLine("/diag - Device diagnostics", "output");
          addLine("/clear - Clear console", "output");
          addLine("/setup_wizard - Restart setup wizard", "output");
          addLine("/restart - Reload application", "output");
          addLine(
            "/faction [hev|hecu|security|combine] - Change faction",
            "output",
          );
          addLine(
            "/mark [I|II|III|IV|V|prototype] - Change mark level",
            "output",
          );
          addLine(
            "/simulate [hazard|damage|emp] - Trigger simulation",
            "output",
          );
          addLine("/lock - Lock HUD with PIN", "output");
          addLine("/time - Display time + uptime", "output");
          break;

        case "status":
          addLine("--- HUD STATUS DUMP ---", "system");
          addLine(`OPERATOR: ${settings.operatorName}`, "output");
          addLine(`FACTION: ${settings.faction.toUpperCase()}`, "output");
          addLine(`MARK: ${settings.markLevel.toUpperCase()}`, "output");
          addLine(`GAME MODE: ${settings.gameMode.toUpperCase()}`, "output");
          addLine(
            `DISPLAY MODE: ${settings.displayMode.toUpperCase()}`,
            "output",
          );
          addLine(
            `CRT: ${settings.crtFilter} | SCANLINES: ${settings.scanlines} | GLOW: ${settings.glowEffect}`,
            "output",
          );
          addLine(`LOG ENTRIES: ${eventLog.length}`, "output");
          addLine(`UPTIME: ${formatUptime(uptimeSeconds)}`, "output");
          break;

        case "time":
          addLine(`SYSTEM TIME: ${new Date().toLocaleTimeString()}`, "output");
          addLine(`UPTIME: ${formatUptime(uptimeSeconds)}`, "output");
          break;

        case "diag":
          addLine("--- DEVICE DIAGNOSTICS ---", "system");
          addLine(
            `BATTERY: ${diag.batteryLevel !== null ? `${diag.batteryLevel}%` : "N/A"} ${diag.batteryCharging ? "[CHARGING]" : "[DISCHARGING]"}`,
            "output",
          );
          addLine(
            `NETWORK: ${diag.networkStatus.toUpperCase()} (${diag.connectionType.toUpperCase()})`,
            "output",
          );
          addLine(`ORIENTATION: ${diag.orientation.toUpperCase()}`, "output");
          addLine(`CPU CORES: ${diag.hardwareConcurrency}`, "output");
          addLine(
            `RAM: ${diag.deviceMemory !== null ? `${diag.deviceMemory}GB` : "N/A"}`,
            "output",
          );
          addLine(
            `WAKE LOCK: ${diag.wakeLockActive ? "ACTIVE" : "INACTIVE"}`,
            "output",
          );
          addLine(`PLATFORM: ${navigator.platform}`, "output");
          addLine(`UA: ${navigator.userAgent.slice(0, 60)}...`, "output");
          break;

        case "clear":
          setLines([]);
          break;

        case "setup_wizard":
          addLine("RESTARTING SETUP WIZARD...", "warn");
          setTimeout(() => {
            localStorage.removeItem("hev_setup_complete");
            window.location.reload();
          }, 1000);
          break;

        case "restart":
          addLine("RELOADING SYSTEM...", "warn");
          setTimeout(() => window.location.reload(), 800);
          break;

        case "faction": {
          const validFactions = ["hev", "hecu", "security", "combine"];
          if (validFactions.includes(arg)) {
            updateSettings({
              faction: arg as Faction,
            });
            addLine(`FACTION SET: ${arg.toUpperCase()}`, "output");
            addLogEntry(
              `CONSOLE: FACTION CHANGED TO ${arg.toUpperCase()}`,
              "system",
            );
          } else {
            addLine("USAGE: /faction [hev|hecu|security|combine]", "error");
          }
          break;
        }

        case "mark": {
          const validMarks = ["I", "II", "III", "IV", "V", "prototype"];
          if (
            validMarks.includes(arg.toUpperCase()) ||
            validMarks.includes(arg)
          ) {
            const level =
              validMarks.find((m) => m.toLowerCase() === arg.toLowerCase()) ??
              "V";
            updateSettings({
              markLevel: level as MarkLevel,
            });
            addLine(`MARK LEVEL SET: ${level.toUpperCase()}`, "output");
          } else {
            addLine("USAGE: /mark [I|II|III|IV|V|prototype]", "error");
          }
          break;
        }

        case "simulate":
          if (arg === "hazard") {
            addLogEntry("SIMULATED: HAZARD SPIKE DETECTED", "warn");
            addLine("SIMULATION: HAZARD SPIKE INJECTED", "warn");
          } else if (arg === "damage") {
            triggerScreenShake();
            addLogEntry("SIMULATED: DAMAGE EVENT", "error");
            addLine("SIMULATION: DAMAGE EVENT TRIGGERED", "warn");
          } else if (arg === "emp") {
            updateSettings({ glitchEffects: true });
            addLogEntry("SIMULATED: EMP EVENT", "warn");
            addLine("SIMULATION: EMP GLITCH ACTIVATED", "warn");
            setTimeout(
              () => updateSettings({ glitchEffects: settings.glitchEffects }),
              3000,
            );
          } else {
            addLine("USAGE: /simulate [hazard|damage|emp]", "error");
          }
          break;

        case "lock":
          addLine("ENTER PIN TO LOCK HUD:", "warn");
          addLine("Use Settings tab > LOCK HUD to set a PIN.", "output");
          break;

        default:
          addLine(`UNKNOWN COMMAND: /${command}`, "error");
          addLine("Type /help for available commands.", "output");
      }
    },
    [
      settings,
      updateSettings,
      addLogEntry,
      addLine,
      diag,
      eventLog,
      uptimeSeconds,
      triggerScreenShake,
    ],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (input.trim()) {
        processCommand(input);
        setHistory((prev) => [input, ...prev.slice(0, 49)]);
        setHistIdx(-1);
        setInput("");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : (history[next] ?? ""));
    }
  }

  const lineColors: Record<ConsoleLine["type"], string> = {
    input: colors.primary,
    output: colors.dim,
    error: "#ff4444",
    warn: "#ffaa00",
    system: `${colors.primary}80`,
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
      data-ocid="info.section"
    >
      {/* Lore panel */}
      <div
        style={{
          ...panelStyle,
          flex: "0 0 40%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="info.lore.panel"
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
          INTEL BRIEFING
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            fontSize: "7.5px",
            color: colors.dim,
            lineHeight: "1.6",
            letterSpacing: "0.04em",
            whiteSpace: "pre-wrap",
          }}
        >
          {loreText}
        </div>
      </div>

      {/* Console */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="info.console.panel"
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
          OPERATOR CONSOLE
        </div>
        {/* Output */}
        <div
          ref={outputRef}
          style={{
            flex: 1,
            overflowY: "auto",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "8px",
            lineHeight: "1.5",
            letterSpacing: "0.04em",
          }}
        >
          {lines.map((line) => (
            <div
              key={line.id}
              style={{ color: lineColors[line.type], padding: "0.5px 0" }}
            >
              {line.text}
            </div>
          ))}
          {/* Blink cursor */}
          <span
            style={{
              color: colors.primary,
              animation: "glow-pulse 1s ease-in-out infinite",
              fontSize: "10px",
            }}
          >
            _
          </span>
        </div>
        {/* Input */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderTop: `1px solid ${colors.primary}30`,
            paddingTop: "4px",
            marginTop: "4px",
          }}
        >
          <span style={{ color: colors.primary, fontSize: "9px" }}>&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="/command..."
            data-ocid="info.console.input"
            style={{
              flex: 1,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.08em",
              background: "transparent",
              border: "none",
              outline: "none",
              color: colors.primary,
              caretColor: colors.primary,
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
