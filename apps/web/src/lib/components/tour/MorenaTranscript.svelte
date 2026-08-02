<script lang="ts">
  import { t } from '$lib/i18n'
  import { moveFor, type AnswerCard, type Beat, type MorenaGame } from '$lib/tour/morena'

  let {
    game,
    nameOfCard,
  }: {
    game: MorenaGame
    nameOfCard: (card: AnswerCard) => string
  } = $props()

  const copy = $derived($t.tour.morena)
  const visibleLog = $derived(
    game.log.filter((beat: Beat) => beat.kind !== 'marked' || game.phase === 'over'),
  )
  const questionTitle = (question: string) =>
    (copy.questions as Record<string, { title: string }>)[question]?.title ?? question
  const effectLabel = (effect: string) =>
    (copy.hatsu.effects as Record<string, string>)[effect] ?? effect
  const aftermathLabel = (aftermath: string) =>
    (copy.hatsu.aftermath as Record<string, string>)[aftermath] ?? aftermath
</script>

<div class="mt-5 border-t border-[#222] pt-4">
  <h3 class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.log.title}</h3>
  <ol class="mt-2 space-y-1 text-xs leading-snug text-[#FFFFF0]/55">
    {#each visibleLog as beat, i (i)}
      <li>
        {#if beat.kind === 'marked'}
          {copy.log.marked(nameOfCard(beat.card))}
        {:else if beat.kind === 'asked'}
          {copy.log.asked(beat.round, questionTitle(beat.question))}
        {:else if beat.kind === 'taken'}
          {copy.log.taken(beat.round, nameOfCard(beat.card))}
        {:else if beat.kind === 'offered'}
          {copy.log.offered}
        {:else if beat.kind === 'kissed'}
          {copy.log.kissed(nameOfCard(beat.card))}
        {:else if beat.kind === 'declined'}
          {copy.log.declined}
        {:else if beat.kind === 'recovered'}
          {copy.log.recovered(nameOfCard(beat.card))}
        {:else if beat.kind === 'settled'}
          {copy.log.settled(nameOfCard(beat.card))}
        {:else if beat.kind === 'played'}
          <span class:text-[#ef8a90]={beat.seen}>
            {copy.log.played(
              beat.round,
              effectLabel(moveFor(beat.technique).effect),
              beat.seen,
            )}
          </span>
        {:else if beat.kind === 'narrowed'}
          <span class="text-[#c7a5e8]">{copy.log.narrowed(beat.because)}</span>
        {:else if beat.kind === 'exposed'}
          <span class="text-[#ef8a90]">{copy.log.exposed(nameOfCard(beat.card))}</span>
        {:else if beat.kind === 'aftermath'}
          <span class="text-[#8ecae6]">{aftermathLabel(beat.what)}</span>
        {:else if beat.kind === 'rewound'}
          <span class="text-[#7dd3fc]">{copy.log.rewound(beat.cards)}</span>
        {/if}
      </li>
    {/each}
  </ol>
</div>
