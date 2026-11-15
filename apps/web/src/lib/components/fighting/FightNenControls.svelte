<script lang="ts">
  import type { ArcadeFighter, FightNenCommand } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let onNen: (command: FightNenCommand) => void

  const COMMANDS: Array<{ command: FightNenCommand; key: string; fr: string; en: string }> = [
    { command: 'ten', key: '1', fr: 'Ten · stabilité', en: 'Ten · stability' },
    { command: 'ren', key: '2', fr: 'Ren · puissance', en: 'Ren · power' },
    { command: 'zetsu', key: '3', fr: 'Zetsu · recharge', en: 'Zetsu · recharge' },
    { command: 'ken', key: '4', fr: 'Ken · défense', en: 'Ken · defence' },
    { command: 'gyo', key: '5', fr: 'Gyo · précision', en: 'Gyo · focus' },
    { command: 'ko', key: '6', fr: 'Ko · prochain coup', en: 'Ko · next strike' },
    { command: 'ryu', key: '7', fr: 'Ryu · répartition', en: 'Ryu · flow' },
    { command: 'in', key: '8', fr: 'In · dissimulation', en: 'In · concealment' },
    { command: 'en', key: '9', fr: 'En · perception', en: 'En · perception' },
  ]

  function active(command: FightNenCommand): boolean {
    if (command === 'ten' || command === 'ren' || command === 'zetsu') {
      return fighter.nen.mode === command
    }
    if (command === 'ken' || command === 'gyo' || command === 'in') return fighter.nen[command]
    if (command === 'ko') return fighter.nen.ko !== null
    if (command === 'en') return fighter.nen.en !== null
    return Object.values(fighter.nen.ryu).some((share) => Number(share) > 0) && !fighter.nen.ko
  }
</script>

<div class="nen-controls" aria-label={language === 'fr' ? 'Techniques de Nen' : 'Nen techniques'}>
  <span class="nen-title">NEN</span>
  <div class="nen-scroll">
    {#each COMMANDS as item (item.command)}
      <button
        type="button"
        class:active={active(item.command)}
        aria-pressed={active(item.command)}
        title={language === 'fr' ? item.fr : item.en}
        onclick={() => onNen(item.command)}
      >
        <kbd>{item.key}</kbd>
        <span>{item.command}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .nen-controls {
    position: absolute;
    z-index: 28;
    top: 5.8rem;
    left: 50%;
    display: flex;
    width: min(94%, 850px);
    align-items: center;
    gap: 0.55rem;
    transform: translateX(-50%);
  }
  .nen-title {
    color: #7de7ff;
    font: 700 0.65rem/1 var(--font-display);
    letter-spacing: 0.18em;
    text-shadow: 0 0 10px #369ac7;
  }
  .nen-scroll {
    display: flex;
    flex: 1;
    justify-content: center;
    gap: 0.3rem;
  }
  button {
    display: flex;
    min-width: 54px;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    padding: 0.3rem 0.42rem;
    border: 1px solid rgb(116 171 195 / 32%);
    border-radius: 2px;
    background: rgb(4 10 15 / 78%);
    color: #9fafb8;
    font: 700 0.58rem/1 var(--font-mono);
    text-transform: uppercase;
    backdrop-filter: blur(5px);
  }
  button:hover,
  button.active {
    border-color: #72d9ff;
    background: rgb(21 73 94 / 86%);
    color: #fff;
    box-shadow: 0 0 12px rgb(75 193 238 / 26%);
  }
  kbd {
    color: #d5b85c;
    font: inherit;
  }
  @media (max-width: 760px) {
    .nen-controls {
      top: 4.6rem;
      width: calc(100% - 1rem);
    }
    .nen-scroll {
      overflow-x: auto;
      justify-content: flex-start;
      scrollbar-width: none;
    }
    .nen-scroll::-webkit-scrollbar {
      display: none;
    }
    button {
      min-width: 50px;
    }
  }
</style>
