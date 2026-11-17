import { activeEnRadius } from './en/access'
import { enContacts, gyoSight } from './nenPerception'
import { rig, selfPart, targetPart } from './cinematicRules'
import type { CameraRule } from './cinematicRules'

/** Ordinary stance changes use main-camera cues; detail is reserved for a consequential event. */
export const NEN_CAMERA_RULES: CameraRule[] = [
  {
    id: 'nen.on',
    label: ['On · Éveil', 'On · Awakening'],
    select: (c) => Boolean(c.self.nen.on),
    kind: 'body',
    priority: 3,
    duration: 108,
    strength: 1.2,
  },
  {
    id: 'nen.on-end',
    label: ['On · Poussée épuisée', 'On · Surge exhausted'],
    select: (c) => Boolean(c.self.nen.on),
    edge: 'leave',
    anchors: selfPart('body'),
  },
  {
    id: 'nen.on-seal',
    label: ['On · Sceau appliqué', 'On · Seal applied'],
    select: (c) => (c.target.on?.sealFrames ?? 0) > 0,
    guard: (c) => Boolean(c.self.nen.on),
    anchors: targetPart('chest'),
  },
  {
    id: 'nen.gyo',
    label: ['Gyo · Nen dissimulé révélé', 'Gyo · Concealed Nen revealed'],
    select: (c) => gyoSight(c.self) && (c.target.nen.in || Boolean(c.state.bungeeGum?.hidden)),
    anchors: (c) => [rig(c.side, 'head'), rig(c.other, 'chest')],
    private: true,
  },
  {
    id: 'nen.en',
    label: ['En · Présence détectée', 'En · Presence detected'],
    select: (c) => enContacts(c.state, c.side),
    edge: 'increase',
    guard: (c) => Boolean(activeEnRadius(c.self)),
    anchors: selfPart('body'),
    private: true,
  },
  {
    id: 'nen.shu',
    label: ['Shu · Objet renforcé', 'Shu · Reinforced object'],
    select: (c) => Boolean(c.self.nen.shu),
    anchors: selfPart('hands'),
    priority: 1,
  },
  {
    id: 'nen.in',
    label: ['In · Dissimulation', 'In · Concealment'],
    select: (c) => Boolean(c.self.nen.in),
    anchors: selfPart('hands'),
    private: true,
    priority: 1,
  },
  {
    id: 'nen.forced-zetsu',
    label: ['Zetsu · Nen contraint', 'Zetsu · Nen suppressed'],
    select: (c) => c.self.hatsuEffects.forcedZetsuFrames > 0,
    anchors: selfPart('body'),
    priority: 2.5,
  },
  {
    id: 'nen.stolen',
    label: ['Nen · Capacité scellée par le vol', 'Nen · Ability sealed by theft'],
    select: (c) => c.self.hatsuEffects.hatsuStolen > 0,
    anchors: selfPart('body'),
    priority: 2.5,
  },
  {
    id: 'nen.exhausted',
    label: ['Nen · Épuisement', 'Nen · Exhaustion'],
    select: (c) => c.self.auraExhausted,
    anchors: selfPart('body'),
  },
]
