<script lang="ts">
  import { HATSU_VISUAL_SIGNATURE_BY_KIND, type HatsuProfile } from '$lib/nen/hatsuRegistry'

  interface Props {
    profile: HatsuProfile
    sequence: number
  }
  let { profile, sequence }: Props = $props()
  let signature = $derived(HATSU_VISUAL_SIGNATURE_BY_KIND[profile.kind])
</script>

{#key sequence}
  <div
    class="hatsu-manifestation"
    style:--hatsu={profile.color}
    class:field={signature.form === 'field'}
    data-form={signature.form}
    data-motion={signature.motion}
    aria-label={signature.manifestation}
  >
    <i class="wake"></i><i class="body"></i><i class="trail"></i>
    <b>{signature.glyph}</b>
    <span>{profile.name}</span>
  </div>
{/key}

<style>
  .hatsu-manifestation {
    --hatsu: #8ad7e7;
    position: absolute;
    z-index: 22;
    inset: 38% auto auto 50%;
    width: 8rem;
    height: 8rem;
    transform: translate(-50%, -50%);
    pointer-events: none;
    filter: drop-shadow(0 0 1rem var(--hatsu));
    color: var(--hatsu);
    animation: vanish 1.45s both;
  }
  i,
  b {
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
  }
  .body {
    width: 3.8rem;
    height: 3.8rem;
    border: 0.18rem solid currentColor;
    border-radius: 50%;
    box-shadow: inset 0 0 1.2rem currentColor;
  }
  .wake {
    width: 7rem;
    height: 7rem;
    border: 1px solid currentColor;
    border-radius: 50%;
    opacity: 0.5;
  }
  .trail {
    width: 1px;
    height: 8rem;
    background: linear-gradient(transparent, currentColor, transparent);
  }
  b {
    font-size: 1.6rem;
  }
  span {
    position: absolute;
    top: 100%;
    left: 50%;
    width: 14rem;
    transform: translateX(-50%);
    text-align: center;
    font:
      600 0.62rem 'IBM Plex Mono',
      monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  [data-form='chain'] .body {
    border-radius: 10%;
    transform: translate(-50%, -50%) rotate(45deg);
  }
  [data-form='beast'] .body,
  [data-form='organic'] .body {
    border-radius: 70% 30% 55% 45%;
  }
  [data-form='weapon'] .body {
    width: 6rem;
    height: 0.7rem;
    border-radius: 0;
  }
  [data-form='mark'] .body {
    width: 2.6rem;
    height: 2.6rem;
    border-style: double;
  }
  [data-form='field'] {
    width: 22rem;
    height: 22rem;
  }
  [data-motion='orbit'] .wake {
    animation: orbit 0.75s linear infinite;
  }
  [data-motion='strike'] .body {
    animation: strike 0.45s ease-out both;
  }
  [data-motion='drift'] .body {
    animation: drift 1.1s ease-in-out both;
  }
  [data-motion='coil'] .trail {
    animation: orbit 0.55s linear infinite;
  }
  [data-motion='bloom'] .body {
    animation: bloom 0.75s ease-out both;
  }
  [data-motion='scan'] .trail {
    animation: scan 0.7s ease-in-out 2;
  }
  [data-motion='flicker'] {
    animation:
      flicker 0.18s steps(2) 6,
      vanish 1.45s both;
  }
  @keyframes orbit {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
  @keyframes strike {
    from {
      transform: translate(-180%, -50%) scale(0.3);
    }
    to {
      transform: translate(-50%, -50%) scale(1.25);
    }
  }
  @keyframes drift {
    from {
      transform: translate(-50%, 20%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -70%);
    }
  }
  @keyframes bloom {
    from {
      transform: translate(-50%, -50%) scale(0.15);
    }
    to {
      transform: translate(-50%, -50%) scale(1.4);
    }
  }
  @keyframes scan {
    50% {
      transform: translate(-50%, -50%) rotate(90deg);
    }
  }
  @keyframes flicker {
    50% {
      opacity: 0.25;
    }
  }
  @keyframes vanish {
    0%,
    72% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -65%) scale(1.15);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hatsu-manifestation,
    .hatsu-manifestation * {
      animation-duration: 0.001ms !important;
    }
  }
</style>
