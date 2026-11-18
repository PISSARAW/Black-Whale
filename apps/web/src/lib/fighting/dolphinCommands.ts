import { equippedDolphin, withLoanCarrier } from './dolphinBorrowing'
import { withDolphinSupply } from './dolphinSupply'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

const PREFIXES: Readonly<Record<string, readonly string[]>> = {
  illumi: ['illumi-face-'],
  kalluto: ['paper-stop-listening', 'paper-release-confetti'],
  musse: ['window-recall', 'window-stop-listening'],
  sayird: ['little-eye-'],
  hisoka: ['gum-', 'texture-'],
  biscuit: ['cookie-'],
  hinrigh: ['biohazard-'],
  basho: ['basho-'],
}
export function dolphinCommandAllowed(actor: ArcadeFighter, command: ArsenalCommand): boolean {
  const held = equippedDolphin(actor)
  if (!held?.loaded || held.returned) return false
  return (PREFIXES[held.source] ?? []).some((prefix) => command.action.startsWith(prefix))
}
export function performLoanCommand(
  options: { state: FightState; side: FightSide; command: ArsenalCommand },
  run: (state: FightState, side: FightSide, command: ArsenalCommand) => FightState,
): FightState {
  const { state, side, command } = options
  if (!state[side].dolphinLoan || !dolphinCommandAllowed(state[side], command)) return state
  const native = { ...command, loan: undefined }
  return withLoanCarrier(state, { side, kurapikaCommand: true }, (prepared) =>
    withDolphinSupply(prepared, side, (supplied) => run(supplied, side, native)),
  )
}
export function loanCommandOptions(
  state: FightState,
  side: FightSide,
  list: (state: FightState, side: FightSide) => ArsenalOption[],
): ArsenalOption[] {
  if (!state[side].dolphinLoan) return []
  let result: ArsenalOption[] = []
  withLoanCarrier(state, { side, kurapikaCommand: true }, (prepared) =>
    withDolphinSupply(prepared, side, (supplied) => {
      result = list(supplied, side)
        .filter((option) => dolphinCommandAllowed(supplied[side], option.command))
        .map((option) => ({
          ...option,
          command: { ...option.command, loan: true },
          labelFr: `Dolphin prêté · ${option.labelFr}`,
          labelEn: `Loaned Dolphin · ${option.labelEn}`,
        }))
      return supplied
    }),
  )
  return result
}
