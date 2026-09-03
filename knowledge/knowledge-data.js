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



  weeklyIncomeModel: {
    mission: {
      maxLevel:60,
      dailyEnergy:3,
      ownerRewardsCount:4,
      listedCurrencyCount:6,
      rewardGrowth:1.01,
      base: {
        Coins:5500,
        SkillSummonTickets:184,
        Eggshells:91,
        TechPotions:92,
        ClockWinders:69
      },
      note:"MissionBaseConfig: DailyEnergy=3, MissionOwnerRewardsCount=4. MissionRewardLibrary lists 6 currencies. The default 4/6 share is an estimate unless reward selection distribution is confirmed."
    },
    dungeon: {
      Hammer:{HammersBase:60,HammersIncrease:1,CoinsBase:4000,CoinsIncrease:100},
      Skill:{base:200,increase:2,currency:"SkillSummonTickets"},
      Pet:{base:200,increase:0.65,currency:"Eggshells"},
      note:"Reward index = (world-1)*10 + (stage-1). Example 8-1 -> index 70 -> Skill 340, Pet floor(245.5)=245, Hammer 130 + 11,000 Coins."
    },
    idle: {
      minSeconds:600,
      maxSeconds:14400,
      coinsPerSecond:1,
      hammersPerMinute:1,
      note:"IdleConfig base rates only. Profile/Tech multipliers are player-specific, so the calculator leaves them editable."
    },
    warTiers: {
      E:{win:{Hammers:265,SkillSummonTickets:260,Eggshells:170,TechPotions:200,ClockWinders:125},lose:{Hammers:130,SkillSummonTickets:130,Eggshells:85,TechPotions:100,ClockWinders:65}},
      D:{win:{Hammers:530,SkillSummonTickets:520,Eggshells:350,TechPotions:400,ClockWinders:250},lose:{Hammers:265,SkillSummonTickets:260,Eggshells:175,TechPotions:200,ClockWinders:125}},
      C:{win:{Hammers:1060,SkillSummonTickets:1050,Eggshells:700,TechPotions:800,ClockWinders:525},lose:{Hammers:530,SkillSummonTickets:525,Eggshells:350,TechPotions:400,ClockWinders:260}},
      B:{win:{Hammers:2135,SkillSummonTickets:2100,Eggshells:1400,TechPotions:1580,ClockWinders:1000},lose:{Hammers:1060,SkillSummonTickets:1050,Eggshells:700,TechPotions:790,ClockWinders:500}},
      A:{win:{Hammers:3750,SkillSummonTickets:3600,Eggshells:2500,TechPotions:2800,ClockWinders:1900},lose:{Hammers:1870,SkillSummonTickets:1800,Eggshells:1250,TechPotions:1400,ClockWinders:1000}},
      S:{win:{Hammers:5300,SkillSummonTickets:7800,Eggshells:5200,TechPotions:5900,ClockWinders:4000},lose:{Hammers:2650,SkillSummonTickets:3900,Eggshells:2600,TechPotions:2900,ClockWinders:2000}},
      SS:{win:{Hammers:5500,SkillSummonTickets:8200,Eggshells:5500,TechPotions:6200,ClockWinders:4200},lose:{Hammers:2650,SkillSummonTickets:3900,Eggshells:2600,TechPotions:2900,ClockWinders:2000}},
      SSS:{win:{Hammers:5800,SkillSummonTickets:8600,Eggshells:5700,TechPotions:6500,ClockWinders:4400},lose:{Hammers:2650,SkillSummonTickets:3900,Eggshells:2600,TechPotions:2900,ClockWinders:2000}}
    },
    savingTargets: {
      pets:{label:"Pety",icon:"🥚",currency:"Eggshells",normal:48600,maxTech:32400,maxLevel:100},
      mounts:{label:"Mounty",icon:"⏱️",currency:"ClockWinders",normal:46000,maxTech:23308.2,maxLevel:100},
      items:{label:"Forge",icon:"🪙",currency:"Coins",normal:14466000,maxTech:11599500,maxLevel:35,
        note:"Total before Ascension = 11.466m recovery reserve + 3m Ascension fee; Max Tech = 8.5995m + 3m fee."}
    }
  },
  recoveryResources: {
    items: {
      resource:"Gold",
      icon:"🪙",
      target:"Multiverse",
      targetLevel:"Forge 35",
      base:11466000,
      maxTech:8599500,
      baseLabel:"11,466 mln",
      maxTechLabel:"8,5995 mln",
      ascensionCost:3000000,
      ascensionCostLabel:"3 mln",
      cumulativeSummons:null,
      sourceScope:"Base Maxed → A1 Multiverse"
    },
    pets: {
      resource:"Eggshells",
      icon:"🥚",
      target:"Legendary",
      targetLevel:"Summon Lv 37",
      pullChance:"7,2% Legendary",
      base:48600,
      maxTech:32400,
      baseLabel:"48,6k",
      maxTechLabel:"32,4k",
      ascensionCost:null,
      cumulativeSummons:509,
      sourceScope:"Base Maxed → A1 Legendary"
    },
    mounts: {
      resource:"Clockwinders",
      icon:"⏱️",
      target:"Epic",
      targetLevel:"Summon Lv 47",
      pullChance:"7,2%",
      base:46000,
      maxTech:23308.2,
      baseLabel:"46k",
      maxTechLabel:"23,3k",
      ascensionCost:null,
      cumulativeSummons:940,
      sourceScope:"Base Maxed → A1 recovery baseline"
    },
    skills: {
      resource:"Tickets",
      icon:"🎟️",
      target:"Legendary",
      targetLevel:"Summon Lv 30",
      pullChance:"2% Legendary",
      base:62200,
      maxTech:46650,
      baseLabel:"62,2k",
      maxTechLabel:"46,65k",
      ascensionCost:null,
      cumulativeSummons:null,
      sourceScope:"Base Maxed → A1 Legendary"
    }
  },
  ascensionPaths: {
    pets: {
      system:"Pety",
      eligibilityLabel:"Level 100",
      endRarity:"Mythic",
      recoveryRarity:"Legendary",
      note:"Ascension odblokowuje poziom systemu, nie rarity. Poradnik wskazuje Legendary jako około-próg odzyskania poprzedniej mocy."
    },
    mounts: {
      system:"Mounty",
      eligibilityLabel:"Level 100",
      endRarity:"Mythic",
      recoveryRarity:"Epic",
      note:"Ascension odblokowuje Level 100. Epic jest tylko około-progiem odzyskania poprzedniej mocy."
    },
    items: {
      system:"Itemy / Gear",
      eligibilityLabel:"Forge 35",
      endRarity:"Divine",
      recoveryRarity:"Multiverse",
      note:"Ascension Forge odblokowuje Forge 35. Multiverse jest około-progiem odzyskania poprzedniej mocy."
    }
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