/**
 * The walk's one clock, a second at a time.
 *
 * The walk is only ever allowed one: everything that counts on it counts on
 * the same beat, so nothing in the visit can drift against anything else.
 * What the page hangs on it, in order:
 *
 * - the cast's conduct, and the holds on bodies, which expire on it;
 * - the console's day, counted on the walk's beat and never the reader's clock;
 * - Emperor Time, an hour of life a second, held or not touched — the only way
 *   a price can be one;
 * - a copy's life, on the same exchange: a second of the walk is worth an
 *   hour, so twenty-four of them and the fake is gone;
 * - the visitor's aura reserve (`auraReserve.ts`).
 *
 * Call it during component initialisation: it owns an `$effect`.
 */
export function keepTheBeat(steps: readonly (() => void)[]) {
  $effect(() => {
    const beat = setInterval(() => {
      for (const step of steps) step()
    }, 1000)
    return () => clearInterval(beat)
  })
}
