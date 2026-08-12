<script lang="ts">
  /**
   * The frame budget, over the canvas.
   *
   * Deliberately the plainest surface on the page: no card, no animation, no
   * transition on a number. It is an instrument, and an instrument that redraws
   * prettily is an instrument that has started competing with the thing it
   * measures — the panel is over the same canvas whose cost it is reporting.
   *
   * It renders nothing at all unless `?frames` asked for it, so it is safe to
   * mount unconditionally: the store it reads stays `null` and the whole
   * component is one `{#if}` that does not take.
   *
   * The alert is a colour and a sentence rather than a mark, because what is
   * over budget has to be *named* — "over" alone sends you back to guessing,
   * which is the state this whole instrument exists to end.
   */
  import { BUDGETS, type Overspend } from '$lib/tour/frameBudget'
  import { frameReading } from '$lib/tour/frameBudgetFeed'

  const OVER_LABEL: Record<Overspend, string> = {
    frame: 'image',
    triangles: 'triangles',
    calls: 'appels',
  }

  const counts = new Intl.NumberFormat('fr-FR')
  const millis = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

  const reading = $derived($frameReading)
  const budget = $derived(reading ? BUDGETS[reading.tier] : null)
  const alert = $derived((reading?.over.length ?? 0) > 0)
</script>

{#if reading && budget}
  <!--
    Named and hidden from the accessibility tree on purpose: `id` so that the
    e2e can find it and so that it can be read out of the console on a phone,
    `aria-hidden` because it is an instrument rather than content, and a live
    region that rewrites itself twice a second would be announced twice a
    second to someone who did not ask for a profiler.
  -->
  <div
    id="tour-frame-budget"
    aria-hidden="true"
    class="pointer-events-none absolute left-16 top-3 z-40 max-w-[calc(100%-5rem)] rounded border bg-[#050505]/85 px-2 py-1 font-mono text-[10px] leading-relaxed {alert
      ? 'border-[#ef3340]/70 text-[#ef8a90]'
      : 'border-[#FFD700]/25 text-[#FFFFF0]/70'}"
  >
    <div class="flex flex-wrap items-baseline gap-x-2">
      <span class="uppercase tracking-widest text-[#FFD700]/70">{reading.tier}</span>
      <span>{millis.format(reading.fps)} img/s</span>
      <span>{millis.format(reading.frameMs)} ms / {millis.format(budget.frameMs)}</span>
      <span class="text-[#FFFFF0]/45">pire {millis.format(reading.worstMs)}</span>
      <span class="text-[#FFFFF0]/45">cpu {millis.format(reading.cpuMs)}</span>
      <span>{counts.format(reading.snapshot.calls)} appels</span>
      <span>{counts.format(reading.snapshot.triangles)} tri</span>
      <span class="text-[#FFFFF0]/45">
        {counts.format(reading.snapshot.geometries)} géom · {counts.format(
          reading.snapshot.textures,
        )} tex · {counts.format(reading.snapshot.programs)} prog
      </span>
    </div>
    {#if alert}
      <div class="mt-0.5">
        au-dessus du budget {reading.tier} :
        {reading.over.map((line) => OVER_LABEL[line]).join(', ')}
      </div>
    {/if}
  </div>
{/if}
