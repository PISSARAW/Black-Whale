<script lang="ts">
  import { t } from '$lib/i18n'

  interface Props {
    hasTechnique: boolean
    secondHand: string | null
    twoHanded: boolean
    selfCastable: boolean
    touch: boolean
  }

  let { hasTechnique, secondHand, twoHanded, selfCastable, touch }: Props = $props()
</script>

<section class="rounded border border-[#333] p-3">
  <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {$t.tour.controls.title}
  </p>
  <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-[#FFFFF0]/70">
    <dt class="text-[#FFFFF0]">{$t.tour.controls.move}</dt>
    <dd><kbd>{$t.tour.controls.moveKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.look}</dt>
    <dd><kbd>{$t.tour.controls.lookKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.sprint}</dt>
    <dd><kbd>{$t.tour.controls.sprintKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.use}</dt>
    <dd><kbd>{$t.tour.controls.useKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.plan}</dt>
    <dd><kbd>{$t.tour.controls.planKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.find}</dt>
    <dd><kbd>{$t.tour.controls.findKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.reveal}</dt>
    <dd><kbd>{$t.tour.controls.revealKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.fullscreen}</dt>
    <dd><kbd>{$t.tour.controls.fullscreenKeys}</kbd></dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.release}</dt>
    <dd><kbd>{$t.tour.controls.releaseKeys}</kbd></dd>
    {#if hasTechnique}<dt class="text-[#FFFFF0]">{$t.tour.controls.nen}</dt>
      <dd><kbd>{$t.tour.controls.nenKeys}</kbd></dd>{/if}
    {#if secondHand}
      <dt class="text-[#FFFFF0]">{$t.tour.controls.nenSecond}</dt>
      <dd><kbd>{$t.tour.controls.nenSecondKeys(secondHand)}</kbd></dd>
    {:else if twoHanded}
      <dt class="text-[#FFFFF0]">{$t.tour.controls.nenMoon}</dt>
      <dd><kbd>{$t.tour.controls.nenMoonKeys}</kbd></dd>
    {:else if selfCastable}
      <dt class="text-[#FFFFF0]">{$t.tour.controls.nenSelf}</dt>
      <dd><kbd>{$t.tour.controls.nenSelfKeys}</kbd></dd>
    {/if}
    {#if touch}<dt class="text-[#FFFFF0]">{$t.tour.controls.touch}</dt>
      <dd><kbd>{$t.tour.controls.touchKeys}</kbd></dd>{/if}
  </dl>
</section>
