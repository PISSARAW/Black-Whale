import type { AttackKind, FightInput, FightSide, FightState } from './types'
import type { ReplayCommand } from './fightReplayTypes'
import type { LessonId } from './fightLessons'
import type { BlinkyCommand, BlinkyTarget } from './blinky'
import type { TrainingPosition } from './trainingTypes'

export interface FightBattleActions {
  attack: (kind: AttackKind) => void
  throwAttack: () => void
  finisher: () => void
  control: (key: keyof FightInput, active: boolean) => void
  opponentControl: (key: keyof FightInput, active: boolean) => void
  queueAction: (action: (state: FightState) => FightState) => void
  queueCommand: (command: ReplayCommand) => void
  blinkyTarget: (side: FightSide, target: BlinkyTarget) => void
  blinkyCommand: (side: FightSide, command: BlinkyCommand) => void
  togglePause: () => void
  startFight: () => void
  rematch: () => void
  continueMatch: () => void
  chooseAgain: () => void
  quitFight: () => void
  resetLab: (position: TrainingPosition) => void
  stepLab: () => void
  resetPlayback: () => void
  resetFightInputs: () => void
  startLesson: (id: LessonId) => void
  exitLesson: () => void
  launchPractice: (next: FightState | null) => void
}
