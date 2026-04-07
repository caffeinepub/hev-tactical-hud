import React, { useEffect, useState, useRef, useCallback } from "react";

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  "BLACK MESA H.E.V SYSTEM v5.0",
  "INITIALIZING H.E.V SYSTEMS...",
  "LOADING FACTION DATA...",
  "CALIBRATING SENSORS...",
  "CONNECTING TO NETWORK...",
  "SYSTEM CHECK: PASSED",
];

const HEV_VOICE_LINES = [
  "Welcome to the H.E.V mark 5 protective systems prototype.",
  "Initialization procedures active.",
  "Comms. Active.",
  "Advanced medical systems. Active.",
  "Advanced weaponry systems engaged.",
  "Vital signs Activated.",
  "Tactical engagement systems Activated.",
  "Environmental hazard and informational tabs Activated.",
  "Power and health monitoring systems Activated.",
  "Boot up sequence finished.",
  "Have a very safe day.",
];

type Phase = 1 | 2 | 3 | 4 | 5;

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<Phase>(1);
  const [showSkip, setShowSkip] = useState(false);
  const [lambdaVisible, setLambdaVisible] = useState(false);
  const [crtExpanding, setCrtExpanding] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [currentTypingLine, setCurrentTypingLine] = useState("");
  const [voiceLineIndex, setVoiceLineIndex] = useState(0);
  const [_currentVoiceLine, setCurrentVoiceLine] = useState("");
  const [fadeOut, setFadeOut] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootLineIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const complete = useCallback(() => {
    setFadeOut(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    phaseTimerRef.current = setTimeout(onComplete, 600);
  }, [onComplete]);

  // Show skip button after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Phase 1: Lambda appears
  useEffect(() => {
    if (phase !== 1) return;
    const t = setTimeout(() => setLambdaVisible(true), 200);
    phaseTimerRef.current = setTimeout(() => setPhase(2), 2000);
    return () => {
      clearTimeout(t);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase]);

  // Phase 2: CRT expand
  useEffect(() => {
    if (phase !== 2) return;
    setCrtExpanding(true);
    phaseTimerRef.current = setTimeout(() => setPhase(3), 2000);
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase]);

  // Phase 3: Typewriter boot lines
  useEffect(() => {
    if (phase !== 3) return;
    bootLineIndexRef.current = 0;
    charIndexRef.current = 0;
    setBootLines([]);
    setCurrentTypingLine("");

    function typeNextChar() {
      const lineIdx = bootLineIndexRef.current;
      if (lineIdx >= BOOT_LINES.length) {
        phaseTimerRef.current = setTimeout(() => setPhase(4), 400);
        return;
      }
      const line = BOOT_LINES[lineIdx];
      const charIdx = charIndexRef.current;
      if (charIdx < line.length) {
        setCurrentTypingLine(line.slice(0, charIdx + 1));
        charIndexRef.current++;
        typeTimerRef.current = setTimeout(typeNextChar, 30);
      } else {
        // Finish this line, start next
        setBootLines((prev) => [...prev, line]);
        setCurrentTypingLine("");
        bootLineIndexRef.current++;
        charIndexRef.current = 0;
        typeTimerRef.current = setTimeout(typeNextChar, 120);
      }
    }

    typeTimerRef.current = setTimeout(typeNextChar, 300);
    return () => {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase]);

  // Phase 4: HEV voice
  useEffect(() => {
    if (phase !== 4) return;
    setVoiceLineIndex(0);
    setCurrentVoiceLine("");

    let lineIdx = 0;
    let cancelled = false;

    function speakLine(idx: number) {
      if (cancelled || idx >= HEV_VOICE_LINES.length) {
        if (!cancelled) {
          phaseTimerRef.current = setTimeout(() => setPhase(5), 400);
        }
        return;
      }
      const text = HEV_VOICE_LINES[idx];
      setVoiceLineIndex(idx);
      setCurrentVoiceLine(text);

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        synthRef.current = utt;
        utt.rate = 0.88;
        utt.pitch = 0.9;
        utt.volume = 0.9;
        utt.lang = "en-US";

        // Choose female voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice =
          voices.find((v) => v.name.toLowerCase().includes("female")) ||
          voices.find((v) => v.name.toLowerCase().includes("samantha")) ||
          voices.find((v) => v.name.toLowerCase().includes("zira")) ||
          voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
          voices[1] ||
          null;
        if (femaleVoice) utt.voice = femaleVoice;

        utt.onend = () => {
          if (!cancelled) {
            lineIdx++;
            setTimeout(() => speakLine(lineIdx), 200);
          }
        };
        utt.onerror = () => {
          if (!cancelled) {
            lineIdx++;
            setTimeout(() => speakLine(lineIdx), 300);
          }
        };
        window.speechSynthesis.speak(utt);
      } else {
        // No speech API - just show text with delay
        typeTimerRef.current = setTimeout(() => {
          if (!cancelled) {
            lineIdx++;
            speakLine(lineIdx);
          }
        }, 800);
      }
    }

    // Wait for voices to load
    if (window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) {
        speakLine(0);
      } else {
        window.speechSynthesis.addEventListener(
          "voiceschanged",
          () => speakLine(0),
          { once: true },
        );
        // Fallback if voices never load
        typeTimerRef.current = setTimeout(() => speakLine(0), 500);
      }
    } else {
      speakLine(0);
    }

    return () => {
      cancelled = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase]);

  // Phase 5: Fade to HUD
  useEffect(() => {
    if (phase !== 5) return;
    phaseTimerRef.current = setTimeout(complete, 800);
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase, complete]);

  return (
    <div
      className={`boot-screen transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
    >
      {/* Phase 1: Lambda symbol */}
      {phase === 1 && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div
            className={`lambda-glyph transition-all duration-300 ${
              lambdaVisible ? "animate-lambda-appear" : "opacity-0"
            }`}
          >
            Λ
          </div>
          <div
            className={`text-xs tracking-widest transition-opacity duration-700 ${
              lambdaVisible ? "opacity-60" : "opacity-0"
            }`}
            style={{ color: "var(--hud-dim)", letterSpacing: "0.3em" }}
          >
            BLACK MESA RESEARCH FACILITY
          </div>
        </div>
      )}

      {/* Phase 2: CRT expand */}
      {phase === 2 && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className="absolute"
            style={{
              top: "50%",
              left: 0,
              right: 0,
              height: "2px",
              background: "rgba(255,255,255,0.95)",
              boxShadow:
                "0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(255,200,100,0.4)",
              animation: crtExpanding
                ? "crt-expand 1.8s ease-in-out forwards"
                : "none",
              transformOrigin: "center center",
            }}
          />
          <div
            className="animate-flicker absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,140,0,0.02) 3px, rgba(255,140,0,0.02) 4px)",
            }}
          />
        </div>
      )}

      {/* Phase 3: Boot text */}
      {phase === 3 && (
        <div className="w-full px-6" style={{ maxWidth: "360px" }}>
          <div
            className="text-xs mb-4"
            style={{
              color: "var(--hud-dim)",
              letterSpacing: "0.2em",
              borderBottom: "1px solid rgba(255,140,0,0.2)",
              paddingBottom: "6px",
            }}
          >
            H.E.V BOOT SEQUENCE
          </div>
          <div className="terminal-text">
            {bootLines.map((line, i) => (
              <div
                key={line}
                className="terminal-line animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span style={{ color: "var(--hud-dim)" }}>&#62; </span>
                {line}
              </div>
            ))}
            {currentTypingLine && (
              <div className="terminal-line">
                <span style={{ color: "var(--hud-dim)" }}>&#62; </span>
                {currentTypingLine}
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "12px",
                    background: "var(--hud-primary)",
                    marginLeft: "2px",
                    verticalAlign: "text-bottom",
                    animation: "pulse-danger 0.6s ease-in-out infinite",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 4: Voice lines */}
      {phase === 4 && (
        <div
          className="w-full px-6 flex flex-col gap-3"
          style={{ maxWidth: "360px" }}
        >
          <div
            className="text-xs mb-2"
            style={{
              color: "var(--hud-dim)",
              letterSpacing: "0.2em",
              borderBottom: "1px solid rgba(255,140,0,0.2)",
              paddingBottom: "6px",
            }}
          >
            H.E.V VOICE SYSTEM
          </div>
          {HEV_VOICE_LINES.map((line, i) => (
            <div
              key={line}
              className="terminal-line transition-all duration-200"
              style={{
                opacity:
                  i === voiceLineIndex ? 1 : i < voiceLineIndex ? 0.35 : 0.15,
                color:
                  i === voiceLineIndex
                    ? "var(--hud-primary)"
                    : "var(--hud-dim)",
                fontSize: i === voiceLineIndex ? "12px" : "10px",
                textShadow:
                  i === voiceLineIndex ? "0 0 8px var(--hud-primary)" : "none",
                transform: i === voiceLineIndex ? "translateX(4px)" : "none",
              }}
            >
              {i < voiceLineIndex && (
                <span style={{ marginRight: "6px" }}>&#10003;</span>
              )}
              {i === voiceLineIndex && (
                <span
                  style={{
                    marginRight: "6px",
                    animation: "charging-pulse 0.8s ease-in-out infinite",
                    display: "inline-block",
                  }}
                >
                  &#9658;
                </span>
              )}
              {line}
            </div>
          ))}
          <div
            style={{
              marginTop: "8px",
              fontSize: "9px",
              color: "rgba(255,140,0,0.4)",
              letterSpacing: "0.15em",
            }}
          >
            VOICE LINE {voiceLineIndex + 1}/{HEV_VOICE_LINES.length}
          </div>
        </div>
      )}

      {/* Phase 5: Fade transition */}
      {phase === 5 && (
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className="lambda-glyph"
            style={{ fontSize: "40px", opacity: 0.6 }}
          >
            Λ
          </div>
          <div
            className="text-xs tracking-widest"
            style={{ color: "var(--hud-dim)", letterSpacing: "0.3em" }}
          >
            SYSTEMS ONLINE
          </div>
        </div>
      )}

      {/* Skip button */}
      {showSkip && (
        <button
          type="button"
          onClick={complete}
          data-ocid="boot.skip_button"
          className="absolute"
          style={{
            bottom: "20px",
            right: "16px",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "rgba(255,140,0,0.45)",
            border: "1px solid rgba(255,140,0,0.25)",
            background: "transparent",
            padding: "4px 10px",
            cursor: "pointer",
            borderRadius: "3px",
            fontFamily: "'Share Tech Mono', monospace",
            minHeight: "28px",
          }}
        >
          SKIP
        </button>
      )}

      {/* Version watermark */}
      <div
        className="absolute"
        style={{
          bottom: "8px",
          left: "12px",
          fontSize: "8px",
          color: "rgba(255,140,0,0.2)",
          letterSpacing: "0.1em",
        }}
      >
        H.E.V v5.0 © BLACK MESA
      </div>
    </div>
  );
}
