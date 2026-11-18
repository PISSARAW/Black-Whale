<script lang="ts">
  import { tick } from 'svelte'
  import { mixedHisokaScenario } from './mixedHisoka'
  import { prosthesisScenario } from './prostheses'
  import type { InjuryPreset } from '$lib/fighting/injuryPreparation'
  import { documentScenario, documentSnapshot } from './documents'
  import { illumiFaceScenario, illumiFaceSnapshot, illumiBookFaceScenario } from './illumiFaces'
  import FightKallutoReceivers from '$lib/components/fighting/FightKallutoReceivers.svelte'
  import FightKallutoSupplies from '$lib/components/fighting/FightKallutoSupplies.svelte'
  import { paperDolls, activePaperOwner } from '$lib/fighting/kallutoSurveillance'
  import { ownedPaperScatters } from '$lib/fighting/kallutoScatter'
  import { createTeamFight, requestTeamAssist } from '$lib/fighting/teamMatch'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import FightSecretWindowStatus from '$lib/components/fighting/FightSecretWindowStatus.svelte'
  import { speakPaperWords } from '$lib/fighting/kallutoListening'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { performArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
  import { toggleEmperorTime } from '$lib/fighting/kurapikaActions'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightPreparationSetup from '$lib/components/fighting/FightPreparationSetup.svelte'
  import FightPreparationStatus from '$lib/components/fighting/FightPreparationStatus.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performAuraAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { createFightEnvironment, type FightEnvironment } from '$lib/fighting/fightEnvironment'
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { EMPTY_INPUT, type FightInput, type FighterId, type FightSide } from '$lib/fighting/types'
  import type { PreparationResource } from '$lib/fighting/preparationTypes'

  let player: FighterId = 'bill'
  let opponent: FighterId = 'hisoka'
  let environment = createFightEnvironment()
  let state = beginFight(createFight(player, opponent, { mode: 'versus-local', environment }))
  let input = { ...EMPTY_INPUT }
  $: presentation = fightSpecialPresentation(state, 'fr')
  function control(key: keyof FightInput, active: boolean) {
    input = { ...input, [key]: active }
    advanceFrame()
  }
  function advanceFrame() {
    state = tickFight(state, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  function reset(next: FightEnvironment) {
    environment = next
    const fresh = beginFight(createFight(player, opponent, { mode: 'versus-local', environment }))
    state = { ...fresh, player: { ...fresh.player, aura: 100 } }
    input = { ...EMPTY_INPUT }
  }
  export async function renderCase(
    id: FighterId,
    resources: PreparationResource[] = [],
    copied = false,
  ) {
    player = id
    opponent = 'hisoka'
    reset(
      createFightEnvironment({
        preparation: {
          mode: resources.length ? 'scenario' : 'duel',
          resources,
          cohorts: id === 'halkenburg' && resources.length ? ['player'] : [],
        },
      }),
    )
    if (copied)
      state = {
        ...state,
        player: {
          ...state.player,
          chrolloBook: { pages: ['melody'], page: 0, open: false, bookmark: 'melody' },
        },
      }
    await tick()
  }
  export async function advance(frames: number) {
    for (let frame = 0; frame < frames; frame++) advanceFrame()
    await tick()
  }
  export async function prepareHisokaProstheses(side: FightSide, preset?: InjuryPreset) {
    state = prosthesisScenario(side, preset)
    player = state.player.id
    opponent = state.opponent.id
    environment = state.environment
    input = { ...EMPTY_INPUT }
    await tick()
  }
  export function prosthesisSnapshot(side: FightSide) {
    const actor = state[side]
    return {
      damage: actor.bodyDamage,
      rubber: actor.gumProstheses,
      skin: actor.textureSurprise,
      target: actor.textureTarget,
      health: actor.health,
      aura: actor.aura,
    }
  }
  export async function preparePaperDocument(side: FightSide) {
    state = documentScenario(side)
    player = state.player.id
    opponent = state.opponent.id
    environment = state.environment
    input = { ...EMPTY_INPUT }
    await tick()
  }
  export function paperSnapshot(side: FightSide) {
    return documentSnapshot(state, side)
  }
  export async function prepareIllumiFace(side: FightSide, pinned: boolean, close = false) {
    state = illumiFaceScenario(side, pinned, close)
    player = state.player.id
    opponent = state.opponent.id
    environment = state.environment
    input = { ...EMPTY_INPUT }
    await tick()
  }
  export function illumiFaceState(side: FightSide) {
    return illumiFaceSnapshot(state, side)
  }
  export async function prepareIllumiBookFace(side: FightSide) {
    state = illumiBookFaceScenario(side)
    player = state.player.id
    opponent = state.opponent.id
    environment = state.environment
    input = { ...EMPTY_INPUT }
    await tick()
  }
  export async function prepareOitoLoan() {
    player = 'kurapika'
    opponent = 'sayird'
    environment = createFightEnvironment({
      preparation: { mode: 'scenario', resources: ['people', 'animals'], cohorts: [] },
    })
    const fresh = beginFight(
      createFight('kurapika', 'sayird', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment,
      }),
    )
    state = {
      ...fresh,
      player: { ...fresh.player, x: 22, aura: 100 },
      opponent: { ...fresh.opponent, x: 27, aura: 30 },
    }
    input = { ...EMPTY_INPUT }
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    for (let index = 0; index < 160; index++) advanceFrame()
    for (let index = 0; index < 80; index++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, right: true },
      })
    state = toggleEmperorTime(state, 'player')
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    await tick()
  }
  export async function prepareHalkenburgScenario() {
    player = 'halkenburg'
    opponent = 'hisoka'
    reset(
      createFightEnvironment({
        preparation: { mode: 'scenario', resources: [], cohorts: ['player'] },
      }),
    )
    state = {
      ...state,
      player: { ...state.player, x: 44 },
      opponent: { ...state.opponent, x: 49 },
    }
    for (let index = 0; index < 480; index++) advanceFrame()
    await tick()
  }
  export async function prepareKallutoGather() {
    player = 'kalluto'
    opponent = 'hisoka'
    reset(createFightEnvironment())
    state = {
      ...state,
      player: { ...state.player, x: 44 },
      opponent: { ...state.opponent, x: 49 },
    }
    castPaper('neutralSpecial')
    const paper = state.battlefield!.entities.find(
      (entry) => entry.paperScatter && entry.id.endsWith(':path:1'),
    )!
    state = {
      ...state,
      player: {
        ...state.player,
        x: paper.x - 2,
        paperKit: { ...state.player.paperKit!, salvos: 0 },
      },
      opponent: { ...state.opponent, x: 90 },
    }
    await tick()
  }
  export async function prepareMixedHisoka(mode: 'book-texture' | 'loan-texture') {
    player = 'chrollo'
    opponent = 'kurapika'
    state = mixedHisokaScenario(mode)
    environment = state.environment
    input = { ...EMPTY_INPUT }
    await tick()
  }
  export async function prepareMusseListening(id: 'musse' | 'benjamin') {
    player = id
    opponent = 'hisoka'
    reset(createFightEnvironment())
    state = { ...state, player: { ...state.player, x: 22 }, opponent: { ...state.opponent, x: 48 } }
    await tick()
  }
  export async function speakToOwl() {
    state = speakPaperWords(state, 'opponent', 'Nous attendons derrière la porte.')
    await tick()
  }
  export async function prepareMusseArchive() {
    player = 'benjamin'
    opponent = 'camilla'
    environment = createFightEnvironment({
      preparation: { mode: 'scenario', resources: ['musse-history'], cohorts: [] },
    })
    state = beginFight(
      createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout', environment }),
    )
    input = { ...EMPTY_INPUT }
    await tick()
  }
  export async function prepareJudgmentInterview() {
    player = 'kurapika'
    opponent = 'hisoka'
    reset(createFightEnvironment())
    state = {
      ...state,
      player: { ...state.player, x: 42, aura: 100 },
      opponent: { ...state.opponent, x: 48 },
    }
    state = performArsenalCommand(state, 'player', { action: 'judgment-preset', target: 'answers' })
    state = toggleEmperorTime(state, 'player')
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:finisher',
      auraCharged: false,
    })
    for (let index = 0; index < 120; index++) advanceFrame()
    await tick()
  }
  export async function prepareDowsingInterview() {
    player = 'kurapika'
    opponent = 'hisoka'
    reset(createFightEnvironment())
    state = {
      ...state,
      player: { ...state.player, x: 42, aura: 100 },
      opponent: { ...state.opponent, x: 48 },
    }
    await tick()
  }
  export async function prepareGumObjectAnchors() {
    player = 'hisoka'
    opponent = 'theta'
    reset(createFightEnvironment({ arenaInteractions: true }))
    state = {
      ...state,
      player: { ...state.player, x: 28.5, aura: 100 },
      opponent: { ...state.opponent, x: 88 },
    }
    state = performArsenalCommand(state, 'player', {
      action: 'gum-anchor-attach',
      target: 'arena:crate:34',
    })
    for (let index = 0; index < 20; index++) advanceFrame()
    for (let index = 0; index < 240 && state.player.x < 59.5; index++)
      state = tickFight(
        state,
        { ...EMPTY_INPUT, right: true, jump: true },
        {
          dt: 1 / 60,
          opponentInput: EMPTY_INPUT,
        },
      )
    for (let index = 0; index < 100 && state.player.y > 0; index++) advanceFrame()
    state = performArsenalCommand(state, 'player', {
      action: 'gum-anchor-attach',
      target: 'arena:crate:66',
    })
    for (let index = 0; index < 20; index++) advanceFrame()
    await tick()
  }
  function castPaper(slot: string) {
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: `kalluto:${slot}`,
      auraCharged: false,
    })
    for (let index = 0; index < 80; index++) advanceFrame()
  }
  export async function prepareKallutoReceivers() {
    player = 'kalluto'
    opponent = 'chrollo'
    state = beginFight(
      createTeamFight({
        player: ['kalluto', 'theta', 'biscuit'],
        opponent: ['hisoka', 'chrollo', 'benjamin'],
      }),
    )
    input = { ...EMPTY_INPUT }
    state = {
      ...state,
      player: { ...state.player, x: 30, aura: 100 },
      opponent: { ...state.opponent, x: 48 },
    }
    castPaper('neutralSpecial')
    castPaper('backSpecial')
    state = requestTeamAssist({ ...state, opponent: { ...state.opponent, x: 93 } }, 'opponent', 1)
    state = {
      ...state,
      player: { ...state.player, x: 30, aura: 100 },
      opponent: { ...state.opponent, x: 48 },
    }
    castPaper('neutralSpecial')
    castPaper('backSpecial')
    state = speakPaperWords(state, 'opponent', 'Paroles près du deuxième papier.')
    state = { ...state, player: { ...state.player, x: 93 } }
    state = speakPaperWords(state, 'player', 'Paroles près du premier papier.')
    await tick()
  }
  export async function reuseKallutoPaper() {
    castPaper('forwardSpecial')
    await tick()
  }
  export function snapshot() {
    return {
      battlefield: state.battlefield,
      equipment: state.player.equipment,
      health: state.opponent.health,
      music: Boolean(state.player.melodyPerformance),
      nocked: state.player.hatsuEffects.arrowNocked,
      listening: state.player.secretWindowListening,
      archive: state.player.hatsuEffects.baton?.musseArchive,
      judgment: state.opponent.judgmentChain,
      playerHeard: state.player.heardWords,
      dowsing: state.player.dowsingReading,
      dowsingPrompt: state.opponent.dowsingPrompt,
      gumAnchors: state.player.gumObjectAnchors,
      casterId: state.player.id,
      halkenburgOrigin: state.player.halkenburgOrigin,
      possession: state.opponent.hatsuEffects.possessedFrames,
      rosterVariant: state.environment.halkenburgRosterVariant === true,
      texture: state.player.textureSurprise,
      gumNetwork: state.gumNetwork,
      aura: state.player.aura,
      donorAura: state.player.dolphinLoan?.held.auraSupply?.amount,
      playerX: state.player.x,
      dolls: paperDolls(state.player),
      paperKit: state.player.paperKit,
      scatters: ownedPaperScatters(state, activePaperOwner(state, 'player')),
    }
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === '6') {
      event.preventDefault()
      control('interact', true)
    }
  }}
  onkeyup={(event) => {
    if (event.key === '6') control('interact', false)
  }}
/>
<main>
  <FightPreparationSetup
    {environment}
    {player}
    opponent={state.opponent.id}
    language="fr"
    onChange={reset}
  />
  <div class="arena">
    {#key `${player}:${opponent}`}<FightScene {state} stageId="heavens-arena" />{/key}
  </div>
  <section class="status">
    <FightPreparationStatus {state} side="player" language="fr" onControl={control} />
    <button
      type="button"
      aria-label="Activer L"
      disabled={!presentation.ready}
      onclick={() => {
        state = performAttack(state, 'player', 'special')
      }}>{presentation.label} · L</button
    >
    <p>{presentation.hint}</p>
    <FightSecretWindowStatus {state} side="player" language="fr" />
    <FightKallutoReceivers {state} side="player" language="fr" />
    <FightKallutoSupplies {state} side="player" language="fr" />
    {#if [player, opponent].some( (id) => ['hisoka', 'chrollo', 'kalluto', 'kurapika', 'musse', 'benjamin', 'halkenburg', 'illumi'].includes(id) ) || state.battlefield?.entities.some((entry) => entry.person)}
      <FightRetrospectiveArsenal
        {state}
        language="fr"
        onUse={(side, command) => {
          state = performArsenalAction({ state, side, command }, performAuraAttack)
        }}
      />
    {/if}
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080e14;
    color: #e0eaf2;
    font: 500 0.8rem/1.5 var(--font-mono);
  }
  main {
    max-width: 1100px;
    margin: auto;
  }
  .arena {
    height: 420px;
    position: relative;
  }
  .status {
    padding: 1rem;
    display: grid;
    gap: 0.5rem;
  }
  button {
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #7894a0;
    background: #18303a;
    color: inherit;
    font: inherit;
  }
  button:disabled {
    opacity: 0.5;
  }
  p {
    overflow-wrap: anywhere;
  }
</style>
