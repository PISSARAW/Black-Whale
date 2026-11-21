import {
  SIGNATURE_COMBOS,
  type SignatureCombo,
  type SignatureStep,
} from '../../src/lib/fighting/signatureCombos'
import {
  createSignatureFight,
  playSignatureCombo,
  type SignatureDummy,
} from '../../src/lib/fighting/signatureComboRunner'
import { tickFight } from '../../src/lib/fighting/engine'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { EMPTY_INPUT, type FightState, type FighterId } from '../../src/lib/fighting/types'

/** One recorded demonstration: every simulated frame and the step attempted on it. */
export interface SignatureClip {
  combo: SignatureCombo
  opponent: FighterId
  ai: boolean
  labels: string[]
  states: FightState[]
  steps: number[]
}

/** Frames kept after the last step, so the finish (and Feitan's sun) can be seen. */
const TAIL = 200

/** Tserriednich is shown against Phinks' AI: his vision only matters if someone attacks. */
const VERSUS: Partial<Record<string, { opponent: FighterId; ai: boolean }>> = {
  'tserriednich:ten-seconds-ahead': { opponent: 'phinks', ai: true },
}

export function recordSignatureClips(): SignatureClip[] {
  return SIGNATURE_COMBOS.map(recordClip)
}

function recordClip(base: SignatureCombo): SignatureClip {
  const versus = VERSUS[base.id]
  const combo = versus ? { ...base, opponent: versus.opponent } : base
  const ai = Boolean(versus?.ai)
  const states: FightState[] = []
  const steps: number[] = []
  const dummy: SignatureDummy = {
    ai,
    onFrame: (state, step) => {
      states.push(state)
      steps.push(step)
    },
  }
  const run = playSignatureCombo(
    combo,
    createSignatureFight(combo, { mirrored: false, gap: 5 }),
    dummy,
  )
  let state = run.state
  for (let i = 0; i < TAIL; i++) {
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai,
      opponentInput: ai ? undefined : { ...EMPTY_INPUT, guard: true },
    })
    states.push(state)
    steps.push(combo.steps.length)
  }
  return {
    combo,
    opponent: combo.opponent,
    ai,
    labels: combo.steps.map((step) => stepLabel(combo, step)),
    states,
    steps,
  }
}

function stepLabel(combo: SignatureCombo, step: SignatureStep): string {
  if ('move' in step) return moveForSlot(combo.fighter, step.move)?.nameFr ?? step.move
  if ('dash' in step)
    return {
      back: 'Accélération arrière',
      forward: 'Accélération avant',
      through: 'Accélération traversante',
    }[step.dash]
  if ('future' in step)
    return { close: 'Zetsu, yeux fermés', vision: 'Vision du futur', open: 'Ouverture des yeux' }[
      step.future
    ]
  if ('riposte' in step) return 'Riposte encaissée'
  if ('emperor' in step) return 'Emperor Time'
  return 'Ancrage au plafond'
}
