import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

actor {
  type Faction = {
    #hev;
    #hecu;
    #security;
    #combine;
  };

  type MarkLevel = {
    #I;
    #II;
    #III;
    #IV;
    #V;
    #prototype;
  };

  type DisplayMode = {
    #standard;
    #tactical;
    #minimal;
    #emergency;
  };

  type GameMode = {
    #hl1;
    #hl2;
  };

  type TabNavStyle = {
    #dropdown;
    #drawer;
  };

  type UserSettings = {
    faction : Faction;
    markLevel : MarkLevel;
    displayMode : DisplayMode;
    hudSize : Nat;
    brightness : Nat;
    gameMode : GameMode;
    tabNavStyle : TabNavStyle;
    operatorName : Text;
    colorScheme : Text;
    crtFilter : Bool;
    scanlines : Bool;
    glowEffect : Bool;
    glitchEffects : Bool;
    setupComplete : Bool;
  };

  type EquipmentToggle = {
    flashlight : Bool;
    respirator : Bool;
    helmet : Bool;
    hudDisplay : Bool;
    longJumpModule : Bool;
    advancedMedical : Bool;
    enhancedBioMonitoring : Bool;
  };

  type Loadout = {
    name : Text;
    weaponIds : [Text];
  };

  module Loadout {
    public func compare(loadout1 : Loadout, loadout2 : Loadout) : Order.Order {
      Text.compare(loadout1.name, loadout2.name);
    };
  };

  type Player = {
    settings : UserSettings;
    toggles : EquipmentToggle;
    loadouts : Map.Map<Text, Loadout>;
  };

  type PlayerDTO = {
    settings : UserSettings;
    toggles : EquipmentToggle;
    loadouts : [Loadout];
  };

  let players = Map.empty<Principal, Player>();

  func getPlayerInternal(caller : Principal) : Player {
    switch (players.get(caller)) {
      case (null) { Runtime.trap("Player does not exist!") };
      case (?player) { player };
    };
  };

  func getPlayerDTO(caller : Principal) : PlayerDTO {
    let player = getPlayerInternal(caller);
    let loadouts = player.loadouts.values().toArray().sort();
    {
      player with loadouts;
    };
  };

  public query ({ caller }) func getAllPlayers() : async [(Principal, PlayerDTO)] {
    players.entries().map(func((principal, player)) { (principal, getPlayerDTO(principal)) }).toArray();
  };

  public query ({ caller }) func getSettings() : async UserSettings {
    getPlayerInternal(caller).settings;
  };

  public query ({ caller }) func getToggles() : async EquipmentToggle {
    getPlayerInternal(caller).toggles;
  };

  public query ({ caller }) func getLoadouts() : async [Loadout] {
    let player = getPlayerInternal(caller);
    player.loadouts.values().toArray().sort();
  };

  public shared ({ caller }) func saveSettings(settings : UserSettings) : async () {
    if (players.containsKey(caller)) {
      let oldPlayer = getPlayerInternal(caller);
      players.add(caller, { oldPlayer with settings });
    } else {
      let togglesMap = Map.empty<Text, Loadout>();
      let newPlayer = {
        settings;
        toggles = defaultToggles;
        loadouts = togglesMap;
      };
      players.add(caller, newPlayer);
    };
  };

  public shared ({ caller }) func saveToggle(toggleName : Text, state : Bool) : async () {
    let player = getPlayerInternal(caller);

    let toggles =
      if (toggleName == "flashlight") {
        { player.toggles with flashlight = state };
      } else if (toggleName == "respirator") {
        { player.toggles with respirator = state };
      } else if (toggleName == "helmet") {
        { player.toggles with helmet = state };
      } else if (toggleName == "hudDisplay") {
        { player.toggles with hudDisplay = state };
      } else if (toggleName == "longJumpModule") {
        { player.toggles with longJumpModule = state };
      } else if (toggleName == "advancedMedical") {
        { player.toggles with advancedMedical = state };
      } else if (toggleName == "enhancedBioMonitoring") {
        { player.toggles with enhancedBioMonitoring = state };
      } else { player.toggles };

    let newPlayer = { player with toggles };
    players.add(caller, newPlayer);
  };

  public shared ({ caller }) func saveLoadout(name : Text, weaponIds : [Text]) : async () {
    let player = getPlayerInternal(caller);
    let newLoadout = { name; weaponIds };
    player.loadouts.add(name, newLoadout);
  };

  public shared ({ caller }) func deleteLoadout(name : Text) : async () {
    let player = getPlayerInternal(caller);
    player.loadouts.remove(name);
  };

  func defaultSettings() : UserSettings {
    {
      faction = #hev;
      markLevel = #I;
      displayMode = #standard;
      hudSize = 100;
      brightness = 50;
      gameMode = #hl1;
      tabNavStyle = #dropdown;
      operatorName = "G. Freeman";
      colorScheme = "orange";
      crtFilter = false;
      scanlines = false;
      glowEffect = false;
      glitchEffects = false;
      setupComplete = false;
    };
  };

  let defaultToggles : EquipmentToggle = {
    flashlight = false;
    respirator = false;
    helmet = true;
    hudDisplay = true;
    longJumpModule = false;
    advancedMedical = false;
    enhancedBioMonitoring = true;
  };
};
