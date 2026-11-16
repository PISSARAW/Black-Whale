import { catsNamePhase } from './camillaCat'
import { rulesFor, selfPart, targetPart, pair, node, rig } from './cinematicRules'
import type { CameraContext } from './cinematicRules'
const privateOwl = (c: CameraContext) => [node(`secret-window-${c.side}`, rig(c.other, 'head'))]

export const BENJAMIN_CAMERA_RULES = rulesFor('benjamin', [
  {
    id: 'inheritance',
    label: ['Benjamin Baton · Héritage acquis', 'Benjamin Baton · Inheritance acquired'],
    select: (c) => c.self.hatsuEffects.baton?.inherited.join('|'),
    anchors: selfPart('hands'),
  },
  {
    id: 'mark',
    label: ['Secret Window · Marquage', 'Secret Window · Marked'],
    select: (c) => c.self.hatsuEffects.baton?.markedTarget,
    anchors: targetPart('chest'),
    private: true,
  },
  {
    id: 'capture',
    label: ['Culdcept · Projectile capturé', 'Culdcept · Projectile captured'],
    select: (c) => c.self.hatsuEffects.baton?.card?.id,
    matches: (a, b) => a == null && b != null,
    anchors: (c) => [node(`benjamin-culdcept-card:${c.side}`, rig(c.side, 'hands'))],
    priority: 2.5,
  },
  {
    id: 'release',
    label: ['Culdcept · Restitution', 'Culdcept · Replay'],
    select: (c) => c.self.hatsuEffects.baton?.card?.id,
    edge: 'leave',
    guard: (c) => c.state.projectiles.some((p) => p.owner === c.side),
    anchors: selfPart('hands'),
    priority: 2.5,
  },
])
export const TSERRIEDNICH_CAMERA_RULES = rulesFor('tserriednich', [
  {
    id: 'zetsu',
    label: ['Futur parallèle · Yeux fermés', 'Parallel Future · Eyes closed'],
    select: (c) => Boolean(c.self.parallelEyesClosed),
    anchors: selfPart('head'),
    frontal: true,
    priority: 3,
  },
  {
    id: 'vision',
    label: ['Futur parallèle · Vision disponible', 'Parallel Future · Vision ready'],
    select: (c) =>
      c.state.parallelFuture?.owner === c.side && c.state.parallelFuture.phase === 'vision',
    anchors: selfPart('head'),
    frontal: true,
    private: true,
    priority: 3,
  },
  {
    id: 'diverge',
    label: ['Futur parallèle · Divergence', 'Parallel Future · Divergence'],
    select: (c) =>
      c.state.parallelFuture?.owner === c.side && c.state.parallelFuture.phase === 'diverging',
    anchors: selfPart('head'),
    frontal: true,
    priority: 3,
  },
  {
    id: 'interrupted',
    label: [
      'Futur parallèle · Préparation interrompue',
      'Parallel Future · Preparation interrupted',
    ],
    select: (c) =>
      c.state.parallelFuture?.owner === c.side && c.state.parallelFuture.phase === 'preparing',
    edge: 'leave',
    guard: (c) => !c.state.parallelFuture && c.self.hitStun > 0,
    anchors: selfPart('body'),
  },
])
export const CAMILLA_CAMERA_RULES = rulesFor('camilla', [
  ...(['summon', 'capture', 'absorb', 'revive'] as const).map((phase, index) => ({
    id: `cat-${phase}`,
    label: [
      [
        'Cat’s Name · Apparition',
        'Cat’s Name · Capture',
        'Cat’s Name · Absorption',
        'Cat’s Name · Résurrection',
      ][index],
      [
        'Cat’s Name · Summon',
        'Cat’s Name · Capture',
        'Cat’s Name · Absorption',
        'Cat’s Name · Revival',
      ][index],
    ] as const,
    select: (c: CameraContext) =>
      c.state.catsName?.victimSide === c.side && catsNamePhase(c.state.catsName.frame) === phase,
    anchors: (c: CameraContext) =>
      phase === 'revive'
        ? [rig(c.side), node('cats-name-life-energy', rig(c.side, 'chest'))]
        : [node('cats-name-feline', rig(c.other), 2.8), rig(c.other)],
    priority: 4,
    duration: phase === 'absorb' ? 36 : 30,
  })),
  {
    id: 'revived',
    label: ['Cat’s Name · Vie restaurée', 'Cat’s Name · Life restored'],
    select: (c) => c.self.health,
    edge: 'increase',
    guard: (c) => c.state.phase === 'finished',
    anchors: selfPart('body'),
    priority: 4,
  },
])
export const HALKENBURG_CAMERA_RULES = rulesFor('halkenburg', [
  {
    id: 'cohort',
    label: ['Grimmel · Volonté collective', 'Grimmel · Collective will'],
    select: (c) => c.self.hatsuEffects.cohortWillFrames > 0,
    anchors: selfPart('body'),
    priority: 1,
  },
  {
    id: 'ready',
    label: ['Grimmel · Volonté rassemblée', 'Grimmel · Will gathered'],
    select: (c) => c.self.hatsuEffects.cohortWillFrames >= 480,
    anchors: selfPart('hands'),
    priority: 2.5,
  },
  {
    id: 'nocked',
    label: ['Grimmel · Flèche armée', 'Grimmel · Arrow nocked'],
    select: (c) => c.self.hatsuEffects.arrowNocked > 0,
    anchors: selfPart('hands'),
    priority: 2.5,
  },
  {
    id: 'possession',
    label: ['Grimmel · Possession confirmée', 'Grimmel · Possession confirmed'],
    select: (c) => c.target.hatsuEffects.possessedFrames > 0,
    anchors: targetPart('head'),
    frontal: true,
    priority: 3,
  },
  {
    id: 'release',
    label: ['Grimmel · Fin de possession', 'Grimmel · Possession ended'],
    select: (c) => c.target.hatsuEffects.possessedFrames > 0,
    edge: 'leave',
    anchors: targetPart('head'),
    frontal: true,
  },
])
export const MUSSE_CAMERA_RULES = rulesFor('musse', [
  {
    id: 'owl',
    label: ['Secret Window · Hibou attaché', 'Secret Window · Owl attached'],
    select: (c) => Boolean(c.self.secretWindow),
    anchors: privateOwl,
    private: true,
  },
  {
    id: 'observation',
    label: ['Secret Window · Observation', 'Secret Window · Observation'],
    select: (c) => c.self.secretWindow?.observation.action,
    anchors: privateOwl,
    private: true,
    priority: 1,
  },
  {
    id: 'end',
    label: ['Secret Window · Surveillance terminée', 'Secret Window · Monitoring ended'],
    select: (c) => Boolean(c.self.secretWindow),
    edge: 'leave',
    anchors: selfPart('head'),
    private: true,
  },
])
export const LONGHI_CAMERA_RULES = rulesFor('longhi', [
  {
    id: 'offer',
    elevation: 45,
    label: ['Moonlight Act · Première signature', 'Moonlight Act · First signature'],
    select: (c) => c.state.moonlight?.offer?.issuer === c.side,
    anchors: (c) => [node('moonlight-contract:offer', rig(c.side, 'hands'))],
  },
  {
    id: 'signed',
    elevation: 45,
    label: ['Moonlight Act · Pacte signé', 'Moonlight Act · Agreement signed'],
    select: (c) => c.state.moonlight?.active?.issuer === c.side,
    anchors: (c) => [node('moonlight-contract:signed', rig(c.side, 'hands'))],
    priority: 2.5,
  },
  {
    id: 'outcome',
    label: ['Moonlight Act · Résolution', 'Moonlight Act · Resolution'],
    select: (c) => c.state.moonlight?.outcome?.kind,
    anchors: pair,
    priority: 2.5,
  },
  {
    id: 'penalty',
    label: ['Moonlight Act · Zetsu imposé', 'Moonlight Act · Enforced Zetsu'],
    select: (c) => Boolean(c.target.moonlightZetsu),
    anchors: targetPart('body'),
    priority: 3,
  },
  {
    id: 'self-penalty',
    label: ['Moonlight Act · Clause violée', 'Moonlight Act · Clause breached'],
    select: (c) => Boolean(c.self.moonlightZetsu),
    anchors: selfPart('body'),
    priority: 3,
  },
])
