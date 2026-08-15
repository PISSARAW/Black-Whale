<script lang="ts">
  import type { NenTechnique, NenTechniqueAction, NenTechniqueState } from '@black-whale/nen-engine'
  import { ryuDistribution, type NenBodyZone } from '$lib/nen/controls'
  type Availability = boolean | string
  interface Props {
    nenState: NenTechniqueState
    selectedZone?: NenBodyZone
    aimedObjectId?: string | null
    availability?: Partial<Record<NenTechnique | 'hatsu' | 'action', Availability>>
    hatsuAllowedInZetsu?: boolean
    hatsuRequiresZetsu?: boolean
    /**
     * Whether a Ten held and used for nothing is being shown to its owner.
     *
     * The button reads it so that pressing Ten twice looks like what it does —
     * lit while the skin is up, unlit once it has been put down — and so that
     * the panel and the T key never disagree about which press comes next.
     */
    restingAuraShown?: boolean
    onAction: (action: NenTechniqueAction) => void
    /** Ten as a toggle. Falls back to the plain transition where none is given. */
    onTen?: () => void
    onSelectZone?: (zone: NenBodyZone) => void
    onInteract?: () => void
    onHatsu?: () => void
  }
  let {
    nenState,
    selectedZone = 'hands',
    aimedObjectId = null,
    availability = {},
    hatsuAllowedInZetsu = false,
    hatsuRequiresZetsu = false,
    restingAuraShown = true,
    onAction,
    onTen,
    onSelectZone,
    onInteract,
    onHatsu,
  }: Props = $props()
  let open = $state(false)
  const enabled = (technique: NenTechnique | 'hatsu' | 'action') =>
    availability[technique] !== false && typeof availability[technique] !== 'string'
  const reason = (technique: NenTechnique | 'hatsu' | 'action') =>
    typeof availability[technique] === 'string' ? (availability[technique] as string) : undefined
  const hatsuBlockedByMode = () =>
    nenState.mode === 'zetsu' ? !hatsuAllowedInZetsu : hatsuRequiresZetsu
  const toggle = (type: 'IN' | 'GYO' | 'KEN') =>
    onAction({ type, on: !nenState[type.toLowerCase() as 'in' | 'gyo' | 'ken'] })
  const zoneNames: Record<NenBodyZone, string> = {
    head: 'Tête',
    torso: 'Torse',
    hands: 'Mains',
    feet: 'Pieds',
  }
</script>

<aside class="pointer-events-auto absolute left-3 top-52 z-20 text-[10px] text-[#FFFFF0]">
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-expanded={open}
    class="rounded border border-[#8ecae6]/50 bg-[#050505]/90 px-2 py-1 uppercase tracking-widest text-[#8ecae6]"
    >Nen · {nenState.on ? 'on' : nenState.mode}</button
  >
  {#if open}
    <div
      class="mt-1 grid w-64 grid-cols-3 gap-1 rounded border border-[#8ecae6]/25 bg-[#050505]/95 p-2 backdrop-blur"
    >
      <button
        disabled={!enabled('ten')}
        title={reason('ten') ??
          (nenState.mode === 'ten' && restingAuraShown
            ? 'Reposer le Ten : l’aura reste levée, elle cesse de se voir.'
            : undefined)}
        class:active={nenState.mode === 'ten' && restingAuraShown}
        onclick={() => (onTen ? onTen() : onAction({ type: 'TEN' }))}>Ten</button
      >
      <button
        disabled={!enabled('ren')}
        title={reason('ren')}
        class:active={nenState.mode === 'ren'}
        onclick={() => onAction({ type: 'REN' })}>Ren</button
      >
      <button
        disabled={!enabled('zetsu')}
        title={reason('zetsu')}
        class:active={nenState.mode === 'zetsu'}
        onclick={() => onAction({ type: 'ZETSU' })}>Zetsu</button
      >
      <button
        disabled={!enabled('on')}
        title={reason('on')}
        class:active={nenState.on}
        onclick={() =>
          onAction({
            type: 'ON',
            on: !nenState.on,
            distribution: { hands: 0.45, torso: 0.35, feet: 0.2 },
          })}>On</button
      >
      <button
        disabled={!enabled('gyo')}
        title={reason('gyo')}
        class:active={nenState.gyo}
        onclick={() => toggle('GYO')}>Gyo</button
      >
      <button
        disabled={!enabled('in')}
        title={reason('in')}
        class:active={nenState.in}
        onclick={() => toggle('IN')}>In</button
      >
      <button
        disabled={!enabled('en')}
        title={reason('en')}
        class:active={nenState.en !== null}
        onclick={() => onAction({ type: 'EN', radius: nenState.en ? null : 8 })}>En</button
      >
      <button
        disabled={!enabled('ken')}
        title={reason('ken')}
        class:active={nenState.ken}
        onclick={() => toggle('KEN')}>Ken</button
      >
      {#each [['head', '1 Tête'], ['torso', '2 Torse'], ['hands', '3 Mains'], ['feet', '4 Pieds']] as zone (zone[0])}
        <button
          class:active={selectedZone === zone[0]}
          onclick={() => onSelectZone?.(zone[0] as NenBodyZone)}>{zone[1]}</button
        >
      {/each}
      <button
        disabled={!enabled('ko')}
        title={reason('ko')}
        class:active={nenState.ko === selectedZone}
        onclick={() =>
          onAction({ type: 'KO', zone: nenState.ko === selectedZone ? null : selectedZone })}
        >Ko · {zoneNames[selectedZone]}</button
      >
      <label class="col-span-2 grid grid-cols-[auto_1fr_auto] items-center gap-2"
        >Ryu <input
          type="range"
          min="10"
          max="90"
          step="5"
          value={Math.round(Number(nenState.ryu[selectedZone] ?? 0.5) * 100)}
          disabled={!enabled('ryu')}
          oninput={(event) =>
            onAction({
              type: 'RYU',
              distribution: ryuDistribution(selectedZone, Number(event.currentTarget.value) / 100),
            })}
          class="w-full min-w-0"
        /><span>{Math.round(Number(nenState.ryu[selectedZone] ?? 0.5) * 100)}%</span></label
      >
      <button
        disabled={!enabled('shu') || !aimedObjectId}
        title={reason('shu') ?? (!aimedObjectId ? 'Visez un objet.' : undefined)}
        class:active={Boolean(aimedObjectId && nenState.shu.includes(aimedObjectId))}
        onclick={() =>
          aimedObjectId &&
          onAction({
            type: 'SHU',
            objectId: aimedObjectId,
            on: !nenState.shu.includes(aimedObjectId),
          })}>Shu</button
      >
      <button
        class="col-span-2"
        disabled={!enabled('hatsu') || !onHatsu || hatsuBlockedByMode()}
        title={reason('hatsu') ??
          (hatsuRequiresZetsu && nenState.mode !== 'zetsu'
            ? 'Ce Hatsu exige le Zetsu.'
            : nenState.mode === 'zetsu' && !hatsuAllowedInZetsu
              ? 'Le Zetsu ferme ce Hatsu.'
              : undefined)}
        onclick={() => onHatsu?.()}>Hatsu</button
      >
      <button
        class="col-span-3"
        disabled={!enabled('action') || !aimedObjectId || nenState.mode === 'zetsu'}
        title={reason('action') ??
          (!aimedObjectId
            ? 'Visez un objet.'
            : nenState.mode === 'zetsu'
              ? 'Le Zetsu ferme l’aura.'
              : undefined)}
        onclick={() => onInteract?.()}>Agir sur l'objet</button
      >
      <p class="col-span-3 mt-1 text-[9px] leading-snug text-[#FFFFF0]/40">
        T/R/X · G/I/K · −/+ Ryu · 1–4 zone · C Ko · F action · H Hatsu · N En · U Shu
      </p>
    </div>
  {/if}
</aside>

<style>
  div > button {
    min-height: 2rem;
    border: 1px solid rgb(255 255 240 / 0.16);
    border-radius: 0.2rem;
    padding: 0.25rem;
    color: rgb(255 255 240 / 0.68);
  }
  div > button:hover:not(:disabled),
  div > button.active {
    border-color: rgb(142 202 230 / 0.75);
    color: #8ecae6;
    background: rgb(142 202 230 / 0.1);
  }
  div > button:disabled {
    opacity: 0.25;
  }
</style>
