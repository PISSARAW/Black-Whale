<script lang="ts">
  import type { NenTechnique, NenTechniqueAction, NenTechniqueState } from '@black-whale/nen-engine'
  interface Props { nenState: NenTechniqueState; aimedObjectId?: string | null; availability?: Partial<Record<NenTechnique | 'hatsu' | 'action', boolean>>; hatsuAllowedInZetsu?: boolean; onAction: (action: NenTechniqueAction) => void; onInteract?: () => void; onHatsu?: () => void }
  let { nenState, aimedObjectId = null, availability = {}, hatsuAllowedInZetsu = false, onAction, onInteract, onHatsu }: Props = $props()
  let open = $state(false)
  const enabled = (technique: NenTechnique | 'hatsu' | 'action') => availability[technique] !== false
  const toggle = (type: 'IN' | 'GYO' | 'KEN') => onAction({ type, on: !nenState[type.toLowerCase() as 'in' | 'gyo' | 'ken'] })
</script>

<aside class="pointer-events-auto absolute left-3 top-14 z-20 text-[10px] text-[#FFFFF0]">
  <button type="button" onclick={() => (open = !open)} aria-expanded={open} class="rounded border border-[#8ecae6]/50 bg-[#050505]/90 px-2 py-1 uppercase tracking-widest text-[#8ecae6]">Nen · {nenState.on ? 'on' : nenState.mode}</button>
  {#if open}
    <div class="mt-1 grid w-48 grid-cols-3 gap-1 rounded border border-[#8ecae6]/25 bg-[#050505]/95 p-2 backdrop-blur">
      <button disabled={!enabled('ten')} class:active={nenState.mode === 'ten'} onclick={() => onAction({ type: 'TEN' })}>Ten</button>
      <button disabled={!enabled('ren')} class:active={nenState.mode === 'ren'} onclick={() => onAction({ type: 'REN' })}>Ren</button>
      <button disabled={!enabled('zetsu')} class:active={nenState.mode === 'zetsu'} onclick={() => onAction({ type: 'ZETSU' })}>Zetsu</button>
      <button disabled={!enabled('on')} class:active={nenState.on} onclick={() => onAction({ type: 'ON', on: !nenState.on, distribution: { hands: 0.45, torso: 0.35, feet: 0.2 } })}>On</button>
      <button disabled={!enabled('gyo')} class:active={nenState.gyo} onclick={() => toggle('GYO')}>Gyo</button>
      <button disabled={!enabled('in')} class:active={nenState.in} onclick={() => toggle('IN')}>In</button>
      <button disabled={!enabled('en')} class:active={nenState.en !== null} onclick={() => onAction({ type: 'EN', radius: nenState.en ? null : 8 })}>En</button>
      <button disabled={!enabled('ken')} class:active={nenState.ken} onclick={() => toggle('KEN')}>Ken</button>
      <button disabled={!enabled('ko')} class:active={nenState.ko === 'hands'} onclick={() => onAction({ type: 'KO', zone: nenState.ko === 'hands' ? null : 'hands' })}>Ko mains</button>
      <button disabled={!enabled('ryu')} onclick={() => onAction({ type: 'RYU', distribution: { feet: 0.7, torso: 0.2, head: 0.1 } })}>Ryu pieds</button>
      <button disabled={!enabled('ryu')} onclick={() => onAction({ type: 'RYU', distribution: { hands: 0.65, torso: 0.2, feet: 0.15 } })}>Ryu ATK</button>
      <button disabled={!enabled('ryu')} onclick={() => onAction({ type: 'RYU', distribution: { torso: 0.55, head: 0.25, hands: 0.2 } })}>Ryu DEF</button>
      <button disabled={!enabled('shu') || !aimedObjectId} class:active={Boolean(aimedObjectId && nenState.shu.includes(aimedObjectId))} onclick={() => aimedObjectId && onAction({ type: 'SHU', objectId: aimedObjectId, on: !nenState.shu.includes(aimedObjectId) })}>Shu</button>
      <button disabled={!enabled('hatsu') || !onHatsu || (nenState.mode === 'zetsu' && !hatsuAllowedInZetsu)} onclick={() => onHatsu?.()}>Hatsu</button>
      <button class="col-span-2" disabled={!enabled('action') || !aimedObjectId || nenState.mode === 'zetsu'} onclick={() => onInteract?.()}>Agir sur l'objet</button>
      <p class="col-span-3 mt-1 text-[9px] leading-snug text-[#FFFFF0]/40">T/R/X · G/I/K · −/+ Ryu · 1–4 zone · C Ko · F action · H Hatsu · N En · U Shu</p>
    </div>
  {/if}
</aside>

<style>
  div > button { min-height: 2rem; border: 1px solid rgb(255 255 240 / 0.16); border-radius: 0.2rem; padding: 0.25rem; color: rgb(255 255 240 / 0.68); }
  div > button:hover:not(:disabled), div > button.active { border-color: rgb(142 202 230 / 0.75); color: #8ecae6; background: rgb(142 202 230 / 0.1); }
  div > button:disabled { opacity: 0.25; }
</style>
