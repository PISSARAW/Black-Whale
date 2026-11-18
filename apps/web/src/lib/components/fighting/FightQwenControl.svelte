<script lang="ts">
  import type { QwenDuel } from '$lib/fighting/qwen/duel'
  export let qwen: QwenDuel
  export let disabled = false
  let checking = false
  let connection = ''
  let configured: Record<'player' | 'opponent', string> | null = null
  async function toggle() {
    if ($qwen.enabled) {
      qwen.setEnabled(false)
      return
    }
    checking = true
    try {
      const response = await fetch('/fighting/qwen')
      const config = await response.json()
      if (response.ok && config.available) {
        configured = config.models
        connection =
          config.models.player === config.models.opponent
            ? config.models.player
            : `${config.models.player} contre ${config.models.opponent}`
        qwen.setEnabled(true)
      } else connection = 'Ollama non configuré côté serveur'
    } catch {
      connection = 'Connexion au serveur indisponible'
    } finally {
      checking = false
    }
  }
</script>

<aside class="qwen-control" aria-label="Qwen · Duel IA contre IA">
  <button
    type="button"
    onclick={toggle}
    disabled={disabled || checking}
    aria-pressed={$qwen.enabled}
  >
    {$qwen.enabled ? 'Arrêter Qwen · IA contre IA' : 'Activer Qwen · IA contre IA'}
  </button>
  {#if $qwen.enabled}
    <span role="status">{connection} · {$qwen.accepted} plans reçus</span>
    {#each ['player', 'opponent'] as seat (seat)}
      {@const side = seat as 'player' | 'opponent'}
      <span
        >{side === 'player' ? 'P1' : 'P2'} : {$qwen.source[side] === 'qwen'
          ? `${$qwen.models[side]} · ${$qwen.plans[side]?.goal} · ${$qwen.plans[side]?.move}`
          : `Contrôleur local · en attente de ${configured?.[side] ?? 'Qwen'}`}</span
      >
    {/each}
    {#if $qwen.failures || $qwen.stale}<span
        >{$qwen.failures} indisponibilités · {$qwen.stale} réponses périmées</span
      >{/if}
  {:else if connection}<span role="status">{connection}</span>{/if}
</aside>

<style>
  .qwen-control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1rem;
    padding: 0.5rem 1rem;
    background: #15111e;
    color: #e8d4f4;
    font: 0.7rem/1.5 var(--font-mono);
  }
  button {
    padding: 0.5rem 0.8rem;
    background: #35243f;
    color: #f4e5ff;
    border: 1px solid #846392;
    cursor: pointer;
    font: inherit;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
