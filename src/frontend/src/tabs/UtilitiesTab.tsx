import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHUD } from "../context/HUDContext";
import { useActor } from "../hooks/useActor";

type EquipmentKey =
  | "flashlight"
  | "respirator"
  | "longJumpModule"
  | "hudDisplay"
  | "helmet"
  | "enhancedBioMonitoring"
  | "advancedMedical";

const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  flashlight: "FLASHLIGHT",
  respirator: "RESPIRATOR",
  longJumpModule: "LONG JUMP MODULE",
  hudDisplay: "HUD DISPLAY",
  helmet: "HELMET",
  enhancedBioMonitoring: "BIO MONITORING",
  advancedMedical: "ADV MEDICAL",
};

const EQUIPMENT_ICONS: Record<EquipmentKey, string> = {
  flashlight: "★",
  respirator: "□",
  longJumpModule: "▲",
  hudDisplay: "H",
  helmet: "●",
  enhancedBioMonitoring: "♥",
  advancedMedical: "✚",
};

type Track = {
  name: string;
  buffer: ArrayBuffer;
};

const DB_NAME = "hev_music";
const STORE_NAME = "tracks";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "name" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveTracks(files: File[]): Promise<void> {
  const db = await openDB();
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ name: file.name, buffer: buf });
  }
}

async function loadTracks(): Promise<Track[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as Track[]);
    req.onerror = () => resolve([]);
  });
}

async function deleteTrack(name: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(name);
}

export default function UtilitiesTab() {
  const { factionColors, settings, addLogEntry, triggerPanic } = useHUD();
  const { actor } = useActor();
  const colors = factionColors;

  // Equipment
  const [toggles, setToggles] = useState({
    flashlight: false,
    respirator: false,
    longJumpModule: false,
    hudDisplay: true,
    helmet: true,
    enhancedBioMonitoring: false,
    advancedMedical: false,
  });

  // Music
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  // Ambient
  const [ambientOn, setAmbientOn] = useState(false);
  const [ambientVol, setAmbientVol] = useState(0.15);
  const ambientCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // Load toggles from backend
  useEffect(() => {
    if (actor) {
      actor
        .getToggles()
        .then((t) => setToggles((prev) => ({ ...prev, ...t })))
        .catch(() => {});
    }
  }, [actor]);

  // Load tracks from IndexedDB
  useEffect(() => {
    loadTracks()
      .then(setTracks)
      .catch(() => {});
  }, []);

  // Audio volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleToggle = useCallback(
    async (key: EquipmentKey) => {
      const next = !toggles[key];
      setToggles((prev) => ({ ...prev, [key]: next }));
      addLogEntry(
        `EQUIPMENT: ${EQUIPMENT_LABELS[key]} ${next ? "ON" : "OFF"}`,
        "info",
      );
      if (actor) {
        try {
          await actor.saveToggle(key, next);
        } catch {
          /* offline */
        }
      }
    },
    [toggles, actor, addLogEntry],
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      await saveTracks(files);
      const updated = await loadTracks();
      setTracks(updated);
      addLogEntry(`MUSIC: ${files.length} TRACK(S) UPLOADED`, "info");
      e.target.value = "";
    },
    [addLogEntry],
  );

  const playTrack = useCallback(
    (name: string, buffer: ArrayBuffer) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      const audio = new Audio(url);
      audio.volume = volume;
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      setCurrentTrack(name);
      addLogEntry(`MUSIC: PLAYING ${name}`, "info");
    },
    [volume, addLogEntry],
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.name === currentTrack);
    const next = tracks[(idx + 1) % tracks.length];
    playTrack(next.name, next.buffer);
  }, [tracks, currentTrack, playTrack]);

  const prevTrack = useCallback(() => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.name === currentTrack);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    playTrack(prev.name, prev.buffer);
  }, [tracks, currentTrack, playTrack]);

  const handleDeleteTrack = useCallback(
    async (name: string) => {
      await deleteTrack(name);
      const updated = await loadTracks();
      setTracks(updated);
      if (currentTrack === name) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setCurrentTrack(null);
      }
    },
    [currentTrack],
  );

  // Ambient sound
  const toggleAmbient = useCallback(() => {
    if (!ambientOn) {
      const ctx = new AudioContext();
      ambientCtxRef.current = ctx;

      // Low hum oscillator
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 60;

      const gain = ctx.createGain();
      gain.gain.value = ambientVol * 0.3;

      // Noise
      const bufLen = ctx.sampleRate * 2;
      const nBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = nBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;
      nSrc.loop = true;

      const nGain = ctx.createGain();
      nGain.gain.value = ambientVol * 0.05;

      osc.connect(gain);
      gain.connect(ctx.destination);
      nSrc.connect(nGain);
      nGain.connect(ctx.destination);

      osc.start();
      nSrc.start();

      ambientNodeRef.current = osc;
      ambientGainRef.current = gain;
      setAmbientOn(true);
      addLogEntry("AMBIENT: HEV HUM ACTIVATED", "info");
    } else {
      try {
        ambientNodeRef.current?.stop();
        ambientCtxRef.current?.close();
      } catch {
        /* ignore */
      }
      ambientNodeRef.current = null;
      ambientCtxRef.current = null;
      setAmbientOn(false);
      addLogEntry("AMBIENT: HEV HUM DEACTIVATED", "info");
    }
  }, [ambientOn, ambientVol, addLogEntry]);

  useEffect(() => {
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.value = ambientVol * 0.3;
    }
  }, [ambientVol]);

  const panelStyle = {
    border: `1px solid ${colors.primary}`,
    borderRadius: "5px",
    background: "rgba(14, 10, 4, 0.92)",
    padding: "6px",
    boxShadow: settings.glowEffect ? `0 0 6px ${colors.primary}40` : "none",
  };

  const btnStyle = (active?: boolean) => ({
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "8px",
    padding: "3px 8px",
    background: active ? `${colors.primary}25` : `${colors.primary}08`,
    border: `1px solid ${active ? colors.primary : `${colors.primary}40`}`,
    color: active ? colors.primary : `${colors.primary}70`,
    borderRadius: "3px",
    cursor: "pointer",
    letterSpacing: "0.08em",
    transition: "all 0.15s",
  });

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
      data-ocid="utilities.section"
    >
      {/* Equipment Toggles */}
      <div style={panelStyle} data-ocid="utilities.equipment.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.2em",
            marginBottom: "5px",
          }}
        >
          EQUIPMENT STATUS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3px",
          }}
        >
          {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              data-ocid={`utilities.equipment.toggle.${i + 1}`}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 6px",
                background: toggles[key]
                  ? `${colors.primary}15`
                  : "rgba(0,0,0,0.4)",
                border: `1px solid ${toggles[key] ? colors.primary : `${colors.primary}25`}`,
                color: toggles[key] ? colors.primary : `${colors.primary}50`,
                borderRadius: "3px",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "10px" }}>{EQUIPMENT_ICONS[key]}</span>
              <div>
                <div style={{ fontSize: "7px", letterSpacing: "0.08em" }}>
                  {EQUIPMENT_LABELS[key]}
                </div>
                <div
                  style={{
                    fontSize: "6px",
                    color: toggles[key] ? "#44cc44" : `${colors.dim}60`,
                  }}
                >
                  {toggles[key] ? "ACTIVE" : "OFFLINE"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Music Player */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="utilities.music.panel"
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
          AUDIO SYSTEM
        </div>

        {/* Now playing */}
        {currentTrack && (
          <div
            style={{
              flexShrink: 0,
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
              {isPlaying &&
                [0, 1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    style={{
                      width: "3px",
                      background: colors.primary,
                      borderRadius: "1px",
                      animation: `eq-bar-${bar} ${0.4 + bar * 0.1}s ease-in-out infinite alternate`,
                      height: `${6 + bar * 2}px`,
                    }}
                  />
                ))}
            </div>
            <div
              style={{
                flex: 1,
                fontSize: "8px",
                color: colors.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentTrack.replace(/\.[^.]+$/, "").toUpperCase()}
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            gap: "4px",
            marginBottom: "4px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={prevTrack}
            data-ocid="utilities.music.prev.button"
            style={btnStyle()}
          >
            ◄
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!currentTrack && !tracks.length}
            data-ocid="utilities.music.play.button"
            style={btnStyle(isPlaying)}
          >
            {isPlaying ? "■" : "►"}
          </button>
          <button
            type="button"
            onClick={nextTrack}
            data-ocid="utilities.music.next.button"
            style={btnStyle()}
          >
            ►►
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            data-ocid="utilities.music.volume.select"
            style={{ flex: 1, accentColor: colors.primary }}
          />
          <span style={{ fontSize: "8px", color: colors.dim }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Track list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tracks.length === 0 && (
            <div
              style={{
                fontSize: "8px",
                color: `${colors.dim}60`,
                textAlign: "center",
                padding: "8px",
              }}
              data-ocid="utilities.music.empty_state"
            >
              NO TRACKS LOADED
            </div>
          )}
          {tracks.map((t, i) => (
            <button
              type="button"
              key={t.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px",
                borderRadius: "3px",
                background:
                  currentTrack === t.name
                    ? `${colors.primary}12`
                    : "transparent",
                border:
                  currentTrack === t.name
                    ? `1px solid ${colors.primary}30`
                    : "1px solid transparent",
                marginBottom: "2px",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              }}
              onClick={() => playTrack(t.name, t.buffer)}
              data-ocid={`utilities.music.item.${i + 1}`}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: currentTrack === t.name ? colors.primary : colors.dim,
                }}
              >
                {currentTrack === t.name && isPlaying ? "►" : "□"}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: "8px",
                  color: colors.dim,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.name.replace(/\.[^.]+$/, "").toUpperCase()}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTrack(t.name);
                }}
                data-ocid={`utilities.music.delete_button.${i + 1}`}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "7px",
                  padding: "1px 4px",
                  background: "rgba(255,68,68,0.08)",
                  border: "1px solid #ff444430",
                  color: "#ff444480",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </button>
          ))}
        </div>

        {/* Upload */}
        <label
          data-ocid="utilities.music.upload_button"
          style={{
            display: "block",
            flexShrink: 0,
            marginTop: "4px",
            padding: "5px",
            background: `${colors.primary}08`,
            border: `1px dashed ${colors.primary}40`,
            borderRadius: "3px",
            fontSize: "8px",
            color: colors.dim,
            textAlign: "center",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          + UPLOAD TRACKS (MP3)
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Ambient sound */}
      <div
        style={{
          ...panelStyle,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        data-ocid="utilities.ambient.panel"
      >
        <span
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            flex: 1,
          }}
        >
          HEV AMBIENT HUM
        </span>
        <input
          type="range"
          min={0.01}
          max={0.5}
          step={0.01}
          value={ambientVol}
          onChange={(e) => setAmbientVol(Number(e.target.value))}
          data-ocid="utilities.ambient.volume.select"
          style={{ width: "60px", accentColor: colors.primary }}
        />
        <button
          type="button"
          onClick={toggleAmbient}
          data-ocid="utilities.ambient.toggle"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "8px",
            padding: "3px 8px",
            background: ambientOn
              ? `${colors.primary}25`
              : `${colors.primary}08`,
            border: `1px solid ${ambientOn ? colors.primary : `${colors.primary}40`}`,
            color: ambientOn ? colors.primary : `${colors.primary}60`,
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {ambientOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* Panic button */}
      <button
        type="button"
        onClick={() => {
          triggerPanic();
          addLogEntry("PANIC: CRITICAL FAILURE SEQUENCE INITIATED", "error");
        }}
        data-ocid="utilities.panic.button"
        style={{
          flexShrink: 0,
          width: "100%",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.15em",
          padding: "7px",
          background: "rgba(255,0,0,0.12)",
          border: "2px solid #ff000050",
          color: "#ff4444",
          borderRadius: "4px",
          cursor: "pointer",
          textShadow: "0 0 8px #ff4444",
          transition: "all 0.2s",
        }}
      >
        ⚠ INITIATE CRITICAL FAILURE SEQUENCE
      </button>
    </div>
  );
}
