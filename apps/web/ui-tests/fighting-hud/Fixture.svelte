<script lang="ts">
  import { tick } from 'svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import FightResources from '$lib/components/fighting/FightResources.svelte'
  import FightTrainingOverlay from '$lib/components/fighting/FightTrainingOverlay.svelte'
  import { createFightState } from '$lib/fighting/fightState'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { focusGuardRyu } from '$lib/fighting/nen'
  import type { FightSide, FightState, FighterId } from '$lib/fighting/types'

  let state = createFightState('kurapika', 'hisoka')
  let detailed = false
  let training = false
  let scale = 1.3
  let language: 'fr' | 'en' = 'fr'
  const noop = () => {}

  export function roster() {
    return FIGHTING_ROSTER.map(({ id }) => id)
  }

  function loadedFighter(current: FightState, side: FightSide) {
    const fighter = current[side]
    fighter.on = { grudge: 75, sealFrames: 0 }
    fighter.textureSurprise = { surface: 'cloth' }
    if (fighter.chrolloBook) {
      fighter.chrolloBook = {
        pages: ['sun-and-moon', 'black-voice', ...roster().filter((id) => id !== 'chrollo')],
        page: 3,
        open: true,
        bookmark: 'feitan',
      }
      fighter.hatsuEffects.painPacker = {
        injuries: 123,
        packedDamage: 123,
        armour: true,
        sun: null,
      }
      current[side === 'player' ? 'opponent' : 'player'].hatsuEffects.sunMark = 120
      current[side === 'player' ? 'opponent' : 'player'].hatsuEffects.moonMark = 120
      current[side === 'player' ? 'opponent' : 'player'].hatsuEffects.manipulatedFrames = 120
    }
    if (fighter.kurapika) {
      fighter.kurapika = {
        ...fighter.kurapika,
        emperorTime: true,
        lifespanFrames: 1234567,
        held: {
          victim: side === 'player' ? 'opponent' : 'player',
          source: 'benjamin',
          moveId: 'benjamin:neutralSpecial',
          loaded: true,
          used: false,
          sustainedKeys: [],
        },
      }
      fighter.judgmentChain = { owner: side === 'player' ? 'opponent' : 'player', rule: 'zetsu' }
      fighter.chainJail = { owner: side === 'player' ? 'opponent' : 'player', x: fighter.x, y: 0 }
    }
    if (fighter.hatsuEffects.baton) {
      fighter.hatsuEffects.baton.markedTarget = side === 'player' ? 'opponent' : 'player'
      // The status only needs the existence of the captured projectile.
      fighter.hatsuEffects.baton.card = { id: 1 } as NonNullable<
        typeof fighter.hatsuEffects.baton.card
      >
    }
  }

  export async function renderCase(options: {
    player: FighterId
    opponent: FighterId
    loaded?: boolean
    detailed?: boolean
    training?: boolean
    language?: 'fr' | 'en'
    scale?: number
    suspended?: boolean
  }) {
    state = createFightState(options.player, options.opponent, {
      formatId: 'heavens-arena',
      mode: 'versus-local',
    })
    state.phase = 'fighting'
    state.player = focusGuardRyu(state.player, 'hands')
    state.player.nen.gyo = true
    state.roundsWon = { player: 1, opponent: 1 }
    if (options.loaded) {
      loadedFighter(state, 'player')
      loadedFighter(state, 'opponent')
    }
    if (options.suspended) {
      state.player.nen.mode = 'zetsu'
      state.opponent.nen.mode = 'zetsu'
    }
    detailed = options.detailed ?? false
    training = options.training ?? false
    language = options.language ?? 'fr'
    scale = options.scale ?? 1.3
    await tick()
  }
</script>

<div class="fixture" style={`--hud-scale:${scale}`}>
  <div class="fight-arena">
    <FightHud {state} {language} {detailed} />
    {#if training}<FightTrainingOverlay {state} {language} />{/if}
  </div>
  <FightResources {state} {language} {detailed} onAura={noop} onEmperor={noop} />
</div>

<style>
  :global(body) {
    margin: 0;
    background: #080f15;
  }
  .fixture {
    --hud-font: calc(0.75rem * var(--hud-scale, 1));
    width: min(1380px, 100%);
    margin-inline: auto;
  }
  .fight-arena {
    position: relative;
    height: 420px;
    background: #101923;
  }
</style>
