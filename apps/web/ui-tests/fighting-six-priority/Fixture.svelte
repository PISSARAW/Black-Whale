<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import { beginFight, createFight, tickFight, performAuraAttack } from '$lib/fighting/engine'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { COHORT_WILL_FRAMES } from '$lib/fighting/preparationTuning'
  import { emptyBattleCantabile } from '$lib/fighting/battleCantabileTypes'
  import { createKurapika } from '$lib/fighting/kurapika'
  import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from '$lib/fighting/types'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'

  let state = fresh('hinrigh'),
    generation = 0
  let mode = 'hinrigh'
  let comfort = defaultFightComfort()
  let audit: { names: string[]; finite: boolean; corpses: { id: string; rotation: number }[] } = {
    names: [],
    finite: true,
    corpses: [],
  }
  const previous = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previous?.apply(this, args)
    const names: string[] = []
    const corpses: { id: string; rotation: number }[] = []
    let finite = true
    this.traverse((node) => {
      if (!node.visible) return
      finite = finite && node.position.toArray().every(Number.isFinite)
      if (/^prepared:.*corpse$/.test(node.name))
        corpses.push({ id: node.name, rotation: node.rotation.z })
      if (
        /^(roster-guest:|biohazard-(camera|transmitter|gun)$|machi-material-thread:|luini-aperture:|prepared:.*corpse|manga-head:|feitan-umbrella:|historical-weapon:)/.test(
          node.name,
        )
      )
        names.push(node.name)
    })
    audit = { names, finite, corpses }
  }
  onDestroy(() => {
    Scene.prototype.onAfterRender = previous
  })
  function fresh(id: FighterId, opponent: FighterId = 'hisoka'): FightState {
    const s = beginFight(
      createFight(id, opponent, {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: 'vip-casino',
          arenaInteractions: true,
          preparation: {
            mode: 'scenario',
            resources: ['objects', 'rooms', 'cameras', 'hostages', 'corpses'],
            cohorts: ['player'],
          },
        },
      }),
    )
    return { ...s, player: { ...s.player, x: 40, aura: 100 }, opponent: { ...s.opponent, x: 62 } }
  }
  function frames(count: number) {
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  function use(side: FightSide, command: ArsenalCommand) {
    state = performArsenalAction({ state, side, command }, performAuraAttack)
  }
  export async function scenario(
    name:
      | 'hinrigh'
      | 'chrollo'
      | 'halkenburg'
      | 'kurapika'
      | 'machi'
      | 'luini'
      | 'bonolenov'
      | 'illumi'
      | 'illumi-mask'
      | 'leorio'
      | 'feitan',
  ) {
    mode = name
    state = fresh(
      name === 'illumi-mask' ? 'illumi' : name,
      name === 'hinrigh' ? 'theta' : name === 'kurapika' ? 'franklin' : 'hisoka',
    )
    if (name === 'feitan') {
      use('player', { action: 'umbrella-feint' })
      frames(8)
    }
    if (name === 'leorio') {
      use('player', { action: 'weapon-ready' })
      frames(12)
    }
    if (name === 'illumi-mask') {
      use('player', { action: 'illumi-mask', target: 'hisoka' })
      frames(60)
    }
    if (name === 'bonolenov') {
      state = {
        ...state,
        player: {
          ...state.player,
          battleCantabile: {
            ...emptyBattleCantabile(),
            models: {
              hisoka: { frames: 600, spoken: true },
              lynch: { frames: 240, spoken: true },
              zakuro: { frames: 360, spoken: true },
            },
          },
        },
      }
      use('player', { action: 'bono-model', target: 'lynch' })
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'bonolenov:downSpecial',
        auraCharged: false,
      })
      frames(45)
    }
    if (name === 'illumi') {
      state = { ...state, player: { ...state.player, x: 20 } }
      use('player', { action: 'illumi-corpse', target: 'player:corpse' })
      frames(60)
      use('player', { action: 'illumi-corpse-order', target: 'player:corpse|retreat' })
      frames(10)
      use('player', { action: 'illumi-corpse-speak', target: 'player:corpse' })
    }
    if (name === 'hinrigh') {
      state = { ...state, opponent: { ...state.opponent, x: 45 } }
      use('player', { action: 'bio-transform', target: 'kit:camera' })
      frames(20)
      use('player', { action: 'bio-transform', target: 'kit:transmitter' })
      frames(20)
      use('player', { action: 'bio-oyster-hide' })
      use('player', { action: 'bio-transform', target: 'weapon:opponent' })
      frames(20)
    }
    if (name === 'chrollo') {
      state = {
        ...state,
        player: {
          ...state.player,
          chrolloBook: { pages: ['black-voice'], page: 0, open: true, bookmark: null },
        },
      }
      use('player', { action: 'black-roster' })
      frames(65)
    }
    if (name === 'halkenburg') {
      state = {
        ...state,
        player: {
          ...state.player,
          hatsuEffects: { ...state.player.hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
        },
      }
      use('player', { action: 'halkenburg-transfer' })
    }
    if (name === 'kurapika') {
      state = {
        ...state,
        player: {
          ...state.player,
          kurapika: {
            ...createKurapika(),
            emperorTime: true,
            held: {
              victim: 'opponent',
              source: 'franklin',
              moveId: 'franklin:neutralSpecial',
              loaded: true,
              used: false,
              sustainedKeys: [],
            },
          },
        },
      }
      use('player', { action: 'dolphin-loan' })
      frames(24)
    }
    if (name === 'machi') {
      state = {
        ...state,
        player: { ...state.player, health: 60, openWounds: 2 },
        opponent: { ...state.opponent, x: 47 },
      }
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'machi:downSpecial',
        auraCharged: false,
      })
      frames(55)
      use('player', { action: 'machi-length', target: '8' })
      use('player', { action: 'machi-suture', target: 'player' })
      frames(12)
    }
    if (name === 'luini') {
      state = { ...state, player: { ...state.player, x: 20 } }
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'luini:neutralSpecial',
        auraCharged: false,
      })
      frames(20)
      use('player', { action: 'luini-select', target: 'ceiling:player:destination' })
      use('player', { action: 'luini-travel' })
      frames(20)
    }
    generation++
    await tick()
  }
  export function snapshot() {
    return state
  }
  export function diagnostics() {
    return audit
  }
  export async function command(action: ArsenalCommand['action'], target?: string) {
    use('player', { action, target })
    await tick()
  }
  export async function advance(count: number) {
    frames(count)
    await tick()
  }
  export async function reduced() {
    comfort = { ...comfort, camera: 0, flashes: false }
    await tick()
  }
</script>

<main>
  <h1>Clash · {mode}</h1>
  {#key generation}<div class="stage">
      <FightLiveScene {state} language="fr" {comfort} stageId={state.environment.stageId} />
    </div>{/key}
  <FightRetrospectiveArsenal {state} language="fr" onUse={use} />
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
      height: 500px;
    }
  }
</style>
