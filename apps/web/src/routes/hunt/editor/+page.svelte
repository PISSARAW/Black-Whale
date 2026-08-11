<script lang="ts">
  import { huntContractById } from '$lib/hunt/contracts/registry'
  import { editContract, encodeContract } from '$lib/hunt/contracts/share'
  import { link, t } from '$lib/i18n'

  const template = huntContractById('royal-apartments')!
  let title = $state('My pursuit')
  let titleFr = $state('Ma traque')
  let duration = $state(900)
  let lighting = $state<'normal' | 'low' | 'blackout'>('normal')
  let acoustics = $state<'clear' | 'reverberant' | 'masked'>('clear')
  let sharePath = $derived.by(() => {
    const contract = editContract(template, {
      id: 'shared-pursuit',
      title: { en: title, fr: titleFr },
      description: {
        en: 'A player-authored Hunt contract.',
        fr: 'Un contrat de traque créé par un joueur.',
      },
      durationSeconds: duration,
      environment: { lighting, acoustics, sealableExits: lighting === 'blackout' },
    })
    return $link(`/hunt?contract=${encodeURIComponent(encodeContract(contract))}`)
  })
</script>

<svelte:head><title>{$t.hunt.editor.seoTitle}</title></svelte:head>
<main class="min-h-screen bg-slate-950 px-6 py-16 text-white">
  <section class="mx-auto max-w-2xl">
    <p class="text-xs uppercase tracking-[.3em] text-amber-300/70">{$t.hunt.editor.eyebrow}</p>
    <h1 class="mt-3 text-3xl">{$t.hunt.editor.title}</h1>
    <div class="mt-8 grid gap-5 sm:grid-cols-2">
      <label>{$t.hunt.editor.englishTitle}<input bind:value={title} /></label>
      <label>{$t.hunt.editor.frenchTitle}<input bind:value={titleFr} /></label>
      <label
        >{$t.hunt.editor.duration}<input
          type="number"
          min="60"
          max="1800"
          bind:value={duration}
        /></label
      >
      <label
        >{$t.hunt.editor.lighting}<select bind:value={lighting}
          ><option value="normal">{$t.hunt.editor.lightingOptions.normal}</option><option
            value="low">{$t.hunt.editor.lightingOptions.low}</option
          ><option value="blackout">{$t.hunt.editor.lightingOptions.blackout}</option></select
        ></label
      >
      <label
        >{$t.hunt.editor.acoustics}<select bind:value={acoustics}
          ><option value="clear">{$t.hunt.editor.acousticsOptions.clear}</option><option
            value="reverberant">{$t.hunt.editor.acousticsOptions.reverberant}</option
          ><option value="masked">{$t.hunt.editor.acousticsOptions.masked}</option></select
        ></label
      >
    </div>
    <a
      class="mt-8 inline-block rounded-full border border-amber-300/50 px-6 py-3 text-amber-100"
      href={sharePath}>{$t.hunt.editor.playAndShare}</a
    >
  </section>
</main>

<style>
  label {
    display: grid;
    gap: 0.45rem;
    color: rgb(255 255 255 / 0.65);
    font-size: 0.8rem;
  }
  input,
  select {
    min-height: 2.75rem;
    border: 1px solid rgb(255 255 255 / 0.18);
    border-radius: 0.5rem;
    background: rgb(255 255 255 / 0.05);
    padding: 0.6rem;
    color: white;
  }
  input:focus-visible,
  select:focus-visible,
  a:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
</style>
