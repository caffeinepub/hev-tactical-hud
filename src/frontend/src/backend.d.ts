import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Loadout {
    name: string;
    weaponIds: Array<string>;
}
export interface UserSettings {
    glowEffect: boolean;
    scanlines: boolean;
    setupComplete: boolean;
    displayMode: DisplayMode;
    brightness: bigint;
    operatorName: string;
    tabNavStyle: TabNavStyle;
    hudSize: bigint;
    glitchEffects: boolean;
    crtFilter: boolean;
    faction: Faction;
    gameMode: GameMode;
    markLevel: MarkLevel;
    colorScheme: string;
}
export interface EquipmentToggle {
    helmet: boolean;
    enhancedBioMonitoring: boolean;
    hudDisplay: boolean;
    advancedMedical: boolean;
    respirator: boolean;
    longJumpModule: boolean;
    flashlight: boolean;
}
export interface PlayerDTO {
    settings: UserSettings;
    toggles: EquipmentToggle;
    loadouts: Array<Loadout>;
}
export enum DisplayMode {
    emergency = "emergency",
    minimal = "minimal",
    tactical = "tactical",
    standard = "standard"
}
export enum Faction {
    hev = "hev",
    hecu = "hecu",
    security = "security",
    combine = "combine"
}
export enum GameMode {
    hl1 = "hl1",
    hl2 = "hl2"
}
export enum MarkLevel {
    I = "I",
    V = "V",
    II = "II",
    IV = "IV",
    III = "III",
    prototype = "prototype"
}
export enum TabNavStyle {
    drawer = "drawer",
    dropdown = "dropdown"
}
export interface backendInterface {
    deleteLoadout(name: string): Promise<void>;
    getAllPlayers(): Promise<Array<[Principal, PlayerDTO]>>;
    getLoadouts(): Promise<Array<Loadout>>;
    getSettings(): Promise<UserSettings>;
    getToggles(): Promise<EquipmentToggle>;
    saveLoadout(name: string, weaponIds: Array<string>): Promise<void>;
    saveSettings(settings: UserSettings): Promise<void>;
    saveToggle(toggleName: string, state: boolean): Promise<void>;
}
