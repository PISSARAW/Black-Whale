<script lang="ts">
  import { onMount } from 'svelte'
  import {
    RANKING_STORAGE,
    rankingCredential,
    type RankingCredential,
  } from '$lib/fighting/career/ranking'
  import { onlineRequest, onlineError } from '$lib/fighting/online/client'
  import type { OnlineView } from '$lib/fighting/online/types'
  export let endpoint: string
  export let profileEndpoint: string
  export let language: 'fr' | 'en'
  export let onCredential: (credential: RankingCredential) => void
  let credential: RankingCredential | null = null
  let name = '',
    code = '',
    error = '',
    busy = false,
    visible = false
  $: fr = language === 'fr'
  function use(value: RankingCredential) {
    credential = value
    try {
      localStorage.setItem(RANKING_STORAGE, JSON.stringify(value))
    } catch {
      /* downloadable recovery remains available */
    }
    onCredential(value)
  }
  async function recover() {
    busy = true
    error = ''
    try {
      const value = await onlineRequest<OnlineView>({ endpoint, token: code.trim() })
      use({ ...value.profile, token: code.trim() })
      code = ''
    } catch (failure) {
      error = onlineError(failure, language)
    } finally {
      busy = false
    }
  }
  async function register() {
    busy = true
    error = ''
    try {
      const response = await fetch(profileEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) throw Error('UNAVAILABLE')
      use(await response.json())
    } catch (failure) {
      error = onlineError(failure, language)
    } finally {
      busy = false
    }
  }
  function download() {
    if (!credential) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, token: credential.token })], {
        type: 'application/json',
      }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'clash-identity.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
  async function importCode(event: Event) {
    const input = event.currentTarget as HTMLInputElement,
      file = input.files?.[0]
    if (!file) return
    try {
      if (file.size > 2000) throw Error('UNAUTHORIZED')
      const value = JSON.parse(await file.text())
      if (value.version !== 1 || typeof value.token !== 'string' || value.token.length > 100)
        throw Error('UNAUTHORIZED')
      code = value.token
      await recover()
    } catch (failure) {
      error = onlineError(failure, language)
    }
    input.value = ''
  }
  onMount(() => {
    try {
      credential = rankingCredential(localStorage)
      if (credential) onCredential(credential)
    } catch {
      /* Registration and recovery remain available without browser storage. */
    }
  })
</script>

<section aria-label={fr ? 'Identité en ligne' : 'Online identity'}>
  <h2>{fr ? 'Identité en ligne' : 'Online identity'}</h2>
  {#if credential}<p>{credential.name}</p>
    <details>
      <summary>{fr ? 'Conserver mon identité' : 'Keep my identity'}</summary>
      <p>
        {fr
          ? 'Ce code retrouve ton identité sur ce serveur. Conserve-le pour changer de navigateur.'
          : 'This code recovers your identity on this server. Keep it to change browsers.'}
      </p>
      <label
        >{fr ? 'Mon code privé' : 'My private code'}<input
          type={visible ? 'text' : 'password'}
          value={credential.token}
          readonly
          autocomplete="off"
        /></label
      >
      <button type="button" onclick={() => (visible = !visible)}
        >{fr ? 'Afficher ou masquer le code' : 'Show or hide code'}</button
      >
      <button type="button" onclick={download}
        >{fr ? 'Enregistrer mon code' : 'Save my code'}</button
      >
    </details>
  {:else}
    <form
      onsubmit={(event) => {
        event.preventDefault()
        void register()
      }}
    >
      <label
        >{fr ? 'Pseudo en ligne' : 'Online name'}<input
          bind:value={name}
          required
          maxlength="24"
        /></label
      >
      <button disabled={busy}>{fr ? 'Créer mon identité' : 'Create my identity'}</button>
    </form>
  {/if}
  <details>
    <summary>{fr ? 'Récupérer une identité' : 'Recover an identity'}</summary>
    <form
      onsubmit={(event) => {
        event.preventDefault()
        void recover()
      }}
    >
      <label
        >{fr ? 'Code de récupération' : 'Recovery code'}<input
          bind:value={code}
          type="password"
          required
          maxlength="100"
          autocomplete="off"
        /></label
      >
      <button disabled={busy}>{fr ? 'Récupérer mon identité' : 'Recover my identity'}</button>
    </form>
    <label
      >{fr ? 'Importer mon code sauvegardé' : 'Import my saved code'}<input
        type="file"
        accept=".json,application/json"
        onchange={importCode}
      /></label
    >
  </details>
  {#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
  section {
    border: 1px solid #526c7b;
    padding: 1rem;
    margin: 1rem 0;
    min-width: 0;
  }
  label {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.4rem;
    margin: 0.7rem 0;
    min-width: 0;
  }
  input,
  button {
    max-width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    font: inherit;
    padding: 0.5rem;
    background: #162e40;
    color: #eef5fa;
    border: 1px solid #829dab;
  }
  input {
    min-width: 0;
    width: 100%;
  }
  button {
    margin: 0.4rem 0.4rem 0.4rem 0;
    cursor: pointer;
  }
  summary {
    cursor: pointer;
  }
  p {
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
</style>
