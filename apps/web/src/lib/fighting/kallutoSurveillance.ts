import { physicalBodyAt } from './fightBodyIdentity'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { PaperDoll } from './kallutoPaperTypes'
import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

export function activePaperOwner(state: FightState, side: FightSide): DolphinBodyRef {
  return { owner: side, member: state.teamMatch?.seats[side].active ?? 0 }
}

/** A marking belongs to its actual user and actual carrier, never a relay replacement. */
export function paperMarksAt(
  state: FightState,
  refs: { owner: DolphinBodyRef; target: DolphinBodyRef; zone?: FightNenZone },
): boolean {
  const body = physicalBodyAt(state, refs.target.owner, refs.target.member)
  return Boolean(
    body?.plantedPaper?.some(
      (paper) =>
        paper.owner === refs.owner.owner &&
        (paper.ownerMember ?? 0) === refs.owner.member &&
        (!refs.zone || paper.zone === refs.zone),
    ),
  )
}

export function paperDolls(actor: ArcadeFighter): readonly PaperDoll[] {
  const memory = actor.kallutoPaper
  return memory?.dolls ?? (memory?.doll ? [memory.doll] : [])
}

export function paperDollBody(state: FightState, doll: PaperDoll): ArcadeFighter | undefined {
  return physicalBodyAt(state, doll.target, doll.targetMember ?? 0)
}

export function paperDollMarked(
  state: FightState,
  owner: DolphinBodyRef,
  doll: PaperDoll,
): boolean {
  return paperMarksAt(state, {
    owner,
    target: { owner: doll.target, member: doll.targetMember ?? 0 },
  })
}

export function currentPaperDoll(state: FightState, side: FightSide): PaperDoll | undefined {
  const target = side === 'player' ? 'opponent' : 'player'
  const member = state.teamMatch?.seats[target].active ?? 0
  return paperDolls(state[side]).find(
    (doll) =>
      doll.active !== false && doll.target === target && (doll.targetMember ?? 0) === member,
  )
}

/** A score reset is not physical removal of the paper or a transfer to another person. */
export function carryKallutoPaper(fresh: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  return { ...fresh, plantedPaper: previous.plantedPaper, kallutoPaper: previous.kallutoPaper }
}

export function makePaperDoll(state: FightState, side: FightSide): ArcadeFighter {
  const fighter = state[side]
  const target = side === 'player' ? 'opponent' : 'player'
  const targetMember = state.teamMatch?.seats[target].active ?? 0
  const existing = paperDolls(fighter).find(
    (entry) => entry.target === target && (entry.targetMember ?? 0) === targetMember,
  )
  const doll: PaperDoll = existing
    ? { ...existing, active: true }
    : { target, targetMember, createdAt: state.frame, active: true }
  const dolls = existing
    ? paperDolls(fighter).map((entry) => (entry === existing ? doll : entry))
    : [...paperDolls(fighter), doll]
  return {
    ...fighter,
    kallutoPaper: {
      ...fighter.kallutoPaper,
      zone: fighter.kallutoPaper?.zone ?? 'torso',
      doll,
      dolls,
    },
  }
}

export function mutePaperDolls(actor: ArcadeFighter): ArcadeFighter {
  const dolls = paperDolls(actor).map((doll) => ({ ...doll, active: false }))
  const selected = actor.kallutoPaper?.doll
  const doll = dolls.find(
    (entry) => entry.target === selected?.target && entry.targetMember === selected?.targetMember,
  )
  return { ...actor, kallutoPaper: { ...actor.kallutoPaper!, dolls, doll } }
}
