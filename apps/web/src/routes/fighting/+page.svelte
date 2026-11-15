<script lang="ts">
  import { onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import FighterAvatar from '$lib/components/fighting/FighterAvatar.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightFormatPicker from '$lib/components/fighting/FightFormatPicker.svelte'
  import StagePicker from '$lib/components/fighting/StagePicker.svelte'
  import { link, locale } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import {
    beginFight,
    createFight,
    opponentAttack,
    performAuraAttack,
    performThrow,
    tickFight,
  } from '$lib/fighting/engine'
  import { fightingStyle } from '$lib/fighting/fightStyles'
  import { type FightFormatId } from '$lib/fighting/formats'
  import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import {
    EMPTY_INPUT,
    type AttackKind,
    type FightInput,
    type FightState,
    type FighterId,
  } from '$lib/fighting/types'
  import './fighting.css'

  let selectedPlayer: FighterId = 'kurapika'
  let selectedOpponent: FighterId = 'hisoka'
  let selectedStage: FightStageId = DEFAULT_FIGHT_STAGE
  let selectedFormat: FightFormatId = 'heavens-arena'
  let state: FightState | null = null
  let input: FightInput = { ...EMPTY_INPUT }
  let aiClock = 0
  let paused = false
  let language: 'fr' | 'en'

  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: copy =
    language === 'fr'
      ? {
          eyebrow: 'NOUVEAU MODE · DUEL 2D',
          title: 'Black Whale: Clash',
          intro:
            'Choisis ton combattant, maîtrise son aura et impose-toi avant la fin du chronomètre.',
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
          jump: 'Z ou ↑ : saut · S ou ↓ : bas · Maj/I : garde',
          attacks:
            'J : rapide · K : puissante · U : projectile · relâcher L : Hatsu (maintenir : In)',
          aura: 'Bas + J/K : coups bas · saut + J/K : aériens · O : projection/déprojection · combo sur touche J → K → L. Espace : Aura. Maintenir pour Ren ; combiner avec garde, bas ou haut ; relâcher pendant un coup pour Ko.',
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
          jump: 'W or ↑: jump · S or ↓: down · Shift/I: guard',
          attacks: 'J: quick · K: heavy · U: projectile · release L: Hatsu (hold: In)',
          aura: 'Down + J/K: lows · jump + J/K: aerials · O: throw/tech · on-hit combo J → K → L. Space: Aura. Hold for Ren; combine with guard, down or up; release during a strike for Ko.',
        }

  function previewFighter(id: FighterId) {
    return createFight(id, id).player
  }

  function setOpponent(id: FighterId) {
    selectedOpponent = id
  }

  function prepareFight() {
    state = createFight(selectedPlayer, selectedOpponent, selectedFormat)
    input = { ...EMPTY_INPUT }
    aiClock = 0
    paused = false
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
    paused = false
  }

  function attack(kind: AttackKind) {
    if (state && !paused) {
      state = performAuraAttack({ state, side: 'player', kind, auraCharged: input.aura })
    }
  }

  function throwAttack() {
    if (state && !paused) state = performThrow(state, 'player')
  }

  function control(key: keyof FightInput, active: boolean) {
    if (paused) return
    input = { ...input, [key]: active }
  }

  function winnerLabel(current: FightState): string {
    if (current.winner === 'draw') return copy.draw
    return current.winner === 'player' ? copy.victory : copy.defeat
  }

  function finishLabel(current: FightState): string {
    if (current.finishReason === 'time') return 'TIME'
    if (current.finishReason === 'hits') return language === 'fr' ? '3 COUPS' : '3 HITS'
    return 'K.O.'
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
    ArrowDown: 'down',
    s: 'down',
    Shift: 'guard',
    i: 'guard',
    ' ': 'aura',
  }

  const attackKeys: Record<string, AttackKind> = {
    j: 'light',
    k: 'heavy',
    u: 'ranged',
  }

  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (handleHatsuKey(event, active, key)) return
    const movement = movementKeys[key]
    if (movement) {
      event.preventDefault()
      control(movement, active)
      return
    }
    if (!active || event.repeat) return
    handleActionKey(key)
  }

  function handleActionKey(key: string) {
    if (key === 'p' && state?.phase === 'fighting') return togglePause()
    if (paused) return
    if (key === 'o') return throwAttack()
    const attackKind = attackKeys[key]
    if (attackKind) return attack(attackKind)
    if (key === 'Enter' && state?.phase === 'ready') startFight()
  }

  function togglePause() {
    paused = !paused
    input = { ...EMPTY_INPUT }
  }

  function handleHatsuKey(event: KeyboardEvent, active: boolean, key: string): boolean {
    if (key !== 'l') return false
    event.preventDefault()
    if (active && !event.repeat) control('hatsu', true)
    if (!active) {
      attack('special')
      control('hatsu', false)
    }
    return true
  }

  onMount(() => {
    let frame = 0
    let last = performance.now()
    const keydown = (event: KeyboardEvent) => handleKey(event, true)
    const keyup = (event: KeyboardEvent) => handleKey(event, false)
    const release = () => (input = { ...EMPTY_INPUT })
    const visibility = () => {
      if (document.hidden && state?.phase === 'fighting') paused = true
      release()
    }
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (state?.phase === 'fighting' && !paused) {
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
    document.addEventListener('visibilitychange', visibility)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', visibility)
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
    <section
      class="selection-panel"
      aria-label={language === 'fr' ? 'Sélection des combattants' : 'Fighter selection'}
    >
      <div class="selection-column">
        <p class="selection-label"><span>01</span>{copy.player}</p>
        <div class="roster-grid">
          {#each FIGHTING_ROSTER as fighter (fighter.id)}
            {@const style = fightingStyle(fighter.id)}
            <button
              type="button"
              class:selected={selectedPlayer === fighter.id}
              aria-pressed={selectedPlayer === fighter.id}
              title={language === 'fr' ? style.descriptionFr : style.descriptionEn}
              onclick={() => (selectedPlayer = fighter.id)}
            >
              <span class="portrait">
                {#if selectedPlayer === fighter.id}
                  <FighterAvatar fighter={previewFighter(fighter.id)} preview />
                {:else}
                  <span class="roster-monogram" style={`--fighter:${fighter.colour}`}>
                    {fighter.name.slice(0, 1)}
                  </span>
                {/if}
              </span>
              <strong>{fighter.name}</strong>
              <small
                >{language === 'fr' ? fighter.titleFr : fighter.titleEn} · {language === 'fr'
                  ? style.nameFr
                  : style.nameEn}</small
              >
            </button>
          {/each}
        </div>
      </div>

      <div class="versus" aria-hidden="true"><span>V</span><span>S</span></div>

      <div class="selection-column opponent-selection">
        <p class="selection-label"><span>02</span>{copy.opponent}</p>
        <div class="roster-grid">
          {#each FIGHTING_ROSTER as fighter (fighter.id)}
            {@const style = fightingStyle(fighter.id)}
            <button
              type="button"
              class:selected={selectedOpponent === fighter.id}
              aria-pressed={selectedOpponent === fighter.id}
              title={language === 'fr' ? style.descriptionFr : style.descriptionEn}
              onclick={() => setOpponent(fighter.id)}
            >
              <span class="portrait">
                {#if selectedOpponent === fighter.id}
                  <FighterAvatar fighter={previewFighter(fighter.id)} preview />
                {:else}
                  <span class="roster-monogram" style={`--fighter:${fighter.colour}`}>
                    {fighter.name.slice(0, 1)}
                  </span>
                {/if}
              </span>
              <strong>{fighter.name}</strong>
              <small
                >{language === 'fr' ? style.nameFr : style.nameEn} · {language === 'fr'
                  ? fighter.specialFr
                  : fighter.specialEn}</small
              >
            </button>
          {/each}
        </div>
      </div>
    </section>

    <StagePicker selected={selectedStage} {language} onSelect={(id) => (selectedStage = id)} />
    <FightFormatPicker
      selected={selectedFormat}
      {language}
      onSelect={(id) => (selectedFormat = id)}
    />

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
      <FightStage
        {state}
        {language}
        stageId={selectedStage}
        onAttack={attack}
        onThrow={throwAttack}
        onControl={control}
      />

      {#if state.phase === 'fighting'}
        <button type="button" class="pause-fight" aria-pressed={paused} onclick={togglePause}>
          {paused ? (language === 'fr' ? 'Reprendre' : 'Resume') : 'Pause'}
        </button>
      {/if}

      {#if paused && state.phase === 'fighting'}
        <div class="match-overlay pause-overlay">
          <p>{language === 'fr' ? 'COMBAT EN PAUSE' : 'FIGHT PAUSED'}</p>
          <h2>{language === 'fr' ? 'PAUSE' : 'PAUSED'}</h2>
          <button type="button" onclick={togglePause}>
            {language === 'fr' ? 'Reprendre' : 'Resume'}
          </button>
        </div>
      {/if}

      {#if state.phase === 'ready'}
        <div class="match-overlay ready-overlay">
          <p>
            {fighterDefinition(state.player.id).name} <span>VS</span>
            {fighterDefinition(state.opponent.id).name}
          </p>
          <h2>{copy.ready}</h2>
          <button type="button" onclick={startFight}>{copy.fight}</button>
        </div>
      {:else if state.phase === 'finished'}
        <div class="match-overlay result-overlay">
          <p>{finishLabel(state)}</p>
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
