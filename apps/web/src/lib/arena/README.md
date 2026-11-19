---
titre: arena
etage: 2
couvre:
  - apps/web/src/lib/arena/**
depend-de: [07-les-modes]
revu-le: 2026-11-15
decisions: [adr-002]
---

# Arena

Arena is split into three deterministic layers:

- `apps/web/src/lib/combat/` owns exchanges, KOs, ring-outs and environment intervention.
- `apps/web/src/lib/arena/match.ts` owns formats and boss setup. It may end a running combat, but never replaces a terminal combat verdict.
- `apps/web/src/lib/arena/replay/` records commands plus the complete match configuration and uses the same referee as the live page.

`FIGHTING_MOVE` is the shared first-person combat bridge. Arena keeps planar
locomotion, walls and aiming, while
[combat/fightingMove.ts](../combat/fightingMove.ts) projects Fighting's authored
startup, reach, recovery, aura cost and strength onto each attacker's local 3D
axis. The page renders the player's roster identity as POV hands and signature
equipment, and the opponent with the matching shared character rig. Hisoka's
special is routed through Arena's persistent Bungee Gum tether rule.

Both roster identities are stored in the match. Each player command also carries
its fighter and move slot, while the opponent AI reuses its recorded roster
moveset. Replay validation therefore never depends on mutable UI state.

## Match lifecycle

The page resolves the URL into one `ArenaReplayMatch`, creates the initial state with `initialArenaMatchState`, then calls `applyArenaMatchRules` after every accepted command and simulation tick. `finishRun` is the only local completion path.

Named opponent profiles own their default doctrine, difficulty and optional boss rule. An authored campaign mission overrides those defaults with its complete match preset; this lets the same named opponent appear at different campaign difficulty levels without invalidating the recorded mission. The `custom` profile preserves explicit doctrine and difficulty values. Manual changes switch the page back to `custom`.

## Replay V2

Replay V2 stores the format, opponent, challenge, campaign mission and boss rule. A checksum covers the final combat state. The codec can import V1 replays by trying the former first-to-three page rules and then the raw combat-engine rules.

Shared replays are read-only for progression. Branching creates a new recorder; camera and live statistics are reset for the new bout.

## Campaign

Campaign links are full presets: terrain, challenge, doctrine, difficulty, format, opponent and mission id. A challenge advances the campaign only when the completed replay still matches that preset.

## Bridges and PvP

`bridge.ts` defines the session handoff contract. Hunt can hand an active duel to Arena; Infiltration can hand off an identified agent who has already completed the required objective. Investigation deliberately has no handoff: its confrontations compare testimony and do not identify a physical opponent.

`/arena/pvp` creates an invite-only match. The HTTP transport authenticates each seat with an opaque session token, rejects client ticks and teleports, and polls snapshots from `AuthoritativeArenaMatch`. The token in session storage supports page reloads while the server process lives. The registry is intentionally in-process: horizontal deployment or restart-safe matches require a shared coordinator before PvP can span several Node processes.
