<script lang="ts">
  /**
   * The report at the end: what each of you believed, when, and what it cost.
   *
   * The same gesture as the rest of the site. A record that belongs to a moment
   * and to a point of view — two columns, because the interesting thing about a
   * ten-minute game is almost never the result, it is the gap between the two
   * accounts of it. The minute he spent searching a room you had left four
   * minutes earlier is the whole of what the prototype is measuring, and it is
   * only visible with both columns side by side.
   *
   * Every line comes out of `telemetry.ts`, which stores kinds and costs rather
   * than sentences: the wording is here and in both languages, and the record
   * itself has no language at all.
   */
  import type { HuntOutcome } from '$lib/hunt/outcome'
  import type { TelemetryEvent, TelemetryKind } from '$lib/hunt/telemetry'
  import { spentBy } from '$lib/hunt/telemetry'
  import type { AuraPool } from '$lib/hunt/aura'

  interface Props {
    report: {
      outcome: HuntOutcome
      clock: number
      log: TelemetryEvent[]
      playerPool: AuraPool
      hunterPool: AuraPool
      laid: number
      sprung: number
      recovered: number
      roomName: (spaceId: string | null) => string
    }
    labels: {
      title: string
      duration: string
      seconds: string
      laid: string
      sprung: string
      recovered: string
      spent: string
      remaining: string
      condition: string
      intact: string
      journal: string
      nothing: string
      actor: { player: string; hunter: string }
      kind: Record<TelemetryKind, string>
    }
    outcomeLabel: string
  }

  let { report, labels, outcomeLabel }: Props = $props()

  let clock = $derived((seconds: number) => {
    const whole = Math.floor(seconds)
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
  })

  let byPlayer = $derived(report.log.filter((event) => event.actor === 'player'))
  let byHunter = $derived(report.log.filter((event) => event.actor === 'hunter'))
</script>

<article class="mx-auto max-w-3xl px-6 py-10 text-white/80">
  <p class="text-xs uppercase tracking-[0.35em] text-white/40">{labels.title}</p>
  <h2 class="mt-2 text-2xl font-medium text-white">{outcomeLabel}</h2>

  <dl class="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 border-y border-white/10 py-4 text-sm sm:grid-cols-3">
    <dt class="text-white/45">{labels.duration}</dt>
    <dd class="tabular-nums sm:col-span-2">{clock(report.clock)}</dd>

    <dt class="text-white/45">{labels.laid}</dt>
    <dd class="tabular-nums sm:col-span-2">
      {report.laid} — {labels.sprung}: {report.sprung}, {labels.recovered}: {report.recovered}
    </dd>

    <dt class="text-white/45">{labels.spent}</dt>
    <dd class="tabular-nums sm:col-span-2">
      {labels.actor.player} {Math.round(spentBy(report.log, 'player'))} ·
      {labels.actor.hunter} {Math.round(spentBy(report.log, 'hunter'))}
    </dd>

    <dt class="text-white/45">{labels.remaining}</dt>
    <dd class="tabular-nums sm:col-span-2">
      {labels.actor.player} {Math.round(report.playerPool.available)} ·
      {labels.actor.hunter} {Math.round(report.hunterPool.available)}
    </dd>

    <dt class="text-white/45">{labels.condition}</dt>
    <dd class="sm:col-span-2">
      {report.hunterPool.available > 0 ? labels.intact : labels.kind.duelClosed}
    </dd>
  </dl>

  <h3 class="mt-10 text-xs uppercase tracking-[0.35em] text-white/40">{labels.journal}</h3>

  {#if report.log.length === 0}
    <p class="mt-4 text-sm text-white/45">{labels.nothing}</p>
  {:else}
    <div class="mt-4 grid gap-8 sm:grid-cols-2">
      {#each [{ who: labels.actor.player, events: byPlayer }, { who: labels.actor.hunter, events: byHunter }] as column (column.who)}
        <section>
          <h4 class="mb-2 text-sm font-medium text-white/70">{column.who}</h4>
          <ol class="space-y-1 text-sm">
            {#each column.events as event, index (index)}
              <li class="flex gap-3 border-b border-white/5 pb-1">
                <span class="w-10 shrink-0 tabular-nums text-white/35">{clock(event.at)}</span>
                <span class="grow">
                  {labels.kind[event.kind]}
                  {#if event.where}
                    <span class="text-white/40">— {report.roomName(event.where)}</span>
                  {/if}
                </span>
                {#if event.cost !== 0}
                  <span class="shrink-0 tabular-nums text-white/40">{Math.round(event.cost)}</span>
                {/if}
              </li>
            {/each}
          </ol>
        </section>
      {/each}
    </div>
  {/if}
</article>
