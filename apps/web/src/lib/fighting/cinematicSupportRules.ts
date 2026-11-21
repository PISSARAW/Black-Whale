import { sheetComplete } from './predatorSheet'
import { MELODY_LISTEN_FRAMES } from './melodyTuning'
import { rulesFor, selfPart, targetPart, prop, node, rig, point } from './cinematicRules'
import type { CameraContext } from './cinematicRules'
import type { CameraAnchor } from './cinematicTypes'
import type { PreparedEntity } from './preparationTypes'
export function preparedFocus(
  c: CameraContext,
  predicate: (e: PreparedEntity) => boolean,
): CameraAnchor[] {
  const entry = c.state.battlefield?.entities.find(predicate)
  return entry ? [{ type: 'entity', id: entry.id, x: entry.x, y: entry.y }] : [rig(c.side, 'hands')]
}
export const HANZO_CAMERA_RULES = rulesFor('hanzo', [
  {
    id: 'split',
    label: ['Hanzo Skill 4 · Séparation', 'Hanzo Skill 4 · Separation'],
    select: (c) => Boolean(c.self.hanzoProjection),
    anchors: (c) => [point(c.self.hanzoProjection?.bodyX ?? c.self.x, 2, 1), rig(c.side)],
    priority: 3,
  },
  {
    id: 'ready',
    label: ['Hanzo Skill 4 · Double libre', 'Hanzo Skill 4 · Double ready'],
    select: (c) => c.self.hanzoProjection?.startupFrames === 0,
    anchors: selfPart('body'),
  },
  {
    id: 'return',
    label: ['Hanzo Skill 4 · Réveil', 'Hanzo Skill 4 · Awake'],
    select: (c) => Boolean(c.self.hanzoProjection),
    edge: 'leave',
    anchors: selfPart('body'),
    priority: 2.5,
  },
])
export const RIHAN_CAMERA_RULES = rulesFor('rihan', [
  {
    id: 'watch',
    label: ['Predator · Observation', 'Predator · Observation'],
    select: (c) => Boolean(c.self.predator?.watching),
    anchors: selfPart('head'),
    private: true,
    frontal: true,
    priority: 1,
  },
  {
    id: 'study',
    label: ['Predator · Analyse', 'Predator · Study'],
    select: (c) => c.self.predator?.analysis?.preyId,
    anchors: selfPart('head'),
    private: true,
    frontal: true,
    priority: 1,
  },
  {
    id: 'ready',
    label: ['Predator · Analyse achevée', 'Predator · Analysis complete'],
    select: (c) => Boolean(c.self.predator?.analysis && sheetComplete(c.self.predator.analysis)),
    anchors: selfPart('head'),
    private: true,
    priority: 2.5,
  },
  {
    id: 'hunt',
    label: ['Predator · Chasse ciblée', 'Predator · Targeted hunt'],
    select: (c) => c.self.predator?.hunt?.preyId,
    anchors: (c) => [
      node(
        `predator:${c.side}`,
        point(c.self.predator?.hunt?.x ?? c.self.x, c.self.predator?.hunt?.y ?? 7),
      ),
    ],
  },
  {
    id: 'devour',
    label: ['Predator · Dévoration', 'Predator · Devoured'],
    select: (c) => c.self.predator?.successes ?? 0,
    edge: 'increase',
    anchors: targetPart('body'),
    priority: 3,
  },
  {
    id: 'seal',
    label: ['Predator · Nen du prédateur scellé', 'Predator · User’s Nen sealed'],
    select: (c) => (c.self.predator?.sealFrames ?? 0) > 0,
    anchors: selfPart('body'),
    priority: 3,
  },
  {
    id: 'abandon',
    label: ['Predator · Analyse abandonnée', 'Predator · Analysis abandoned'],
    select: (c) => Boolean(c.self.predator?.watching),
    edge: 'leave',
    guard: (c) => !c.self.predator?.hunt && !c.self.predator?.sealFrames,
    anchors: selfPart('head'),
    private: true,
  },
])
export const MELODY_CAMERA_RULES = rulesFor('melody', [
  {
    id: 'breath',
    label: ['Musique envoûtante · Préparation', 'Enchanting Music · Preparation'],
    select: (c) => Boolean(c.self.melodyPerformance),
    anchors: (c) => [prop(c.side, 'signature-flute', 'head')],
    priority: 1,
  },
  {
    id: 'playing',
    label: ['Musique envoûtante · Performance', 'Enchanting Music · Performance'],
    select: (c) => c.self.melodyPerformance?.startupFrames === 0,
    anchors: (c) => [prop(c.side, 'signature-flute', 'head')],
  },
  {
    id: 'listener',
    label: ['Musique envoûtante · Auditeur apaisé', 'Enchanting Music · Listener soothed'],
    select: (c) => c.target.hatsuEffects.entrancedFrames > 0,
    anchors: targetPart('head'),
    frontal: true,
  },
  {
    id: 'ears',
    label: ['Musique · Oreilles couvertes', 'Music · Ears covered'],
    select: (c) => Boolean(c.self.melodyPerformance && c.target.coveringEars),
    anchors: targetPart('head'),
    frontal: true,
  },
  {
    id: 'stop',
    label: ['Musique envoûtante · Interruption', 'Enchanting Music · Interrupted'],
    select: (c) => Boolean(c.self.melodyPerformance),
    edge: 'leave',
    anchors: selfPart('hands'),
  },
  {
    id: 'heart',
    label: ['Melody · Rythme cardiaque', 'Melody · Heart rhythm'],
    select: (c) => (c.self.melodyHearing?.frames ?? 0) >= MELODY_LISTEN_FRAMES,
    guard: (c) => c.self.id === 'melody',
    anchors: (c) => [rig(c.side, 'head'), rig(c.other, 'chest')],
    private: true,
    priority: 1,
  },
])
export const BASHO_CAMERA_RULES = rulesFor('basho', [
  {
    id: 'write',
    label: ['Great Hiker · Écriture', 'Great Hiker · Writing'],
    select: (c) => (c.self.bashoPoem?.writingFrames ?? 0) > 0,
    anchors: (c) => [node(`basho-poem:${c.side}`, rig(c.side, 'hands'))],
    priority: 1,
  },
  {
    id: 'ready',
    label: ['Great Hiker · Poème prêt', 'Great Hiker · Poem ready'],
    select: (c) => Boolean(c.self.bashoPoem?.ready),
    anchors: (c) => [node(`basho-poem:${c.side}`, rig(c.side, 'hands'))],
  },
  {
    id: 'fire',
    label: ['Great Hiker · Embrasement', 'Great Hiker · Ignited'],
    select: (c) => c.target.bashoBurn?.owner === c.side,
    anchors: targetPart('chest'),
    priority: 2.5,
  },
  {
    id: 'cancel',
    label: ['Great Hiker · Écriture interrompue', 'Great Hiker · Writing interrupted'],
    select: (c) => (c.self.bashoPoem?.writingFrames ?? 0) > 0,
    edge: 'leave',
    guard: (c) => !c.self.bashoPoem?.ready,
    anchors: selfPart('hands'),
  },
])
export const BILL_CAMERA_RULES = rulesFor('bill', [
  {
    id: 'growth',
    label: ['Erigeron · Croissance', 'Erigeron · Growth'],
    select: (c) =>
      c.state.battlefield?.entities
        .filter((e) => e.owner === c.side && e.kind === 'seed')
        .reduce((n, e) => n + (e.growth ?? 0), 0) ?? 0,
    edge: 'increase',
    anchors: (c) => preparedFocus(c, (e) => e.owner === c.side && e.kind === 'seed'),
  },
])
export const CLUCK_CAMERA_RULES = rulesFor('cluck', [
  {
    id: 'bird',
    label: ['Cluck · Pigeon en mission', 'Cluck · Pigeon dispatched'],
    select: (c) =>
      c.state.battlefield?.entities
        .filter((e) => e.controller?.side === c.side && e.controller.source === 'cluck')
        .map((e) => e.id)
        .join('|'),
    anchors: (c) => preparedFocus(c, (e) => e.controller?.side === c.side && e.kind === 'bird'),
  },
  {
    id: 'delivery',
    label: ['Cluck · Livraison accomplie', 'Cluck · Delivery complete'],
    select: (c) =>
      c.state.battlefield?.entities
        .filter((e) => e.owner === c.side && e.kind === 'bird' && e.delivered)
        .map((e) => e.id)
        .join('|'),
    anchors: (c) => preparedFocus(c, (e) => e.owner === c.side && e.kind === 'bird'),
  },
])
export const SAYIRD_CAMERA_RULES = rulesFor('sayird', [
  {
    id: 'animal',
    label: ['Little Eye · Éclaireur contrôlé', 'Little Eye · Scout controlled'],
    select: (c) =>
      c.state.battlefield?.entities
        .filter((e) => e.controller?.side === c.side && e.controller.source === 'sayird')
        .map((e) => e.id)
        .join('|'),
    anchors: (c) => preparedFocus(c, (e) => e.controller?.side === c.side && e.kind === 'animal'),
    private: true,
  },
  {
    id: 'animal-end',
    label: ['Little Eye · Relais interrompu', 'Little Eye · Relay ended'],
    select: (c) =>
      c.state.battlefield?.entities.some(
        (e) => e.controller?.side === c.side && e.controller.source === 'sayird',
      ),
    edge: 'leave',
    anchors: selfPart('head'),
    private: true,
  },
])
