<script lang="ts">
  import {
    COMBAT_FIGHTERS,
    COMBAT_ROUTES,
    combatRoutesFor,
    combatRoute,
    type CombatFighter,
  } from '$lib/fighting/combatRoutes'
  import type { CombatSchool } from '$lib/fighting/combatSchool'
  import { moveForSlot } from '$lib/fighting/movesets'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  import type { FightState } from '$lib/fighting/types'
  import { DEFAULT_WAKEUP, type WakeupSettings } from '$lib/fighting/combatWakeupPractice'
  import {
    WAKEUP_POSITIONS,
    WAKEUP_REACTIONS,
    WAKEUP_FOLLOWUPS,
    wakeupPracticeLabel,
  } from '$lib/fighting/wakeupPracticeLabels'
  export let school: CombatSchool
  export let language: 'fr' | 'en'
  export let expanded = false
  export let onLaunch: (state: FightState) => void
  export let beforeLaunch: () => void = () => {}
  export let onExit: () => void
  let selected: CombatFighter = $school ? ($school.id.split(':')[0] as CombatFighter) : 'kurapika'
  const bindings = useFightBindings()
  let catalog: HTMLDetailsElement
  let wakeupSettings: WakeupSettings = { ...DEFAULT_WAKEUP }
  $: index = language === 'fr' ? 0 : 1
  $: routes = combatRoutesFor(selected)
  $: current = $school
  $: activeRoute = current && !current.id.endsWith(':defense') ? combatRoute(current.id) : null
  const cues = {
    ready: [
      'Commence la route. Les directions avant / arrière sont relatives à ton personnage.',
      'Start the route. Forward / back directions are relative to your fighter.',
    ],
    wait: ['Attends la confirmation de la touche.', 'Wait for the hit confirmation.'],
    volley: [
      'Rafale en cours : une seule commande, laisse les balles toucher.',
      'Barrage in progress: one command, let the bullets land.',
    ],
    late: [
      'Trop tard pour garantir la suite : réessaie et enchaîne plus tôt.',
      'Too late to guarantee the next hit: retry and continue earlier.',
    ],
    cancel: ['Touche confirmée : enchaîne maintenant.', 'Hit confirmed: continue now.'],
    'link-wait': [
      'Liaison : attends la fin du geste avant le coup suivant.',
      'Link: wait for recovery before the next attack.',
    ],
    link: [
      'Liaison disponible : lance le coup suivant maintenant.',
      'Link available: start the next attack now.',
    ],
    blocked: [
      'La garde ou une touche reçue a interrompu l’essai. Réessaie.',
      'A block or received hit interrupted the attempt. Retry.',
    ],
    wrong: [
      'La suite ou le timing ne correspond pas à cet exercice. Réessaie.',
      'The sequence or timing does not match this exercise. Retry.',
    ],
    dropped: [
      'Combo interrompu : le mannequin a retrouvé la possibilité de se défendre. Réessaie.',
      'Combo dropped: the dummy could defend again. Retry.',
    ],
    complete: ['Exercice réussi !', 'Exercise complete!'],
    'defend-wait': [
      'Garde confirmée : attends la fin du blocage avant de préparer ton léger.',
      'Block confirmed: wait for the end of blockstun before preparing your light.',
    ],
    'defense-late': [
      'L’ouverture de punition est passée. Réessaie.',
      'The punish opening has passed. Retry.',
    ],
    guard: [
      'Maintiens Garde. Le mannequin attaque après une courte préparation.',
      'Hold Guard. The dummy attacks after a short preparation.',
    ],
    punish: [
      'Coup bloqué : relâche la garde et punis avec ton léger pendant sa récupération.',
      'Attack blocked: release guard and punish with your light during recovery.',
    ],
    evade: [
      'Recule dès que le mannequin arme son coup lourd.',
      'Step back as soon as the dummy winds up its heavy.',
    ],
    'whiff-confirm': [
      'Le coup est passé dans le vide. Rentre et lance le premier coup de la route.',
      'The heavy missed. Step in and use the first move of the route.',
    ],
  } as const
  function launch(id: string, demo = false, settings = wakeupSettings) {
    beforeLaunch()
    if (catalog) catalog.open = false
    onLaunch(school.start(id, demo, settings))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }
  function routeText(id: string) {
    const route = combatRoute(id)
    return route.moves
      .map((slot) => moveInputHint(moveForSlot(route.fighter, slot)!.input, $bindings))
      .join(' → ')
  }
</script>

<section
  class="combat-school"
  aria-label={language === 'fr' ? 'École de combat' : 'Combat school'}
  data-fight-scroll
>
  {#if current}
    <div class="active-exercise" aria-live="polite">
      <strong
        >{current.demo
          ? language === 'fr'
            ? 'Démonstration'
            : 'Demonstration'
          : language === 'fr'
            ? 'Exercice'
            : 'Exercise'} · {activeRoute
          ? activeRoute.title[index]
          : language === 'fr'
            ? 'Bloquer puis punir'
            : 'Block and punish'}</strong
      >
      {#if activeRoute}<p class="route">{routeText(activeRoute.id)}</p>
        <details>
          <summary>{language === 'fr' ? 'Conditions de la route' : 'Route conditions'}</summary>
          <p>{moveInputHint(activeRoute.requirement[index], $bindings)}</p>
        </details>
        {#if activeRoute.kind === 'punish' && !activeRoute.whiff}<p>
            {language === 'fr'
              ? 'Travaille ici la route après une grosse ouverture. L’exercice Défense enseigne le timing réel de punition.'
              : 'Practice the route after a large opening here. The Defense exercise teaches actual punish timing.'}
          </p>{/if}
        {#if activeRoute.kind === 'air'}<p>
            {language === 'fr'
              ? 'Saute sur place, attends la descente, puis enchaîne tes deux attaques aériennes.'
              : 'Jump in place, wait until descending, then connect your two air attacks.'}
          </p>{/if}
      {:else}<p>
          {language === 'fr' ? 'Garde' : 'Guard'} : {$bindings.playerGuard} · {language === 'fr'
            ? 'Punition'
            : 'Punish'} : {$bindings.playerLight}
        </p>{/if}
      <p class:complete={current.complete} class:failed={current.failed} role="status">
        {current.wakeup ? wakeupPracticeLabel(current.wakeup, index) : cues[current.cue][index]}
      </p>
      {#if current.wakeup}
        <p>
          {language === 'fr' ? 'Distance après le combo' : 'Distance after the combo'} · {current.wakeup.gap.toFixed(
            1,
          )}
        </p>
      {/if}
      <span
        >{current.step} / {activeRoute?.moves.length ?? 2}
        {#if (activeRoute?.hits?.[current.step] ?? 1) > 1}
          · {language === 'fr' ? 'Impacts de la rafale' : 'Barrage impacts'} : {current.stepHits} / {activeRoute!
            .hits![current.step]}
        {/if}
      </span>
      <div class="actions">
        <button type="button" onclick={() => launch(current!.id, false, current!.wakeupSettings)}
          >{language === 'fr' ? 'Réessayer l’exercice' : 'Retry exercise'}</button
        >
        {#if activeRoute}<button
            type="button"
            onclick={() => launch(current!.id, true, current!.wakeupSettings)}
            >{language === 'fr' ? 'Voir la démonstration' : 'Watch demonstration'}</button
          >{/if}
        <button
          type="button"
          onclick={() => {
            school.exit()
            onExit()
          }}>{language === 'fr' ? 'Terminer l’exercice' : 'Leave exercise'}</button
        >
      </div>
    </div>
  {/if}
  <details bind:this={catalog} open={expanded}>
    <summary
      >{language === 'fr'
        ? `École de combat · ${COMBAT_ROUTES.length} routes et défense`
        : `Combat school · ${COMBAT_ROUTES.length} routes and defense`}</summary
    >
    <label
      >{language === 'fr' ? 'Personnage des exercices' : 'Exercise fighter'}
      <select
        bind:value={selected}
        aria-label={language === 'fr' ? 'Personnage des exercices' : 'Exercise fighter'}
      >
        {#each COMBAT_FIGHTERS as fighter (fighter)}<option value={fighter}
            >{fighterDefinition(fighter).name}</option
          >{/each}
      </select>
    </label>
    <p>
      {language === 'fr'
        ? 'Le mannequin garde après la première touche : une interruption réelle fait échouer la route. La démonstration utilise les mêmes règles, coûts et commandes que toi.'
        : 'The dummy guards after the first hit: a real gap fails the route. Demonstrations use the same rules, costs and commands as you.'}
    </p>
    {#if routes.some((route) => route.wakeup)}
      <fieldset>
        <legend>{language === 'fr' ? 'Jeu à la relevée' : 'Wakeup practice'}</legend>
        <label
          >Position
          <select bind:value={wakeupSettings.position} aria-label="Position">
            {#each Object.entries(WAKEUP_POSITIONS) as [value, label] (value)}
              <option {value}>{label[index]}</option>
            {/each}
          </select>
        </label>
        <label
          >{language === 'fr' ? 'Réaction du défenseur' : 'Defender response'}
          <select
            bind:value={wakeupSettings.reaction}
            aria-label={language === 'fr' ? 'Réaction du défenseur' : 'Defender response'}
          >
            {#each Object.entries(WAKEUP_REACTIONS) as [value, label] (value)}
              <option {value}>{label[index]}</option>
            {/each}
          </select>
        </label>
        <label
          >{language === 'fr' ? 'Suite en démonstration' : 'Demo follow-up'}
          <select
            bind:value={wakeupSettings.followup}
            aria-label={language === 'fr' ? 'Suite en démonstration' : 'Demo follow-up'}
          >
            {#each Object.entries(WAKEUP_FOLLOWUPS) as [value, label] (value)}
              <option {value}>{label[index]}</option>
            {/each}
          </select>
        </label>
      </fieldset>
    {/if}
    <ol>
      {#each routes as route (route.id)}<li>
          <strong>{route.title[index]}</strong>
          <p class="route">{routeText(route.id)}</p>
          <p>{moveInputHint(route.requirement[index], $bindings)}</p>
          <div class="actions">
            <button type="button" onclick={() => launch(route.id)}
              >{language === 'fr' ? 'Pratiquer' : 'Practice'} · {route.title[index]}</button
            >
            <button type="button" onclick={() => launch(route.id, true)}
              >{language === 'fr' ? 'Démontrer' : 'Demonstrate'} · {route.title[index]}</button
            >
          </div>
        </li>{/each}
    </ol>
    <button type="button" onclick={() => launch(`${selected}:defense`)}
      >{language === 'fr' ? 'Défense · bloquer puis punir' : 'Defense · block and punish'}</button
    >
  </details>
</section>

<style>
  .combat-school {
    margin: 0.65rem 0;
    padding: 0.8rem;
    border: 1px solid #526878;
    border-radius: 0.5rem;
    background: #0b1620;
    color: #dce5ea;
    font: 0.85rem/1.5 var(--font-mono);
  }
  summary {
    cursor: pointer;
    color: #f5d25c;
    min-height: 44px;
  }
  .active-exercise {
    border-left: 3px solid #f5d25c;
    padding: 0.4rem 0.7rem;
    margin-bottom: 0.7rem;
  }
  p {
    margin: 0.4rem 0;
  }
  .route {
    font-weight: 700;
    color: #a7dcff;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.4rem 0;
  }
  button,
  select {
    min-height: 44px;
    max-width: 100%;
    padding: 0.5rem;
    border: 1px solid #718b9e;
    background: #172c3c;
    color: white;
    font: inherit;
    cursor: pointer;
  }
  button {
    white-space: normal;
    text-align: left;
  }
  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  ol {
    padding-left: 1.3rem;
  }
  li {
    margin: 0.8rem 0;
  }
  .complete {
    color: #b2f4ae;
  }
  .failed {
    color: #ffb5a5;
  }
</style>
