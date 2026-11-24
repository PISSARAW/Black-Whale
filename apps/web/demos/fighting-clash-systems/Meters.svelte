<script lang="ts">
  import { auraPsychology, readAuraPsychology } from '$lib/fighting/nenPsychology'
  import { readNenCognitiveLoad, nenMentalFatigueRatio } from '$lib/fighting/nenCognitiveLoad'
  import { currentAuraShares, nenTransferFrames } from '$lib/fighting/nenTransfer'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { isKameoId, kameoDefinition } from '$lib/fighting/kameos/catalogue'
  import type { FightState } from '$lib/fighting/types'
  import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
  import type { MeterKind } from './meterKinds'

  /** Gauges read straight from the engine state of the frame on screen. */
  let { kind, segment, sim }: { kind: MeterKind; segment: BuiltSegment; sim: number } = $props()
  const at = (states: FightState[]) => states[Math.min(states.length - 1, Math.floor(sim))]
  let state = $derived(at(segment.states))
  let twin = $derived(segment.twin ? at(segment.twin.states) : undefined)
  const pct = (v: number) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`
  let aura = $derived(auraPsychology(state, 'player'))
  let read = $derived(readAuraPsychology(state, 'player', 'opponent'))
  let load = $derived(readNenCognitiveLoad(state, 'player'))
  let fatigue = $derived(nenMentalFatigueRatio(state.player))
  const ZONES = ['head', 'torso', 'hands', 'feet'] as const
  const shares = (s: FightState) => currentAuraShares(s.player)
  let kameo = $derived(state.kameos?.player)
</script>

{#if kind === 'psychology'}
  <div class="panel">
    <h4>{fighterDefinition(state.player.id).name.toUpperCase()} · AURA</h4>
    {#each [['PRESSURE', aura.pressure / 100], ['STABILITY', aura.stability], ['INTENT', aura.intent]] as const as [label, value] (label)}
      <div class="row"><span>{label}</span><i><b style={`width:${pct(value)}`}></b></i></div>
    {/each}
    <p>
      {fighterDefinition(state.opponent.id).name.toUpperCase()}'S GYO ·
      {read
        ? `${read.pressure.toUpperCase()}${read.detail ? ` · ${read.detail.stability.toUpperCase()} · ${read.detail.intent.toUpperCase()}` : ''}`
        : 'NOTHING'}
    </p>
  </div>
{:else if kind === 'load'}
  <div class="panel">
    <h4>{fighterDefinition(state.player.id).name.toUpperCase()} · ATTENTION</h4>
    <div class="row">
      <span>LOAD</span><i class:over={load.overloaded}
        ><b style={`width:${pct(load.ratio / 2)}`}></b><em style="left:50%"></em></i
      >
    </div>
    <div class="row">
      <span>FATIGUE</span><i><b class="tired" style={`width:${pct(fatigue)}`}></b></i>
    </div>
    <p class:alert={load.overloaded}>
      {load.overloaded ? 'OVERLOADED · NEW NEN REFUSED' : load.strained ? 'STRAINED' : 'CLEAR'} · {Math.round(
        load.ratio * 100,
      )}% OF CAPACITY
    </p>
  </div>
{:else if kind === 'ryu'}
  {#each [[state, 'top'], ...(twin ? [[twin, 'bottom']] : [])] as const as [s, where] (where)}
    {@const share = shares(s)}
    <div class="panel ryu" class:low={where === 'bottom'}>
      <h4>
        {fighterDefinition(s.player.id).name.toUpperCase()} · {nenTransferFrames(s.player)} FRAMES PER
        SHIFT
      </h4>
      {#each ZONES as zone (zone)}
        <div class="row">
          <span>{zone.toUpperCase()}</span><i
            ><b style={`width:${pct(share?.[zone] ?? 0.25)}`}></b></i
          >
        </div>
      {/each}
    </div>
  {/each}
{:else if kind === 'kameo' && kameo}
  <div class="panel">
    <h4>
      KAMEO · {(isKameoId(kameo.fighter.id)
        ? kameoDefinition(kameo.fighter.id).name
        : kameo.fighter.id
      ).toUpperCase()}
    </h4>
    <p>{kameo.phase.toUpperCase()}</p>
    <div class="row">
      <span>LEADER HP</span><i
        ><b style={`width:${pct(state.player.health / state.player.maxHealth)}`}></b></i
      >
    </div>
  </div>
{/if}

<style>
  .panel {
    position: absolute;
    right: 22px;
    top: 440px;
    width: 330px;
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
  .panel.ryu {
    top: 250px;
  }
  .panel.ryu.low {
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
    width: 120px;
    font-size: 17px;
    color: #c8d3de;
  }
  .row i {
    position: relative;
    flex: 1;
    height: 16px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }
  .row i.over {
    box-shadow: 0 0 14px #ff1e50;
  }
  .row b {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--aura);
    transition: width 0.08s linear;
  }
  .row b.tired {
    background: #9b7bff;
  }
  .row em {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 3px;
    background: #fff;
  }
  p {
    margin: 10px 0 0;
    font-size: 18px;
    color: #fff;
  }
  p.alert {
    color: #ff4d6d;
  }
</style>
