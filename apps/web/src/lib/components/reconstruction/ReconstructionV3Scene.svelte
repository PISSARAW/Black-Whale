<script lang="ts">
  import { onDestroy } from 'svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { activateHatsu, activeHatsu, deactivateHatsu } from '$lib/nen/hatsuState'
  import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
  import { theShip } from '$lib/tour/blueprint'
  import { flashFor, type TourFlash } from '$lib/tour/apparitions'
  import { EMPTY_WORLD, type TourReport, type TourWorld } from '$lib/tour/hatsu'
  import { TourCastController } from '$lib/tour/pageCastController'
  import type { CastHand } from '$lib/tour/pageCasting'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import { TourHatsuView } from '$lib/tour/pageHatsuView.svelte'
  import { playTourReportSound } from '$lib/tour/reportSound'
  import { playHatsuActivationSignature } from '$lib/audio/hatsuSounds'
  import type { Space, Structure, Vec2 } from '$lib/tour/types'

  interface Props {
    abilityId: string
    onTarget?: (targetId: string) => void
  }

  let { abilityId, onTarget }: Props = $props()
  const ship = theShip()
  let tierId = $state(ship.tiers[0].id)
  let currentSpace = $state<Space | null>(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(0)
  let engaged = $state(false)
  let jumpTo = $state<string | null>(null)
  let jumpAt = $state<Vec2 | null>(null)
  let aimedAt = $state<Space | null>(null)
  let aimedSolidAt = $state<Structure | null>(null)
  let world = $state<TourWorld>(EMPTY_WORLD)
  let report = $state<TourReport | null>(null)
  let flash = $state<(TourFlash & { seq: number }) | null>(null)
  let flashSequence = 0
  let activationSequence = $state(0)
  let hands = $state<Record<CastHand, 'sun' | 'moon'>>({
    first: 'sun',
    second: 'sun',
    third: 'sun',
  })

  const selectedProfile = $derived(
    HATSU_PROFILES.find((profile) => profile.id === abilityId) ?? null,
  )
  const view = new TourHatsuView({
    active: () => $activeHatsu,
    world: () => world,
    locale: () => 'fr',
    tuneName: (air) => air,
  })
  const technique = $derived(view.technique)

  function show(next: TourReport) {
    report = next
    const nextFlash = flashFor({ report: next, from: position }, ship, world)
    if (nextFlash) flash = { ...nextFlash, seq: ++flashSequence }
    playTourReportSound(next)
  }

  function goToSpace(space: Space, landing?: Vec2 | null) {
    tierId = space.tierId
    jumpTo = space.id
    jumpAt = landing ?? null
  }

  const casting = new TourCastController({
    read: () => ({
      world,
      ship,
      activeKind: technique?.kind ?? null,
      pages: view.openPages,
      hands,
      currentSpace,
      aimedAt,
      aimedSolidAt,
      position,
      heading,
    }),
    updateWorld: (next) => (world = next),
    updateReport: (next) => (report = next),
    updateHands: (next) => (hands = next),
    show,
    goToSpace,
  })

  const session = new TourHatsuSession({
    readActivation: () => ({
      ship,
      activeKind: technique?.kind ?? null,
      hasAura: Boolean($activeHatsu),
      position,
      spaceId: currentSpace?.id ?? null,
    }),
    read: () => ({
      world,
      ship,
      activeKind: technique?.kind ?? null,
      hasAura: Boolean($activeHatsu),
      position,
      spaceId: currentSpace?.id ?? null,
    }),
    updateWorld: (next) => (world = next),
    updateReport: (next) => (report = next),
    resetHands: () => (hands = { first: 'sun', second: 'sun', third: 'sun' }),
    show,
    goToSpace: (spaceId) => {
      const space = ship.spaces.get(spaceId)
      if (space) goToSpace(space)
    },
    reboundText: () => 'Le contrecoup force le Zetsu.',
    vowText: (spaceId) => `Le pacte interdit de quitter ${spaceId}.`,
  })
  session.watchActivation()
  session.watchFuture()

  function arm() {
    if (!selectedProfile) return
    if (activateHatsu(selectedProfile)) {
      activationSequence += 1
      playHatsuActivationSignature(selectedProfile.id)
    }
  }

  function cast(spaceId: string | null, solidId: string | null, hand: CastHand) {
    casting.castOn(spaceId, solidId, hand)
    const target = solidId ?? spaceId
    if (target) onTarget?.(target)
  }

  onDestroy(() => {
    session.dispose()
    deactivateHatsu()
  })
</script>

<div class="scene-shell" data-hatsu-pass>
  <div class="scene-toolbar">
    <div>
      <small>Scène interactive</small>
      <strong>{selectedProfile?.name ?? abilityId}</strong>
      <span>{report?.kind ?? 'Armez le Hatsu puis visez avec le réticule.'}</span>
    </div>
    <button type="button" onclick={arm} disabled={!selectedProfile}>
      {selectedProfile ? 'Armer le Hatsu' : 'Animation indisponible'}
    </button>
  </div>
  <div class="viewport">
    {#key activationSequence}
      {#if activationSequence && selectedProfile}
        <div
          class="activation-signature"
          style={`--hatsu-colour:${selectedProfile.color}`}
          aria-hidden="true"
        >
          <i></i><i></i><i></i><strong>{selectedProfile.name}</strong>
        </div>
      {/if}
    {/key}
    <TourScene
      {ship}
      bind:tierId
      bind:currentSpace
      bind:position
      bind:heading
      bind:engaged
      bind:jumpTo
      bind:jumpAt
      {world}
      auraColour={technique?.color ?? selectedProfile?.color ?? null}
      {flash}
      aiming={Boolean(technique)}
      selfCastable={view.selfCastable}
      hands={view.hands}
      tunes={view.tunes}
      twoHanded={view.twoHanded}
      bind:aimedAt
      bind:aimedSolidAt
      onCast={cast}
      onHatsu={cast}
      nen={session.nen}
      onNenChange={session.useNen}
      onArrive={session.arrived}
      touchLabels={{ move: 'Se déplacer', cast: 'Lancer' }}
      soundLabels={{ silence: 'Couper le son', restore: 'Rétablir le son' }}
      loadingLabel="Chargement de la scène…"
      unsupportedLabel="WebGL est requis pour la scène interactive."
    />
  </div>
</div>

<style>
  .scene-shell {
    border: 1px solid #33445b;
    border-radius: 14px;
    overflow: hidden;
    background: #05080d;
    margin-top: 1rem;
  }
  .scene-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1rem;
    background: #0b121d;
  }
  .scene-toolbar div {
    display: grid;
    gap: 0.15rem;
  }
  .scene-toolbar small {
    color: #e8b05b;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .scene-toolbar span {
    color: #91a0b1;
    font-size: 0.78rem;
  }
  .scene-toolbar button {
    border: 1px solid #4b7688;
    border-radius: 999px;
    background: #102431;
    color: #bfeaff;
    padding: 0.65rem 1rem;
    font-weight: 800;
  }
  .viewport {
    height: min(58vh, 560px);
    min-height: 360px;
    position: relative;
  }
  .activation-signature {
    position: absolute;
    inset: 0;
    z-index: 8;
    display: grid;
    place-items: center;
    pointer-events: none;
    overflow: hidden;
    animation: signature-fade 1.6s ease-out both;
  }
  .activation-signature i {
    position: absolute;
    width: min(42vw, 320px);
    aspect-ratio: 1;
    border: 2px solid var(--hatsu-colour);
    border-radius: 50%;
    box-shadow:
      0 0 28px var(--hatsu-colour),
      inset 0 0 22px var(--hatsu-colour);
    animation: signature-ring 1.1s cubic-bezier(0.1, 0.7, 0.2, 1) both;
  }
  .activation-signature i:nth-child(2) {
    animation-delay: 0.12s;
    transform: rotate(60deg);
  }
  .activation-signature i:nth-child(3) {
    animation-delay: 0.24s;
    transform: rotate(120deg);
  }
  .activation-signature strong {
    color: white;
    text-shadow: 0 0 18px var(--hatsu-colour);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    animation: signature-name 1.2s ease-out both;
  }
  .viewport :global(.tour-scene),
  .viewport :global(canvas) {
    height: 100% !important;
  }
  @media (max-width: 700px) {
    .scene-toolbar {
      align-items: stretch;
      flex-direction: column;
    }
    .viewport {
      min-height: 430px;
    }
  }
  @keyframes signature-ring {
    from {
      opacity: 0;
      scale: 0.15;
      rotate: -35deg;
    }
    55% {
      opacity: 1;
    }
    to {
      opacity: 0;
      scale: 2.2;
      rotate: 35deg;
    }
  }
  @keyframes signature-name {
    from {
      opacity: 0;
      scale: 0.8;
      filter: blur(8px);
    }
    35% {
      opacity: 1;
    }
    to {
      opacity: 0;
      scale: 1.08;
      filter: blur(0);
    }
  }
  @keyframes signature-fade {
    80% {
      opacity: 1;
    }
    to {
      opacity: 0;
      visibility: hidden;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .activation-signature,
    .activation-signature i,
    .activation-signature strong {
      animation-duration: 0.01ms;
    }
  }
</style>
