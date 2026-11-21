import { moveInputHint } from './fightControlHints'
import type { KeyboardBindings } from './fightInputBindings'
import { moveForSlot } from './movesets'
import type { SignatureCombo, SignatureStep } from './signatureCombos'

type Language = 0 | 1

/** Name and command of one step, in the player's own bindings. */
export function signatureStepLabel(
  combo: SignatureCombo,
  step: SignatureStep,
  options: { language: Language; bindings: KeyboardBindings },
): string {
  const { language, bindings } = options
  if ('move' in step) {
    const move = moveForSlot(combo.fighter, step.move)!
    const name = language === 0 ? move.nameFr : move.nameEn
    return `${name} (${moveInputHint(move.input, bindings)})`
  }
  if ('dash' in step)
    return step.free ? freeDashLabel(step, language) : dashLabel(step.dash, language)
  if ('future' in step || 'riposte' in step) return hingeLabel(step, language)
  return motionLabel(step, language, bindings) ?? techniqueLabel(step, language, bindings)
}

function techniqueLabel(step: SignatureStep, language: Language, bindings: KeyboardBindings) {
  if ('ranged' in step)
    return language === 0
      ? `Tir (${bindings.playerRanged}, ${step.hits} balles)`
      : `Ranged (${bindings.playerRanged}, ${step.hits} shots)`
  if ('emperor' in step)
    return language === 0
      ? `Emperor Time (Aura + ${bindings.playerFinisher}, pendant la capture)`
      : `Emperor Time (Aura + ${bindings.playerFinisher}, during the capture)`
  return language === 0
    ? 'Ancrage au plafond (Arsenal · Bungee Gum · Plafond / poutre)'
    : 'Ceiling anchor (Arsenal · Bungee Gum · Ceiling / beam)'
}

/** The deliberate breaks of a route (signatureCombosSecond.ts). */
function hingeLabel(
  step: Extract<SignatureStep, { future: unknown } | { riposte: unknown }>,
  language: Language,
): string {
  if ('riposte' in step)
    return language === 0 ? 'Encaisser volontairement une riposte' : 'Take a riposte on purpose'
  const labels = {
    close: ['Zetsu, yeux fermés', 'Zetsu, eyes closed'],
    vision: ['Vision du futur', 'Future vision'],
    open: ['Ouverture des yeux · Diverger', 'Open eyes · Diverge'],
  } as const
  return labels[step.future][language]
}

function freeDashLabel(
  step: { dash: 'back' | 'forward' | 'through'; low?: true },
  language: Language,
) {
  if (step.low) return language === 0 ? 'Esquive basse (↓ + → →)' : 'Low dodge (↓ + → →)'
  const arrows = step.dash === 'back' ? '← ←' : '→ →'
  return language === 0 ? `Dash (${arrows})` : `Dash (${arrows})`
}

const MOTION_LABELS: Record<string, readonly [string, string]> = {
  trueForm: ['Vraie forme (L, pendant la capture)', 'True Form (L, during the capture)'],
  wind: ['Démarrer Ripper Cyclotron (L)', 'Start Ripper Cyclotron (L)'],
  jump: ['Saut croisé (↑ + →)', 'Cross-up jump (↑ + →)'],
  land: ['Atterrir derrière la cible', 'Land behind the target'],
  turn: ['Terminer le dernier tour', 'Finish the last turn'],
}

/** Steps that are neither a move nor a dash; null for the others. */
function motionLabel(
  step: SignatureStep,
  language: Language,
  bindings: KeyboardBindings,
): string | null {
  const key = Object.keys(MOTION_LABELS).find((name) => name in step)
  if (!key) return null
  return MOTION_LABELS[key][language].replace('(L', `(${bindings.playerSpecial}`)
}

function dashLabel(dash: 'back' | 'forward' | 'through', language: Language): string {
  if (dash === 'through')
    return language === 0
      ? 'Accélération traversante (→ → après la touche)'
      : 'Crossing accélération (→ → after the hit)'
  const arrows = dash === 'back' ? '← ←' : '→ →'
  if (language === 0)
    return `Accélération ${dash === 'back' ? 'arrière' : 'avant'} (${arrows} après la touche)`
  return `${dash === 'back' ? 'Back' : 'Forward'} accélération (${arrows} after the hit)`
}

export const signatureRouteText = (
  combo: SignatureCombo,
  options: { language: Language; bindings: KeyboardBindings },
) => combo.steps.map((step) => signatureStepLabel(combo, step, options)).join(' → ')
