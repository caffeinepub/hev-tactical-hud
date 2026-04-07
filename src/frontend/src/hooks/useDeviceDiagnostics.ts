import { useCallback, useEffect, useRef, useState } from "react";

export interface DeviceDiagnostics {
  batteryLevel: number | null;
  batteryCharging: boolean;
  networkStatus: "online" | "offline";
  connectionType: string;
  orientation: "portrait" | "landscape";
  deviceMemory: number | null;
  hardwareConcurrency: number;
  wakeLockActive: boolean;
  enableWakeLock: () => Promise<void>;
  releaseWakeLock: () => void;
}

export function useDeviceDiagnostics(): DeviceDiagnostics {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline",
  );
  const [connectionType, setConnectionType] = useState("unknown");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const deviceMemory =
    typeof navigator !== "undefined" && "deviceMemory" in navigator
      ? (navigator as Navigator & { deviceMemory: number }).deviceMemory
      : null;

  const hardwareConcurrency =
    typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? 2) : 2;

  // Battery API
  useEffect(() => {
    let battery: {
      level: number;
      charging: boolean;
      addEventListener: (e: string, cb: () => void) => void;
      removeEventListener: (e: string, cb: () => void) => void;
    } | null = null;

    async function initBattery() {
      try {
        if ("getBattery" in navigator) {
          battery = await (
            navigator as Navigator & {
              getBattery(): Promise<{
                level: number;
                charging: boolean;
                addEventListener: (e: string, cb: () => void) => void;
                removeEventListener: (e: string, cb: () => void) => void;
              }>;
            }
          ).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setBatteryCharging(battery.charging);

          const onLevelChange = () =>
            setBatteryLevel(Math.round(battery!.level * 100));
          const onChargingChange = () => setBatteryCharging(battery!.charging);

          battery.addEventListener("levelchange", onLevelChange);
          battery.addEventListener("chargingchange", onChargingChange);

          return () => {
            battery?.removeEventListener("levelchange", onLevelChange);
            battery?.removeEventListener("chargingchange", onChargingChange);
          };
        }
      } catch {
        // Battery API not supported
      }
    }

    const cleanup = initBattery();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  // Network status
  useEffect(() => {
    const onOnline = () => setNetworkStatus("online");
    const onOffline = () => setNetworkStatus("offline");

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Network Information API
    try {
      const conn = (
        navigator as Navigator & {
          connection?: {
            effectiveType?: string;
            type?: string;
            addEventListener: (e: string, cb: () => void) => void;
            removeEventListener: (e: string, cb: () => void) => void;
          };
        }
      ).connection;
      if (conn) {
        const type = conn.effectiveType ?? conn.type ?? "unknown";
        setConnectionType(type);
        const onConnChange = () =>
          setConnectionType(conn.effectiveType ?? conn.type ?? "unknown");
        conn.addEventListener("change", onConnChange);
        return () => {
          window.removeEventListener("online", onOnline);
          window.removeEventListener("offline", onOffline);
          conn.removeEventListener("change", onConnChange);
        };
      }
    } catch {
      // not supported
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Orientation
  useEffect(() => {
    function updateOrientation() {
      try {
        if (screen.orientation) {
          setOrientation(
            screen.orientation.type.startsWith("landscape")
              ? "landscape"
              : "portrait",
          );
        } else {
          setOrientation(
            window.innerWidth > window.innerHeight ? "landscape" : "portrait",
          );
        }
      } catch {
        setOrientation(
          window.innerWidth > window.innerHeight ? "landscape" : "portrait",
        );
      }
    }

    updateOrientation();

    try {
      screen.orientation.addEventListener("change", updateOrientation);
    } catch {
      window.addEventListener("orientationchange", updateOrientation);
      window.addEventListener("resize", updateOrientation);
    }

    return () => {
      try {
        screen.orientation.removeEventListener("change", updateOrientation);
      } catch {
        window.removeEventListener("orientationchange", updateOrientation);
        window.removeEventListener("resize", updateOrientation);
      }
    };
  }, []);

  // Wake Lock
  const enableWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (
          navigator as Navigator & {
            wakeLock: { request: (type: string) => Promise<WakeLockSentinel> };
          }
        ).wakeLock.request("screen");
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener("release", () => {
          setWakeLockActive(false);
          wakeLockRef.current = null;
        });
      }
    } catch {
      // not supported or permission denied
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        setWakeLockActive(false);
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    batteryLevel,
    batteryCharging,
    networkStatus,
    connectionType,
    orientation,
    deviceMemory,
    hardwareConcurrency,
    wakeLockActive,
    enableWakeLock,
    releaseWakeLock,
  };
}
