import type { Rider } from './verdict.js'
import type { MorenaGame } from './game.js'

export type TableEffect =
  | 'read'
  | 'foresee'
  | 'pass'
  | 'recover'
  | 'forge'
  | 'shield'
  | 'hide'
  | 'proxy'
  | 'evict'
  | 'blind'
  | 'rider'
  | 'rewind'

export interface TableMove {
  hatsuId: string
  effect: TableEffect
  rider?: Rider
  exposure: number
  fraud: boolean
  uses: number
  wearsOff?: boolean
}

const WEAR_PER_ROUND = 0.12

export function exposureNow(move: TableMove, game: MorenaGame): number {
  const worn = move.wearsOff ? (game.round - 1) * WEAR_PER_ROUND : 0
  return Math.max(0, Math.min(1, (move.exposure + worn) * game.watch))
}

export const TABLE_TECHNIQUES = {
  dowsing: { hatsuId: 'dowsing-chain', effect: 'foresee', exposure: 0.55, fraud: true, uses: 3 },
  future: { hatsuId: 'parallel-future', effect: 'rewind', exposure: 0, fraud: true, uses: 1 },
  divination: { hatsuId: 'love-dial-6700', effect: 'foresee', exposure: 0.2, fraud: true, uses: 2 },
  prophecy: { hatsuId: 'lovely-ghostwriter', effect: 'read', exposure: 0, fraud: false, uses: 1 },
  surveillance: { hatsuId: 'secret-window', effect: 'read', exposure: 0.15, fraud: true, uses: 1 },
  scout: { hatsuId: 'little-eye', effect: 'read', exposure: 0.1, fraud: true, uses: 2 },
  'paper-spy': { hatsuId: 'surveillance-paper-dolls', effect: 'read', exposure: 0.3, fraud: true, uses: 2 },
  scarlet: { hatsuId: 'emperor-time', effect: 'read', exposure: 0, fraud: false, uses: 1 },
  'truth-punch': { hatsuId: 'body-and-soul', effect: 'read', exposure: 1, fraud: true, uses: 1 },

  disguise: { hatsuId: 'texture-surprise', effect: 'forge', exposure: 0, fraud: true, uses: 1 },
  melody: { hatsuId: 'melody-enchanting-music', effect: 'pass', exposure: 0, fraud: false, uses: 2 },
  senses: { hatsuId: 'saiyu-three-monkeys', effect: 'blind', exposure: 1, fraud: true, uses: 1 },

  'coin-growth': { hatsuId: 'zhanglei-guardian-coins', effect: 'recover', exposure: 0, fraud: false, uses: 1 },
  clone: { hatsuId: 'gallery-fake', effect: 'recover', rider: 'smoke', exposure: 0, fraud: true, uses: 1 },
  growth: { hatsuId: 'erigeron', effect: 'recover', exposure: 0.4, fraud: true, uses: 1 },
  'drug-synthesis': { hatsuId: 'tubeppa-guardian-synthesis', effect: 'recover', exposure: 0.35, fraud: true, uses: 1 },

  contract: { hatsuId: 'moonlight-act', effect: 'rider', rider: 'bound', exposure: 0, fraud: false, uses: 1 },
  'heart-vow': { hatsuId: 'judgment-chain', effect: 'shield', rider: 'sworn', exposure: 0, fraud: false, uses: 1 },
  polarity: { hatsuId: 'sun-and-moon', effect: 'rider', rider: 'moon', exposure: 0.25, fraud: true, uses: 1 },
  curse: { hatsuId: 'beyond-sacrificial-curse', effect: 'rider', rider: 'deterred', exposure: 0, fraud: false, uses: 1 },
  resurrection: { hatsuId: 'cats-name', effect: 'rider', rider: 'deterred', exposure: 0, fraud: false, uses: 1 },
  'desire-trap': { hatsuId: 'luzurus-guardian-desire-trap', effect: 'read', rider: 'trapped', exposure: 0.5, fraud: true, uses: 1 },
  'lie-marks': { hatsuId: 'tserriednich-guardian-lie-marks', effect: 'rider', rider: 'taxed', exposure: 0, fraud: false, uses: 1 },
  solicitation: { hatsuId: 'momoze-guardian-solicitation', effect: 'rider', rider: 'solicited', exposure: 0.3, fraud: true, uses: 1 },

  theft: { hatsuId: 'skill-hunter', effect: 'rider', rider: 'stolen', exposure: 0.2, fraud: true, uses: 1 },
  puppet: { hatsuId: 'black-voice', effect: 'proxy', exposure: 0, fraud: true, uses: 1 },
  command: { hatsuId: 'order-stamp', effect: 'proxy', exposure: 0, fraud: true, uses: 1 },
  needle: { hatsuId: 'illumi-needle-people', effect: 'proxy', exposure: 0, fraud: true, uses: 1 },
  'identity-swap': { hatsuId: 'convert-hands', effect: 'proxy', exposure: 0.3, fraud: true, uses: 1 },
  guardian: { hatsuId: 'without-you', effect: 'proxy', exposure: 0.1, fraud: true, uses: 1 },
  mimicry: { hatsuId: 'battle-cantabile-metamorphosen', effect: 'proxy', exposure: 0.1, fraud: true, uses: 1, wearsOff: true },
  projection: { hatsuId: 'hanzo-skill-4', effect: 'proxy', exposure: 0.35, fraud: true, uses: 1 },

  teleport: { hatsuId: 'chrollo-teleportation', effect: 'evict', exposure: 0.4, fraud: true, uses: 1 },
  tribunal: { hatsuId: 'cross-game', effect: 'evict', exposure: 0, fraud: false, uses: 1 },

  'room-isolation': { hatsuId: 'marayam-guardian-isolation', effect: 'hide', exposure: 0, fraud: true, uses: 1 },
  'door-network': { hatsuId: 'voconte-hideout-doors', effect: 'hide', exposure: 0.2, fraud: true, uses: 1 },
} as const satisfies Record<string, TableMove>

export type TableKind = keyof typeof TABLE_TECHNIQUES
export const TABLE_KINDS = Object.keys(TABLE_TECHNIQUES) as TableKind[]

export function worksAtTheTable(kind: string | null | undefined): kind is TableKind {
  return Boolean(kind) && kind! in TABLE_TECHNIQUES
}

export function moveFor(kind: TableKind): TableMove {
  return TABLE_TECHNIQUES[kind]
}

export const UNBIDDEN: readonly TableKind[] = ['prophecy']

export function castsItself(kind: TableKind): boolean {
  return UNBIDDEN.includes(kind)
}

export type TablePage = 'open' | 'second'

export interface TableSeat {
  page: TablePage
  kind: TableKind
  spent: number
}

export function livePages(game: MorenaGame): TableSeat[] {
  const seats: TableSeat[] = []
  if (game.technique) seats.push({ page: 'open', kind: game.technique, spent: game.spent })
  if (game.bookmark) {
    seats.push({ page: 'second', kind: game.bookmark.kind, spent: game.bookmark.spent })
  }
  return seats
}

export function spentOn(game: MorenaGame, kind: TableKind): number | null {
  return livePages(game).find((seat) => seat.kind === kind)?.spent ?? null
}
