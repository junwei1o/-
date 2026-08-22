# Island Explorer RPG Structure

## Layering

`client/src/game/` contains framework-agnostic gameplay rules. It must not import React, DOM, tRPC, or browser storage. The first slice uses plain TypeScript modules rather than introducing a second rendering engine into the existing React learning platform; this preserves the current field-guide UI and makes the RPG mechanics testable before any canvas migration.

## Modules

| Module | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `rpgTypes.ts` | Domain types, enums, immutable state shapes | none | `RpgState`, `Companion`, `Encounter` |
| `rpgData.ts` | Original companion, region, skill and encounter definitions | static data | data records |
| `rpgRewards.ts` | Answer event to energy／coin ledger | answer result + event id | reward delta |
| `rpgBattle.ts` | Turn reducer and damage／cost rules | battle state + action | next battle state |
| `rpgStorage.ts` | Versioned localStorage adapter and validation | Storage-like object | safe `RpgState` |
| `RpgAdventure.tsx` | React shell for exploration, encounter, battle and companion tabs | state + callbacks | accessible UI |

## React integration

`Home.tsx` keeps the existing map, daily challenge, casual quiz, report, wisdom, astronomy and speech settings screens. A new `rpg` screen or route opens `RpgAdventure`; the existing question answer handler emits a typed reward event rather than directly mutating RPG state. A compact resource bar is shared by the RPG screen and challenge completion feedback, but the learning record remains authoritative for correctness statistics.

## State boundaries

The existing `xue-adventure-v1` learning state remains unchanged. RPG state uses `xue-adventure-rpg-v1`, with a schema version and safe fallback. Speech preferences remain under their existing key. The adapter treats malformed, missing, or future-version data as a clean new RPG profile.

## Accessibility contract

Every exploration node, companion action, battle action and capture action is a real button with visible focus. Battle state changes are announced through `aria-live`; disabled skills expose the reason in text; color is never the sole signal; reduced-motion removes decorative movement while preserving state feedback.
