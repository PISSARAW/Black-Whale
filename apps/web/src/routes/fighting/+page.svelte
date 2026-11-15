<script lang="ts">
  import { onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import FighterAvatar from '$lib/components/fighting/FighterAvatar.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { link, locale } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import {
    beginFight,
    createFight,
    opponentAttack,
    performAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
  import { EMPTY_INPUT, type AttackKind, type FightInput, type FightState, type FighterId } from '$lib/fighting/types'
  import './fighting.css'

  let selectedPlayer: FighterId = 'kurapika'
  let selectedOpponent: FighterId = 'hisoka'
  let state: FightState | null = null
  let input: FightInput = { ...EMPTY_INPUT }
  let aiClock = 0
  let language: 'fr' | 'en'

  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: copy = language === 'fr'
    ? {
        eyebrow: 'NOUVEAU MODE · DUEL 2D',
        title: 'Black Whale: Clash',
        intro: 'Choisis ton combattant, maîtrise son aura et impose-toi avant la fin du chronomètre.',
        player: 'Ton combattant',
        opponent: 'Adversaire',
        launch: 'Entrer dans l’arène',
        ready: 'PRÊT ?',
        fight: 'COMBATTRE',
        victory: 'VICTOIRE',
        defeat: 'DÉFAITE',
        draw: 'ÉGALITÉ',
        rematch: 'Revanche',
        roster: 'Changer de combattants',
        controls: 'Commandes',
        movement: 'Q / D ou flèches : déplacement',
        jump: 'Z ou ↑ : saut · S ou ↓ : garde',
        attacks: 'J : rapide · K : puissante · L : Hatsu',
        aura: 'Le Hatsu consomme 40 points d’aura.',
      }
    : {
        eyebrow: 'NEW MODE · 2D DUEL',
        title: 'Black Whale: Clash',
        intro: 'Choose your fighter, master their aura and prevail before the timer runs out.',
        player: 'Your fighter',
        opponent: 'Opponent',
        launch: 'Enter the arena',
        ready: 'READY?',
        fight: 'FIGHT',
        victory: 'VICTORY',
        defeat: 'DEFEAT',
        draw: 'DRAW',
        rematch: 'Rematch',
        roster: 'Change fighters',
        controls: 'Controls',
        movement: 'A / D or arrows: move',
        jump: 'W or ↑: jump · S or ↓: block',
        attacks: 'J: quick · K: heavy · L: Hatsu',
        aura: 'Hatsu consumes 40 aura points.',
      }

  function previewFighter(id: FighterId) {
    return createFight(id, id).player
  }

  function setOpponent(id: FighterId) {
    selectedOpponent = id
  }

  function prepareFight() {
    state = createFight(selectedPlayer, selectedOpponent)
    input = { ...EMPTY_INPUT }
    aiClock = 0
  }

  function startFight() {
    if (state) state = beginFight(state)
  }

  function rematch() {
    prepareFight()
    startFight()
  }

  function chooseAgain() {
    state = null
    input = { ...EMPTY_INPUT }
  }

  function attack(kind: AttackKind) {
    if (state) state = performAttack(state, 'player', kind)
  }

  function control(key: keyof FightInput, active: boolean) {
    input = { ...input, [key]: active }
  }

  function winnerLabel(current: FightState): string {
    if (current.winner === 'draw') return copy.draw
    return current.winner === 'player' ? copy.victory : copy.defeat
  }

  const movementKeys: Record<string, keyof FightInput> = {
    ArrowLeft: 'left',
    q: 'left',
    a: 'left',
    ArrowRight: 'right',
    d: 'right',
    ArrowUp: 'jump',
    z: 'jump',
    w: 'jump',
    ArrowDown: 'block',
    s: 'block',
  }

  const attackKeys: Record<string, AttackKind> = {
    j: 'light',
    k: 'heavy',
    l: 'special',
  }

  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const movement = movementKeys[key]
    if (movement) {
      event.preventDefault()
      control(movement, active)
      return
    }
    if (!active || event.repeat) return
    const attackKind = attackKeys[key]
    if (attackKind) attack(attackKind)
    if (key === 'Enter' && state.phase === 'ready') startFight()
  }

  onMount(() => {
    let frame = 0
    let last = performance.now()
    const keydown = (event: KeyboardEvent) => handleKey(event, true)
    const keyup = (event: KeyboardEvent) => handleKey(event, false)
    const release = () => (input = { ...EMPTY_INPUT })
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (state?.phase === 'fighting') {
        state = tickFight(state, input, dt)
        aiClock += dt
        if (aiClock >= 0.34) {
          state = opponentAttack(state)
          aiClock = 0
        }
      }
      frame = requestAnimationFrame(loop)
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', release)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', release)
    }
  })
</script>

<Seo
  title="Black Whale: Clash — Duel 2D"
  description={copy.intro}
  jsonLd={breadcrumbSchema([
    { name: 'Black Whale', path: $link('/') },
    { name: language === 'fr' ? 'Modes jouables' : 'Playable modes', path: $link('/tour/modes') },
    { name: 'Black Whale: Clash', path: $link('/fighting') },
  ])}
/>

<main class="fighting-shell">
  <header class="fight-header">
    <nav aria-label="Breadcrumb" class="fight-breadcrumb">
      <a href={$link('/tour/modes')}>{language === 'fr' ? 'Modes jouables' : 'Playable modes'}</a>
      <span>/</span><span>Clash</span>
    </nav>
    <p class="eyebrow">{copy.eyebrow}</p>
    <h1>{copy.title}</h1>
    <p class="intro">{copy.intro}</p>
  </header>

  {#if !state}
    <section class="selection-panel" aria-label={language === 'fr' ? 'Sélection des combattants' : 'Fighter selection'}>
      <div class="selection-column">
        <p class="selection-label"><span>01</span>{copy.player}</p>
        <div class="roster-grid">
          {#each FIGHTING_ROSTER as fighter (fighter.id)}
            <button
              type="button"
              class:selected={selectedPlayer === fighter.id}
              aria-pressed={selectedPlayer === fighter.id}
              onclick={() => (selectedPlayer = fighter.id)}
            >
              <span class="portrait"><FighterAvatar fighter={previewFighter(fighter.id)} preview /></span>
              <strong>{fighter.name}</strong>
              <small>{language === 'fr' ? fighter.titleFr : fighter.titleEn}</small>
            </button>
          {/each}
        </div>
      </div>

      <div class="versus" aria-hidden="true"><span>V</span><span>S</span></div>

      <div class="selection-column opponent-selection">
        <p class="selection-label"><span>02</span>{copy.opponent}</p>
        <div class="roster-grid">
          {#each FIGHTING_ROSTER as fighter (fighter.id)}
            <button
              type="button"
              class:selected={selectedOpponent === fighter.id}
              aria-pressed={selectedOpponent === fighter.id}
              onclick={() => setOpponent(fighter.id)}
            >
              <span class="portrait"><FighterAvatar fighter={previewFighter(fighter.id)} preview /></span>
              <strong>{fighter.name}</strong>
              <small>{language === 'fr' ? fighter.specialFr : fighter.specialEn}</small>
            </button>
          {/each}
        </div>
      </div>
    </section>

    <div class="selection-summary">
      <div>
        <span style={`--swatch:${fighterDefinition(selectedPlayer).accent}`}></span>
        <strong>{fighterDefinition(selectedPlayer).name}</strong>
      </div>
      <b>VS</b>
      <div>
        <strong>{fighterDefinition(selectedOpponent).name}</strong>
        <span style={`--swatch:${fighterDefinition(selectedOpponent).accent}`}></span>
      </div>
      <button type="button" onclick={prepareFight}>{copy.launch}</button>
    </div>
  {:else}
    <div class="stage-wrap">
      <FightStage {state} {language} onAttack={attack} onControl={control} />

      {#if state.phase === 'ready'}
        <div class="match-overlay ready-overlay">
          <p>{fighterDefinition(state.player.id).name} <span>VS</span> {fighterDefinition(state.opponent.id).name}</p>
          <h2>{copy.ready}</h2>
          <button type="button" onclick={startFight}>{copy.fight}</button>
        </div>
      {:else if state.phase === 'finished'}
        <div class="match-overlay result-overlay">
          <p>{state.winner === 'draw' ? 'TIME' : 'K.O.'}</p>
          <h2>{winnerLabel(state)}</h2>
          <div>
            <button type="button" onclick={rematch}>{copy.rematch}</button>
            <button type="button" class="secondary" onclick={chooseAgain}>{copy.roster}</button>
          </div>
        </div>
      {/if}
    </div>

    <aside class="control-manual">
      <h2>{copy.controls}</h2>
      <p>{copy.movement}</p>
      <p>{copy.jump}</p>
      <p>{copy.attacks}</p>
      <p>{copy.aura}</p>
    </aside>
  {/if}
</main>
