<script lang="ts">
  import { t } from '$lib/i18n'
  import { cssInk, owlSaw, theLosingBranch, OWL_COLOUR, type AnswerCard, type MorenaGame, type QuestionCard } from '$lib/tour/morena'
  import MorenaCard from './MorenaCard.svelte'

  interface Props {
    game: MorenaGame
    nameOfCard: (card: AnswerCard) => string
  }

  let { game, nameOfCard }: Props = $props()
  const copy = $derived($t.tour.morena)
  const losing = $derived(theLosingBranch(game))
  const filmed = $derived(owlSaw(game))
  const verse = $derived(losing ? (copy.hatsu.ghost.verse as Record<string, string[]>)[losing] ?? [] : [])
  const questionLabel = (question: QuestionCard) =>
    (copy.questions as Record<string, { short: string }>)[question]?.short ?? question
</script>

{#if game.phase !== 'over'}
  <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70" aria-live="polite">{copy.round(game.asked.length, game.hand.length)}</p>
{/if}

{#if game.manipulated}
  <div class="mt-3 rounded border border-[#9d65d0]/70 bg-[#9d65d0]/10 p-3">
    <p class="text-[10px] uppercase tracking-widest text-[#c7a5e8]">{copy.hatsu.narrowed.title}</p>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/80">{game.ending === 'abandoned' ? copy.hatsu.narrowed.leaving : copy.hatsu.narrowed.cheating}</p>
  </div>
{/if}

{#if game.read || game.foreseen || game.forged || game.shielded || game.proxied}
  <ul class="mt-3 space-y-1 text-xs leading-snug text-[#8ecae6]">
    {#if game.read}<li>{copy.hatsu.read}</li>{/if}
    {#if game.foreseen}<li>{copy.hatsu.foreseen(nameOfCard(game.foreseen))}</li>{/if}
    {#if game.forged}<li>{copy.hatsu.forged(nameOfCard(game.forged))}</li>{/if}
    {#if game.shielded}<li class="text-[#FFD700]">{copy.hatsu.shielded}</li>{/if}
    {#if game.proxied}<li>{copy.hatsu.proxied}</li>{/if}
  </ul>
{/if}

{#if game.forced.length}
  <div class="mt-3 rounded border border-[#7dd3fc]/50 bg-[#7dd3fc]/10 p-3">
    <p class="text-[10px] uppercase tracking-widest text-[#7dd3fc]">{copy.hatsu.rewound.title}</p>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/80">{copy.hatsu.rewound.body(game.forced.length)}</p>
  </div>
{/if}

{#if losing}
  <div class="mt-3 rounded border border-[#d8c7ed]/40 bg-[#d8c7ed]/5 p-3">
    <p class="text-[10px] uppercase tracking-widest text-[#d8c7ed]">{copy.hatsu.ghost.title}</p>
    <p class="mt-2 whitespace-pre-line text-xs italic leading-relaxed text-[#FFFFF0]/80">{verse.join('\n')}</p>
    <p class="mt-2 text-[11px] leading-snug text-[#FFFFF0]/45">{copy.hatsu.ghost.body}</p>
  </div>
{/if}

{#if filmed}
  <div class="mt-3 rounded border border-[#a8b7d8]/40 bg-[#a8b7d8]/5 p-3">
    <p class="text-[10px] uppercase tracking-widest text-[#a8b7d8]">{copy.hatsu.owl.title}</p>
    <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">{copy.hatsu.owl.body}</p>
    <div class="mt-2 flex flex-wrap gap-1">
      {#each filmed as question (question)}
        <MorenaCard face={question} label={questionLabel(question)} ink={cssInk(OWL_COLOUR)} state={game.questions.includes(question) ? 'live' : 'spent'} />
      {/each}
    </div>
  </div>
{/if}
