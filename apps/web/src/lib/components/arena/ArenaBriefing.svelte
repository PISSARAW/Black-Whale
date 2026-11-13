<script lang="ts">
  import { t } from '$lib/i18n'

  let { onStart, goal }: { onStart: () => void; goal: string } = $props()
</script>

<div
  class="combat-briefing"
  role="dialog"
  aria-modal="true"
  aria-labelledby="combat-briefing-title"
>
  <div class="briefing-card">
    <p class="briefing-kicker">{$t.arena.ui.beforeFight}</p>
    <h2 id="combat-briefing-title">{$t.arena.ui.briefingTitle}</h2>
    <p class="briefing-goal">{goal}</p>
    <ol class="briefing-steps">
      <li>
        <kbd>{$t.arena.ui.moveKeys}</kbd>
        <span><strong>{$t.arena.ui.approach}</strong>{$t.arena.ui.approachSuffix}</span>
      </li>
      <li>
        <kbd>CLIC · F</kbd>
        <span><strong>{$t.arena.ui.strike}</strong>{$t.arena.ui.strikeSuffix}</span>
      </li>
      <li>
        <kbd>MAJ</kbd>
        <span><strong>{$t.arena.ui.block}</strong>{$t.arena.ui.blockSuffix}</span>
      </li>
    </ol>
    <button class="briefing-start" onclick={onStart}>{$t.arena.ui.enterArena}</button>
  </div>
</div>
