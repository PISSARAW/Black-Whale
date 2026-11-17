<script lang="ts">
  import { goto } from '$app/navigation'
  import { link, locale } from '$lib/i18n'
  import FightOnline from '$lib/components/fighting/FightOnline.svelte'
  import { rememberOnlineSession } from '$lib/fighting/online/client'
  import type { PvpSession } from '$lib/fighting/pvp/types'
  import '../pvp.css'
  function play(session: PvpSession) {
    rememberOnlineSession(session)
    void goto($link(`/fighting/pvp/${session.matchId}`))
  }
</script>

<svelte:head
  ><title>Clash · {$locale === 'fr' ? 'Jeu en ligne' : 'Online play'}</title><meta
    name="description"
    content="Matchmaking Clash, séries non classées et classées, identité récupérable et tournois vérifiés."
  /></svelte:head
>
<main class="pvp-page">
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>Clash · {$locale === 'fr' ? 'Jeu en ligne' : 'Online play'}</h1>
  <a href={$link('/fighting/profile')}
    >{$locale === 'fr' ? 'Profil et classement' : 'Profile and standings'}</a
  >
  <FightOnline
    endpoint={$link('/fighting/pvp/online/api')}
    profileEndpoint={$link('/fighting/profile/api')}
    base={$link('/fighting/pvp/online')}
    language={$locale === 'fr' ? 'fr' : 'en'}
    onPlay={play}
  />
</main>
