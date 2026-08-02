<script lang="ts">
  import { huntContractById } from '$lib/hunt/contracts/registry'
  import { editContract, encodeContract } from '$lib/hunt/contracts/share'

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
      description: { en: 'A player-authored Hunt contract.', fr: 'Un contrat Hunt créé par un joueur.' },
      durationSeconds: duration,
      environment: { lighting, acoustics, sealableExits: lighting === 'blackout' },
    })
    return `/hunt?contract=${encodeURIComponent(encodeContract(contract))}`
  })
</script>

<svelte:head><title>Hunt contract editor</title></svelte:head>
<main class="min-h-screen bg-slate-950 px-6 py-16 text-white">
  <section class="mx-auto max-w-2xl">
    <p class="text-xs uppercase tracking-[.3em] text-amber-300/70">Hunt V3</p>
    <h1 class="mt-3 text-3xl">Contract editor</h1>
    <div class="mt-8 grid gap-5 sm:grid-cols-2">
      <label>English title<input bind:value={title} /></label>
      <label>Titre français<input bind:value={titleFr} /></label>
      <label>Duration<input type="number" min="60" max="1800" bind:value={duration} /></label>
      <label>Lighting<select bind:value={lighting}><option value="normal">Normal</option><option value="low">Low</option><option value="blackout">Blackout</option></select></label>
      <label>Acoustics<select bind:value={acoustics}><option value="clear">Clear</option><option value="reverberant">Reverberant</option><option value="masked">Masked</option></select></label>
    </div>
    <a class="mt-8 inline-block rounded-full border border-amber-300/50 px-6 py-3 text-amber-100" href={sharePath}>Play and share this contract</a>
  </section>
</main>

<style>
  label { display: grid; gap: .45rem; color: rgb(255 255 255 / .65); font-size: .8rem; }
  input, select { min-height: 2.75rem; border: 1px solid rgb(255 255 255 / .18); border-radius: .5rem; background: rgb(255 255 255 / .05); padding: .6rem; color: white; }
  input:focus-visible, select:focus-visible, a:focus-visible { outline: 2px solid white; outline-offset: 2px; }
</style>
