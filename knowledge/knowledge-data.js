window.FORGE_KNOWLEDGE = {
  sourceVersion: "2026_07_15_12_09",
  rarities: ["Common","Rare","Epic","Legendary","Ultimate","Mythic"],
  colors: {
    Common:"#aeb8c6", Rare:"#5ba7ff", Epic:"#bb6cff",
    Legendary:"#ffb84d", Ultimate:"#ff6767", Mythic:"#67e6d0"
  },
  pets: [
    {rarity:"Common",    damage:100,     health:800,      hatchSeconds:1800},
    {rarity:"Rare",      damage:500,     health:4000,     hatchSeconds:7200},
    {rarity:"Epic",      damage:15000,   health:120000,   hatchSeconds:14400},
    {rarity:"Legendary", damage:150000,  health:1200000,  hatchSeconds:28800},
    {rarity:"Ultimate",  damage:750000,  health:6000000,  hatchSeconds:57600},
    {rarity:"Mythic",    damage:1600000, health:12800000, hatchSeconds:115200}
  ],
  mounts: [
    {rarity:"Common",    damage:300,     health:2400},
    {rarity:"Rare",      damage:10000,   health:80000},
    {rarity:"Epic",      damage:200000,  health:1600000},
    {rarity:"Legendary", damage:1000000, health:8000000},
    {rarity:"Ultimate",  damage:3500000, health:28000000},
    {rarity:"Mythic",    damage:8000000, health:64000000}
  ],
  balancing: [
    {type:"Balanced", damageMultiplier:1.0, healthMultiplier:1.0},
    {type:"Damage",   damageMultiplier:1.5, healthMultiplier:0.5},
    {type:"Health",   damageMultiplier:0.5, healthMultiplier:1.5}
  ],
  ascension: {
    priority:["Skills","Mounts","Pets","Forge"],
    baseCost: {
      gold:41886000, tickets:396600, eggshells:193500, clockwinders:99000
    },
    maxTechCost: {
      gold:31414500, tickets:297450, eggshells:129000, clockwinders:49500
    },
    notes:[
      "Skills: zalecane jako pierwsze; źródłowy poradnik wskazuje, że A1 Legendary odpowiada Base Divine.",
      "Mount: zalecany jako drugi — jest jeden slot i można założyć go od razu.",
      "Pets: zalecane jako trzecie, po odbudowaniu siły mounta podczas czasu wykluwania.",
      "Forge: źródłowy poradnik traktuje jako ostatni i zależny od siły pozostałych systemów."
    ]
  }
};