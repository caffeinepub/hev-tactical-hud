import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  DisplayMode,
  Faction,
  GameMode,
  MarkLevel,
  TabNavStyle,
  type UserSettings,
} from "../backend";
import { useActor } from "../hooks/useActor";

export interface FactionColors {
  primary: string;
  bg: string;
  accent: string;
  text: string;
  dim: string;
}

export const FACTION_COLORS: Record<Faction, FactionColors> = {
  [Faction.hev]: {
    primary: "#FF8C00",
    bg: "#000000",
    accent: "#FFA500",
    text: "#FFFFFF",
    dim: "#C86510",
  },
  [Faction.hecu]: {
    primary: "#4A5D23",
    bg: "#000000",
    accent: "#6B8E23",
    text: "#FFFFFF",
    dim: "#3A4A1A",
  },
  [Faction.security]: {
    primary: "#1E3A8A",
    bg: "#000000",
    accent: "#3B82F6",
    text: "#FFFFFF",
    dim: "#1A2E6A",
  },
  [Faction.combine]: {
    primary: "#3B82F6",
    bg: "#FFFFFF",
    accent: "#60A5FA",
    text: "#000000",
    dim: "#93C5FD",
  },
};

export const FACTION_DESIGNATIONS: Record<Faction, string> = {
  [Faction.hev]: "LAMBDA-6",
  [Faction.hecu]: "GRUNT-117",
  [Faction.security]: "GUARD-042",
  [Faction.combine]: "UNIT-7734",
};

export const FACTION_LABELS: Record<Faction, string> = {
  [Faction.hev]: "H.E.V SUIT",
  [Faction.hecu]: "HECU MARINES",
  [Faction.security]: "BM SECURITY",
  [Faction.combine]: "COMBINE",
};

export const defaultSettings: UserSettings = {
  faction: Faction.hev,
  markLevel: MarkLevel.V,
  displayMode: DisplayMode.standard,
  hudSize: 100n,
  brightness: 100n,
  gameMode: GameMode.hl1,
  tabNavStyle: TabNavStyle.dropdown,
  operatorName: "OPERATIVE",
  colorScheme: "orange",
  crtFilter: true,
  scanlines: true,
  glowEffect: true,
  glitchEffects: true,
  setupComplete: false,
};

export type LogEntryType = "info" | "warn" | "error" | "system";

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogEntryType;
}

interface HUDContextValue {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  saveSettingsToBackend: (s: UserSettings) => Promise<void>;
  factionColors: FactionColors;
  designation: string;
  factionLabel: string;
  isLoading: boolean;
  // Event log
  eventLog: LogEntry[];
  addLogEntry: (msg: string, type: LogEntryType) => void;
  // Uptime
  uptimeSeconds: number;
  // Panic
  panicActive: boolean;
  triggerPanic: () => void;
  // HUD lock
  hudLocked: boolean;
  lockHUD: (pin: string) => void;
  unlockHUD: (pin: string) => boolean;
  // Screen shake
  screenShake: boolean;
  triggerScreenShake: () => void;
}

const HUDContext = createContext<HUDContextValue | null>(null);

function applyFactionCssVars(colors: FactionColors) {
  const root = document.documentElement;
  root.style.setProperty("--hud-primary", colors.primary);
  root.style.setProperty("--hud-bg", colors.bg);
  root.style.setProperty("--hud-accent", colors.accent);
  root.style.setProperty("--hud-text", colors.text);
  root.style.setProperty("--hud-dim", colors.dim);
}

function applyBrightness(brightness: bigint) {
  const val = Number(brightness);
  document.documentElement.style.setProperty("--hud-brightness", String(val));
  document.body.style.filter = `brightness(${val / 100})`;
}

export function HUDProvider({ children }: { children: ReactNode }) {
  const { actor } = useActor();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [panicActive, setPanicActive] = useState(false);
  const [hudLocked, setHudLocked] = useState(() => {
    return localStorage.getItem("hev_locked") === "true";
  });
  const [screenShake, setScreenShake] = useState(false);
  const panicTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logIdRef = useRef(0);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load settings from backend or localStorage
  useEffect(() => {
    async function load() {
      const cached = localStorage.getItem("hev_settings");
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as UserSettings;
          parsed.hudSize = BigInt(parsed.hudSize as unknown as string);
          parsed.brightness = BigInt(parsed.brightness as unknown as string);
          setSettings(parsed);
          applyFactionCssVars(
            FACTION_COLORS[parsed.faction] ?? FACTION_COLORS[Faction.hev],
          );
          applyBrightness(parsed.brightness);
        } catch {
          // ignore parse errors
        }
      }

      if (actor) {
        try {
          const s = await actor.getSettings();
          setSettings(s);
          localStorage.setItem("hev_settings", JSON.stringify(s));
          applyFactionCssVars(
            FACTION_COLORS[s.faction] ?? FACTION_COLORS[Faction.hev],
          );
          applyBrightness(s.brightness);
        } catch {
          // Use defaults if backend fails
        }
      }
      setIsLoading(false);
    }
    load();
  }, [actor]);

  // Apply faction CSS vars whenever faction changes
  useEffect(() => {
    applyFactionCssVars(
      FACTION_COLORS[settings.faction] ?? FACTION_COLORS[Faction.hev],
    );
    applyBrightness(settings.brightness);
  }, [settings.faction, settings.brightness]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("hev_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const saveSettingsToBackend = useCallback(
    async (s: UserSettings) => {
      localStorage.setItem("hev_settings", JSON.stringify(s));
      if (actor) {
        try {
          await actor.saveSettings(s);
        } catch {
          // silently continue
        }
      }
    },
    [actor],
  );

  const addLogEntry = useCallback((msg: string, type: LogEntryType) => {
    logIdRef.current += 1;
    const entry: LogEntry = {
      id: String(logIdRef.current),
      timestamp: Date.now(),
      message: msg,
      type,
    };
    setEventLog((prev) => {
      const next = [entry, ...prev];
      if (next.length > 100) next.length = 100;
      return next;
    });
  }, []);

  const triggerPanic = useCallback(() => {
    setPanicActive(true);
    if (panicTimerRef.current) clearTimeout(panicTimerRef.current);
    panicTimerRef.current = setTimeout(() => {
      setPanicActive(false);
    }, 10000);
  }, []);

  const lockHUD = useCallback((pin: string) => {
    localStorage.setItem("hev_pin", pin);
    localStorage.setItem("hev_locked", "true");
    setHudLocked(true);
  }, []);

  const unlockHUD = useCallback((pin: string): boolean => {
    const stored = localStorage.getItem("hev_pin");
    if (stored === pin) {
      localStorage.setItem("hev_locked", "false");
      setHudLocked(false);
      return true;
    }
    return false;
  }, []);

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => {
      setScreenShake(false);
    }, 600);
  }, []);

  const factionColors =
    FACTION_COLORS[settings.faction] ?? FACTION_COLORS[Faction.hev];
  const designation = FACTION_DESIGNATIONS[settings.faction] ?? "LAMBDA-6";
  const factionLabel = FACTION_LABELS[settings.faction] ?? "H.E.V SUIT";

  return (
    <HUDContext.Provider
      value={{
        settings,
        updateSettings,
        saveSettingsToBackend,
        factionColors,
        designation,
        factionLabel,
        isLoading,
        eventLog,
        addLogEntry,
        uptimeSeconds,
        panicActive,
        triggerPanic,
        hudLocked,
        lockHUD,
        unlockHUD,
        screenShake,
        triggerScreenShake,
      }}
    >
      {children}
    </HUDContext.Provider>
  );
}

export function useHUD(): HUDContextValue {
  const ctx = useContext(HUDContext);
  if (!ctx) throw new Error("useHUD must be used within HUDProvider");
  return ctx;
}
