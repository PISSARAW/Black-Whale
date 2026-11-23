<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { selectionVoice } from '$lib/fighting/audio/selectionVoice'
  import { FIGHT_FORMATS } from '$lib/fighting/formats'
  import { FIGHT_STAGES } from '$lib/fighting/stages'
  import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
  import { PVP_RULESET, pvpSessionKey, type PvpSession } from '$lib/fighting/pvp/types'
  import FightPreparationSetup from '$lib/components/fighting/FightPreparationSetup.svelte'
  import FightArenaSetup from '$lib/components/fighting/FightArenaSetup.svelte'
  import FightIllumiEquipment from '$lib/components/fighting/FightIllumiEquipment.svelte'
  import FightLsdfSetup from '$lib/components/fighting/FightLsdfSetup.svelte'
  import FightKameoPicker from '$lib/components/fighting/FightKameoPicker.svelte'
  import { chosenKameos } from '$lib/fighting/kameos/selection'
  import { kameoSetupField } from '$lib/fighting/kameos/pvp'
  import type { FighterId } from '$lib/fighting/types'
  import type { FightFormatId } from '$lib/fighting/formats'
  import './pvp.css'
  import { rankingToken } from '$lib/fighting/career/ranking'
  let player: FighterId = 'kurapika',
    opponent: FighterId = 'hisoka'
  let formatId: FightFormatId = 'knockout'
  let rollback = false
  let environment = createFightEnvironment({ arenaInteractions: true })
  let language: 'fr' | 'en'
  let mounted = false
  onMount(() => {
    mounted = true
  })
  let creating = false,
    error = ''
  $: language = $locale === 'fr' ? 'fr' : 'en'
  async function create() {
    creating = true
    error = ''
    try {
      const response = await fetch($link('/fighting/pvp/api/matches'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-clash-profile': rankingToken() },
        body: JSON.stringify({
          ruleset: PVP_RULESET,
          rollback,
          setup: { player, opponent, formatId, environment, ...kameoSetupField($chosenKameos) },
        }),
      })
      const value = await response.json()
      if (!response.ok) throw Error(value.error ?? 'CREATE_FAILED')
      const session = value as PvpSession
      sessionStorage.setItem(pvpSessionKey(session.matchId), session.token)
      if (session.watchHref)
        sessionStorage.setItem(`clash:watch:${session.matchId}`, session.watchHref)
      await goto($link(session.inviteHref))
    } catch (failure) {
      error = failure instanceof Error ? failure.message : 'CREATE_FAILED'
    } finally {
      creating = false
    }
  }
</script>

<svelte:head
  ><title>Clash · PvP privé</title><meta
    name="description"
    content="Crée un duel privé Clash et invite un deuxième joueur."
  /></svelte:head
>
<main class="pvp-page">
  <a href={$link('/fighting')}>{language === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>Clash · {language === 'fr' ? 'Duel privé' : 'Private duel'}</h1>
  <a href={$link('/fighting/pvp/online')}
    >{language === 'fr' ? 'Chercher un adversaire en ligne' : 'Find an online opponent'}</a
  >
  <a href={$link('/fighting/profile')}
    >{language === 'fr' ? 'Profil et saison PvP' : 'Profile and PvP season'}</a
  >
  <p>
    {language === 'fr'
      ? 'Choisis le duel et partage son invitation. Chaque joueur confirme la même configuration avant de commencer.'
      : 'Choose the duel and share its invitation. Both players confirm the same setup before starting.'}
  </p>
  <div class="pvp-setup">
    <label
      >{language === 'fr' ? 'Ton personnage · P1' : 'Your fighter · P1'}<select
        bind:value={player}
        use:selectionVoice={{ locale: language, other: opponent }}
        >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
            >{fighter.name}</option
          >{/each}</select
      ></label
    >
    <label
      >{language === 'fr' ? 'Personnage invité · P2' : 'Guest fighter · P2'}<select
        bind:value={opponent}
        use:selectionVoice={{ locale: language, other: player }}
        >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
            >{fighter.name}</option
          >{/each}</select
      ></label
    >
    <label
      >{language === 'fr' ? 'Règles' : 'Rules'}<select bind:value={formatId}
        >{#each FIGHT_FORMATS as format (format.id)}<option value={format.id}
            >{language === 'fr' ? format.titleFr : format.titleEn}</option
          >{/each}</select
      ></label
    >
    <label
      >{language === 'fr' ? 'Arène' : 'Stage'}<select bind:value={environment.stageId}
        >{#each FIGHT_STAGES as stage (stage.id)}<option value={stage.id}
            >{language === 'fr' ? stage.nameFr : stage.nameEn}</option
          >{/each}</select
      ></label
    >
  </div>
  <FightPreparationSetup
    {environment}
    {player}
    {opponent}
    {language}
    onChange={(next) => (environment = next)}
  />
  <FightArenaSetup {environment} {language} onEnvironment={(next) => (environment = next)} />
  <FightLsdfSetup {environment} {language} onChange={(next) => (environment = next)} />
  <FightIllumiEquipment
    {environment}
    {player}
    {opponent}
    {language}
    onEnvironment={(next) => (environment = next)}
  />
  <FightKameoPicker {language} />
  <label>
    <input type="checkbox" bind:checked={rollback} />
    {language === 'fr'
      ? 'Rollback expérimental · duel privé hors classement'
      : 'Experimental rollback · unranked private duel'}
  </label>
  <button type="button" onclick={create} disabled={!mounted || creating}
    >{language === 'fr' ? 'Créer une invitation' : 'Create invite'}</button
  >
  {#if error}<p role="alert">{error}</p>{/if}
</main>
