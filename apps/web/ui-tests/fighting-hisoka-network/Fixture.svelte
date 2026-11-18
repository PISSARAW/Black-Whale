<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHisokaLiveGum from '$lib/components/fighting/FightHisokaLiveGum.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performAuraAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { performArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
  import { ownedGumLinks } from '$lib/fighting/bungeeNetwork'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  let state = fresh(),
    generation = 0
  let comfort = defaultFightComfort()
  let audit: { visible: number; finite: boolean } = { visible: 0, finite: true }
  const previous = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previous?.apply(this, args)
    let visible = 0,
      finite = true
    this.traverse((node) => {
      if (!node.name.startsWith('hisoka-bungee-gum') || !node.visible) return
      visible++
      finite = finite && node.position.toArray().every(Number.isFinite)
    })
    audit = { visible, finite }
  }
  onDestroy(() => {
    Scene.prototype.onAfterRender = previous
  })
  function fresh(): FightState {
    const s = beginFight(
      createFight('hisoka', 'illumi', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { stageId: 'vip-casino', arenaInteractions: true },
      }),
    )
    return {
      ...s,
      player: { ...s.player, x: 44, aura: 100 },
      opponent: { ...s.opponent, x: 54, aura: 100 },
    }
  }
  function frames(n: number) {
    for (let i = 0; i < n; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  function use(side: FightSide, command: ArsenalCommand) {
    state = performArsenalCommand(state, side, command)
  }
  export async function scenario(mode: 'network' | 'ceiling' | 'card') {
    state = fresh()
    if (mode === 'network') {
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      })
      frames(90)
      use('player', { action: 'gum-limb', target: 'foot-left' })
      use('player', { action: 'gum-anchor', target: 'floor-back' })
      frames(20)
      use('player', { action: 'gum-anchor', target: 'ceiling' })
      frames(20)
    }
    if (mode === 'ceiling') {
      use('player', { action: 'gum-anchor', target: 'ceiling' })
      frames(20)
      use('player', { action: 'gum-propel' })
      frames(40)
    }
    if (mode === 'card') {
      state = {
        ...state,
        player: { ...state.player, x: 40 },
        opponent: { ...state.opponent, x: 85 },
      }
      use('player', { action: 'gum-prepare-throw' })
      frames(15)
      state = performAttack(state, 'player', 'ranged')
      frames(35)
    }
    generation++
    await tick()
  }
  export async function advance(count: number) {
    frames(count)
    await tick()
  }
  export async function command(action: ArsenalCommand['action'], target?: string) {
    use('player', { action, target })
    await tick()
  }
  export function snapshot() {
    return state
  }
  export function diagnostics() {
    return { ...audit, count: ownedGumLinks(state, 'player').length }
  }
  export async function reduced() {
    comfort = { ...comfort, camera: 0, flashes: false }
    await tick()
  }
  const actions = {
    queueAction(action: (state: FightState) => FightState) {
      state = action(state)
    },
  }
</script>

<main>
  <h1>Hisoka · Bungee Gum</h1>
  {#key generation}
    <div class="stage">
      <FightLiveScene {state} language="fr" {comfort} stageId={state.environment.stageId} />
      <FightHisokaLiveGum {state} language="fr" {actions} />
    </div>
  {/key}
</main>

<style>
  main {
    max-width: 1200px;
    margin: auto;
    padding: 12px;
    color: #f7e5f1;
  }
  h1 {
    font-size: 1rem;
  }
  .stage {
    position: relative;
    height: 620px;
    background: #100b17;
  }
  @media (max-width: 600px) {
    main {
      padding: 4px;
    }
    .stage {
      height: 560px;
    }
  }
</style>
