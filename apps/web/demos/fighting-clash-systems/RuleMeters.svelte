<script lang="ts">
  import { canBurst } from '$lib/fighting/fightBurst'
  import {
    onOf,
    onRageReady,
    ON_RAGE_GRUDGE,
    ON_RAGE_HEALTH_PERCENT,
  } from '$lib/fighting/onTechnique'
  import { bodyMemoryLabel, BODY_MEMORY_HIT_THRESHOLD } from '$lib/fighting/bodyMemory'
  import { careerMoraleLabel } from '$lib/fighting/career/morale'
  import { nenPsychologyOf, MAX_NEN_PSYCHOLOGY } from '$lib/fighting/nenPsychology'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
  import type { MeterKind } from './meterKinds'

  /** Gauges for the newer combat rules, read from the engine state of the frame on screen. */
  let { kind, segment, sim }: { kind: MeterKind; segment: BuiltSegment; sim: number } = $props()
  const at = (states: FightState[]) => states[Math.min(states.length - 1, Math.floor(sim))]
  let state = $derived(at(segment.states))
  let twin = $derived(segment.twin ? at(segment.twin.states) : undefined)
  const pct = (v: number) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`
  const name = (s: FightState) => fighterDefinition(s.player.id).name.toUpperCase()
  const hp = (s: FightState) => s.player.health / s.player.maxHealth
</script>

{#if kind === 'burst'}
  <div class="panel">
    <h4>{name(state)} · BURST</h4>
    <div class="row">
      <span>AURA</span><i><b style={`width:${pct(state.player.aura / 100)}`}></b></i>
    </div>
    <div class="row"><span>COMBO TAKEN</span><em>{state.player.comboHits} HITS</em></div>
    <p class:alert={(state.player.burstZetsuFrames ?? 0) > 0}>
      {(state.player.burstZetsuFrames ?? 0) > 0
        ? `FORCED ZETSU · ${((state.player.burstZetsuFrames ?? 0) / 60).toFixed(1)} S`
        : state.burstAvailable?.player === false
          ? 'BURST SPENT FOR THIS ROUND'
          : canBurst(state.player)
            ? 'BURST READY'
            : 'ONE BURST PER ROUND'}
    </p>
  </div>
{:else if kind === 'rage'}
  <div class="panel">
    <h4>{name(state)} · LAST STAND</h4>
    <div class="row">
      <span>HP</span><i
        ><b style={`width:${pct(hp(state))}`}></b><s style={`left:${ON_RAGE_HEALTH_PERCENT}%`}
        ></s></i
      >
    </div>
    <div class="row">
      <span>GRUDGE</span><i
        ><b class="grudge" style={`width:${pct(onOf(state.player).grudge / 100)}`}></b><s
          style={`left:${ON_RAGE_GRUDGE}%`}
        ></s></i
      >
    </div>
    <p class:alert={onRageReady(state.player)}>
      {onRageReady(state.player)
        ? 'RAGE · THE NEXT CLEAN HEAVY IS LETHAL'
        : state.player.nen.on
          ? 'ON SWORN'
          : 'UNDER 20% HP · 50 GRUDGE · ON'}
    </p>
  </div>
{:else if kind === 'clash'}
  <div class="panel">
    <h4>KO AGAINST KO</h4>
    {#if state.attackClash}
      <div class="row">
        <span>{name(state)}</span><em>REN {Math.round(state.attackClash.playerRen)}</em>
      </div>
      <div class="row">
        <span>{fighterDefinition(state.opponent.id).name.toUpperCase()}</span><em
          >REN {Math.round(state.attackClash.opponentRen)}</em
        >
      </div>
      <p class="alert">
        {state.attackClash.winner
          ? `${fighterDefinition(state[state.attackClash.winner].id).name.toUpperCase()} PUSHES THROUGH`
          : 'DEAD EVEN'}
      </p>
    {:else}
      <p>TWO KO ON THE SAME FRAME CANCEL OUT</p>
    {/if}
  </div>
{:else if kind === 'body'}
  {@const memory = state.opponent.bodyMemory?.hits ?? {}}
  <div class="panel">
    <h4>{fighterDefinition(state.opponent.id).name.toUpperCase()} · BODY MEMORY</h4>
    {#each [['ARMS', memory.hands ?? 0], ['LEGS', memory.feet ?? 0]] as const as [label, hits] (label)}
      <div class="row">
        <span>{label}</span><i
          ><b
            class:worn={hits >= BODY_MEMORY_HIT_THRESHOLD}
            style={`width:${pct(hits / BODY_MEMORY_HIT_THRESHOLD)}`}
          ></b></i
        >
      </div>
    {/each}
    <p class:alert={Boolean(bodyMemoryLabel(state.opponent, 'en'))}>
      {bodyMemoryLabel(state.opponent, 'en')?.toUpperCase() ?? 'EACH LANDED BLOW IS REMEMBERED'}
    </p>
  </div>
{:else if kind === 'morale'}
  {#each [[state, 'top'], ...(twin ? [[twin, 'bottom']] : [])] as const as [s, where] (where)}
    {@const psyche = nenPsychologyOf(s.player)}
    <div class="panel" class:upper={where === 'top'} class:lower={where === 'bottom'}>
      <h4>{s.careerMorale ? careerMoraleLabel(s.careerMorale, 'en').toUpperCase() : name(s)}</h4>
      {#each [['COMPOSURE', psyche.composure], ['APPREHENSION', psyche.apprehension], ['RESOLVE', psyche.resolve]] as const as [label, value] (label)}
        <div class="row">
          <span>{label}</span><i><b style={`width:${pct(value / MAX_NEN_PSYCHOLOGY)}`}></b></i>
        </div>
      {/each}
    </div>
  {/each}
{/if}

<style>
  .panel {
    position: absolute;
    right: 22px;
    top: 440px;
    width: 340px;
    padding: 14px 16px;
    border: 2px solid rgba(217, 182, 116, 0.8);
    border-radius: 8px;
    background: rgba(5, 7, 11, 0.78);
    color: #fff;
    font:
      20px/1.1 Impact,
      'Arial Black',
      sans-serif;
  }
  .panel.upper {
    top: 250px;
  }
  .panel.lower {
    top: 890px;
  }
  h4 {
    margin: 0 0 10px;
    font-weight: normal;
    color: #d9b674;
    letter-spacing: 1px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0;
  }
  .row span {
    width: 130px;
    font-size: 17px;
    color: #c8d3de;
  }
  .row em {
    font-style: normal;
  }
  .row i {
    position: relative;
    flex: 1;
    height: 16px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }
  .row b {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--aura);
  }
  .row b.grudge,
  .row b.worn {
    background: #ff4d6d;
  }
  .row s {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 3px;
    background: #fff;
  }
  p {
    margin: 10px 0 0;
    font-size: 18px;
  }
  p.alert {
    color: #ff4d6d;
  }
</style>
