<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import { pvpSessionKey, type ArenaPvpSession, type ArenaPvpView } from '$lib/arena/pvp/transport'
  import type { NetworkAction } from '$lib/arena/pvp/serverMatch'
  import type { BodyZone, CombatSide } from '$lib/combat/types'
  import type { PageData } from './$types'

  type UnsidedNetworkAction = NetworkAction extends infer Action
    ? Action extends { side: CombatSide }
      ? Omit<Action, 'side'>
      : never
    : never

  let { data }: { data: PageData } = $props()
  let token = $state('')
  let view = $state<ArenaPvpView | null>(null)
  let joining = $state(false)
  let sending = $state(false)
  let error = $state('')
  let copied = $state(false)
  let targetZone = $state<BodyZone>('torso')
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const matchState = $derived(view?.snapshot?.state ?? null)
  const side = $derived(view?.side ?? null)
  const fighter = $derived(matchState && side ? matchState[side] : null)
  const rivalSide = $derived<CombatSide | null>(
    side === 'player' ? 'opponent' : side === 'opponent' ? 'player' : null,
  )
  const rival = $derived(matchState && rivalSide ? matchState[rivalSide] : null)
  const gap = $derived(
    fighter && rival
      ? Math.hypot(fighter.position[0] - rival.position[0], fighter.position[1] - rival.position[1])
      : 0,
  )
  const ownOutcome = $derived.by(() => {
    if (!matchState || !side || matchState.outcome === 'playing')
      return matchState?.outcome ?? 'playing'
    if (side === 'player') return matchState.outcome
    return matchState.outcome === 'won' ? 'lost' : 'won'
  })

  onMount(() => {
    token = sessionStorage.getItem(pvpSessionKey(data.matchId)) ?? ''
    if (token) void refresh()
    pollTimer = setInterval(() => token && void refresh(), 150)
  })

  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer)
  })

  async function join() {
    joining = true
    error = ''
    try {
      const response = await fetch(api(`/join`), { method: 'POST' })
      if (!response.ok) throw new Error((await response.json()).error)
      const session = (await response.json()) as ArenaPvpSession
      token = session.playerToken
      sessionStorage.setItem(pvpSessionKey(data.matchId), token)
      await refresh()
    } catch (reason) {
      error = message(reason)
    } finally {
      joining = false
    }
  }

  async function refresh() {
    try {
      const response = await fetch(api(''), { headers: authorization() })
      if (!response.ok) throw new Error((await response.json()).error)
      view = (await response.json()) as ArenaPvpView
      error = ''
    } catch (reason) {
      error = message(reason)
    }
  }

  async function command(action: NetworkAction) {
    if (!view || sending || view.status !== 'playing') return
    sending = true
    try {
      const response = await fetch(api('/commands'), {
        method: 'POST',
        headers: { ...authorization(), 'content-type': 'application/json' },
        body: JSON.stringify({ sequence: view.nextSequence, action }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      view = (await response.json()) as ArenaPvpView
      error = ''
    } catch (reason) {
      error = message(reason)
      await refresh()
    } finally {
      sending = false
    }
  }

  function sided(action: UnsidedNetworkAction): NetworkAction {
    return { ...action, side: side! } as NetworkAction
  }

  function move(direction: -1 | 0 | 1) {
    if (!fighter || !rival || direction === 0) {
      void command(sided({ type: 'MOVE', vector: [0, 0] }))
      return
    }
    const dx = rival.position[0] - fighter.position[0]
    const dz = rival.position[1] - fighter.position[1]
    const length = Math.hypot(dx, dz) || 1
    void command(
      sided({ type: 'MOVE', vector: [(dx / length) * direction, (dz / length) * direction] }),
    )
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href)
    copied = true
  }

  function api(suffix: string): string {
    return $link(`/arena/pvp/api/matches/${data.matchId}${suffix}`)
  }

  function authorization(): Record<string, string> {
    return { authorization: `Bearer ${token}` }
  }

  function message(reason: unknown): string {
    const code = reason instanceof Error ? reason.message : 'UNKNOWN'
    const fr: Record<string, string> = {
      MATCH_NOT_FOUND: 'Duel introuvable ou expiré.',
      MATCH_FULL: 'Ce duel a déjà deux joueurs.',
      UNAUTHORIZED: 'Session de joueur invalide.',
      OUT_OF_ORDER: 'Commande désynchronisée.',
    }
    return $locale === 'fr'
      ? (fr[code] ?? 'Connexion au duel impossible.')
      : code.replaceAll('_', ' ')
  }

  const zones: readonly BodyZone[] = ['head', 'torso', 'arms', 'legs']
</script>

<svelte:head><title>Arena PvP · Black Whale</title></svelte:head>

<main class="min-h-[100dvh] bg-[#050708] p-4 text-[#f4ead4] sm:p-8">
  <header class="mx-auto flex max-w-5xl items-center justify-between border-b border-white/15 pb-4">
    <div>
      <p class="text-[10px] uppercase tracking-[0.35em] text-amber-300">Arena · PvP</p>
      <h1 class="mt-1 text-2xl font-black uppercase">
        {$locale === 'fr' ? 'Duel autoritaire' : 'Authoritative duel'}
      </h1>
    </div>
    <span class="font-mono text-xs text-white/40">{data.matchId}</span>
  </header>

  {#if !token}
    <section class="mx-auto mt-20 max-w-lg border border-amber-300/30 bg-black/50 p-8 text-center">
      <h2 class="text-2xl font-bold">
        {$locale === 'fr' ? 'Invitation reçue' : 'Invitation received'}
      </h2>
      <button
        class="mt-6 border border-amber-300 px-7 py-3 uppercase text-amber-100 disabled:opacity-40"
        onclick={join}
        disabled={joining}
      >
        {joining ? '…' : $locale === 'fr' ? 'Rejoindre le duel' : 'Join duel'}
      </button>
    </section>
  {:else if view?.status === 'waiting'}
    <section class="mx-auto mt-20 max-w-lg border border-sky-300/30 bg-black/50 p-8 text-center">
      <h2 class="text-2xl font-bold">
        {$locale === 'fr' ? "En attente de l'adversaire" : 'Waiting for opponent'}
      </h2>
      <button class="mt-6 border border-sky-300 px-6 py-3 text-sky-100" onclick={copyInvite}>
        {copied
          ? $locale === 'fr'
            ? 'Lien copié'
            : 'Link copied'
          : $locale === 'fr'
            ? "Copier l'invitation"
            : 'Copy invite'}
      </button>
    </section>
  {:else if matchState && fighter && rival && side}
    <section class="mx-auto mt-8 grid max-w-5xl gap-5 lg:grid-cols-[1fr_20rem_1fr]">
      <article class="border border-sky-300/25 bg-sky-950/15 p-5">
        <p class="text-xs uppercase text-sky-300">{$locale === 'fr' ? 'Vous' : 'You'} · {side}</p>
        <strong class="mt-3 block text-4xl">{Math.ceil(fighter.aura)}</strong>
        <div class="mt-2 h-2 bg-white/10">
          <i class="block h-full bg-sky-300" style:width={`${fighter.aura}%`}></i>
        </div>
        <p class="mt-3 text-sm text-white/55">
          {fighter.condition} · {fighter.mode} · {fighter.score} pts
        </p>
      </article>

      <article class="border border-amber-300/25 bg-black/50 p-5 text-center">
        <p class="text-xs uppercase tracking-widest text-white/40">
          {$locale === 'fr' ? 'Premier à 3' : 'First to 3'}
        </p>
        <strong class="mt-3 block text-4xl"
          >{side === 'player' ? fighter.score : rival.score} — {side === 'player'
            ? rival.score
            : fighter.score}</strong
        >
        <p class="mt-2 font-mono text-xs text-white/45">
          {matchState.clock.toFixed(1)}s · {gap.toFixed(1)}m
        </p>
        {#if ownOutcome !== 'playing'}<p class="mt-5 text-2xl font-black uppercase text-amber-200">
            {ownOutcome === 'won'
              ? $locale === 'fr'
                ? 'Victoire'
                : 'Victory'
              : $locale === 'fr'
                ? 'Défaite'
                : 'Defeat'}
          </p>{/if}
      </article>

      <article class="border border-rose-300/25 bg-rose-950/10 p-5 text-right">
        <p class="text-xs uppercase text-rose-300">
          {$locale === 'fr' ? 'Adversaire' : 'Opponent'}
        </p>
        <strong class="mt-3 block text-4xl">{Math.ceil(rival.aura)}</strong>
        <div class="mt-2 h-2 bg-white/10">
          <i class="ml-auto block h-full bg-rose-300" style:width={`${rival.aura}%`}></i>
        </div>
        <p class="mt-3 text-sm text-white/55">
          {rival.condition} · {rival.mode} · {rival.score} pts
        </p>
      </article>
    </section>

    <section
      class="mx-auto mt-5 grid max-w-5xl gap-4 border border-white/15 bg-black/55 p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div class="grid grid-cols-3 gap-2">
        <button class="control" onclick={() => move(1)}
          >↑ {$locale === 'fr' ? 'Avancer' : 'Advance'}</button
        >
        <button class="control" onclick={() => move(0)}>■ Stop</button>
        <button class="control" onclick={() => move(-1)}
          >↓ {$locale === 'fr' ? 'Reculer' : 'Retreat'}</button
        >
      </div>
      <div>
        <label class="text-xs uppercase text-white/45" for="ryu"
          >Ryu · {Math.round(fighter.attackShare * 100)}%</label
        >
        <input
          id="ryu"
          class="mt-3 w-full accent-amber-300"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={fighter.attackShare}
          onchange={(event) =>
            void command(sided({ type: 'RYU', attackShare: Number(event.currentTarget.value) }))}
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        {#each zones as zone (zone)}
          <button
            class:active={targetZone === zone}
            class="control"
            onclick={() => {
              targetZone = zone
              void command(sided({ type: 'RYU', guard: zone }))
            }}>{zone}</button
          >
        {/each}
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="control attack"
          onclick={() => void command(sided({ type: 'STRIKE', zone: targetZone }))}
          >{$locale === 'fr' ? 'Frapper' : 'Strike'}</button
        >
        <button
          class="control attack"
          onclick={() => void command(sided({ type: 'KO', zone: targetZone }))}>Ko</button
        >
        <button class="control" onclick={() => void command(sided({ type: 'GUARD' }))}>Guard</button
        >
        <button
          class="control"
          onclick={() => void command(sided({ type: 'FEINT', zone: targetZone }))}>Feint</button
        >
      </div>
      <div class="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
        {#each ['ten', 'ren', 'zetsu'] as mode (mode)}
          <button
            class:active={fighter.mode === mode}
            class="control"
            onclick={() =>
              void command(sided({ type: 'MODE', mode: mode as 'ten' | 'ren' | 'zetsu' }))}
            >{mode}</button
          >
        {/each}
        <button
          class:active={fighter.gyo}
          class="control"
          onclick={() => void command(sided({ type: 'GYO', on: !fighter.gyo }))}>Gyo</button
        >
        <button
          class:active={fighter.in}
          class="control"
          onclick={() => void command(sided({ type: 'IN', on: !fighter.in }))}>In</button
        >
        <button
          class:active={fighter.ken}
          class="control"
          onclick={() => void command(sided({ type: 'KEN', on: !fighter.ken }))}>Ken</button
        >
      </div>
    </section>
  {/if}

  {#if error}<p class="mx-auto mt-5 max-w-5xl text-center text-sm text-red-300">{error}</p>{/if}
</main>

<style>
  .control {
    border: 1px solid rgb(255 255 255 / 0.16);
    padding: 0.65rem 0.8rem;
    color: rgb(255 255 255 / 0.7);
    text-transform: uppercase;
    font-size: 0.7rem;
  }
  .control:hover,
  .control.active {
    border-color: rgb(252 211 77 / 0.7);
    color: white;
    background: rgb(252 211 77 / 0.08);
  }
  .control.attack {
    border-color: rgb(251 113 133 / 0.5);
  }
</style>
