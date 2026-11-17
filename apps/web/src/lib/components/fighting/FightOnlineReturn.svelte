<script lang="ts">
  import { onMount } from 'svelte'
  import { rankingToken } from '$lib/fighting/career/ranking'
  import { onlineRequest } from '$lib/fighting/online/client'
  import type { OnlineView, OnlineSeries } from '$lib/fighting/online/types'
  export let endpoint: string
  export let href: string
  export let matchId: string
  export let language: 'fr' | 'en'
  let series: OnlineSeries | null = null
  let unavailable = false
  onMount(() => {
    let running = false,
      alive = true
    const token = rankingToken()
    async function refresh() {
      if (!token || running) return
      running = true
      try {
        const view = await onlineRequest<OnlineView>({ endpoint, token })
        const found = view.history.find(
          (s) => s.current === matchId || s.games.some((g) => g.id === matchId),
        )
        if (alive) {
          series = found ?? null
          unavailable = false
        }
      } catch {
        if (alive) unavailable = true
      } finally {
        running = false
      }
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 3000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  })
</script>

{#if series}<aside>
    <p>
      {series.players.map((p) => p.name).join(' / ')} · {series.score.join(' : ')} · {language ===
      'fr'
        ? 'Premier à deux matchs'
        : 'First to two matches'}
    </p>
    <a {href}
      >{language === 'fr'
        ? 'Retrouver ma série, son résultat et le match suivant'
        : 'Return to my series, result and next match'}</a
    >
  </aside>{/if}
{#if unavailable}<p role="status">
    {language === 'fr'
      ? 'Suivi de série indisponible. Le verdict doit être conservé par le serveur avant de compter.'
      : 'Series tracking unavailable. The server must retain the verdict before it counts.'}
    <a {href}>{language === 'fr' ? 'Vérifier ma série' : 'Check my series'}</a>
  </p>{/if}

<style>
  aside {
    border: 1px solid #63798a;
    padding: 0.7rem;
    margin: 1rem 0;
  }
  p {
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  a {
    color: #b7d9f2;
  }
</style>
