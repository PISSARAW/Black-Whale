<script lang="ts">
  import type { NenCause, NenCauseEntry } from '$lib/tour/nenFeedback'

  interface Props {
    entries?: readonly NenCauseEntry[]
    french?: boolean
  }

  let { entries = [], french = false }: Props = $props()

  const sentence = (cause: NenCause) => {
    if (cause.code === 'ACTION_ACCEPTED')
      return french ? `${cause.action} accepté.` : `${cause.action} accepted.`
    if (cause.code === 'ACTION_REFUSED') {
      const reason =
        cause.reason === 'RESERVE_TOO_LOW'
          ? french
            ? 'réserve insuffisante'
            : 'aura reserve too low'
          : cause.reason === 'NODES_SHUT'
            ? french
              ? 'nœuds fermés'
              : 'nodes closed'
            : cause.reason
      return french ? `${cause.action} refusé : ${reason}.` : `${cause.action} refused: ${reason}.`
    }
    if (cause.code === 'EN_CONTACT')
      return french ? `Votre En a touché ${cause.name}.` : `Your En touched ${cause.name}.`
    if (cause.code === 'PRESSURE_WITNESS')
      return french
        ? `${cause.name} a senti votre ${cause.pressure === 'on' ? 'On' : 'Ren'}.`
        : `${cause.name} felt your ${cause.pressure === 'on' ? 'On' : 'Ren'}.`
    if (cause.code === 'EXHAUSTED')
      return french ? 'Épuisement : retour forcé au Ten.' : 'Exhausted: forced back to Ten.'
    if (cause.code === 'SHU_TRACE')
      return french
        ? `Le Shu relâché sur ${cause.objectId} laisse une trace.`
        : `Released Shu on ${cause.objectId} leaves a trace.`
    if (cause.code === 'RUMOR_SPREAD')
      return french
        ? `Une rumeur part de ${cause.spaceId}.`
        : `A rumor spreads from ${cause.spaceId}.`
    return french
      ? `Balayage de sécurité programmé dans ${cause.spaceId}.`
      : `Security sweep scheduled in ${cause.spaceId}.`
  }
</script>

{#if entries.length}
  <ol
    class="pointer-events-none absolute bottom-24 left-3 z-20 w-72 space-y-1 text-[10px] text-[#fffff0]/70"
    aria-live="polite"
    aria-label={french ? 'Journal causal du Nen' : 'Nen cause log'}
  >
    {#each entries as entry (entry.id)}
      <li class="rounded border border-[#8ecae6]/20 bg-[#050505]/80 px-2 py-1">
        {sentence(entry.cause)}
      </li>
    {/each}
  </ol>
{/if}
