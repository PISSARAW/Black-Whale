import type { InfiltrationAction } from './state'

export interface RecordedAction {
  frame: number
  action: InfiltrationAction
}
export interface MissionReplay {
  version: 1
  missionId: string
  seed: number
  actions: RecordedAction[]
}

export const beginReplay = (missionId: string, seed: number): MissionReplay => ({
  version: 1,
  missionId,
  seed,
  actions: [],
})

export function recordAction(
  replay: MissionReplay,
  frame: number,
  action: InfiltrationAction,
): MissionReplay {
  return { ...replay, actions: [...replay.actions, { frame, action }] }
}

export function actionsAt(replay: MissionReplay, frame: number): InfiltrationAction[] {
  return replay.actions.filter((entry) => entry.frame === frame).map((entry) => entry.action)
}
