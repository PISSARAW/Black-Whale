# Arena V2 — Release QA

Status: release candidate.

## Automated acceptance

- 2 attested blueprint terrains, each with derived footprint, collision, cover and spawn points.
- 4 opponent doctrines × 3 difficulty levels × 2 terrains: 24 finite, referee-safe simulations.
- 4 individualized Hatsu contracts: Bungee Gum, Ripper Cyclotron, Double Machine Gun and Battle Cantabile: Jupiter.
- 5 replay-backed trials with objective grading.
- Deterministic replay checksum, subjective perspectives and URL round-trip under the 100 KB guard.
- Keyboard/touch combat, reduced-motion styles and bilingual labels retained.

## Release gates

1. All Arena and combat unit tests pass.
2. Svelte diagnostics contain no Arena error.
3. Unknown terrain ids fall back to the attested Banquet Hall.
4. Invalid or modified replay payloads are rejected by schema and checksum.
5. URL sharing never silently publishes an oversized replay.

## Known limits

- Replay links are self-contained and intentionally capped at 100 KB; there is no server-side replay archive.
- Challenge progress is evaluated at the verdict, not persisted as an account-wide progression system.
- Balance simulations are regression guards, not a claim of final competitive tuning.
