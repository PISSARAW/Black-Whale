<script lang="ts">
  import { KO_COST, nenStatus, nenTacticalState, type FightNenTactic } from '$lib/fighting/nen'
  import type { ArcadeFighter, FightNenZone } from '$lib/fighting/types'
  import { FIGHT_NEN_ZONES } from '$lib/fighting/nen'
  import { onFlowLabel, onTacticalCopy } from '$lib/fighting/onCopy'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let onAura: (active: boolean) => void

  $: technique = nenStatus(fighter).join(' · ')
  $: tactical = nenTacticalState(fighter)
  $: explanation =
    tactical.technique === 'on' ? onTacticalCopy(language) : tacticalCopy(tactical.technique)
  $: flow = flowLabel(tactical.technique, tactical.auraPerSecond)
  $: danger =
    tactical.exhausted ||
    tactical.technique === 'zetsu' ||
    tactical.technique === 'ko' ||
    tactical.technique === 'on' ||
    (tactical.technique === 'ren' && fighter.aura <= 25)

  const ZONE_LABELS: Record<'fr' | 'en', Record<FightNenZone, string>> = {
    fr: { head: 'Tête', torso: 'Torse', hands: 'Mains', feet: 'Jambes' },
    en: { head: 'Head', torso: 'Torso', hands: 'Hands', feet: 'Legs' },
  }

  function zoneLabel(zone: FightNenZone): string {
    return ZONE_LABELS[language][zone]
  }

  function exposedList(): string {
    return tactical.exposedZones.map(zoneLabel).join(' · ')
  }

  function flowLabel(active: FightNenTactic, rate: number): string {
    if (active === 'ko') return `${language === 'fr' ? 'COÛT' : 'COST'} −${KO_COST}`
    if (active === 'on') return onFlowLabel(language)
    const amount = Math.abs(rate).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
      maximumFractionDigits: 1,
    })
    const prefix = rate >= 0 ? '+' : '−'
    return `${prefix}${amount} AURA/S`
  }

  function tacticalCopyFr(active: FightNenTactic): { benefit: string; risk: string } {
    if (active === 'zetsu')
      return {
        benefit: 'Récupération accélérée de la réserve',
        risk: tactical.exhausted
          ? 'ÉPUISEMENT · défense d’aura nulle jusqu’à 18'
          : 'DÉFENSE NULLE · les impacts Nen deviennent dévastateurs',
      }
    if (active === 'ken')
      return {
        benefit: 'Sous garde, les dégâts sont annulés',
        risk: 'Drain massif et continu · épuisement rapide',
      }
    if (active === 'ko')
      return {
        benefit: 'Impact critique · puissance maximale',
        risk: `CORPS EXPOSÉ · hors ${zoneLabel(tactical.focusZone!)} : dégâts ×1,55`,
      }
    if (active === 'gyo')
      return {
        benefit: 'Révèle In, les pièges et l’aura adverse',
        risk: 'Défense amincie pendant la lecture',
      }
    if (active === 'ryu')
      return {
        benefit: `${zoneLabel(tactical.focusZone!)} renforcé avant l’impact`,
        risk: `EXPOSÉ · ${exposedList()}`,
      }
    if (active === 'ren')
      return {
        benefit: 'Pression active · puissance des coups +22 %',
        risk:
          fighter.aura <= 25
            ? 'FATIGUE CRITIQUE · Zetsu forcé imminent'
            : 'Fatigue progressive tant que la pression tient',
      }
    return {
      benefit: 'Défense équilibrée · récupération légère',
      risk: 'Aucune zone spécialisée',
    }
  }

  function tacticalCopy(active: FightNenTactic): { benefit: string; risk: string } {
    if (language === 'fr') return tacticalCopyFr(active)

    if (active === 'zetsu')
      return {
        benefit: 'Accelerated aura recovery',
        risk: tactical.exhausted
          ? 'EXHAUSTED · no aura defence until 18'
          : 'NO DEFENCE · Nen impacts become devastating',
      }
    if (active === 'ken')
      return { benefit: 'While guarding, damage is negated', risk: 'Massive constant drain' }
    if (active === 'ko')
      return {
        benefit: 'Critical impact · maximum power',
        risk: `BODY EXPOSED · outside ${zoneLabel(tactical.focusZone!)}: damage ×1.55`,
      }
    if (active === 'gyo')
      return { benefit: 'Reveals In, traps and enemy aura', risk: 'Thinner defence while reading' }
    if (active === 'ryu')
      return {
        benefit: `${zoneLabel(tactical.focusZone!)} reinforced before impact`,
        risk: `EXPOSED · ${exposedList()}`,
      }
    if (active === 'ren')
      return {
        benefit: 'Active pressure · strike power +22%',
        risk:
          fighter.aura <= 25
            ? 'CRITICAL FATIGUE · forced Zetsu imminent'
            : 'Progressive fatigue while pressure holds',
      }
    return { benefit: 'Balanced defence · light recovery', risk: 'No specialised zone' }
  }
</script>

<div
  class="nen-controls"
  class:danger
  aria-label={language === 'fr' ? 'Contrôle tactique de l’aura' : 'Tactical aura control'}
>
  <button
    type="button"
    class:active={fighter.nen.mode !== 'ten' || fighter.nen.gyo || fighter.nen.ko !== null}
    aria-label={language === 'fr' ? 'Maintenir Aura' : 'Hold Aura'}
    onpointerdown={(event) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      onAura(true)
    }}
    onpointerup={() => onAura(false)}
    onpointercancel={() => onAura(false)}
  >
    <kbd>ESPACE</kbd>
    <strong>AURA</strong>
    <span>{technique}</span>
  </button>

  <section class="tactical-readout" data-technique={tactical.technique} aria-live="polite">
    <header>
      <div>
        <small>{language === 'fr' ? 'ÉTAT NEN' : 'NEN STATE'}</small>
        <strong>{tactical.technique}</strong>
      </div>
      <b class:draining={tactical.auraPerSecond < 0 || tactical.technique === 'ko' || tactical.technique === 'on'}
        >{flow}</b
      >
    </header>

    <div class="tradeoff">
      <p class="benefit"><i aria-hidden="true">+</i><span>{explanation.benefit}</span></p>
      <p class="risk"><i aria-hidden="true">!</i><span>{explanation.risk}</span></p>
    </div>

    {#if tactical.focusZone}
      <div class="focus-heading">
        <span>{language === 'fr' ? 'ZONE RENFORCÉE' : 'REINFORCED ZONE'}</span>
        <b>{zoneLabel(tactical.focusZone)} · {Math.round(tactical.focusShare * 100)}%</b>
      </div>
      <div
        class="zone-distribution"
        aria-label={language === 'fr' ? 'Répartition du Ryu' : 'Ryu distribution'}
      >
        {#each FIGHT_NEN_ZONES as zone (zone)}
          <span
            class:focused={zone === tactical.focusZone}
            class:exposed={tactical.exposedZones.includes(zone)}
            style={`--share:${Math.max(0.04, tactical.distribution[zone])}`}
          >
            <i></i><small>{zoneLabel(zone)}</small><b
              >{Math.round(tactical.distribution[zone] * 100)}%</b
            >
          </span>
        {/each}
      </div>
    {/if}
  </section>

  <p class="shortcut-hint">
    {language === 'fr'
      ? 'Maintenir : Ren · + garde : Ken · + bas : Zetsu · + haut : Gyo · relâcher sur un coup : Ko · + L (rancune 50) : On'
      : 'Hold: Ren · + guard: Ken · + down: Zetsu · + up: Gyo · release on a strike: Ko · + L (grudge 50): On'}
  </p>
</div>

<style>
  .nen-controls {
    position: absolute;
    z-index: 28;
    top: 5.8rem;
    left: 50%;
    display: grid;
    width: min(92vw, 620px);
    justify-items: center;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .nen-controls > button {
    display: grid;
    min-width: 148px;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: center;
    gap: 0.2rem 0.65rem;
    padding: 0.55rem 0.8rem;
    border: 1px solid rgb(116 171 195 / 45%);
    border-radius: 3px;
    background: rgb(4 10 15 / 82%);
    color: #dce9ef;
    backdrop-filter: blur(6px);
    touch-action: none;
    pointer-events: auto;
  }
  .nen-controls > button:hover,
  .nen-controls > button.active,
  .nen-controls > button:active {
    border-color: #72d9ff;
    background: rgb(21 73 94 / 90%);
    box-shadow: 0 0 18px rgb(75 193 238 / 34%);
  }
  .nen-controls > button kbd {
    color: #d5b85c;
    font: 700 0.55rem/1 var(--font-mono);
  }
  .nen-controls > button strong {
    font: 800 0.78rem/1 var(--font-display);
    letter-spacing: 0.14em;
  }
  .nen-controls > button span {
    grid-column: 1 / -1;
    color: #87dcff;
    font: 700 0.55rem/1 var(--font-mono);
    text-transform: uppercase;
  }
  .tactical-readout {
    width: 100%;
    margin-top: 0.42rem;
    padding: 0.55rem 0.65rem 0.62rem;
    border: 1px solid rgb(109 217 255 / 32%);
    border-radius: 3px;
    background: linear-gradient(105deg, rgb(4 11 16 / 92%), rgb(9 25 34 / 88%));
    box-shadow: 0 10px 28px rgb(0 0 0 / 30%);
    backdrop-filter: blur(8px);
  }
  .danger .tactical-readout {
    border-color: rgb(255 91 91 / 58%);
    background: linear-gradient(105deg, rgb(25 6 9 / 94%), rgb(39 12 15 / 91%));
  }
  .tactical-readout header,
  .focus-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .tactical-readout header > div {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
  }
  .tactical-readout header small,
  .focus-heading span {
    color: #81949e;
    font: 700 0.46rem/1 var(--font-mono);
    letter-spacing: 0.12em;
  }
  .tactical-readout header strong {
    color: #a9eaff;
    font: 900 0.85rem/1 var(--font-display);
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  .danger .tactical-readout header strong {
    color: #ff9a96;
  }
  .tactical-readout header > b {
    padding: 0.18rem 0.35rem;
    border: 1px solid rgb(126 228 191 / 35%);
    color: #82e1bb;
    font: 800 0.52rem/1 var(--font-mono);
    letter-spacing: 0.05em;
  }
  .tactical-readout header > b.draining {
    border-color: rgb(255 132 105 / 43%);
    color: #ff9c83;
  }
  .tradeoff {
    display: grid;
    margin-top: 0.42rem;
    grid-template-columns: 1fr 1fr;
    gap: 0.42rem;
  }
  .tradeoff p {
    display: grid;
    min-width: 0;
    margin: 0;
    grid-template-columns: 1.15rem 1fr;
    align-items: center;
    gap: 0.35rem;
    color: #c9d8de;
    font: 650 0.55rem/1.22 var(--font-mono);
  }
  .tradeoff i {
    display: grid;
    width: 1.05rem;
    height: 1.05rem;
    place-items: center;
    border-radius: 50%;
    font-style: normal;
    font-weight: 900;
  }
  .benefit i {
    background: rgb(61 194 146 / 20%);
    color: #79dfb9;
  }
  .risk i {
    background: rgb(234 72 72 / 20%);
    color: #ff8580;
  }
  .risk span {
    color: #ffaaa2;
  }
  .focus-heading {
    margin-top: 0.52rem;
    padding-top: 0.46rem;
    border-top: 1px solid rgb(255 255 255 / 10%);
  }
  .focus-heading b {
    color: #fff3aa;
    font: 800 0.58rem/1 var(--font-mono);
    text-transform: uppercase;
  }
  .zone-distribution {
    display: grid;
    margin-top: 0.38rem;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.28rem;
  }
  .zone-distribution > span {
    position: relative;
    display: grid;
    overflow: hidden;
    min-width: 0;
    padding: 0.28rem 0.34rem;
    grid-template-columns: 1fr auto;
    gap: 0.2rem;
    border: 1px solid rgb(255 255 255 / 11%);
    background: rgb(255 255 255 / 4%);
  }
  .zone-distribution > span > i {
    position: absolute;
    inset: 0;
    width: calc(var(--share) * 100%);
    background: rgb(80 198 238 / 18%);
  }
  .zone-distribution > span.focused {
    border-color: rgb(255 222 103 / 70%);
    box-shadow: inset 0 0 12px rgb(255 201 55 / 16%);
  }
  .zone-distribution > span.focused > i {
    background: rgb(255 207 66 / 31%);
  }
  .zone-distribution > span.exposed {
    border-color: rgb(255 92 92 / 36%);
  }
  .zone-distribution > span.exposed > i {
    background: rgb(231 55 55 / 22%);
  }
  .zone-distribution small,
  .zone-distribution b {
    position: relative;
    z-index: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .zone-distribution small {
    color: #a9bac2;
    font: 650 0.48rem/1 var(--font-mono);
  }
  .zone-distribution b {
    color: #edf7fa;
    font: 800 0.5rem/1 var(--font-mono);
  }
  .shortcut-hint {
    max-width: min(82vw, 620px);
    margin: 0.35rem 0 0;
    color: #a9bbc5;
    font: 600 0.52rem/1.25 var(--font-mono);
    text-align: center;
    text-shadow: 0 1px 5px #000;
  }
  @media (max-width: 760px) {
    .nen-controls {
      top: 4.6rem;
      width: min(96vw, 620px);
    }
    .shortcut-hint {
      display: none;
    }
    .tactical-readout {
      padding: 0.45rem 0.5rem 0.5rem;
    }
    .tradeoff {
      grid-template-columns: 1fr;
    }
    .tradeoff p {
      font-size: 0.5rem;
    }
    .zone-distribution small {
      display: none;
    }
  }
</style>
