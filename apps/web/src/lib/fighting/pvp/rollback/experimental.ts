export const CLASH_SOCKET_PATH = '/fighting/pvp/socket/'
export const CLASH_SOCKET_PROTOCOL = 'clash-rollback-1'
export const EXPERIMENTAL_INPUT_DELAY = 2
export const EXPERIMENTAL_MAX_ROLLBACK = 8

export interface ExperimentalRollbackView {
  epoch: number
  frame: number
}

export interface ExperimentalRollbackStart {
  epoch: number
  snapshot: string
}
