<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import { BATTLE_MOVES } from '$lib/fighting/battleCantabileTypes'
  import { speakBattleWords } from '$lib/fighting/battleConversation'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'

  let state = beginFight(
    createFight('bonolenov', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  let language: 'fr' | 'en' = 'fr'
  let owner: FightSide = 'player'

  function advance(frames: number) {
    for (let index = 0; index < frames; index++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  function command(side: FightSide, moveId: string) {
    state = performAuraAttack({ state, side, moveId, kind: 'special', auraCharged: false })
  }
  function talk(side: FightSide) {
    state = speakBattleWords(state, side)
    advance(1)
  }

  export async function showCase(
    phase: 'fresh' | 'dance' | 'prologue' | 'jupiter' | 'metamorphosen',
    locale: 'fr' | 'en' = 'fr',
    side: FightSide = 'player',
  ) {
    language = locale
    owner = side
    state = beginFight(
      createFight(
        side === 'player' ? 'bonolenov' : 'hisoka',
        side === 'opponent' ? 'bonolenov' : 'hisoka',
        { mode: 'versus-local', formatId: 'knockout' },
      ),
    )
    state = {
      ...state,
      player: { ...state.player, x: 24, aura: 100 },
      opponent: { ...state.opponent, x: 64, aura: 100 },
    }
    if (phase === 'dance' || phase === 'prologue') {
      command(owner, BATTLE_MOVES.prologue)
      if (phase === 'prologue') advance(60)
    }
    if (phase === 'jupiter') {
      command(owner, BATTLE_MOVES.jupiter)
      advance(90)
    }
    if (phase === 'metamorphosen') {
      const other = owner === 'player' ? 'opponent' : 'player'
      state = {
        ...state,
        [other]: { ...state[other], x: state[owner].x + (owner === 'player' ? 14 : -14) },
      }
      talk('player')
      talk('opponent')
      advance(180)
      command(owner, BATTLE_MOVES.metamorphosen)
      advance(45)
    }
    await tick()
    return current()
  }
  export function current() {
    return { battle: state[owner].battleCantabile, projectiles: state.projectiles.length }
  }
  onMount(() => Object.assign(window, { bonolenovFixture: { showCase, current, advance } }))
</script>

<main style="max-width: 1200px; margin: 0 auto; padding: 8px;">
  <FightStage
    {state}
    {language}
    showControls={true}
    onAttack={() => {}}
    onThrow={() => {}}
    onCall={() => {}}
    onFinisher={() => command(owner, BATTLE_MOVES.jupiter)}
    onControl={() => {}}
    onTalk={talk}
    onBattleAction={command}
  />
</main>
