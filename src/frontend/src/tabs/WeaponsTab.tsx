import React, { useState, useCallback, useEffect } from "react";
import { Faction, GameMode } from "../backend";
import { useHUD } from "../context/HUDContext";
import { useActor } from "../hooks/useActor";

type Weapon = {
  id: string;
  name: string;
  icon: string;
  clip: number;
  maxClip: number;
  reserve: number;
  maxReserve: number;
  damage: number;
  rof: number;
  accuracy: number;
};

const HEV_WEAPONS: Weapon[] = [
  {
    id: "crowbar",
    name: "CROWBAR",
    icon: "Л",
    clip: 1,
    maxClip: 1,
    reserve: 999,
    maxReserve: 999,
    damage: 35,
    rof: 40,
    accuracy: 100,
  },
  {
    id: "glock17",
    name: "GLOCK 17",
    icon: "•",
    clip: 17,
    maxClip: 17,
    reserve: 85,
    maxReserve: 170,
    damage: 18,
    rof: 75,
    accuracy: 82,
  },
  {
    id: "spas12",
    name: "SPAS-12",
    icon: "■",
    clip: 8,
    maxClip: 8,
    reserve: 32,
    maxReserve: 64,
    damage: 80,
    rof: 30,
    accuracy: 60,
  },
  {
    id: "mp5",
    name: "MP5",
    icon: "≡",
    clip: 30,
    maxClip: 30,
    reserve: 120,
    maxReserve: 240,
    damage: 22,
    rof: 90,
    accuracy: 78,
  },
  {
    id: "crossbow",
    name: "CROSSBOW",
    icon: "†",
    clip: 1,
    maxClip: 1,
    reserve: 5,
    maxReserve: 10,
    damage: 100,
    rof: 20,
    accuracy: 98,
  },
  {
    id: "rpg7",
    name: "RPG-7",
    icon: "▲",
    clip: 1,
    maxClip: 1,
    reserve: 3,
    maxReserve: 5,
    damage: 200,
    rof: 15,
    accuracy: 75,
  },
  {
    id: "taucannon",
    name: "TAU CANNON",
    icon: "τ",
    clip: 100,
    maxClip: 100,
    reserve: 0,
    maxReserve: 0,
    damage: 150,
    rof: 60,
    accuracy: 95,
  },
  {
    id: "gluongun",
    name: "GLUON GUN",
    icon: "β",
    clip: 200,
    maxClip: 200,
    reserve: 0,
    maxReserve: 0,
    damage: 300,
    rof: 100,
    accuracy: 100,
  },
  {
    id: "grenade",
    name: "FRAG GRENADE",
    icon: "●",
    clip: 5,
    maxClip: 5,
    reserve: 5,
    maxReserve: 10,
    damage: 150,
    rof: 25,
    accuracy: 70,
  },
  {
    id: "satchel",
    name: "SATCHEL",
    icon: "□",
    clip: 3,
    maxClip: 3,
    reserve: 3,
    maxReserve: 5,
    damage: 200,
    rof: 20,
    accuracy: 85,
  },
  {
    id: "tripmine",
    name: "TRIPMINE",
    icon: "T",
    clip: 3,
    maxClip: 3,
    reserve: 2,
    maxReserve: 5,
    damage: 180,
    rof: 10,
    accuracy: 100,
  },
  {
    id: "snark",
    name: "SNARK",
    icon: "S",
    clip: 5,
    maxClip: 5,
    reserve: 10,
    maxReserve: 15,
    damage: 60,
    rof: 50,
    accuracy: 40,
  },
];

const HECU_WEAPONS: Weapon[] = [
  {
    id: "m16a2",
    name: "M16A2",
    icon: "≡",
    clip: 30,
    maxClip: 30,
    reserve: 120,
    maxReserve: 300,
    damage: 35,
    rof: 88,
    accuracy: 85,
  },
  {
    id: "m9",
    name: "M9 PISTOL",
    icon: "•",
    clip: 15,
    maxClip: 15,
    reserve: 75,
    maxReserve: 150,
    damage: 20,
    rof: 65,
    accuracy: 80,
  },
  {
    id: "spas12h",
    name: "SPAS-12",
    icon: "■",
    clip: 8,
    maxClip: 8,
    reserve: 32,
    maxReserve: 64,
    damage: 80,
    rof: 30,
    accuracy: 60,
  },
  {
    id: "m249",
    name: "M249 SAW",
    icon: "≡",
    clip: 100,
    maxClip: 100,
    reserve: 200,
    maxReserve: 400,
    damage: 30,
    rof: 95,
    accuracy: 72,
  },
  {
    id: "m203",
    name: "M203 GL",
    icon: "▲",
    clip: 1,
    maxClip: 1,
    reserve: 6,
    maxReserve: 12,
    damage: 175,
    rof: 18,
    accuracy: 80,
  },
  {
    id: "m67",
    name: "M67 FRAG",
    icon: "●",
    clip: 4,
    maxClip: 4,
    reserve: 4,
    maxReserve: 8,
    damage: 150,
    rof: 22,
    accuracy: 65,
  },
  {
    id: "m84",
    name: "M84 FLASHBANG",
    icon: "○",
    clip: 3,
    maxClip: 3,
    reserve: 3,
    maxReserve: 6,
    damage: 0,
    rof: 20,
    accuracy: 85,
  },
  {
    id: "knife",
    name: "COMBAT KNIFE",
    icon: "†",
    clip: 1,
    maxClip: 1,
    reserve: 999,
    maxReserve: 999,
    damage: 45,
    rof: 55,
    accuracy: 100,
  },
];

const SECURITY_WEAPONS: Weapon[] = [
  {
    id: "9mm",
    name: "9MM PISTOL",
    icon: "•",
    clip: 15,
    maxClip: 15,
    reserve: 60,
    maxReserve: 120,
    damage: 18,
    rof: 60,
    accuracy: 78,
  },
  {
    id: "rem870",
    name: "REMINGTON 870",
    icon: "■",
    clip: 5,
    maxClip: 5,
    reserve: 20,
    maxReserve: 40,
    damage: 85,
    rof: 25,
    accuracy: 55,
  },
  {
    id: "baton",
    name: "STUN BATON",
    icon: "|",
    clip: 1,
    maxClip: 1,
    reserve: 999,
    maxReserve: 999,
    damage: 25,
    rof: 45,
    accuracy: 100,
  },
  {
    id: "pepper",
    name: "PEPPER SPRAY",
    icon: "□",
    clip: 8,
    maxClip: 8,
    reserve: 2,
    maxReserve: 3,
    damage: 10,
    rof: 70,
    accuracy: 90,
  },
];

const COMBINE_WEAPONS: Weapon[] = [
  {
    id: "ar2",
    name: "AR2",
    icon: "≡",
    clip: 30,
    maxClip: 30,
    reserve: 120,
    maxReserve: 240,
    damage: 42,
    rof: 82,
    accuracy: 88,
  },
  {
    id: "usp",
    name: "USP MATCH",
    icon: "•",
    clip: 18,
    maxClip: 18,
    reserve: 90,
    maxReserve: 180,
    damage: 22,
    rof: 68,
    accuracy: 84,
  },
  {
    id: "smg1",
    name: "SMG1",
    icon: "≈",
    clip: 45,
    maxClip: 45,
    reserve: 180,
    maxReserve: 360,
    damage: 18,
    rof: 92,
    accuracy: 72,
  },
  {
    id: "357",
    name: ".357 MAGNUM",
    icon: "•",
    clip: 6,
    maxClip: 6,
    reserve: 12,
    maxReserve: 36,
    damage: 90,
    rof: 35,
    accuracy: 95,
  },
  {
    id: "xcrossbow",
    name: "CROSSBOW",
    icon: "†",
    clip: 1,
    maxClip: 1,
    reserve: 5,
    maxReserve: 10,
    damage: 100,
    rof: 18,
    accuracy: 98,
  },
  {
    id: "xrpg",
    name: "RPG",
    icon: "▲",
    clip: 1,
    maxClip: 1,
    reserve: 3,
    maxReserve: 5,
    damage: 220,
    rof: 12,
    accuracy: 78,
  },
  {
    id: "grav",
    name: "GRAVITY GUN",
    icon: "Φ",
    clip: 1,
    maxClip: 1,
    reserve: 999,
    maxReserve: 999,
    damage: 50,
    rof: 30,
    accuracy: 80,
  },
  {
    id: "orb",
    name: "ORB CHARGE",
    icon: "○",
    clip: 3,
    maxClip: 3,
    reserve: 3,
    maxReserve: 5,
    damage: 180,
    rof: 20,
    accuracy: 88,
  },
  {
    id: "ball",
    name: "COMBINE BALL",
    icon: "Ω",
    clip: 3,
    maxClip: 3,
    reserve: 6,
    maxReserve: 9,
    damage: 250,
    rof: 15,
    accuracy: 92,
  },
];

function getWeapons(faction: Faction): Weapon[] {
  switch (faction) {
    case Faction.hecu:
      return HECU_WEAPONS;
    case Faction.security:
      return SECURITY_WEAPONS;
    case Faction.combine:
      return COMBINE_WEAPONS;
    default:
      return HEV_WEAPONS;
  }
}

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        height: "3px",
        background: `${color}20`,
        borderRadius: "1px",
        overflow: "hidden",
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          borderRadius: "1px",
        }}
      />
    </div>
  );
}

export default function WeaponsTab() {
  const { factionColors, settings, addLogEntry } = useHUD();
  const { actor } = useActor();
  const colors = factionColors;

  const [weapons, setWeapons] = useState<Weapon[]>(() =>
    getWeapons(settings.faction),
  );
  const [equipped, setEquipped] = useState<Set<string>>(
    new Set(["crowbar", "glock17", "mp5"]),
  );
  const [loadouts, setLoadouts] = useState<
    Array<{ name: string; weaponIds: string[] }>
  >([]);
  const [loadoutName, setLoadoutName] = useState("");
  const [saving, setSaving] = useState(false);

  // Load faction weapons
  useEffect(() => {
    setWeapons(getWeapons(settings.faction));
    setEquipped(new Set());
  }, [settings.faction]);

  // Load loadouts from backend
  useEffect(() => {
    if (actor) {
      actor
        .getLoadouts()
        .then((l) => setLoadouts(l))
        .catch(() => {});
    }
  }, [actor]);

  const toggleEquip = useCallback(
    (id: string) => {
      setEquipped((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          addLogEntry(`WEAPON UNEQUIPPED: ${id.toUpperCase()}`, "info");
        } else {
          next.add(id);
          addLogEntry(`WEAPON EQUIPPED: ${id.toUpperCase()}`, "info");
        }
        return next;
      });
    },
    [addLogEntry],
  );

  const adjustAmmo = useCallback(
    (id: string, field: "clip" | "reserve", delta: number) => {
      setWeapons((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                [field]: Math.max(
                  0,
                  Math.min(
                    field === "clip" ? w.maxClip : w.maxReserve,
                    w[field] + delta,
                  ),
                ),
              }
            : w,
        ),
      );
    },
    [],
  );

  const saveLoadout = useCallback(async () => {
    if (!loadoutName.trim()) return;
    setSaving(true);
    const ids = Array.from(equipped);
    if (actor) {
      try {
        await actor.saveLoadout(loadoutName, ids);
        const updated = await actor.getLoadouts();
        setLoadouts(updated);
        addLogEntry(`LOADOUT SAVED: ${loadoutName.toUpperCase()}`, "info");
      } catch {
        // offline
      }
    } else {
      setLoadouts((prev) => [
        ...prev.filter((l) => l.name !== loadoutName),
        { name: loadoutName, weaponIds: ids },
      ]);
    }
    setLoadoutName("");
    setSaving(false);
  }, [actor, loadoutName, equipped, addLogEntry]);

  const loadLoadout = useCallback(
    (wids: string[]) => {
      setEquipped(new Set(wids));
      addLogEntry("LOADOUT APPLIED", "info");
    },
    [addLogEntry],
  );

  const deleteLoadout = useCallback(
    async (name: string) => {
      if (actor) {
        try {
          await actor.deleteLoadout(name);
        } catch {
          /* offline */
        }
      }
      setLoadouts((prev) => prev.filter((l) => l.name !== name));
      addLogEntry(`LOADOUT DELETED: ${name.toUpperCase()}`, "warn");
    },
    [actor, addLogEntry],
  );

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
      data-ocid="weapons.section"
    >
      {/* Arsenal */}
      <div
        style={{
          ...panelStyle,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        data-ocid="weapons.arsenal.panel"
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
          ARSENAL ({equipped.size} EQUIPPED)
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {weapons.map((w, i) => {
            const isEq = equipped.has(w.id);
            return (
              <div
                key={w.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  padding: "5px",
                  marginBottom: "4px",
                  border: `1px solid ${isEq ? colors.primary : `${colors.primary}30`}`,
                  borderRadius: "4px",
                  background: isEq ? `${colors.primary}08` : "transparent",
                  transition: "all 0.15s",
                }}
                data-ocid={`weapons.item.${i + 1}`}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      color: isEq ? colors.primary : `${colors.primary}50`,
                      textShadow: isEq ? `0 0 6px ${colors.primary}` : "none",
                      width: "18px",
                      textAlign: "center",
                    }}
                  >
                    {w.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "9px",
                        color: isEq ? colors.primary : `${colors.primary}70`,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {w.name}
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "2px" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "6px",
                            color: `${colors.dim}80`,
                            marginBottom: "1px",
                          }}
                        >
                          DMG
                        </div>
                        <StatBar value={w.damage} color={colors.primary} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "6px",
                            color: `${colors.dim}80`,
                            marginBottom: "1px",
                          }}
                        >
                          ROF
                        </div>
                        <StatBar value={w.rof} color={colors.accent} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "6px",
                            color: `${colors.dim}80`,
                            marginBottom: "1px",
                          }}
                        >
                          ACC
                        </div>
                        <StatBar value={w.accuracy} color="#44cc44" />
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: colors.primary,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                      }}
                    >
                      {w.clip}/
                      <span style={{ fontSize: "9px", color: colors.dim }}>
                        {w.reserve}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button
                        type="button"
                        onClick={() => adjustAmmo(w.id, "clip", 1)}
                        data-ocid={`weapons.ammo_plus.button.${i + 1}`}
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "7px",
                          padding: "1px 3px",
                          background: `${colors.primary}10`,
                          border: `1px solid ${colors.primary}30`,
                          color: colors.primary,
                          borderRadius: "2px",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustAmmo(w.id, "clip", -1)}
                        data-ocid={`weapons.ammo_minus.button.${i + 1}`}
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "7px",
                          padding: "1px 3px",
                          background: `${colors.primary}10`,
                          border: `1px solid ${colors.primary}30`,
                          color: colors.primary,
                          borderRadius: "2px",
                          cursor: "pointer",
                        }}
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleEquip(w.id)}
                    data-ocid={`weapons.equip.toggle.${i + 1}`}
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "7px",
                      padding: "3px 5px",
                      background: isEq ? `${colors.primary}25` : "transparent",
                      border: `1px solid ${isEq ? colors.primary : `${colors.primary}40`}`,
                      color: isEq ? colors.primary : `${colors.primary}60`,
                      borderRadius: "2px",
                      cursor: "pointer",
                      letterSpacing: "0.08em",
                      minWidth: "32px",
                      textAlign: "center",
                    }}
                  >
                    {isEq ? "EQ" : "OFF"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loadout save */}
      <div style={panelStyle} data-ocid="weapons.loadout.panel">
        <div
          style={{
            fontSize: "7px",
            color: colors.dim,
            letterSpacing: "0.15em",
            marginBottom: "4px",
          }}
        >
          LOADOUTS
        </div>
        <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
          <input
            type="text"
            value={loadoutName}
            onChange={(e) => setLoadoutName(e.target.value)}
            placeholder="LOADOUT NAME"
            data-ocid="weapons.loadout.input"
            style={{
              flex: 1,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "8px",
              letterSpacing: "0.08em",
              background: "rgba(0,0,0,0.7)",
              border: `1px solid ${colors.primary}40`,
              color: colors.primary,
              borderRadius: "3px",
              padding: "3px 6px",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={saveLoadout}
            disabled={saving || !loadoutName.trim()}
            data-ocid="weapons.loadout.save_button"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "8px",
              padding: "3px 8px",
              background: `${colors.primary}15`,
              border: `1px solid ${colors.primary}50`,
              color: colors.primary,
              borderRadius: "3px",
              cursor: saving ? "not-allowed" : "pointer",
              letterSpacing: "0.08em",
            }}
          >
            {saving ? "..." : "SAVE"}
          </button>
        </div>
        {loadouts.length === 0 && (
          <div
            style={{
              fontSize: "7px",
              color: `${colors.dim}60`,
              textAlign: "center",
            }}
            data-ocid="weapons.loadout.empty_state"
          >
            NO SAVED LOADOUTS
          </div>
        )}
        {loadouts.map((l, i) => (
          <div
            key={l.name}
            style={{
              display: "flex",
              gap: "4px",
              alignItems: "center",
              padding: "2px 0",
              borderBottom: `1px solid ${colors.primary}15`,
            }}
            data-ocid={`weapons.loadout.item.${i + 1}`}
          >
            <span
              style={{
                flex: 1,
                fontSize: "8px",
                color: colors.dim,
                letterSpacing: "0.05em",
              }}
            >
              {l.name.toUpperCase()} ({l.weaponIds.length})
            </span>
            <button
              type="button"
              onClick={() => loadLoadout(l.weaponIds)}
              data-ocid={`weapons.loadout.load.button.${i + 1}`}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "7px",
                padding: "2px 5px",
                background: `${colors.primary}10`,
                border: `1px solid ${colors.primary}30`,
                color: colors.primary,
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              LOAD
            </button>
            <button
              type="button"
              onClick={() => deleteLoadout(l.name)}
              data-ocid={`weapons.loadout.delete_button.${i + 1}`}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "7px",
                padding: "2px 5px",
                background: "rgba(255,68,68,0.08)",
                border: "1px solid #ff444430",
                color: "#ff4444",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              DEL
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
