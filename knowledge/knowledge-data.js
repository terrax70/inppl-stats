window.FORGE_KNOWLEDGE = {
  sourceVersion: "2026_07_15_12_09",
  ascensionMultipliers: [
    {level:0,label:"A0",multiplier:1,      stepMultiplier:null},
    {level:1,label:"A1",multiplier:50,     stepMultiplier:50},
    {level:2,label:"A2",multiplier:2500,   stepMultiplier:50},
    {level:3,label:"A3",multiplier:125000, stepMultiplier:50}
  ],
  rarities: ["Common","Rare","Epic","Legendary","Ultimate","Mythic"],
  skills: [
    {rarity:"Common",warPoints:50},
    {rarity:"Rare",warPoints:75},
    {rarity:"Epic",warPoints:100},
    {rarity:"Legendary",warPoints:125},
    {rarity:"Ultimate",warPoints:150},
    {rarity:"Mythic",warPoints:175}
  ],
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





  officialTechGuideSummary: {
    early:["Forge Upgrade Cost","Forge Upgrade Time","Tech Research Time","Tech Node Cost","Auto Forge","Max Offline Time","Offline Hammer Reward","Extra Mount Chance"],
    mid:["Tech Research Time","Tech Node Cost","Pet Damage/Health","Free Forge Chance","Extra Mount Chance"],
    late:["Tech Research Time","Tech Node Cost","Weapon/Ring/Necklace Mastery","Helmet/Body/Belt/Shoe Mastery","Mount Damage/Health","Extra Mount Chance","Ultimate/Mythic Egg Timers"],
    rule:"Max Forge Cost + Forge Speed T1, potem Tech Speed + Tech Cost T1, następnie wszystkie pozostałe Tier I do 1/5.",
    source:"Forge Master Tech Tree Guide"
  },
  techRoadmap: {
    tierUpgrade: {
      0:{name:"Tier I",costs:[40,56,78,110,154],durations:[300,600,1200,2400,4800]},
      1:{name:"Tier II",costs:[215,301,422,590,826],durations:[9600,19200,38400,76800,86016]},
      2:{name:"Tier III",costs:[1157,1319,1504,1714,1954],durations:[96338,107898,120846,135348,151590]},
      3:{name:"Tier IV",costs:[2228,2540,2895,3300,3763],durations:[169780,190154,212972,238529,267153]},
      4:{name:"Tier V",costs:[4289,4890,5574,6355,7244],durations:[299211,335116,375330,420370,470814]}
    },
    trees: {
      Forge: {
        label:"Forge",
        icon:"🔨",
        nodes:[
          {type:"ForgeTimerSpeed",effect:"+4% Forge speed / rank",priority:"max",why:"Przyspiesza każdy kolejny poziom Forge. Największa wartość, jeśli celem jest Forge 35."},
          {type:"ForgeUpgradeCost",effect:"-2% Forge cost / rank",priority:"max",why:"Zmniejsza koszt wszystkich kolejnych upgrade'ów Forge."},
          {type:"EquipmentSellPrice",effect:"+2% sell price / rank",priority:"high",why:"Więcej Gold z itemów; pomaga finansować dalszy Forge."},
          {type:"HammerThiefHammerReward",effect:"+2% Hammer reward / rank",priority:"medium",why:"Więcej młotków z Hammer Thief."},
          {type:"HammerThiefCoinReward",effect:"+2% Coin reward / rank",priority:"medium",why:"Więcej Gold z Hammer Thief."},
          {type:"AutoForge",effect:"+1 Auto Forge",priority:"one",why:"MaxLevel = 1. Bierzesz i idziesz dalej."},
          {type:"FreeForgeChance",effect:"+1% free forge / rank",priority:"high",why:"Stała oszczędność młotków przy całym progresie."},
          {type:"MaxOfflineReward",effect:"+16% max offline / rank",priority:"high",why:"Bardzo duży wzrost długości/limitu offline."},
          {type:"CoinOfflineReward",effect:"+2% offline Coins / rank",priority:"medium",why:"Więcej Gold pasywnie."},
          {type:"HammerOfflineReward",effect:"+2% offline Hammers / rank",priority:"medium",why:"Więcej Hammers pasywnie."}
        ],
        recommendation:"Przed Forge Ascension priorytet: ForgeTimerSpeed → ForgeUpgradeCost → FreeForgeChance → EquipmentSellPrice. Resztę możesz przechodzić 1 rankiem, żeby szybciej otworzyć kolejny Tier."
      },
      Power: {
        label:"Power + Mounts",
        icon:"⚔️",
        nodes:[
          {type:"WeaponBonus",effect:"+2% Weapon DMG/HP / rank",priority:"high"},
          {type:"HelmetBonus",effect:"+2% Helmet HP / rank",priority:"medium"},
          {type:"GloveBonus",effect:"+2% Gloves DMG / rank",priority:"high"},
          {type:"BodyBonus",effect:"+2% Armour HP / rank",priority:"medium"},
          {type:"NecklaceBonus",effect:"+2% Necklace DMG / rank",priority:"high"},
          {type:"ShoeBonus",effect:"+2% Shoes HP / rank",priority:"medium"},
          {type:"RingBonus",effect:"+2% Ring DMG / rank",priority:"high"},
          {type:"BeltBonus",effect:"+2% Belt HP / rank",priority:"medium"},
          {type:"MountDamage",effect:"+2% Mount DMG / rank",priority:"high"},
          {type:"MountHealth",effect:"+2% Mount HP / rank",priority:"high"},
          {type:"WeaponLevelUp",effect:"+2 max Weapon level / rank",priority:"high"},
          {type:"HelmetLevelUp",effect:"+2 max Helmet level / rank",priority:"medium"},
          {type:"GloveLevelUp",effect:"+2 max Gloves level / rank",priority:"high"},
          {type:"BodyLevelUp",effect:"+2 max Armour level / rank",priority:"medium"},
          {type:"NecklaceLevelUp",effect:"+2 max Necklace level / rank",priority:"high"},
          {type:"ShoeLevelUp",effect:"+2 max Shoes level / rank",priority:"medium"},
          {type:"RingLevelUp",effect:"+2 max Ring level / rank",priority:"high"},
          {type:"BeltLevelUp",effect:"+2 max Belt level / rank",priority:"medium"},
          {type:"MountSummonCost",effect:"-1% Mount summon cost / rank",priority:"max",why:"Bezpośrednio zmniejsza Clockwinders potrzebne do summonów."},
          {type:"ExtraMountChance",effect:"+2% extra Mount chance / rank",priority:"max",why:"Najlepszy długoterminowy node Mountów; więcej summonów z tego samego zasobu."}
        ],
        recommendation:"Jeśli zbliża się Mount Ascension: przechodź Tier 1-rankowo do MountSummonCost i ExtraMountChance, a te dwa maxuj. DMG/HP i level cap backfilluj potem."
      },
      SkillsPetTech: {
        label:"Skills + Pets + Research",
        icon:"🧪",
        nodes:[
          {type:"TechResearchTimer",effect:"+4% Research speed / rank",priority:"rush",why:"Najważniejszy długoterminowy node całego Player Tech Tree. Skraca każdy następny research."},
          {type:"SkillDamage",effect:"+2% Skill DMG/HP / rank",priority:"medium"},
          {type:"SkillPassiveDamage",effect:"+2% passive DMG / rank",priority:"medium"},
          {type:"SkillPassiveHealth",effect:"+2% passive HP / rank",priority:"low"},
          {type:"TechNodeUpgradeCost",effect:"-2% Tech cost / rank",priority:"rush",why:"Obniża koszt wszystkich kolejnych node'ów Tech."},
          {type:"PetBonusDamage",effect:"+2% Pet DMG / rank",priority:"high"},
          {type:"PetBonusHealth",effect:"+2% Pet HP / rank",priority:"high"},
          {type:"SkillSummonCost",effect:"-1% Skill summon cost / rank",priority:"high"},
          {type:"CommonEggTimer",effect:"+10% Common hatch speed / rank",priority:"medium"},
          {type:"RareEggTimer",effect:"+10% Rare hatch speed / rank",priority:"medium"},
          {type:"EpicEggTimer",effect:"+10% Epic hatch speed / rank",priority:"high"},
          {type:"LegendaryEggTimer",effect:"+10% Legendary hatch speed / rank",priority:"high"},
          {type:"UltimateEggTimer",effect:"+10% Ultimate hatch speed / rank",priority:"high"},
          {type:"MythicEggTimer",effect:"+10% Mythic hatch speed / rank",priority:"high"},
          {type:"ExtraEggChance",effect:"+4% extra Egg chance / rank",priority:"max",why:"Długoterminowo zwiększa liczbę eggów z dungeonowego źródła."},
          {type:"GhostTownSkillBonus",effect:"+1% Ghost Town Skill reward / rank",priority:"medium"},
          {type:"ZombieRushTechPotions",effect:"+2% Tech Potion reward / rank",priority:"high",why:"Pomaga finansować dalszy Player Tech Tree."}
        ],
        recommendation:"GLOBALNY RUSH: max TechResearchTimer, potem max TechNodeUpgradeCost, następnie 1 rank reszty aż do kolejnego Tieru. W nowym Tierze znowu Research Timer → Cost. To daje największy efekt składany."
      }
    }
  },

  officialAscensionGuide: {
    baseStats:[
      ["Critical Chance","50%"],
      ["Critical Damage","350%"],
      ["Lifesteal","30%"],
      ["Double Chance","30%"],
      ["Attack Speed","150%"]
    ],
    global:[
      "Są 4 filary Ascension: Forge, Skills, Pets i Mounts.",
      "Wszystkie ascended pillars poza Skills mają zawsze 2 substaty, niezależnie od rarity.",
      "Przepchnij dungeony tak daleko jak możesz — poradnik wskazuje zakres 19-1 do 20-1.",
      "Przed Ascension 1 miej CO NAJMNIEJ Tier 3 Tech maxed na discount i drop chance. Tier 4 jest mocno rekomendowany.",
      "Wbij możliwie wysoką rangę w Ranked League przed Ascension."
    ],
    pillars:{
      Forge:{
        priority:"VERY HIGH",
        reset:"Gear zostaje usunięty i Forge resetuje się do Lv1.",
        keep:"Zachowujesz waluty/zasoby do forge'owania nowych enhanced gears.",
        recovery:"Multiverse daje mniej więcej moc non-ascended Divine.",
        safe:"Quantum jest bezpieczniejszym celem; A1 Quantum ≈ ×2 non-ascended Divine.",
        advice:"Forge jest najbardziej czasochłonnym filarem. Nie warto jednak siedzieć bardzo długo na Forge 35. Dobrze ascendować drugi filar równolegle, zależnie od zasobów."
      },
      Skills:{
        priority:"HIGH",
        reset:"Skille znikają i resetują się do Lv1.",
        keep:"Zachowujesz Skill Tickets.",
        recovery:"Legendary daje mniej więcej moc non-ascended Mythic.",
        advice:"Najłatwiejszy pillar do Ascension. Po zdobyciu kompletu Legendary wracasz na właściwy tor; poradnik poleca go też jako dobrego partnera do Forge Ascension."
      },
      Pets:{
        priority:"MEDIUM",
        reset:"Pety są tracone i resetują się do Lv1.",
        keep:"Zachowujesz Eggshells.",
        recovery:"Legendary daje mniej więcej moc non-ascended Mythic.",
        alternative:"Jeśli Twoje non-ascended Mythic pets mają słabe staty, można celować tylko w Epic; A1 Epic ≈ non-ascended Ultimate.",
        advice:"Wczesny Pet Ascension ma sens szczególnie, jeśli inne filary już niosą Twoją moc."
      },
      Mounts:{
        priority:"LOW",
        reset:"Mounty są scrapped i resetują się do Lv1.",
        keep:"Zachowujesz Clockwinders.",
        recovery:"Epic daje mniej więcej moc non-ascended Mythic.",
        advice:"Najbardziej wymagający Techowo pillar, bo poradnik chce discount + extra drop. Powinien być ostatni; co najmniej T3, T4 jako sweet spot dla Stage 1 Ascension."
      }
    }
  },
  recoveryResources: {
    items: {
      resource:"Gold", icon:"🪙", target:"Multiverse", targetLevel:"Forge Lv22",
      base:11471100, discount:8603325, baseLabel:"11 471 100", discountLabel:"8 603 325",
      discountText:"25% discount", ascensionCost:3000000, ascensionCostLabel:"3 mln",
      chance:"4% Multiverse drop", unlock:"Multiverse zaczyna dropić od Forge Lv17 przy 0,05%",
      alternative:{target:"Quantum",targetLevel:"Forge Lv25",base:16841100,discount:12630825,baseLabel:"16 841 100",discountLabel:"12 630 825",chance:"4% Quantum drop",unlock:"Quantum zaczyna dropić od Forge Lv20 przy 0,05%",note:"A1 Quantum ≈ ×2 non-ascended Divine"},
      priority:"VERY HIGH", sourceScope:"Official Discord Comprehensive Ascension Guide"
    },
    skills: {
      resource:"Tickets", icon:"🎟️", target:"Legendary", targetLevel:"Skill Lv24",
      base:49600, discount:37200, baseLabel:"49 600", discountLabel:"37 200",
      discountText:"25% discount", chance:"2% Legendary drop",
      unlock:"Legendary zaczyna dropić od Skill Lv18 przy 0,03%",
      priority:"HIGH", sourceScope:"Official Discord Comprehensive Ascension Guide"
    },
    pets: {
      resource:"Eggshells", icon:"🥚", target:"Legendary", targetLevel:"Pet Lv37",
      base:48600, discount:32400, baseLabel:"48 600", discountLabel:"32 400",
      discountText:"+50% Extra Drop ≈ 33,33% estimated discount", chance:"7,2% Legendary drop",
      unlock:"Legendary zaczyna dropić od Pet Lv28 przy 0,07%",
      alternative:{target:"Epic",targetLevel:"Pet Lv15",base:7100,discount:4733,baseLabel:"7 100",discountLabel:"4 733",chance:"20% Epic drop",note:"Opcja dla słabych statów non-ascended Mythic pets; A1 Epic ≈ non-ascended Ultimate."},
      priority:"MEDIUM", sourceScope:"Official Discord Comprehensive Ascension Guide"
    },
    mounts: {
      resource:"Clockwinders", icon:"⏱️", target:"Epic", targetLevel:"Mount Lv31",
      base:30000, discount:15000, baseLabel:"30 000", discountLabel:"15 000",
      discountText:"25% discount + 50% Extra Drop ≈ 50% estimated discount",
      chance:"7,2% Epic drop", unlock:"Epic zaczyna dropić od Mount Lv22 przy 0,07%",
      note:"Poradnik zakłada summonowanie paczkami ×50, nie pojedynczo.",
      priority:"LOW", sourceScope:"Official Discord Comprehensive Ascension Guide"
    }
  },
  ascensionPaths: {
    skills: {
      system:"Skille",
      eligibilityLabel:"Level 100",
      endRarity:"Mythic",
      recoveryRarity:"Legendary",
      note:"Ascension odblokowuje Level 100. Oficjalny poradnik wskazuje Legendary jako około-próg odzyskania poprzedniej mocy."
    },
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