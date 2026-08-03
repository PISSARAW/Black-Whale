<script lang="ts">
  import { explainRun, type RunInsight } from '$lib/hunt/debriefAnalysis'
  import { measureRun } from '$lib/hunt/metrics'
  import type { HuntOutcome } from '$lib/hunt/outcome'
  import type { TelemetryEvent } from '$lib/hunt/telemetry'

  interface Props {
    log: TelemetryEvent[]
    clock: number
    outcome: HuntOutcome
    labels: {
      title: string
      metrics: string
      rooms: string
      zetsu: string
      hatsu: string
      falseTrails: string
      insight: Record<RunInsight, string>
    }
  }

  let { log, clock, outcome, labels }: Props = $props()
  let metrics = $derived(measureRun(log, clock, outcome))
  let insights = $derived(explainRun(metrics))
</script>

<section class="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-4">
  <h3 class="text-xs uppercase tracking-[0.3em] text-white/45">{labels.title}</h3>
  <dl class="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
    <div>
      <dt class="text-white/40">{labels.rooms}</dt>
      <dd>{metrics.roomsVisited}</dd>
    </div>
    <div>
      <dt class="text-white/40">{labels.zetsu}</dt>
      <dd>{Math.round(metrics.timeInZetsu)} s</dd>
    </div>
    <div>
      <dt class="text-white/40">{labels.hatsu}</dt>
      <dd>{metrics.hatsuUses}</dd>
    </div>
    <div>
      <dt class="text-white/40">{labels.falseTrails}</dt>
      <dd>{metrics.falseTrails}</dd>
    </div>
  </dl>
  <h4 class="mt-5 text-xs uppercase tracking-[0.25em] text-white/40">{labels.metrics}</h4>
  <ul class="mt-2 space-y-1 text-sm leading-relaxed text-white/65">
    {#each insights as insight}
      <li>— {labels.insight[insight]}</li>
    {/each}
  </ul>
</section>
