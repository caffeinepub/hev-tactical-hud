import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import React, { useState, useEffect } from "react";
import {
  DisplayMode,
  Faction,
  GameMode,
  MarkLevel,
  TabNavStyle,
  type UserSettings,
} from "../backend";
import {
  FACTION_COLORS,
  FACTION_DESIGNATIONS,
  FACTION_LABELS,
  defaultSettings,
} from "../context/HUDContext";

const TOTAL_STEPS = 8;

const FACTION_DESCRIPTIONS: Record<Faction, string> = {
  [Faction.hev]: "Black Mesa protective suit. Science & hazard focused.",
  [Faction.hecu]: "Military tactical interface. Combat mission systems.",
  [Faction.security]: "Facility security monitoring. Guard systems.",
  [Faction.combine]: "Combine occupation interface. Suppression protocols.",
};

interface SetupWizardProps {
  onComplete: (settings: UserSettings) => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [miniBooting, setMiniBooting] = useState(false);
  const [config, setConfig] = useState<UserSettings>({
    ...defaultSettings,
    setupComplete: true,
  });
  const [nameInput, setNameInput] = useState("");
  const [easterEggHint, setEasterEggHint] = useState("");

  // Apply faction colors live
  useEffect(() => {
    const colors = FACTION_COLORS[config.faction];
    document.documentElement.style.setProperty("--hud-primary", colors.primary);
    document.documentElement.style.setProperty("--hud-bg", colors.bg);
    document.documentElement.style.setProperty("--hud-accent", colors.accent);
    document.documentElement.style.setProperty("--hud-text", colors.text);
    document.documentElement.style.setProperty("--hud-dim", colors.dim);
  }, [config.faction]);

  function handleFactionSelect(f: Faction) {
    setConfig((prev) => ({ ...prev, faction: f }));
  }

  function handleNameChange(val: string) {
    setNameInput(val);
    const v = val.trim().toLowerCase();
    if (v === "gordon freeman") {
      setEasterEggHint(
        "Dr. Gordon Freeman - Theoretical Physicist. Anomalous Materials Lab. Subject of prophecy. Λ",
      );
    } else if (v === "adrian shephard") {
      setEasterEggHint(
        "Corporal Adrian Shephard - HECU Marine. Survived the Black Mesa incident.",
      );
    } else if (v === "barney calhoun") {
      setEasterEggHint(
        "Barney Calhoun - Black Mesa Security. 'About that beer I owed ya...'",
      );
    } else {
      setEasterEggHint("");
    }
  }

  function handleNext() {
    if (step === 3) {
      const displayName = nameInput.trim() || "OPERATIVE";
      setConfig((prev) => ({
        ...prev,
        operatorName: displayName.toUpperCase(),
      }));
    }
    // Skip game mode step for non-HEV factions
    if (step === 5 && config.faction !== Faction.hev) {
      setStep(7);
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    if (step === 7 && config.faction !== Faction.hev) {
      setStep(5);
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    setMiniBooting(true);
    const finalSettings = {
      ...config,
      operatorName: nameInput.trim().toUpperCase() || "OPERATIVE",
      setupComplete: true,
    };
    localStorage.setItem("hev_setup_complete", "true");
    localStorage.setItem("hev_settings", JSON.stringify(finalSettings));
    // Mini boot delay
    await new Promise((r) => setTimeout(r, 1800));
    onComplete(finalSettings);
  }

  const colors = FACTION_COLORS[config.faction];
  const effectiveTotal =
    config.faction === Faction.hev ? TOTAL_STEPS : TOTAL_STEPS - 1;

  const stepTitle = [
    "",
    "WELCOME",
    "FACTION",
    "OPERATOR",
    "HUD SIZE",
    "VISUALS",
    "GAME MODE",
    "NAVIGATION",
    "CONFIRM",
  ];

  if (miniBooting) {
    return (
      <div
        className="wizard-screen items-center justify-center"
        style={{ background: colors.bg }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            style={{
              fontSize: "60px",
              color: colors.primary,
              textShadow: `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}50`,
              animation: "charging-pulse 0.6s ease-in-out infinite",
            }}
          >
            Λ
          </div>
          <div
            style={{
              fontSize: "11px",
              color: colors.primary,
              letterSpacing: "0.25em",
              animation: "pulse-danger 1s ease-in-out infinite",
            }}
          >
            SWITCHING TO {FACTION_LABELS[config.faction]}...
          </div>
          <div
            style={{
              width: "160px",
              height: "3px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "2px",
              overflow: "hidden",
              border: `1px solid ${colors.primary}40`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: colors.primary,
                animation: "charging-pulse 0.4s ease-in-out infinite",
                transformOrigin: "left",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-screen" style={{ background: "rgba(0,0,0,0.98)" }}>
      {/* CRT overlay */}
      <div className="crt-overlay" />
      <div className="vignette" />

      {/* Header */}
      <div
        style={{
          padding: "10px 14px 8px",
          borderBottom: `1px solid ${colors.primary}40`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "8px",
            color: colors.dim,
            letterSpacing: "0.3em",
            marginBottom: "6px",
          }}
        >
          H.E.V TACTICAL SYSTEM - INITIAL CONFIGURATION
        </div>
        {/* Step progress */}
        <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
          {Array.from({ length: effectiveTotal }).map((_, i) => {
            const s = i + 1;
            return (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: "3px",
                  borderRadius: "1px",
                  background:
                    s < step
                      ? colors.primary
                      : s === step
                        ? colors.accent
                        : `${colors.primary}30`,
                  transition: "background 0.2s",
                  boxShadow: s <= step ? `0 0 4px ${colors.primary}` : "none",
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "9px",
            color: colors.dim,
            letterSpacing: "0.15em",
          }}
        >
          STEP {step} / {effectiveTotal} — {stepTitle[step]}
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}>
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-6">
            <div
              style={{
                fontSize: "70px",
                color: colors.primary,
                textShadow: `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}60`,
                lineHeight: 1,
              }}
            >
              Λ
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: colors.primary,
                  letterSpacing: "0.2em",
                  marginBottom: "6px",
                }}
              >
                H.E.V TACTICAL HUD
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: colors.dim,
                  letterSpacing: "0.1em",
                  lineHeight: "1.6",
                }}
              >
                MARK V PROTECTIVE SYSTEMS
                <br />
                BLACK MESA RESEARCH FACILITY
              </div>
            </div>
            <div
              style={{
                fontSize: "10px",
                color: `${colors.primary}60`,
                letterSpacing: "0.15em",
                textAlign: "center",
                lineHeight: "1.7",
              }}
            >
              FIRST BOOT DETECTED.
              <br />
              CONFIGURATION REQUIRED.
            </div>
          </div>
        )}

        {/* Step 2: Faction */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
                marginBottom: "4px",
              }}
            >
              SELECT YOUR FACTION:
            </div>
            {(Object.values(Faction) as Faction[]).map((f) => {
              const fc = FACTION_COLORS[f];
              const isSelected = config.faction === f;
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => handleFactionSelect(f)}
                  data-ocid={`wizard.faction_${f}.button`}
                  className="wizard-card"
                  style={{
                    borderColor: isSelected ? fc.primary : `${fc.primary}40`,
                    boxShadow: isSelected
                      ? `0 0 10px ${fc.primary}80, inset 0 0 6px ${fc.primary}10`
                      : "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* Color swatch */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "4px",
                        background: fc.primary,
                        boxShadow: isSelected
                          ? `0 0 8px ${fc.primary}`
                          : "none",
                        flexShrink: 0,
                        border: `1px solid ${fc.primary}80`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: fc.bg === "#FFFFFF" ? "#000" : "#fff",
                      }}
                    >
                      Λ
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: isSelected ? fc.primary : `${fc.primary}80`,
                          letterSpacing: "0.12em",
                          textShadow: isSelected
                            ? `0 0 6px ${fc.primary}`
                            : "none",
                        }}
                      >
                        {FACTION_LABELS[f]}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          color: isSelected ? fc.dim : `${fc.dim}80`,
                          marginTop: "2px",
                          lineHeight: "1.4",
                        }}
                      >
                        {FACTION_DESCRIPTIONS[f]}
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          color: `${fc.primary}70`,
                          marginTop: "3px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        DESIGNATION: {FACTION_DESIGNATIONS[f]}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          marginLeft: "auto",
                          fontSize: "14px",
                          color: fc.primary,
                          textShadow: `0 0 6px ${fc.primary}`,
                        }}
                      >
                        ●
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3: Operator name */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
              }}
            >
              ENTER OPERATOR DESIGNATION:
            </div>
            <input
              className="hud-input"
              type="text"
              placeholder="OPERATIVE"
              value={nameInput}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={24}
              data-ocid="wizard.operator.input"
              style={{ borderColor: colors.primary, color: colors.primary }}
            />
            {nameInput.length === 0 && (
              <div
                style={{
                  fontSize: "9px",
                  color: `${colors.dim}90`,
                  letterSpacing: "0.1em",
                }}
              >
                LEAVE BLANK FOR DEFAULT: &quot;OPERATIVE&quot;
              </div>
            )}
            <div
              style={{
                fontSize: "9px",
                color: `${colors.primary}50`,
                border: `1px solid ${colors.primary}20`,
                borderRadius: "4px",
                padding: "8px",
                lineHeight: "1.6",
                letterSpacing: "0.08em",
              }}
            >
              <span style={{ color: colors.dim }}>HINT:</span> Try entering
              &apos;Gordon Freeman&apos;, &apos;Adrian Shephard&apos;, or
              &apos;Barney Calhoun&apos;
            </div>
            {easterEggHint && (
              <div
                style={{
                  fontSize: "10px",
                  color: colors.primary,
                  background: `${colors.primary}10`,
                  border: `1px solid ${colors.primary}40`,
                  borderRadius: "4px",
                  padding: "10px",
                  lineHeight: "1.6",
                  letterSpacing: "0.08em",
                  boxShadow: `0 0 8px ${colors.primary}30`,
                  animation: "fade-in 0.3s ease-out",
                }}
              >
                {easterEggHint}
              </div>
            )}
            <div
              style={{
                fontSize: "9px",
                color: `${colors.primary}60`,
                letterSpacing: "0.1em",
              }}
            >
              DESIGNATION PREVIEW: {FACTION_DESIGNATIONS[config.faction]}
            </div>
          </div>
        )}

        {/* Step 4: HUD Size */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
              }}
            >
              HUD DISPLAY SIZE:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "9px", color: colors.dim }}>80%</span>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min={80}
                  max={120}
                  value={Number(config.hudSize)}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hudSize: BigInt(e.target.value),
                    }))
                  }
                  data-ocid="wizard.hudsize.input"
                  style={{
                    width: "100%",
                    accentColor: colors.primary,
                    cursor: "pointer",
                  }}
                />
              </div>
              <span style={{ fontSize: "9px", color: colors.dim }}>120%</span>
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: "24px",
                color: colors.primary,
                textShadow: `0 0 8px ${colors.primary}`,
                letterSpacing: "0.1em",
              }}
            >
              {Number(config.hudSize)}%
            </div>

            {/* Live preview mini panel */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  transform: `scale(${Number(config.hudSize) / 100})`,
                  transformOrigin: "center top",
                  transition: "transform 0.2s ease",
                  width: "140px",
                }}
              >
                <div
                  style={{
                    border: `1px solid ${colors.primary}`,
                    borderRadius: "6px",
                    background: "rgba(14,10,4,0.95)",
                    padding: "8px",
                    boxShadow: `0 0 8px ${colors.primary}60`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "8px",
                      color: colors.dim,
                      letterSpacing: "0.15em",
                      marginBottom: "4px",
                    }}
                  >
                    HEALTH
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      color: colors.primary,
                      textShadow: `0 0 8px ${colors.primary}`,
                      lineHeight: 1,
                    }}
                  >
                    85
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: `${colors.primary}20`,
                      borderRadius: "2px",
                      marginTop: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "85%",
                        height: "100%",
                        background: colors.primary,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Visual effects */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
              }}
            >
              VISUAL EFFECTS:
            </div>
            {[
              {
                key: "crtFilter" as const,
                label: "CRT FILTER",
                desc: "Screen curvature & pixel effect",
              },
              {
                key: "scanlines" as const,
                label: "SCANLINES",
                desc: "Horizontal scan line overlay",
              },
              {
                key: "glowEffect" as const,
                label: "PANEL GLOW",
                desc: "Amber glow on all HUD panels",
              },
              {
                key: "glitchEffects" as const,
                label: "GLITCH FX",
                desc: "Random static bursts",
              },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: `1px solid ${colors.primary}30`,
                  borderRadius: "5px",
                  padding: "8px 10px",
                  background: `${colors.primary}06`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: colors.primary,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      color: colors.dim,
                      marginTop: "2px",
                    }}
                  >
                    {desc}
                  </div>
                </div>
                <Switch
                  checked={config[key]}
                  onCheckedChange={(v) =>
                    setConfig((prev) => ({ ...prev, [key]: v }))
                  }
                  className="hud-switch"
                  style={{
                    // @ts-ignore
                    "--switch-checked-bg": colors.primary,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 6: Game mode (HEV only) */}
        {step === 6 && config.faction === Faction.hev && (
          <div className="flex flex-col gap-4">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
              }}
            >
              SELECT GAME MODE:
            </div>
            {[
              {
                mode: GameMode.hl1,
                label: "HALF-LIFE 1",
                desc: "Classic arsenal. Long Jump Module available. No Vehicles tab.",
              },
              {
                mode: GameMode.hl2,
                label: "HALF-LIFE 2",
                desc: "HL2 weapons. Gravity Gun. Vehicles tab enabled.",
              },
            ].map(({ mode, label, desc }) => {
              const isSelected = config.gameMode === mode;
              return (
                <button
                  type="button"
                  key={mode}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, gameMode: mode }))
                  }
                  data-ocid={`wizard.gamemode_${mode}.button`}
                  style={{
                    border: `1px solid ${isSelected ? colors.primary : `${colors.primary}40`}`,
                    borderRadius: "6px",
                    background: isSelected
                      ? `${colors.primary}10`
                      : "rgba(14,10,4,0.8)",
                    padding: "12px",
                    cursor: "pointer",
                    boxShadow: isSelected
                      ? `0 0 8px ${colors.primary}50`
                      : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: isSelected
                        ? colors.primary
                        : `${colors.primary}80`,
                      letterSpacing: "0.15em",
                      textShadow: isSelected
                        ? `0 0 6px ${colors.primary}`
                        : "none",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: colors.dim,
                      marginTop: "4px",
                      lineHeight: "1.5",
                    }}
                  >
                    {desc}
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: colors.primary,
                        marginTop: "4px",
                      }}
                    >
                      &#9654; SELECTED
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 7: Tab navigation */}
        {step === 7 && (
          <div className="flex flex-col gap-4">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
              }}
            >
              TAB NAVIGATION STYLE:
            </div>
            {[
              {
                style: TabNavStyle.dropdown,
                label: "DROPDOWN",
                desc: "Hamburger button opens full-width dropdown list from top",
                illustration: (
                  <div
                    style={{
                      width: "80px",
                      border: `1px solid ${colors.primary}50`,
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "10px",
                        background: `${colors.primary}20`,
                        borderBottom: `1px solid ${colors.primary}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        padding: "0 4px",
                        gap: "2px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "6px",
                          background: `${colors.primary}80`,
                          borderRadius: "1px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "1px",
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              height: "1px",
                              background: colors.primary,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        background: `${colors.primary}15`,
                        borderBottom: `1px solid ${colors.primary}30`,
                      }}
                    >
                      {["BASICS", "TACTICAL", "MEDICAL"].map((t) => (
                        <div
                          key={t}
                          style={{
                            fontSize: "5px",
                            color: colors.dim,
                            padding: "2px 4px",
                            borderBottom: `1px solid ${colors.primary}15`,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        height: "28px",
                        padding: "4px",
                        background: "rgba(0,0,0,0.8)",
                      }}
                    >
                      <div style={{ fontSize: "5px", color: colors.dim }}>
                        CONTENT AREA
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                style: TabNavStyle.drawer,
                label: "DRAWER",
                desc: "Slide-out panel from left side with all tab options",
                illustration: (
                  <div
                    style={{
                      width: "80px",
                      height: "70px",
                      border: `1px solid ${colors.primary}50`,
                      borderRadius: "4px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        background: `${colors.primary}15`,
                        borderRight: `1px solid ${colors.primary}40`,
                      }}
                    >
                      {["BAS", "TAC", "MED", "INFO", "WPN"].map((t) => (
                        <div
                          key={t}
                          style={{
                            fontSize: "5px",
                            color: colors.dim,
                            padding: "3px 3px",
                            borderBottom: `1px solid ${colors.primary}15`,
                            letterSpacing: "0.03em",
                          }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "4px",
                        background: "rgba(0,0,0,0.8)",
                      }}
                    >
                      <div style={{ fontSize: "5px", color: colors.dim }}>
                        CONTENT
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map(({ style, label, desc, illustration }) => {
              const isSelected = config.tabNavStyle === style;
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, tabNavStyle: style }))
                  }
                  data-ocid={`wizard.nav_${style}.button`}
                  style={{
                    border: `1px solid ${isSelected ? colors.primary : `${colors.primary}40`}`,
                    borderRadius: "6px",
                    background: isSelected
                      ? `${colors.primary}08`
                      : "rgba(14,10,4,0.8)",
                    padding: "12px",
                    cursor: "pointer",
                    boxShadow: isSelected
                      ? `0 0 8px ${colors.primary}50`
                      : "none",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {illustration}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: isSelected
                          ? colors.primary
                          : `${colors.primary}80`,
                        letterSpacing: "0.15em",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        color: colors.dim,
                        marginTop: "4px",
                        lineHeight: "1.5",
                      }}
                    >
                      {desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 8: Confirm */}
        {step === 8 && (
          <div className="flex flex-col gap-3">
            <div
              style={{
                fontSize: "10px",
                color: colors.dim,
                letterSpacing: "0.12em",
                marginBottom: "4px",
              }}
            >
              CONFIGURATION SUMMARY:
            </div>
            {[
              { label: "FACTION", value: FACTION_LABELS[config.faction] },
              {
                label: "OPERATOR",
                value: (nameInput.trim() || "OPERATIVE").toUpperCase(),
              },
              {
                label: "DESIGNATION",
                value: FACTION_DESIGNATIONS[config.faction],
              },
              { label: "HUD SIZE", value: `${Number(config.hudSize)}%` },
              {
                label: "GAME MODE",
                value:
                  config.faction === Faction.hev
                    ? config.gameMode.toUpperCase()
                    : "N/A",
              },
              { label: "NAV STYLE", value: config.tabNavStyle.toUpperCase() },
              {
                label: "EFFECTS",
                value:
                  [
                    config.crtFilter ? "CRT" : "",
                    config.scanlines ? "SCAN" : "",
                    config.glowEffect ? "GLOW" : "",
                    config.glitchEffects ? "GLITCH" : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "NONE",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: `1px solid ${colors.primary}20`,
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    color: colors.dim,
                    letterSpacing: "0.12em",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: colors.primary,
                    letterSpacing: "0.1em",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: "8px",
                fontSize: "9px",
                color: `${colors.primary}50`,
                letterSpacing: "0.1em",
                textAlign: "center",
                lineHeight: "1.6",
              }}
            >
              SETTINGS WILL BE SAVED TO DEVICE AND BACKEND.
              <br />
              RECONFIGURE ANYTIME VIA /SETUP_WIZARD COMMAND.
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${colors.primary}30`,
          display: "flex",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            data-ocid="wizard.back_button"
            style={{
              flex: 1,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: `${colors.primary}80`,
              border: `1px solid ${colors.primary}40`,
              background: "transparent",
              borderRadius: "4px",
              padding: "10px",
              cursor: "pointer",
              minHeight: "40px",
            }}
          >
            &#9668; BACK
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            data-ocid="wizard.next_button"
            style={{
              flex: 2,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: colors.bg === "#FFFFFF" ? "#000" : "#000",
              border: `1px solid ${colors.primary}`,
              background: colors.primary,
              borderRadius: "4px",
              padding: "10px",
              cursor: "pointer",
              minHeight: "40px",
              boxShadow: `0 0 8px ${colors.primary}60`,
            }}
          >
            NEXT &#9658;
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            data-ocid="wizard.initialize.button"
            style={{
              flex: 2,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "#000",
              border: `1px solid ${colors.primary}`,
              background: colors.primary,
              borderRadius: "4px",
              padding: "10px",
              cursor: "pointer",
              minHeight: "40px",
              boxShadow: `0 0 12px ${colors.primary}80`,
              animation: "glow-pulse 2s ease-in-out infinite",
            }}
          >
            INITIALIZE HUD
          </button>
        )}
      </div>
    </div>
  );
}
