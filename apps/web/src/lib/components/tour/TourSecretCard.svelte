<script lang="ts">
  import type { TourSecret } from '$lib/tour/tourSecrets'

  interface Props {
    secret: TourSecret
    french?: boolean
    onClose: () => void
  }

  let { secret, french = false, onClose }: Props = $props()
</script>

<aside class="secret-card" aria-live="polite">
  <button type="button" onclick={onClose} aria-label={french ? 'Fermer' : 'Close'}>×</button>
  <p class="eyebrow">Gyo · {secret.reference.medium}</p>
  <h2>{french ? secret.nameFr : secret.name}</h2>
  <p>{french ? secret.rationaleFr : secret.rationale}</p>
  <footer>
    <span>{secret.reference.title}</span>
    <span>{secret.reference.citation}</span>
    <span>{secret.reference.canonStatus}</span>
  </footer>
</aside>

<style>
  .secret-card {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 80;
    width: min(26rem, calc(100vw - 2rem));
    padding: 1rem 1.1rem;
    border: 1px solid rgb(185 166 255 / 55%);
    border-radius: 4px;
    background: rgb(7 8 14 / 94%);
    color: #f3efff;
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 55%);
  }

  button {
    position: absolute;
    top: 0.35rem;
    right: 0.55rem;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.35rem;
    cursor: pointer;
  }

  .eyebrow,
  footer {
    color: #b9a6ff;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.2rem 1.5rem 0.55rem 0;
    font-size: 1rem;
  }

  p {
    margin: 0;
    line-height: 1.45;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.7rem;
    margin-top: 0.8rem;
  }
</style>
