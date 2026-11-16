<script lang="ts">
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  export let environment: FightEnvironment
  export let language: 'fr' | 'en'
  export let onEnvironment: (environment: FightEnvironment) => void
</script>

<label>
  <input
    type="checkbox"
    checked={environment.arenaInteractions}
    onchange={(event) =>
      onEnvironment({ ...environment, arenaInteractions: event.currentTarget.checked })}
  />
  {language === 'fr'
    ? 'Arène interactive · couverts destructibles et capacités de terrain'
    : 'Interactive arena · destructible cover and terrain abilities'}
</label>
