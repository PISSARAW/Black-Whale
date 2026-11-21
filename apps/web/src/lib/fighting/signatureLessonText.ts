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
  if ('dash' in step) return dashLabel(step.dash, language)
  if ('future' in step || 'riposte' in step) return hingeLabel(step, language)
  return commandLabel(step, options)
}

/** Ranged fire, Emperor Time and the gum anchor: commands rather than moves. */
function commandLabel(
  step: SignatureStep,
  options: { language: Language; bindings: KeyboardBindings },
): string {
  const { language, bindings } = options
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
