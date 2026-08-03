<script lang="ts">
  import type { Crossing, TierPlan } from '$lib/tour/blueprint'
  import type { Space, Vec2 } from '$lib/tour/types'
  import TourMinimap from './TourMinimap.svelte'

  interface DeckOption {
    id: string
    label: string
    active: boolean
  }
  interface Props {
    plan: TierPlan
    position: Vec2
    heading: number
    currentSpaceId: string | null
    decks?: DeckOption[]
    crossings?: Crossing[]
    nameOf?: (entity: Space | { name: string; nameFr: string } | undefined) => string
    crossingLabel?: (crossing: Crossing) => string
    selectLabel?: (room: string) => string
    onSelectDeck?: (id: string) => void
    onSelectPlan?: (space: Space) => void
  }

  import { locale } from '$lib/i18n'
  import { t } from '$lib/i18n'

  let {
    plan,
    position,
    heading,
    currentSpaceId,
    decks = [],
    crossings = [],
    nameOf = (entity: Space | { name: string; nameFr: string } | undefined) => {
      if (!entity) return ''
      return $locale === 'fr' ? entity.nameFr : entity.name
    },
    crossingLabel = () => '',
    selectLabel = (room: string) => room,
    onSelectDeck,
    onSelectPlan,
  }: Props = $props()

  const french = $derived($locale === 'fr')
  const tierName = (tier: { name: string; nameFr: string }) => (french ? tier.nameFr : tier.name)
  const label = $derived($t.tour.minimap(tierName(plan.tier)))
</script>

<div class="tour-minimap-panel">
  {#if decks.length > 0}
    <nav aria-label="Decks" class="deck-selector">
      <p class="deck-label">{$t.tour.decks}</p>
      <div class="deck-buttons">
        {#each decks as deck (deck.id)}
          <button
            type="button"
            onclick={() => onSelectDeck?.(deck.id)}
            aria-current={deck.active ? 'true' : undefined}
            class="deck-button {deck.active ? 'active' : ''}"
          >
            {deck.label}
          </button>
        {/each}
      </div>
    </nav>
  {/if}

  <TourMinimap
    {plan}
    {position}
    {heading}
    {currentSpaceId}
    {label}
    {crossings}
    {nameOf}
    {crossingLabel}
    {selectLabel}
    onSelect={onSelectPlan}
    aiming={false}
  />
</div>

<style>
  .tour-minimap-panel {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: min(320px, calc(100% - 2rem));
  }
  .deck-selector {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .deck-label {
    margin: 0;
    color: #ffd700;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .deck-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .deck-button {
    border: 1px solid #333;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
    color: rgba(255, 255, 240, 0.7);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .deck-button:hover {
    border-color: rgba(255, 215, 0, 0.5);
    color: #ffd700;
  }
  .deck-button.active {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
  }
</style>
