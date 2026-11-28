<script lang="ts">
  import type { QwenDuel } from '$lib/fighting/qwen/duel'
  export let qwen: QwenDuel
  export let language: 'fr' | 'en'
</script>

<aside class="rayxie-status" role="status" aria-label="Rayxie">
  Rayxie · {language === 'fr' ? 'Tu contrôles P1' : 'You control P1'} ·
  {#if $qwen.source.opponent === 'qwen'}
    {$qwen.models.opponent} · {$qwen.plans.opponent?.goal}
  {:else}
    {language === 'fr'
      ? 'Adversaire local · en attente du réseau'
      : 'Local opponent · waiting for the network'}
  {/if}
  · {$qwen.accepted}
  {language === 'fr' ? 'plans reçus' : 'plans received'}
  {#if $qwen.failures || $qwen.stale}
    · {$qwen.failures}
    {language === 'fr' ? 'indisponibilités' : 'failures'}
    · {$qwen.stale}
    {language === 'fr' ? 'réponses périmées' : 'expired replies'}
  {/if}
</aside>

<style>
  .rayxie-status {
    padding: 0.65rem 1rem;
    background: #21152c;
    color: #ead7fa;
    font-size: 0.8rem;
  }
</style>
