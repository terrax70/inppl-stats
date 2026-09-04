# ROZWÓJ 1.0 — MAPA ŹRÓDEŁ

Config źródłowy: `2026_09_02_09_08`

## Pety
- `PetUpgradeLibrary.json` — bazowe Damage / Health per rarity
- `EggLibrary.json` — HatchTime
- `AscensionConfigsLibrary.json` — A1/A2/A3 multipliers
- `ManualSpriteMapping.json` + `Pets/MegaPets/UltraPets/ApexPets.png` — grafiki

## Mounty
- `MountUpgradeLibrary.json` — bazowe Damage / Health
- `MountSummonConfig.json` — summon system
- `AscensionConfigsLibrary.json`
- `ManualSpriteMapping.json` + MountIcons sheets

## Skille
- `SkillPassiveLibrary.json` — pasywne Damage / Health za posiadanie skilla
- `SkillLibrary.json` — cooldown, duration, active Damage / Health
- `AscensionConfigsLibrary.json`
- `ManualSpriteMapping.json` + SkillIcons sheets

## Itemy
- `ItemBalancingLibrary.json` — bazowe staty Age/Tier
- dominująca wartość per Age jest użyta jako reprezentatywna wartość tieru,
  żeby nie mieszać wyjątkowych/hybrydowych wariantów itemów
- lokalne `*AgeItems.png` — grafiki

## Tech Tree
- `PlayerTechTreePositionLibrary.json` — kolejność i prerequisites
- `PlayerTechTreeNodeValuesLibrary.json` — aktualne wartości 1/5 → 5/5
- `PlayerTechTreeTierLibrary.json` — aktualny koszt i czas
- rekomendacje kolejności: przesłany `Tech Tree Guide.txt`
- jeżeli tekst poradnika i config różnią się, liczba na stronie pochodzi z configu

## Ascension
- `AscensionConfigsLibrary.json` — mnożniki mocy ×50 / ×2500 / ×125000
- koszty / recovery targets: oficjalny Discord Comprehensive Ascension Guide dostarczony przez użytkownika
- wykres używa prawdziwych raw statów i NIE wymusza, aby recovery rarity leżało dokładnie na starej mocy
