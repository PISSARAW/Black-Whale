<script lang="ts">
  let {
    fromBody,
    toBody,
    consciousness,
    visible = false,
  }: {
    fromBody: string
    toBody: string
    consciousness: string
    visible?: boolean
  } = $props()
</script>

{#if visible}
  <section class="transfer" aria-label="Consciousness transfer transition">
    <article>
      <h3>Body d'origine</h3>
      <p>{fromBody}</p>
    </article>
    <div class="line" aria-hidden="true">
      <span>{consciousness}</span>
    </div>
    <article>
      <h3>Body de destination</h3>
      <p>{toBody}</p>
    </article>
  </section>
{/if}

<style>
  .transfer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.4rem;
    border: 1px dashed var(--state-transferred);
    border-radius: 0.72rem;
    padding: 0.55rem;
    background: color-mix(in srgb, var(--panel) 72%, var(--state-transferred) 28%);
    animation: reveal 320ms ease-out;
  }

  article {
    border: 1px solid color-mix(in srgb, var(--line) 72%, #f4f2e8 18%);
    border-radius: 0.55rem;
    padding: 0.48rem;
    background: color-mix(in srgb, var(--panel) 90%, #0f1824 10%);
  }

  h3 {
    margin: 0;
    font-size: 0.67rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 70%, #8ea3a0 30%);
  }

  p {
    margin: 0.24rem 0 0;
    font-size: 0.88rem;
    font-weight: 650;
  }

  .line {
    min-width: 7.5rem;
    text-align: center;
    position: relative;
    color: var(--state-transferred);
    font-size: 0.74rem;
  }

  .line::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    border-top: 2px solid currentColor;
    transform: translateY(-50%);
    animation: pulse 700ms ease-in-out infinite;
  }

  .line span {
    position: relative;
    padding: 0 0.4rem;
    background: color-mix(in srgb, var(--panel) 80%, #0e1722 20%);
    z-index: 1;
  }

  @keyframes pulse {
    0% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.25;
    }
  }

  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 750px) {
    .transfer {
      grid-template-columns: 1fr;
    }

    .line {
      min-width: 0;
      margin: 0.3rem 0;
    }
  }
</style>
