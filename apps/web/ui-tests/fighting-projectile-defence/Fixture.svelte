<script lang="ts">
  import { tick } from 'svelte'
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performMove,
    tickFight,
  } from '$lib/fighting/engine'
  import { performFranklinAim } from '$lib/fighting/franklinAim'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FighterId } from '$lib/fighting/types'

  type Pattern = 'high' | 'mixed' | 'physical' | 'jump'
  let state = beginFight(createFight('franklin', 'kurapika'))
  let generation = 0
  let pattern: Pattern = 'high'
  let emitted = new SvelteSet<number>()
  let contacts = new SvelteMap<number, { blocked: boolean; parried: boolean; damage: number }>()
  let offence = false
  let maxHeight = 0
  let maxGuard = 0
  const comfort = { ...defaultFightComfort(), camera: 0 as const, graphics: 'low' as const }
  export async function start(options: {
    fighter: FighterId
    pattern: Pattern
    mirrored: boolean
    offence?: boolean
  }) {
    pattern = options.pattern
    offence = options.offence ?? false
    const source = pattern === 'physical' ? 'benjamin' : pattern === 'jump' ? 'hisoka' : 'franklin'
    const base = beginFight(
      createFight(source, options.fighter, { mode: 'versus-ai', formatId: 'knockout' }),
    )
    const { mirrored } = options
    state = {
      ...base,
      player: { ...base.player, x: mirrored ? 90 : 10, facing: mirrored ? -1 : 1, aura: 100 },
      opponent: { ...base.opponent, x: mirrored ? 10 : 90, facing: mirrored ? 1 : -1 },
    }
    if (pattern === 'mixed')
      state = performFranklinAim({
        state,
        side: 'player',
        command: { action: 'franklin-aim', target: 'sweep' },
      })
    state =
      pattern === 'physical' || pattern === 'jump'
        ? performAttack(state, 'player', 'ranged')
        : performMove({
            state,
            side: 'player',
            action: pattern === 'mixed' ? 'finisher' : 'special',
          })
    emitted = new SvelteSet()
    contacts = new SvelteMap()
    maxHeight = 0
    maxGuard = 0
    generation++
    await tick()
  }
  export async function advance(frames: number) {
    for (let frame = 0; frame < frames; frame++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        ai: offence,
        onFrame: (_before, next) => {
          for (const shot of next.projectiles) if (shot.owner === 'player') emitted.add(shot.id)
          if (next.impact?.projectileId && next.impact.attacker === 'player')
            contacts.set(next.impact.sequence, next.impact)
          maxHeight = Math.max(maxHeight, next.opponent.y)
          maxGuard = Math.max(maxGuard, next.opponent.guardFrames)
        },
      })
    await tick()
  }
  export function snapshot() {
    const hits = [...contacts.values()]
    return {
      pattern,
      offence,
      fighter: state.opponent.id,
      frame: state.frame,
      health: state.opponent.health,
      maxHealth: state.opponent.maxHealth,
      emitted: emitted.size,
      hits: hits.length,
      unblocked: hits.filter((hit) => !hit.blocked).length,
      parried: hits.filter((hit) => hit.parried).length,
      damage: hits.reduce((sum, hit) => sum + hit.damage, 0),
      maxHeight,
      maxGuard,
      invulnerability: state.opponent.wakeupInvulnerableFrames,
      blocking: state.opponent.blocking,
      crouching: state.opponent.crouching,
    }
  }
</script>

<main>
  {#key generation}
    <FightScene {state} {comfort} stageId="heavens-arena" hideSecondaryView />
  {/key}
  <FightHud {state} language="fr" />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    min-height: 420px;
  }
</style>
