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
  <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">{$t.tour.controls.title}</p>
  <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-[#FFFFF0]/70">
    <dt class="text-[#FFFFF0]">{$t.tour.controls.move}</dt><dd>{$t.tour.controls.moveKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.look}</dt><dd>{$t.tour.controls.lookKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.sprint}</dt><dd>{$t.tour.controls.sprintKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.use}</dt><dd>{$t.tour.controls.useKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.plan}</dt><dd>{$t.tour.controls.planKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.find}</dt><dd>{$t.tour.controls.findKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.reveal}</dt><dd>{$t.tour.controls.revealKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.fullscreen}</dt><dd>{$t.tour.controls.fullscreenKeys}</dd>
    <dt class="text-[#FFFFF0]">{$t.tour.controls.release}</dt><dd>{$t.tour.controls.releaseKeys}</dd>
    {#if hasTechnique}<dt class="text-[#FFFFF0]">{$t.tour.controls.nen}</dt><dd>{$t.tour.controls.nenKeys}</dd>{/if}
    {#if secondHand}
      <dt class="text-[#FFFFF0]">{$t.tour.controls.nenSecond}</dt><dd>{$t.tour.controls.nenSecondKeys(secondHand)}</dd>
    {:else if twoHanded}
      <dt class="text-[#FFFFF0]">{$t.tour.controls.nenMoon}</dt><dd>{$t.tour.controls.nenMoonKeys}</dd>
    {:else if selfCastable}
      <dt class="text-[#FFFFF0]">{$t.tour.controls.nenSelf}</dt><dd>{$t.tour.controls.nenSelfKeys}</dd>
    {/if}
    {#if touch}<dt class="text-[#FFFFF0]">{$t.tour.controls.touch}</dt><dd>{$t.tour.controls.touchKeys}</dd>{/if}
  </dl>
</section>
