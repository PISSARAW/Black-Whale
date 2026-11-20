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
  if ('emperor' in step)
    return language === 0
      ? `Emperor Time (Aura + ${bindings.playerFinisher}, pendant la capture)`
      : `Emperor Time (Aura + ${bindings.playerFinisher}, during the capture)`
  return language === 0
    ? 'Ancrage au plafond (Arsenal · Bungee Gum · Plafond / poutre)'
    : 'Ceiling anchor (Arsenal · Bungee Gum · Ceiling / beam)'
}

function dashLabel(dash: 'back' | 'forward', language: Language): string {
  const arrows = dash === 'back' ? '← ←' : '→ →'
  if (language === 0)
    return `Accélération ${dash === 'back' ? 'arrière' : 'avant'} (${arrows} après la touche)`
  return `${dash === 'back' ? 'Back' : 'Forward'} accélération (${arrows} after the hit)`
}

export const signatureRouteText = (
  combo: SignatureCombo,
  options: { language: Language; bindings: KeyboardBindings },
) => combo.steps.map((step) => signatureStepLabel(combo, step, options)).join(' → ')
