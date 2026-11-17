<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { bodyGyoCopy } from '$lib/fighting/nenCombat/copy'
  import { advancedNenCopy } from '$lib/fighting/nenTacticalCopy'
  import FightNenTactics from './FightNenTactics.svelte'
  import type { FightInput } from '$lib/fighting/types'
  import { KO_COST, nenStatus, nenTacticalState, type FightNenTactic } from '$lib/fighting/nen'
  import type { ArcadeFighter, FightNenZone } from '$lib/fighting/types'
  import { FIGHT_NEN_ZONES } from '$lib/fighting/nen'
  import { onFlowLabel, onTacticalCopy } from '$lib/fighting/onCopy'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let detailed = false
  export let showControls = false
  export let onAura: (active: boolean) => void
  export let onControl: (key: keyof FightInput, held: boolean) => void = () => {}
  export let onEmperor: () => void = () => {}

  $: technique = nenStatus(fighter).join(' · ')
  $: tactical = nenTacticalState(fighter)
  $: explanation =
    tactical.technique === 'on'
      ? onTacticalCopy(language)
      : (bodyGyoCopy(fighter, language) ??
        advancedNenCopy(tactical.technique, language) ??
        tacticalCopy(tactical.technique))
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
        benefit: 'Protection soutenue du corps et de la garde',
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
      return { benefit: 'Sustained body and guard protection', risk: 'Massive constant drain' }
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

  $: warning = tactical.exhausted
    ? language === 'fr'
      ? 'Épuisé · défense nulle jusqu’à 18 aura'
      : 'Exhausted · no defence until 18 aura'
    : tactical.technique === 'ren' && fighter.aura <= 25
      ? language === 'fr'
        ? 'Fatigue critique · Zetsu forcé imminent'
        : 'Critical fatigue · forced Zetsu imminent'
      : tactical.technique === 'gyo'
        ? explanation.risk
        : warnings[language][tactical.technique]

  const warnings: Record<'fr' | 'en', Record<FightNenTactic, string>> = {
    fr: {
      en: 'Détection de proximité · drain élevé',
      shu: 'Objet renforcé · corps exposé',
      in: 'Gyo révèle · corps et objets réels visibles',
      ten: '',
      ren: 'Puissance +22 %',
      ken: 'Garde renforcée · drain élevé',
      zetsu: 'Défense Nen nulle',
      gyo: 'Vision Nen · défense réduite',
      ryu: 'Zones non renforcées exposées',
      ko: 'Corps exposé hors zone renforcée',
      on: 'Hatsu, Ken et Ko scellés · drain de vie',
    },
    en: {
      en: 'Proximity sensing · heavy drain',
      shu: 'Reinforced object · exposed body',
      in: 'Aura hidden · Gyo and En can detect',
      ten: '',
      ren: 'Power +22%',
      ken: 'Reinforced guard · heavy drain',
      zetsu: 'No Nen defence',
      gyo: 'Nen vision · reduced defence',
      ryu: 'Other zones exposed',
      ko: 'Body exposed outside focused zone',
      on: 'Hatsu, Ken and Ko sealed · life drain',
    },
  }
</script>

<div class="nen-controls" class:danger>
  <div class="nen-summary">
    <strong>{technique}</strong>
    <b
      class:draining={tactical.auraPerSecond < 0 ||
        tactical.technique === 'ko' ||
        tactical.technique === 'on'}>{flow}</b
    >
    {#if warning}<span class="warning">{warning}</span>{/if}
  </div>
  {#if tactical.focusZone}
    <div
      class="zone-distribution"
      aria-label={language === 'fr' ? 'Répartition de l’aura' : 'Aura distribution'}
    >
      {#each FIGHT_NEN_ZONES as zone (zone)}
        <span
          class:focused={zone === tactical.focusZone}
          class:exposed={tactical.exposedZones.includes(zone)}
        >
          {zoneLabel(zone)} <b>{Math.round(tactical.distribution[zone] * 100)}%</b>
        </span>
      {/each}
    </div>
  {/if}
  {#if showControls || detailed}
    <div class="nen-buttons">
      <button
        type="button"
        aria-label={language === 'fr' ? 'Maintenir Aura' : 'Hold Aura'}
        onpointerdown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          onAura(true)
        }}
        onpointerup={() => onAura(false)}
        onpointercancel={() => onAura(false)}
        ><kbd
          >{$bindings.playerAura === ' '
            ? language === 'fr'
              ? 'Espace'
              : 'Space'
            : $bindings.playerAura}</kbd
        > AURA</button
      >
      {#if fighter.id === 'kurapika'}
        <button
          type="button"
          class:active={fighter.kurapika?.emperorTime}
          onclick={onEmperor}
          disabled={Boolean(fighter.kurapika?.held?.loaded) ||
            (fighter.kurapika?.blackoutFrames ?? 0) > 0}
        >
          <kbd
            >{$bindings.playerAura === ' ' ? 'Aura' : $bindings.playerAura} + {$bindings.playerFinisher}</kbd
          > EMPEROR TIME
        </button>
      {/if}
    </div>
  {/if}
  {#if showControls || detailed}<FightNenTactics {fighter} {language} {onControl} />{/if}
  {#if detailed}
    <div class="nen-explanation">
      <p>{explanation.benefit}</p>
      <p class="warning">{explanation.risk}</p>
      <p>
        {language === 'fr'
          ? 'Maintenir : Ren · + garde : Ken · + bas : Zetsu · + haut : Gyo · relâcher sur un coup : Ko · R : En · F : Shu · X : In · G : Gyo · 1–4 : Ryu tête/torse/mains/jambes · + L (rancune 50) : On'
          : 'Hold: Ren · + guard: Ken · + down: Zetsu · + up: Gyo · release on a strike: Ko · R: En · F: Shu · X: In · G: Gyo · 1–4: Ryu head/torso/hands/legs · + L (grudge 50): On'}
      </p>
    </div>
  {/if}
</div>

<style>
  .nen-controls {
    display: grid;
    gap: 0.4rem;
    color: #dbe6ec;
    font: 600 var(--hud-font, 0.75rem)/1.4 var(--font-mono);
  }
  .nen-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
  }
  .nen-summary strong {
    color: #a9eaff;
    text-transform: uppercase;
  }
  .nen-summary b {
    color: #a0e2c5;
  }
  .nen-summary b.draining {
    color: #ffc29e;
  }
  .warning {
    color: #ffbdab;
  }
  .danger .warning {
    font-weight: 800;
  }
  .nen-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  button {
    min-height: 44px;
    padding: 0.45rem 0.65rem;
    border: 1px solid #6b8a9a;
    border-radius: 3px;
    background: #14232d;
    color: #e8f5fc;
    font: inherit;
    touch-action: none;
  }
  button:active,
  button.active {
    background: #285469;
    border-color: #a4e8ff;
  }
  button:disabled {
    opacity: 0.5;
  }
  button:focus-visible {
    outline: 2px solid #e7ca7c;
    outline-offset: 2px;
  }
  kbd {
    color: #e7ca7c;
    font-size: inherit;
  }
  .zone-distribution {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .zone-distribution span {
    padding: 0.2rem 0.35rem;
    border: 1px solid #394754;
    background: #151e26;
  }
  .zone-distribution .focused {
    border-color: #ecd17b;
    color: #ffedae;
  }
  .zone-distribution .exposed {
    border-style: dashed;
    color: #ffbdab;
  }
  .nen-explanation {
    padding-top: 0.3rem;
    border-top: 1px solid #35434c;
  }
  p {
    margin: 0.3rem 0 0;
  }
</style>
