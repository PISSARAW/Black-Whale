<script lang="ts">
  import type { NenTechniqueAction, NenTechniqueState } from '@black-whale/nen-engine'
  interface Props { nenState: NenTechniqueState; aimedObjectId?: string | null; onAction: (action: NenTechniqueAction) => void; onInteract?: () => void }
  let { nenState, aimedObjectId = null, onAction, onInteract }: Props = $props()
  let open = $state(false)
  const toggle = (type: 'IN' | 'GYO' | 'KEN') => onAction({ type, on: !nenState[type.toLowerCase() as 'in' | 'gyo' | 'ken'] })
</script>

<aside class="pointer-events-auto absolute left-3 top-14 z-20 text-[10px] text-[#FFFFF0]">
  <button type="button" onclick={() => (open = !open)} aria-expanded={open} class="rounded border border-[#8ecae6]/50 bg-[#050505]/90 px-2 py-1 uppercase tracking-widest text-[#8ecae6]">Nen · {nenState.on ? 'on' : nenState.mode}</button>
  {#if open}
    <div class="mt-1 grid w-48 grid-cols-3 gap-1 rounded border border-[#8ecae6]/25 bg-[#050505]/95 p-2 backdrop-blur">
      <button class:active={nenState.mode === 'ten'} onclick={() => onAction({ type: 'TEN' })}>Ten</button>
      <button class:active={nenState.mode === 'ren'} onclick={() => onAction({ type: 'REN' })}>Ren</button>
      <button class:active={nenState.mode === 'zetsu'} onclick={() => onAction({ type: 'ZETSU' })}>Zetsu</button>
      <button class:active={nenState.on} onclick={() => onAction({ type: 'ON', on: !nenState.on, distribution: { hands: 0.45, torso: 0.35, feet: 0.2 } })}>On</button>
      <button class:active={nenState.gyo} onclick={() => toggle('GYO')}>Gyo</button>
      <button class:active={nenState.in} onclick={() => toggle('IN')}>In</button>
      <button class:active={nenState.en !== null} onclick={() => onAction({ type: 'EN', radius: nenState.en ? null : 8 })}>En</button>
      <button class:active={nenState.ken} onclick={() => toggle('KEN')}>Ken</button>
      <button class:active={nenState.ko === 'hands'} onclick={() => onAction({ type: 'KO', zone: nenState.ko === 'hands' ? null : 'hands' })}>Ko mains</button>
      <button class:active={nenState.ko === 'feet'} onclick={() => onAction({ type: 'KO', zone: nenState.ko === 'feet' ? null : 'feet' })}>Ko pieds</button>
      <button onclick={() => onAction({ type: 'RYU', distribution: { hands: 0.65, torso: 0.2, feet: 0.15 } })}>Ryu ATK</button>
      <button onclick={() => onAction({ type: 'RYU', distribution: { torso: 0.55, head: 0.25, hands: 0.2 } })}>Ryu DEF</button>
      <button disabled={!aimedObjectId} class:active={Boolean(aimedObjectId && nenState.shu.includes(aimedObjectId))} onclick={() => aimedObjectId && onAction({ type: 'SHU', objectId: aimedObjectId, on: !nenState.shu.includes(aimedObjectId) })}>Shu</button>
      <button class="col-span-2" disabled={!aimedObjectId || nenState.mode === 'zetsu'} onclick={() => onInteract?.()}>Agir sur l'objet</button>
      <p class="col-span-3 mt-1 text-[9px] leading-snug text-[#FFFFF0]/40">Alt + O · T/R/X · G/I/E/K · 1/2/3/4 · S</p>
    </div>
  {/if}
</aside>

<style>
  div > button { min-height: 2rem; border: 1px solid rgb(255 255 240 / 0.16); border-radius: 0.2rem; padding: 0.25rem; color: rgb(255 255 240 / 0.68); }
  div > button:hover:not(:disabled), div > button.active { border-color: rgb(142 202 230 / 0.75); color: #8ecae6; background: rgb(142 202 230 / 0.1); }
  div > button:disabled { opacity: 0.25; }
</style>
