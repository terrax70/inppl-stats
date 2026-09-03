window.FORGE_KNOWLEDGE = {
  sourceVersion: "2026_07_15_12_09",
  ascensionMultipliers: [
    {level:0,label:"A0",multiplier:1,      stepMultiplier:null},
    {level:1,label:"A1",multiplier:50,     stepMultiplier:50},
    {level:2,label:"A2",multiplier:2500,   stepMultiplier:50},
    {level:3,label:"A3",multiplier:125000, stepMultiplier:50}
  ],
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

  itemTiers: [
    {rarity:"Primitive",    damage:5,       health:40},
    {rarity:"Medieval",     damage:20,      health:160},
    {rarity:"Early-Modern", damage:80,      health:640},
    {rarity:"Modern",       damage:320,     health:2560},
    {rarity:"Space",        damage:1280,    health:10240},
    {rarity:"Interstellar", damage:5120,    health:40960},
    {rarity:"Multiverse",   damage:20480,   health:163840},
    {rarity:"Quantum",      damage:81920,   health:655360},
    {rarity:"Underworld",   damage:327680,  health:2621440},
    {rarity:"Divine",       damage:1310720, health:10485760}
  ],
  itemTierColors: {
    "Primitive":"#aeb8c6","Medieval":"#7eafff","Early-Modern":"#8f7dff",
    "Modern":"#c06cff","Space":"#f16ac1","Interstellar":"#ff776e",
    "Multiverse":"#ff9f5b","Quantum":"#f7c95b","Underworld":"#7be09d","Divine":"#65e6d0"
  },
  ascension: {
    totalCost: {
      base: {
        gold: 41891100,
        tickets: 384000,
        eggshells: 193500,
        clockwinders: 99000
      },
      maxTech: {
        gold: 31418325,
        tickets: 288000,
        eggshells: 129000,
        clockwinders: 49500
      }
    },
    rounded: {
      base: {
        gold: "41.9m gold",
        tickets: "384k tickets",
        eggshells: "194k eggshells",
        clockwinders: "99k clockwinders"
      },
      maxTech: {
        gold: "31.5m gold*",
        tickets: "288k tickets",
        eggshells: "129k eggshells",
        clockwinders: "50k clockwinders"
      }
    },
    discounts: {
      gold: "25%",
      tickets: "25%",
      eggshells: "50%*",
      clockwinders: "25% / 50%*"
    },
    checklist: [
      "Przed Ascension progresuj Dungeon tak daleko, jak możesz — poradnik wskazuje zakres 19-6 → 20-1.",
      "Po Ascension wracasz do poziomu 1 i tracisz materiały: pets, eggs, skills, mounts i gear.",
      "Resources zostają — poradnik wprost zaznacza, że ich nie tracisz.",
      "Przed Ascension przygotuj tyle zasobów, aby po resecie dojść co najmniej do poziomu Legendary.",
      "Według poradnika Legendary zapewnia 2 substaty dla pets/mounts oraz wystarczającą liczbę tickets dla skilla Morale.",
      "Dla wybranego pillar poradnik mocno zaleca rozwinięcie odpowiedniego Tech tak wysoko, jak się da, aby obniżyć koszty kolejnych Ascension."
    ],
    legendaryTargets: [
      {level:30, legendaryChance:2.0, totalCost:62200, maxTechCost:46650},
      {level:37, legendaryChance:7.2, totalCost:48600, maxTechCost:32400},
      {level:47, legendaryChance:7.2, totalCost:46000, maxTechCost:23308.2}
    ],
    legendaryRule: "Skill wymaga co najmniej 2% Legendary Pull Chance. Pets i Mounts wymagają co najmniej 5%, aby ograniczyć ryzyko RNG.",
    notes: [
      "* Arkusz zaznacza, że koszt Ascension 3,000,000 gold jest stały i jest wyłączony z oznaczonej wartości kosztu.",
      "* Dla eggshells arkusz zaznacza zaokrąglenie wartości 37.5 do 38.",
      "Koszty mogą wyjść wyższe lub niższe zależnie od RNG pull.",
      "Final Discount w arkuszu jest opisany jako wartość szacunkowa, a nie gwarantowana."
    ],
    attribution: "Ascension Guide: Xyph1c; reviewed by Unagi, Spectre, Kayzee and AimAndSayer. Data: Forge Master Official Moderator Team."
  }
};