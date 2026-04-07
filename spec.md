# HEV Tactical HUD - Phase 2

## Current State
Phase 1 is complete and deployed. The app has:
- Boot sequence (5 phases)
- Setup wizard (8 steps, first-boot only, re-triggerable via /setup_wizard)
- HUDFrame with hamburger dropdown or drawer navigation
- BasicsTab: health, armor, aux power (real battery), ammo counter, hazards mini-bar, network status
- HUDContext with full faction/settings system (4 factions, mark levels I-V+prototype, display modes, game modes)
- Backend types: UserSettings, EquipmentToggle, Loadout, PlayerDTO with full CRUD
- Device diagnostics hook (battery, network, orientation, memory, wake lock)
- CRT/scanlines/glow/glitch visual effects
- Tab list varies by faction + game mode (VEHICLES tab only in HL2 mode)

## Requested Changes (Diff)

### Add

**New Tabs (all wired into HUDFrame renderTabContent):**
1. TacticalTab - Simulated radar/minimap with animated dot targets, compass heading (device orientation if available), GPS coords (Geolocation API if available, else simulated), threat log with timestamped entries
2. MedicalTab - Vitals panel (HR, BP, O2 sat, body temp - all simulated with realistic drift), injury log, med-kit tracker, morphine/anti-toxin/epinephrine counters, defibrillator button
3. InfoTab - Lore panel (Black Mesa timeline + faction-specific briefings), operator console with full slash-command support, faction-specific flavor text
4. WeaponsTab - Full arsenal per faction (HL1: crowbar/pistol/shotgun/MP5/crossbow/RPG/gauss/gluon/snarks; HECU: M16/M9/SPAS12/M249/M203/flashbang/frag; Security: 9mm/shotgun/stunstick; Combine: AR2/pistol/SMG1/orb/dark energy). Each weapon: equip toggle, ammo tracking, reload button, weapon stats
5. HazardsTab - Expanded from mini-bar: full panels per hazard (fire/temp/gas/rad/elec/bio) with detailed readings, alert history log, decontamination timer per hazard, manual reset buttons
6. UtilitiesTab - Equipment toggles (flashlight, respirator, long-jump module, HUD display, helmet, enhanced bio monitoring, advanced medical) synced to backend EquipmentToggle, local music player (upload MP3s, play/pause/skip, volume), ambient sound toggle (HEV hum)
7. VehiclesTab (HL2 mode only) - Vehicle panels: Airboat, Scout Car, Jalopy. Each: simulated fuel gauge, damage %, speed readout, status indicators, ignition toggle
8. SettingsTab - Full mirror of setup wizard: faction, mark level, HUD size, CRT/scanlines/glow/glitch, operator name, nav style, game mode, brightness, display mode, auto-dim timer, flicker intensity, HUD opacity. Plus: Reset to Setup Wizard button, reset all settings to defaults

**Faction-Specific Custom Tabs:**
- H.E.V: "LAMBDA" tab - resonance cascade data, portal storm readings, Xen anomaly tracker
- HECU: "COMMS" tab - radio channels, mission briefings, unit status
- Security: "PATROL" tab - checkpoint log, sector status, guard roster
- Combine: "NEXUS" tab - Civil Protection orders, suppression field status, citizen compliance data

**Global Features:**
- EventLog system - global scrolling log of timestamped HUD events (tab switches, hazard alerts, health changes, command outputs, system messages). Accessible as a persistent drawer or in InfoTab console
- Uptime clock - shown in status bar (bottom of HUDFrame), counts seconds since app load
- Quick-action bar - persistent mini-bar above the bottom status bar, 4 configurable shortcut buttons (default: Reload, Flashlight, Alert, Medkit)
- Panic button - in UtilitiesTab and Settings, triggers CRITICAL FAILURE alarm sequence (screen shake, HUD border flash red, alarm sound, scrolling alert text, 10s duration)
- Screen shake - CSS animation triggered on health drop, hazard critical, or panic button
- Color pulse on critical - HUD border flashes red when health < 25
- Alert sounds - Web Audio API beeps for low health, low ammo, hazard spike (no external files needed)
- Ambient sound - Web Audio API generated HEV hum/static, toggle in Utilities and Settings
- HUD lock - /lock command and Settings button, shows PIN pad overlay, stored in localStorage
- Auto-dim - after configurable inactivity period, screen dims (CSS filter)

**Operator Console Commands (in InfoTab):**
- /help - list all commands
- /status - dump current HUD status
- /time - current time + uptime
- /diag - dump device diagnostics
- /clear - clear console output
- /setup_wizard - re-launch setup wizard
- /restart - reload app
- /faction [hev|hecu|security|combine] - change faction
- /mark [I|II|III|IV|V|prototype] - change mark level
- /simulate hazard - spike all hazards to critical
- /simulate damage - reduce health by 30
- /simulate emp - trigger EMP visual glitch sequence
- /lock - activate HUD PIN lock

### Modify
- HUDFrame.tsx: wire all new tabs into renderTabContent, add uptime clock to status bar, add quick-action bar, add screen-shake animation trigger, add critical health HUD border pulse, remove "PHASE 2 - COMING SOON" placeholder
- HUDContext.tsx: add EventLog state (array of {timestamp, message, type}), addLogEntry function, expose via context. Add hudLocked state, PIN management. Add panicActive state. Add uptimeSeconds counter.
- index.css: add screen-shake keyframe, add HUD border pulse animation, add quick-action bar styles
- BasicsTab.tsx: integrate with EventLog (log health/armor changes, hazard alerts)

### Remove
- Placeholder "COMING SOON" content in HUDFrame renderTabContent default case

## Implementation Plan
1. Extend HUDContext with EventLog, uptime, panic, hudLock state
2. Update HUDFrame: uptime in status bar, quick-action bar, critical border pulse, screen shake, wire all tabs
3. Implement TacticalTab (radar, compass, GPS, threat log)
4. Implement MedicalTab (vitals, injury log, counters)
5. Implement InfoTab (lore, console with all commands)
6. Implement WeaponsTab (faction arsenals, ammo tracking)
7. Implement HazardsTab (full per-hazard panels, decon timers)
8. Implement UtilitiesTab (equipment toggles, music player, ambient sound, panic button)
9. Implement VehiclesTab (HL2 only, 3 vehicles)
10. Implement SettingsTab (full settings mirror, auto-dim, flicker, opacity)
11. Implement faction custom tabs (LAMBDA/COMMS/PATROL/NEXUS)
12. Add alert sounds via Web Audio API
13. Add HUD lock PIN overlay
14. Update tab list in HUDFrame to include faction custom tabs
15. Update BasicsTab to log to EventLog
