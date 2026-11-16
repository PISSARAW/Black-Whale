<script lang="ts">
  import {
    blinkyAvailable,
    blinkyState,
    exposedBlinkyWounds,
    type BlinkyTarget,
    type BlinkyCommand,
  } from '$lib/fighting/blinky'
  import type { FightInput, FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onTarget: (side: FightSide, target: BlinkyTarget) => void
  export let onCommand: (side: FightSide, command: BlinkyCommand) => void
  export let onHold: (side: FightSide, key: keyof FightInput, active: boolean) => void
  const sides: FightSide[] = ['player', 'opponent']
  const targets: BlinkyTarget[] = ['bullet', 'card', 'stone', 'needle']
  const commands: BlinkyCommand[] = ['suction', 'eject', 'blood']
  const labels = {
    fr: {
      bullet: 'Balles',
      needle: 'Couteaux et aiguilles',
      card: 'Cartes',
      stone: 'Pierres',
      suction: 'Aspiration',
      eject: 'Rejet',
      blood: 'Sang',
    },
    en: {
      bullet: 'Bullets',
      needle: 'Knives and needles',
      card: 'Cards',
      stone: 'Stones',
      suction: 'Suction',
      eject: 'Ejection',
      blood: 'Blood',
    },
  }
</script>

{#if sides.some((side) => state[side].id === 'shizuku' || blinkyAvailable(state[side]) || state[side].openWounds)}
  <section class="blinky-panel" aria-label="Blinky">
    {#each sides as side (side)}
      {@const fighter = state[side]}
      {@const available = blinkyAvailable(fighter)}
      {@const interactive =
        state.phase === 'fighting' && (side === 'player' || state.mode !== 'versus-ai')}
      {#if fighter.id === 'shizuku' || available || fighter.openWounds}
        <div class="blinky-side">
          <strong
            >{side === 'player' ? 'P1' : state.mode === 'versus-ai' ? 'CPU' : 'P2'} · {fighter.id}</strong
          >
          {#if fighter.id === 'shizuku' || available}
            <label>
              {language === 'fr' ? 'Matière désignée' : 'Designated matter'}
              <select
                aria-label={`${side} ${language === 'fr' ? 'matière désignée' : 'designated matter'}`}
                value={blinkyState(fighter).target}
                disabled={!interactive || Boolean(fighter.attack)}
                onchange={(event) => onTarget(side, event.currentTarget.value as BlinkyTarget)}
              >
                {#each targets as target (target)}<option value={target}
                    >{labels[language][target]}</option
                  >{/each}
              </select>
            </label>
            {#if fighter.id !== 'shizuku'}
              <label
                >{language === 'fr' ? 'Usage copié' : 'Copied use'}
                <select
                  aria-label={`${side} Blinky command`}
                  value={blinkyState(fighter).command ?? 'suction'}
                  disabled={!interactive || Boolean(fighter.attack)}
                  onchange={(event) => onCommand(side, event.currentTarget.value as BlinkyCommand)}
                >
                  {#each commands as command (command)}<option value={command}
                      >{labels[language][command]}</option
                    >{/each}
                </select>
              </label>
            {/if}
            <span
              >{language === 'fr' ? 'Dernière matière' : 'Last matter'} : {blinkyState(fighter)
                .lastWasBlood
                ? labels[language].blood
                : blinkyState(fighter).lastObject
                  ? (labels[language][blinkyState(fighter).lastObject!.shape as BlinkyTarget] ??
                    blinkyState(fighter).lastObject!.shape)
                  : '—'}</span
            >
            <small
              >{language === 'fr'
                ? side === 'player'
                  ? 'L : aspirer · ↓ L : bas · → L : frapper · ← L : rejeter · H : sang'
                  : ', : aspirer · ↓ , : bas · → , : frapper · ← , : rejeter · B : sang'
                : side === 'player'
                  ? 'L: suck · ↓ L: low · → L: strike · ← L: eject · H: blood'
                  : ',: suck · ↓ ,: low · → ,: strike · ← ,: eject · B: blood'}</small
            >
          {/if}
          {#if fighter.openWounds}
            <span
              >{language === 'fr' ? 'Plaies exposées' : 'Exposed wounds'} : {exposedBlinkyWounds(
                fighter,
              )} / {fighter.openWounds}</span
            >
            <button
              type="button"
              aria-pressed={Boolean(fighter.pluggingWounds)}
              disabled={!interactive}
              onpointerdown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                onHold(side, 'plugWounds', true)
              }}
              onpointerup={() => onHold(side, 'plugWounds', false)}
              onpointercancel={() => onHold(side, 'plugWounds', false)}
              onkeydown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault()
                  onHold(side, 'plugWounds', true)
                }
              }}
              onkeyup={(event) => {
                if (event.key === ' ' || event.key === 'Enter') onHold(side, 'plugWounds', false)
              }}
              onblur={() => onHold(side, 'plugWounds', false)}
            >
              {side === 'player' ? 'Y' : '5'} · {language === 'fr'
                ? 'Maintenir pour boucher (2 mains)'
                : 'Hold to plug (2 hands)'}
            </button>
            <small
              >{language === 'fr'
                ? 'Occupe les mains ; aucune guérison. Les plaies se rouvrent au relâchement.'
                : 'Occupies the hands; no healing. Wounds reopen on release.'}</small
            >
          {/if}
        </div>
      {/if}
    {/each}
  </section>
{/if}

<style>
  .blinky-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.6rem 0.8rem;
    color: #dfe6ea;
    background: #111b22;
    border-top: 1px solid #394551;
    font: 0.8rem/1.4 var(--font-mono);
  }
  .blinky-side {
    display: flex;
    flex: 1 1 300px;
    flex-direction: column;
    gap: 0.3rem;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  select,
  button {
    color: #f0e5c9;
    background: #17252e;
    border: 1px solid #68747b;
    padding: 0.35rem;
  }
  button[aria-pressed='true'] {
    background: #64402d;
  }
  small {
    color: #a8b5bc;
  }
</style>
