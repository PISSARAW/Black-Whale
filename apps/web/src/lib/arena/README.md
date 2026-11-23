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
axis. The camera wears the player's own fighter model
([selfBody.ts](selfBody.ts)): its head is not drawn, the body stands just
behind the eyes and turns with them, so looking down shows the chest and feet,
and a guard or a strike lifts its arms into view
([tour/humanFirstPerson.ts](../tour/humanFirstPerson.ts)). The opponent uses the
same shared character rig. Exact named specials are routed through their
per-fighter Arena systems rather than flattened into generic strikes.

### Clash combat grammar in first person

Arena keeps its open room; the duel inside it speaks Clash.

- **Commands** — [moveSlot.ts](moveSlot.ts) reads Clash's stick in first
  person: Space/click light, B heavy, Y special, M throw, P finisher
  (X, C and E stay with Zetsu, Ko and the passage link). Holding
  forward or back picks the forward/back variant; aiming at the legs is Clash's
  "down". U launches a deterministic jump; light and heavy become the authored
  air slots until landing. All fifteen authored slots are reachable.
- **Combos** — [combat/moveChain.ts](../combat/moveChain.ts) applies each
  landed move's authored hitstun, blockstun and knockback (frames at 60 fps,
  lane units at 0.2 m), then opens its `cancelWindow` on `cancelInto` after a
  hit or `cancelOnBlockInto` after a block. A press during the running move is
  buffered for 0.2 s and released on impact.
- **Throws** ignore the active guard window and take an unguarded zone. The
  **finisher** is Arena's combo ender: only against a staggered or downed body.
- **Scoring** — the aura contest still decides blocked or connected, but the
  move's authored damage, after Clash's `tieredComboScale`, caps the impact:
  under 9 at most clean, under 15 at most critical, above that knockdown. Only
  the finisher can knock out. A combo scores once, at its best hit, and a move
  without damage scores nothing. Knockback can carry the opponent out of a
  short move's reach; closing the gap is the player's job, since Clash's lunge
  is not projected yet.
- **Nen** — Arena matches carry `nenRules: 'clash'`
  ([combat/clashNen.ts](../combat/clashNen.ts)). Aura flows at Clash's rates:
  Ten +1.4/s, Ren −4, Ken −8, Zetsu +10, plus Gyo −2.4, In −3, En −9 and
  Shu −4. A Clash move is graded by
  [combat/clashGrade.ts](../combat/clashGrade.ts): the guard command blocks
  (throws excepted); otherwise authored damage × combo scaling × the
  attacker's Nen on the striking limb (Ren ×1.22, Ryu share, Ko +0.82, Zetsu
  0.7) × what the shared `nenDefenceFactor` of
  [nen-engine](../../../../../packages/nen-engine/src/techniques.ts) lets
  through (Zetsu ×1.45). Under 12 clean, under 20 critical, then knockdown.
  Ko no longer strikes by itself: C engages it (20 aura, 2.5 s) on the hands,
  or the feet when aiming low; a jab on that limb is at least critical, a blow
  from another limb is purely physical and every other zone is bare until the
  move lands. A held Ko cannot be redistributed by Ryu. Arena's Ryu stays a
  permanent split, mapped onto Clash's four zones. Nen categories are not
  modelled. Replays recorded before this flag, Hunt duels and Hatsu keep
  Arena's own rules.
- **Nen bar** — [nenDock.ts](nenDock.ts) lays out Clash's techniques above the
  move row: guard, Ten, Ren, Ken, Zetsu, Gyo, In, Ko, Ryu and Hatsu, with what
  is held lit. Ten is lit by default and Ko only once engaged; a resting body
  is drawn in Ten, the Ryu flux only once the split is moved. Gyo sharpens the
  whole view ([ArenaGyoSight](../components/arena/ArenaGyoSight.svelte)) and
  draws nothing in front of the eyes.
- **Opponent** — [aiCombo.ts](aiCombo.ts) opens on an authored ground route and
  follows it inside the cancel window: 1, 3 or 5 moves by difficulty.

Authored lunges now advance progressively during startup on the fighter's local
3D attack axis, stop at bodies and walls, and are checked against Clash's lane
position in the parity gate.

Authored contact hitstop now freezes Arena's combat clock and bodies while
keeping a follow-up command buffered. The POV camera reads the same deterministic
freeze for ranked impact recoil, disabled by reduced-motion preferences.

[combat/fightingHatsu.ts](../combat/fightingHatsu.ts) is the explicit identity gate for twenty neutral
specials, including Chain Jail, Bungee Gum, Cyclotron, Double Machine Gun,
Nen Stitches, Needle People, Cross Game, Biohazard and the Black Whale named
systems whose Arena conditions are already complete. Dynamic or multi-step
slots stay on their authored Clash move until Arena can preserve their exact
condition; Blinky, Jupiter, Skill Hunter and Parallel Future are deliberately
not replaced by a convenient generic effect.

[duelPresence.ts](duelPresence.ts) projects Clash's authored psychology profiles into
what the player can actually read: facial bearing, felt Ren pressure and, under
Gyo, stability and hostile intent. It is presentation-only and consumes the POV
filtered state, so concealed aura stays concealed and replay checksums never gain
private psychology. The opponent's shared Tour figure takes the resulting facial
expression, while `ArenaDuelPresence` lets strong Ren occupy the edge of the
first-person frame. Reduced-motion keeps the pressure static.

[training.ts](training.ts) exposes the same authored startup, active and recovery
frames used by Clash. The optional POV lab inspects the command currently under
the pointer or keyboard focus; static normals also show their measured hit/block
advantage, while dynamic specials deliberately show no invented value. Resolved
exchanges explain confirms, whiffs, safe pressure and punish windows. The six-step
Arena initiation now requires a real authored hit, a two-hit cancel route and an
actually blocked opponent move rather than completing on button presses alone.

Finished Arena replays now include a player-POV coach. It scans the deterministic
timeline once, identifies conservative recovery opportunities and punishments,
then lets the player review the contact or branch from just before the exchange.
The diagnosis never consults concealed intent and is explicitly non-exhaustive.

Still Clash-only, in rough order of value: the remaining dynamic Hatsu; rollback PvP.

`parity.ts` is the migration boundary toward one combat truth. It runs Arena
commands on Clash's 60 Hz cadence and emits a small, presentation-independent
trace of impacts, aura, conditions, scores and positions. `clashParity.ts`
translates the same pilot commands into Clash frames. The first Kurapika versus
Hisoka strike now has an executable parity gate. Its guarded variant shares the
Nen engine's six-frame parry contract, records parry separately from block and
temporarily focuses Ryū on the struck zone before restoring its prior split.

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
