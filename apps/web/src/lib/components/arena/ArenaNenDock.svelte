<script lang="ts">
  import { t } from '$lib/i18n'
  import type { BodyZone, FighterState } from '$lib/combat/types'
  import type { ArenaCommand } from '$lib/arena/nenCommands'
  import { dockTechniqueCommand, nenDockButtons } from '$lib/arena/nenDock'

  /**
   * Clash's Nen bar in Arena: guard, the techniques with the ones being held
   * lit (Ten by default), Ryu and Hatsu. The strikes are the move row above.
   */
  interface Props {
    player: FighterState
    aimed: BodyZone
    ryuOpen: boolean
    hatsuName: string
    onCommand: (command: ArenaCommand) => void
    onGuard: () => void
    onRyu: () => void
    onHatsu: () => void
  }

  let { player, aimed, ryuOpen, hatsuName, onCommand, onGuard, onRyu, onHatsu }: Props = $props()

  let techniques = $derived(nenDockButtons(player))
</script>

<nav class="arena-action-dock" aria-label={$t.arena.ui.quickActions}>
  <button type="button" data-arena-action="guard" onclick={onGuard}
    ><kbd>⇧</kbd><span>{$t.arena.ui.guard}</span></button
  >
  {#each techniques as technique (technique.id)}
    <button
      type="button"
      class="technique {technique.id}"
      class:active={technique.active}
      aria-pressed={technique.active}
      data-arena-nen={technique.id}
      onclick={() => onCommand(dockTechniqueCommand(player, technique.id, aimed))}
      ><kbd>{technique.key}</kbd><span>{technique.label}</span></button
    >
  {/each}
  <button type="button" class:active={ryuOpen} aria-expanded={ryuOpen} onclick={onRyu}
    ><kbd>1–4</kbd><span>Ryu · {Math.round(player.attackShare * 100)}%</span></button
  >
  <button type="button" class="hatsu-action" data-arena-action="hatsu" onclick={onHatsu}
    ><kbd>H</kbd><span>{hatsuName}</span></button
  >
</nav>

<style>
  .arena-action-dock {
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 0.3rem;
  }

  .technique {
    color: rgb(255 255 240 / 58%);
  }

  .technique.active {
    background: rgb(255 215 0 / 12%);
  }

  .technique.ko.active {
    border-color: rgb(225 120 90 / 80%);
    color: #f1a38a;
  }

  .technique.zetsu.active,
  .technique.in.active {
    border-color: rgb(155 145 199 / 80%);
    color: #c9c1ec;
  }

  @media (max-width: 760px) {
    .arena-action-dock {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
</style>
