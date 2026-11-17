# Step 4 network qualification

The [step 4 contract](../../src/lib/fighting/STEP4.md) defines the delivered
protocol and the tests. `reference/2026-11-17.json` summarizes the deterministic
network run and source hashes. Its cases cover 0/50/100/150/300 ms simulated RTT,
jitter, duplicated receipts, skipped views, control generations and sensitive Nen.
The first targeted run passes 379 tests; the isolated network suite passes 3,820
tests in 18 files. The record separately describes global failures caused by the
concurrent combo/AI work and the successful production endpoint checks.

The browser run uses two isolated contexts, the production PvP components and
HTTP adapter, with WebGL deliberately disabled. It verifies reconnect, reload,
real Basho activation, stale-generation rejection and 1440/390/320 px layouts.
It does not measure GPU performance, physical input latency or Internet quality.

Raw Vitest JSON, logs and browser captures are written under `/tmp/black-whale-step4-*`.
Human trials on two machines and a real network remain pending. No full two-player
rollback or matchmaking is claimed by this report.
