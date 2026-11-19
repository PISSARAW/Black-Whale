import type { KeyedMove } from './keyPoseMoves'

/** Authored listening gesture; it does not extend a damaging or contact hand. */
export const WINDOW_LISTENING_POSE: KeyedMove = {
  authored: false,
  timeline: [
    { phase: 'startup', at: 0.5, pose: { head: [0, 0.2, -0.1], leadElbow: [0.4, 0, 0] } },
    { phase: 'active', at: 0, pose: { head: [0, 0.3, -0.15], leadElbow: [0.4, 0, 0] } },
    { phase: 'recovery', at: 0.5, pose: { head: [0, 0.1, 0] } },
  ],
}
