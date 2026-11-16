<script lang="ts">
  import { onMount } from 'svelte'
  import FightScene from './FightScene.svelte'
  import FightHud from './FightHud.svelte'
  import { decodeFightSnapshot } from '$lib/fighting/fightReplaySnapshot'
  import { fightReplayHash } from '$lib/fighting/fightReplayHash'
  import type { FightState } from '$lib/fighting/types'
  import type { PvpSpectatorView } from '$lib/fighting/pvp/types'
  export let language: 'fr' | 'en'
  export let endpoint: string
  export let token: string
  let state: FightState | null = null,
    status = '',
    error = ''
  onMount(() => {
    let disposed = false,
      timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const response = await fetch(endpoint, {
          headers: { authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        })
        if (!response.ok) throw Error(String(response.status))
        const view: PvpSpectatorView = await response.json()
        const next = decodeFightSnapshot(view.snapshot, { ...view.setup, mode: 'versus-local' })
        if (fightReplayHash(next) !== view.snapshotHash) throw Error('DIVERGED')
        if (disposed) return
        state = next
        status = view.status
        error = ''
      } catch {
        if (!disposed)
          error =
            language === 'fr'
              ? 'Vue indisponible. Vérifie l’invitation spectateur.'
              : 'View unavailable. Check the spectator invite.'
      }
      if (!disposed && !['finished', 'abandoned'].includes(status)) timer = setTimeout(poll, 250)
    }
    void poll()
    return () => {
      disposed = true
      clearTimeout(timer)
    }
  })
</script>

<section aria-label={language === 'fr' ? 'Vue spectateur' : 'Spectator view'}>
  <p role="status">
    {language === 'fr' ? 'Spectateur · lecture seule' : 'Spectator · read only'} · {status}
  </p>
  <p>
    {language === 'fr'
      ? 'Manifestations publiques : aucune commande de joueur ni perspective privée.'
      : 'Public manifestations: no player controls or private perspective.'}
  </p>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if state}<div class="public-arena">
      <FightHud {state} {language} /><FightScene
        {state}
        {language}
        stageId={state.environment.stageId}
      />
    </div>{/if}
</section>

<style>
  .public-arena {
    position: relative;
    height: min(70vh, 700px);
    min-height: 400px;
    overflow: hidden;
    border: 1px solid #63798a;
  }
  p {
    line-height: 1.6;
  }
</style>
