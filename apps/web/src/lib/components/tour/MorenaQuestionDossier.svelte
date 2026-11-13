<script lang="ts">
  import { t } from '$lib/i18n'
  import { QUESTION_CARDS, type QuestionCard } from '$lib/tour/morena'

  let { discovered }: { discovered: QuestionCard[] } = $props()
  const copy = $derived($t.tour.morena)
</script>

<details class="mt-4 rounded border border-[#333] bg-[#090909]" data-testid="morena-dossier">
  <summary class="cursor-pointer px-3 py-2 text-sm font-semibold text-[#FFD700]">
    {copy.dossier.title} · {copy.dossier.progress(discovered.length)}
  </summary>
  <ol class="space-y-3 border-t border-[#222] p-3">
    {#each QUESTION_CARDS as question (question)}
      <li>
        <p class="text-xs font-semibold text-[#FFFFF0]">{copy.questions[question].title}</p>
        <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/60">
          {discovered.includes(question) ? copy.questions[question].morena : copy.dossier.unknown}
        </p>
      </li>
    {/each}
  </ol>
</details>
