import React, { useState, useEffect } from "react";
import type { UserSettings } from "./backend";
import BootSequence from "./components/BootSequence";
import HUDFrame from "./components/HUDFrame";
import SetupWizard from "./components/SetupWizard";
import { HUDProvider } from "./context/HUDContext";

type AppState = "boot" | "wizard" | "hud";

export default function App() {
  const [appState, setAppState] = useState<AppState>("boot");
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  // Check if setup has been completed on this device
  useEffect(() => {
    const done = localStorage.getItem("hev_setup_complete") === "true";
    setSetupComplete(done);
  }, []);

  function handleBootComplete() {
    if (setupComplete === false) {
      setAppState("wizard");
    } else {
      setAppState("hud");
    }
  }

  function handleWizardComplete(settings: UserSettings) {
    // Settings already saved to localStorage by wizard
    // Transition to HUD
    setAppState("hud");
    // Suppress unused param lint - will be used in Phase 2 for backend save
    void settings;
  }

  // Don't render anything until we know setup state
  if (setupComplete === null) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            color: "#FF8C00",
            textShadow: "0 0 16px #FF8C00",
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          Λ
        </div>
      </div>
    );
  }

  return (
    <HUDProvider>
      {appState === "boot" && <BootSequence onComplete={handleBootComplete} />}
      {appState === "wizard" && (
        <SetupWizard onComplete={handleWizardComplete} />
      )}
      {appState === "hud" && <HUDFrame />}
    </HUDProvider>
  );
}
