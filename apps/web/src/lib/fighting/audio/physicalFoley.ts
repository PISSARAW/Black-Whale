import type { Graph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import { rosterMoveShape } from '../rosterStrikeMotion'
import { PERSONAL_SIGNATURE_MOVES } from '../personalSignatureMoves'
import type { FightImpact } from '../types'

const KICKS = new Set(['kick', 'lowKick', 'sweep', 'spin', 'dive'])
const CUTS = new Set(['slash', 'airSlash', 'thrust'])
const BLADE_USERS = /^(feitan|nobunaga|hinrigh|padaille):/
const CHAIN_MOVES = new Set([
  'kurapika:standingHeavy',
  'kurapika:neutralSpecial',
  'kurapika:forwardSpecial',
  'kurapika:backSpecial',
  'kurapika:finisher',
])
const PAPER_MOVES = new Set([
  'chrollo:neutralSpecial',
  'chrollo:downSpecial',
  'chrollo:backSpecial',
])
const TAKES = [
  { pitch: 1, grit: 1, offset: 0.008 },
  { pitch: 0.91, grit: 0.89, offset: 0.011 },
  { pitch: 1.07, grit: 0.97, offset: 0.006 },
  { pitch: 0.96, grit: 1.06, offset: 0.009 },
]

type ContactMaterial = 'fist' | 'boot' | 'chain' | 'blade' | 'paper' | 'grapple'

export function moveMaterial(moveId?: string): ContactMaterial {
  if (!moveId) return 'fist'
  return PERSONAL_SIGNATURE_MOVES[moveId]?.material ?? intrinsicMaterial(moveId)
}

function intrinsicMaterial(moveId: string): ContactMaterial {
  if (moveId.endsWith(':throw')) return 'grapple'
  if (CHAIN_MOVES.has(moveId)) return 'chain'
  if (PAPER_MOVES.has(moveId)) return 'paper'
  const shape = rosterMoveShape(moveId) ?? ''
  if (CUTS.has(shape) && BLADE_USERS.test(moveId)) return 'blade'
  return KICKS.has(shape) ? 'boot' : 'fist'
}

const CONTACTS = {
  fist: { snap: 2100, body: 185, resonance: 275, tail: 0.07 },
  boot: { snap: 1750, body: 143, resonance: 235, tail: 0.095 },
  chain: { snap: 3250, body: 173, resonance: 310, tail: 0.085 },
  blade: { snap: 3800, body: 192, resonance: 295, tail: 0.075 },
  grapple: { snap: 1550, body: 125, resonance: 211, tail: 0.12 },
  paper: { snap: 2380, body: 186, resonance: 280, tail: 0.06 },
}

export function bodyContact(g: Graph, options: { impact: FightImpact; material: ContactMaterial }) {
  const { impact, material } = options
  const take = TAKES[impact.sequence % TAKES.length]
  const strength = contactStrength(impact)
  const at = startsAt(g)
  if (impact.blocked) {
    guardContact(g, { at, strength, pitch: take.pitch })
    return
  }
  const { snap, body, resonance, tail } = CONTACTS[material]
  rush(g, at, {
    peak: 0.18 * strength * take.grit,
    cutoff: snap * take.pitch,
    sweepTo: snap * 0.31,
    duration: 0.014,
    attack: 0.001,
    release: 0.039,
  })
  swept(g, at, {
    type: 'sine',
    from: body * take.pitch,
    to: 59,
    peak: 0.2 * strength,
    duration: 0.056,
    attack: 0.002,
    release: tail,
  })
  // Short upper-bass resonance carries the weight on speakers with little sub-bass.
  swept(g, at + take.offset, {
    type: 'triangle',
    from: resonance * take.pitch,
    to: resonance * 0.53,
    peak: 0.09 * strength,
    duration: 0.04,
    attack: 0.006,
    release: tail * 0.72,
  })
}

function contactStrength(impact: FightImpact) {
  if (impact.blocked) return impact.kind === 'light' ? 0.63 : 0.85
  const light = impact.kind === 'light' ? 0.58 : 0.87
  const decay = Math.max(0.68, 1 - Math.max(0, impact.comboHits - 2) * 0.07)
  return Math.min(1.37, light + impact.damage / 105) * decay
}

function guardContact(
  g: Graph,
  { at, strength, pitch }: { at: number; strength: number; pitch: number },
) {
  rush(g, at, {
    peak: 0.21 * strength,
    cutoff: 1280 * pitch,
    sweepTo: 540,
    q: 2.1,
    duration: 0.014,
    attack: 0.001,
    release: 0.048,
  })
  swept(g, at, {
    type: 'triangle',
    from: 360 * pitch,
    to: 204,
    peak: 0.08 * strength,
    duration: 0.022,
    attack: 0.002,
    release: 0.045,
  })
}

export function weaponMovement(
  g: Graph,
  options: { material: ContactMaterial; take: number; force: number },
) {
  const { material, force } = options
  const take = TAKES[options.take % TAKES.length]
  if (material === 'chain') chainLinks(g, { force, pitch: take.pitch, gap: take.offset })
  if (material === 'paper') paperFlick(g, force)
  if (material === 'grapple')
    rush(g, startsAt(g), {
      peak: 0.081 * force,
      cutoff: 1320,
      sweepTo: 420,
      duration: 0.07,
      attack: 0.006,
      release: 0.057,
    })
  if (material === 'blade')
    rush(g, startsAt(g), {
      peak: 0.075 * force,
      cutoff: 4700 * take.pitch,
      sweepTo: 2100,
      q: 3,
      duration: 0.05,
      attack: 0.004,
      release: 0.047,
    })
}

function chainLinks(g: Graph, options: { force: number; pitch: number; gap: number }) {
  for (const [index, hz] of [1280, 2480, 1690].entries())
    swept(g, startsAt(g) + index * (0.014 + options.gap), {
      type: 'sine',
      from: hz * options.pitch,
      to: hz * options.pitch * 0.94,
      peak: (0.064 - index * 0.015) * options.force,
      duration: 0.013,
      attack: 0.001,
      release: 0.047,
    })
}

function paperFlick(g: Graph, force: number) {
  const at = startsAt(g)
  rush(g, at, {
    peak: 0.09 * force,
    cutoff: 4000,
    sweepTo: 1900,
    duration: 0.027,
    attack: 0.002,
    release: 0.042,
  })
  rush(g, at + 0.032, {
    peak: 0.04 * force,
    cutoff: 2550,
    duration: 0.019,
    attack: 0.003,
    release: 0.03,
  })
}
