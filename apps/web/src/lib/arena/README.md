# Arena

Arena is split into three deterministic layers:

- `combat/` owns exchanges, KOs, ring-outs and environment intervention.
- `arena/match.ts` owns formats and boss setup. It may end a running combat, but never replaces a terminal combat verdict.
- `arena/replay/` records commands plus the complete match configuration and uses the same referee as the live page.

## Match lifecycle

The page resolves the URL into one `ArenaReplayMatch`, creates the initial state with `initialArenaMatchState`, then calls `applyArenaMatchRules` after every accepted command and simulation tick. `finishRun` is the only local completion path.

Named opponent profiles own their doctrine, difficulty and optional boss rule. The `custom` profile preserves explicit doctrine and difficulty values. Manual changes switch the page back to `custom`.

## Replay V2

Replay V2 stores the format, opponent, challenge, campaign mission and boss rule. A checksum covers the final combat state. The codec can import V1 replays by trying the former first-to-three page rules and then the raw combat-engine rules.

Shared replays are read-only for progression. Branching creates a new recorder; camera and live statistics are reset for the new bout.

## Campaign

Campaign links are full presets: terrain, challenge, doctrine, difficulty, format, opponent and mission id. A challenge advances the campaign only when the completed replay still matches that preset.

## Bridges and PvP

`bridge.ts` defines the session handoff contract for Investigation, Hunt and Infiltration. `pvp/serverMatch.ts` is the authoritative state machine; transport, matchmaking and reconnect policy remain separate integration work.
