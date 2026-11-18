import { physicalBodyAt } from './fightBodyIdentity'
import { existingPaperDoll, issuePaperPart } from './kallutoMaterials'
import { historicalPartExists } from './historicalCopyLifetime'
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
        historicalPartExists(state, paper.materialCopyId) &&
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
  return {
    ...fresh,
    plantedPaper: previous.plantedPaper,
    kallutoPaper: previous.kallutoPaper,
    paperKit: previous.paperKit,
  }
}

export function makePaperDoll(state: FightState, side: FightSide): ArcadeFighter {
  const prepared = preparePaperDoll(state, side)
  if (!prepared) return state[side]
  const { actor, doll } = prepared
  const old = paperDolls(actor)
  const index = old.findIndex(
    (entry) => entry.target === doll.target && (entry.targetMember ?? 0) === doll.targetMember,
  )
  const dolls = index < 0 ? [...old, doll] : old.map((entry, at) => (at === index ? doll : entry))
  return {
    ...actor,
    kallutoPaper: { ...actor.kallutoPaper, zone: actor.kallutoPaper?.zone ?? 'torso', doll, dolls },
  }
}

function preparePaperDoll(
  state: FightState,
  side: FightSide,
): { actor: ArcadeFighter; doll: PaperDoll } | null {
  const existing = existingPaperDoll(state, side)
  if (existing) return { actor: state[side], doll: { ...existing, active: true } }
  const issued = issuePaperPart(state, side, 'doll')
  if (!issued) return null
  const target = side === 'player' ? 'opponent' : 'player'
  return {
    actor: issued.actor,
    doll: {
      target,
      targetMember: state.teamMatch?.seats[target].active ?? 0,
      createdAt: state.frame,
      active: true,
      paperId: issued.part.id,
      materialCopyId: issued.part.materialCopyId,
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
