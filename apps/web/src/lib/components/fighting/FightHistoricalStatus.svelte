<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  import { frontierBeat } from '$lib/fighting/heavensDeathMatch/chrolloPlan/phases'
  import { hisokaPhase, type HisokaPhase } from '$lib/fighting/heavensDeathMatch/hisokaPlan/phases'
  import { deathMatchView, type HisokaDeduction } from '$lib/fighting/heavensDeathMatch/knowledge'
  import type { DeathMatchBeat } from '$lib/fighting/heavensDeathMatch/acts'
  import type { DeathMatchState } from '$lib/fighting/heavensDeathMatch/scenario'

  export let scenario: DeathMatchState
  export let language: 'fr' | 'en'
  export let manual = false

  const bindings = useFightBindings()
  type Text = readonly [fr: string, en: string]
  const actions: Partial<Record<HisokaPhase, Text>> = {
    'gum-referee': ['Attacher la gomme à l’arbitre', 'Attach gum to the referee'],
    'cut-referee': ['Frapper l’arbitre', 'Strike the referee'],
    ceiling: ['Se hisser au plafond', 'Pull up to the ceiling'],
    search: ['Se repositionner et observer', 'Reposition and look around'],
    decapitate: ['Décapiter les marionnettes à portée', 'Decapitate puppets in reach'],
    'head-hammer': ['Saisir une tête et la faire tournoyer', 'Grab a head and swing it'],
    'double-head': ['Préparer le contre à deux têtes', 'Prepare the two-head counter'],
    hostage: ['Saisir une marionnette', 'Grab a puppet'],
    'launch-crowd': ['Attacher puis projeter les corps', 'Attach and throw the bodies'],
    'trap-fake': ['Attraper le sosie', 'Catch the double'],
    'five-body-hammer': [
      'Assembler et utiliser le marteau de corps',
      'Build and swing the body hammer',
    ],
    'upper-level': ['Se hisser au balcon', 'Pull up to the balcony'],
    reattach: ['Tenter de rattacher la jambe', 'Try to reattach the leg'],
    'last-stand': [
      'Préparer l’ordre post-mortem et se dégager',
      'Set the post-mortem order and break clear',
    ],
  }
  const aftermath: Partial<Record<DeathMatchBeat, Text>> = {
    'hisoka-asphyxiated': ['Hisoka a succombé à l’asphyxie.', 'Hisoka has died of asphyxia.'],
    'chrollo-declared-winner': ['Chrollo remporte le combat.', 'Chrollo wins the match.'],
    'rescue-arrives': [
      'Dix minutes plus tard, les secours arrivent.',
      'Ten minutes later, the rescuers arrive.',
    ],
    'troupe-gathers': ['Machi rejoint Hisoka.', 'Machi reaches Hisoka.'],
    resuscitation: ['La gomme relance le cœur d’Hisoka.', 'The gum restarts Hisoka’s heart.'],
    'prosthetics-formed': ['Hisoka façonne ses prothèses.', 'Hisoka forms his prostheses.'],
    'machi-bound': ['Hisoka immobilise Machi avec sa gomme.', 'Hisoka binds Machi with his gum.'],
  }
  const deductions: Record<HisokaDeduction, Text> = {
    'book-and-bookmark': [
      'Le signet maintient une capacité pendant que le livre en ouvre une autre.',
      'The bookmark keeps one ability available while the book opens another.',
    ],
    'copies-are-puppets': [
      'Les copies servent de marionnettes.',
      'The copies are being used as puppets.',
    ],
    'copy-count-corrected': [
      'Chrollo a davantage de copies hors de vue.',
      'Chrollo has more copies out of sight.',
    ],
    'marked-copies-persist': [
      'Les copies marquées survivent à la fermeture de Gallery Fake.',
      'Marked copies survive when Gallery Fake closes.',
    ],
    'fake-chrollo': ['Le Chrollo capturé était un sosie.', 'The captured Chrollo was a double.'],
    'head-body-link': [
      'Le lien persiste entre la tête et le corps.',
      'The head is still linked to its body.',
    ],
    'final-plan': [
      'Les marionnettes ferment la nasse avant de détoner.',
      'The puppets close the net before detonating.',
    ],
  }

  $: index = language === 'fr' ? 0 : 1
  $: frontier = frontierBeat(scenario)
  $: action = manual ? contextualPrompt(frontier, hisokaPhase(scenario)) : undefined

  function contextualPrompt(beat: DeathMatchBeat | null, phase: HisokaPhase): Text | undefined {
    if (beat === 'hand-destroyed') return ['Récupérer une tête', 'Retrieve a head']
    if (beat === 'leg-destroyed') return ['Reprendre appui', 'Find your footing']
    return actions[phase]
  }
  $: last = scenario.log.at(-1)?.beat
  $: narration = last ? aftermath[last] : undefined
  $: known = manual ? deathMatchView(scenario, 'hisoka').deductions : []
  $: deduction = known.at(-1)
</script>

{#if narration || action || deduction}
  <div class="historical-status" data-historical-beat={frontier} aria-live="polite">
    {#if narration}
      <strong>{narration[index]}</strong>
    {:else if action}
      <strong
        >{language === 'fr' ? 'Maintenir Contexte' : 'Hold Context'}
        <kbd>{$bindings.playerContext.toUpperCase()}</kbd>
        · {action[index]}</strong
      >
    {/if}
    {#if deduction && !narration}<small>{deductions[deduction][index]}</small>{/if}
  </div>
{/if}

<style>
  .historical-status {
    position: absolute;
    top: 100%;
    left: 50%;
    width: max-content;
    max-width: min(85vw, 32rem);
    transform: translateX(-50%);
    display: grid;
    gap: 0.3rem;
    padding: 0.5rem 0.85rem;
    border: 1px solid #b69b6b77;
    background: #181517ed;
    color: #fff6e5;
    text-align: center;
    pointer-events: none;
  }
  small {
    color: #e9cda0;
  }
</style>
