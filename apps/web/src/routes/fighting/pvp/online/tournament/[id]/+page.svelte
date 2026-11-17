<script lang="ts">
  import { onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import FightOnlineBracket from '$lib/components/fighting/FightOnlineBracket.svelte'
  import type { OnlineTournament, OnlineSeries } from '$lib/fighting/online/types'
  import type { PageData } from './$types'
  import '../../../pvp.css'
  export let data: PageData
  let tournament:
    | (Omit<OnlineTournament, 'joinHash'> & {
        results?: Pick<
          OnlineSeries,
          'id' | 'tournament' | 'score' | 'status' | 'winner' | 'games'
        >[]
      })
    | null = null
  let error = false
  onMount(() => {
    let alive = true,
      running = false
    async function refresh() {
      if (running) return
      running = true
      try {
        const response = await fetch(
          `${$link('/fighting/pvp/online/api')}?tournament=${encodeURIComponent(data.id)}`,
        )
        if (!response.ok) throw Error('UNAVAILABLE')
        const value = await response.json()
        if (alive) {
          tournament = value
          error = false
        }
      } catch {
        if (alive) error = true
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

<svelte:head
  ><title>Clash · {$locale === 'fr' ? 'Tableau en direct' : 'Live bracket'}</title><meta
    name="robots"
    content="noindex"
  /></svelte:head
>
<main class="pvp-page">
  <a href={$link('/fighting/pvp/online')}>{$locale === 'fr' ? 'Jeu en ligne' : 'Online play'}</a>
  <h1>{$locale === 'fr' ? 'Tableau en direct' : 'Live bracket'}</h1>
  <p>
    {$locale === 'fr'
      ? 'Les scores viennent des séries réellement résolues par le serveur. Cette vue ne montre aucune préparation cachée ni ressource privée.'
      : 'Scores come from series actually resolved by the server. This view shows no hidden setup or private resource.'}
  </p>
  {#if tournament}<FightOnlineBracket
      {tournament}
      results={tournament.results ?? []}
      language={$locale === 'fr' ? 'fr' : 'en'}
    />{/if}
  {#if error}<p role="alert">
      {$locale === 'fr'
        ? 'Tableau momentanément indisponible.'
        : 'Bracket temporarily unavailable.'}
    </p>{/if}
</main>
