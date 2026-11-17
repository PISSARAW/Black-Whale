import { rulesFor, selfPart, pair, node, rig, point } from './cinematicRules'
import { preparedFocus } from './cinematicSupportRules'
import type { CameraContext } from './cinematicRules'

export const LEORIO_CAMERA_RULES = rulesFor('leorio', [
  {
    id: 'surface',
    label: ['Poing à distance · Transmission', 'Remote Punch · Surface transmission'],
    select: (c) => c.state.projectiles.find((p) => p.owner === c.side && p.remotePunch)?.id,
    anchors: selfPart('right-hand'),
  },
  {
    id: 'emerge',
    label: ['Poing à distance · Émergence', 'Remote Punch · Emergence'],
    select: (c) =>
      c.state.projectiles.find(
        (p) => p.owner === c.side && p.remotePunch && p.age >= p.remotePunch.travelFrames,
      )?.id,
    anchors: (c) => {
      const p = c.state.projectiles.find((p) => p.owner === c.side && p.remotePunch)
      return p
        ? [node(`remote-punch:${p.id}`, point(p.remotePunch!.targetX, 5, 0.65))]
        : [rig(c.other, 'chest')]
    },
    priority: 2.5,
  },
])
export const LUINI_CAMERA_RULES = rulesFor('luini', [
  {
    id: 'anchor',
    label: ['Téléportation · Pièce ancrée', 'Teleportation · Room anchored'],
    select: (c) => c.state.battlefield?.luiniAnchors?.[c.side],
    anchors: (c) => preparedFocus(c, (e) => e.id === c.state.battlefield?.luiniAnchors?.[c.side]),
  },
  {
    id: 'invalid',
    label: ['Téléportation · Pièce condamnée', 'Teleportation · Room invalidated'],
    select: (c) =>
      c.state.battlefield?.entities
        .filter((e) => e.kind === 'room' && e.owner === c.side && e.invalidated)
        .map((e) => e.id)
        .join('|'),
    anchors: (c) =>
      preparedFocus(c, (e) => e.kind === 'room' && e.owner === c.side && Boolean(e.invalidated)),
  },
])
export const VOCONTE_CAMERA_RULES = rulesFor('voconte', [
  {
    id: 'network',
    label: ['Door · Liaison des seuils', 'Door · Connected frames'],
    select: (c) => Boolean(c.state.voconteDoors?.networks[c.side]?.active),
    edge: 'change',
    anchors: (c) => [
      node(`voconte:frame:${c.side}:A`, rig(c.side)),
      node(`voconte:frame:${c.side}:B`, rig(c.other)),
    ],
  },
  ...(['player', 'opponent'] as const).map((target) => ({
    id: `transit-${target}`,
    label: ['Door · Passage effectif', 'Door · Actual passage'] as const,
    select: (c: CameraContext) =>
      c.state.voconteDoors?.lastTransit?.[target]?.owner === c.side
        ? c.state.voconteDoors.lastTransit[target]?.frame
        : undefined,
    anchors: (c: CameraContext) => [rig(target), node(`voconte:physical-frames`, rig(c.side))],
    priority: 2.5,
  })),
])
export const YOKOTANI_CAMERA_RULES = rulesFor('yokotani', [
  {
    id: 'guards',
    label: ['LSDF · Intervention', 'LSDF · Intervention'],
    select: (c) => Boolean(c.state.lsdf?.[c.side]),
    anchors: (c) => [node(`lsdf:${c.side}`, rig(c.other), 1.8)],
  },
  {
    id: 'level',
    label: ['LSDF · Alerte renforcée', 'LSDF · Alert escalated'],
    select: (c) => c.state.lsdf?.[c.side]?.level ?? 0,
    edge: 'increase',
    anchors: pair,
  },
  {
    id: 'escort',
    label: ['LSDF · Expulsion en cours', 'LSDF · Escorting intruder'],
    select: (c) => c.state.lsdf?.[c.side]?.phase === 'escorting',
    anchors: (c) => [rig(c.other), node(`lsdf:${c.side}`, rig(c.other))],
    priority: 2.5,
  },
  {
    id: 'expelled',
    label: ['LSDF · Intrus expulsé', 'LSDF · Intruder expelled'],
    select: (c) => (c.state.expulsion?.owner === c.side ? c.state.expulsion.sequence : undefined),
    anchors: (c) => [rig(c.other)],
    priority: 4,
  },
  {
    id: 'end',
    label: ['LSDF · Fin d’intervention', 'LSDF · Dismissed'],
    select: (c) => Boolean(c.state.lsdf?.[c.side]),
    edge: 'leave',
    guard: (c) => c.state.finishReason !== 'expulsion',
    anchors: selfPart('body'),
  },
])
export const LYNCH_CAMERA_RULES = rulesFor('lynch', [
  {
    id: 'question',
    label: ['Body and Soul · Question', 'Body and Soul · Question'],
    select: (c) => (c.self.lynchQuestion ? c.self.lynchQuestion.askedFrame + 1 : 0),
    anchors: selfPart('head'),
    private: true,
    priority: 1,
  },
  {
    id: 'answer',
    label: ['Body and Soul · Réponse reçue', 'Body and Soul · Answer received'],
    select: (c) => {
      const r = c.self.bodyAndSoulReplies?.at(-1)
      return r ? `${r.frame}:${r.question}` : ''
    },
    anchors: (c) => [rig(c.other, 'head'), rig(c.side, 'head')],
    private: true,
    priority: 2.5,
  },
])
export const FURYKOV_CAMERA_RULES = rulesFor('furykov', [
  {
    id: 'console',
    label: ['Combo Master · Console', 'Combo Master · Console'],
    select: (c) => Boolean(c.self.comboMaster),
    anchors: (c) => [node(`combo-master:${c.side}`, rig(c.side, 'hands'))],
    private: true,
  },
  {
    id: 'alert',
    label: ['Combo Master · Menace détectée', 'Combo Master · Threat detected'],
    select: (c) => Boolean(c.self.comboMaster?.alert?.incoming),
    anchors: selfPart('hands'),
    private: true,
    priority: 2.5,
  },
  {
    id: 'identity',
    label: ['Combo Master · Signature identifiée', 'Combo Master · Signature identified'],
    select: (c) => c.self.comboMaster?.alert?.signature,
    anchors: selfPart('hands'),
    private: true,
  },
  {
    id: 'affected',
    label: ['Combo Master · Cible confirmée', 'Combo Master · Recipient confirmed'],
    select: (c) => c.self.comboMaster?.alert?.affected.join('|'),
    anchors: selfPart('hands'),
    private: true,
  },
])
// Theta and Beyond use physical weapon/impact framing. They have no invented Hatsu transition.
export const THETA_CAMERA_RULES = rulesFor('theta', [])
export const BEYOND_CAMERA_RULES = rulesFor('beyond', [])
