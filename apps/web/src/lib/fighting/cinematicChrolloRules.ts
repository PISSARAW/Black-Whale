import { rulesFor, selfPart, targetPart, node, rig, type CameraRule } from './cinematicRules'
import { chrolloManifestations } from './chrolloManifestations'
import { actualSunMoonAttack } from './chrolloDetonation'

export const CHROLLO_CAMERA_RULES = rulesFor('chrollo', [
  {
    id: 'book',
    label: ['Bandit’s Secret · Livre', 'Bandit’s Secret · Book'],
    select: (c) => c.self.chrolloBook?.open,
    edge: 'change',
    anchors: selfPart('hands'),
  },
  {
    id: 'page',
    label: ['Bandit’s Secret · Nouvelle page', 'Bandit’s Secret · New page'],
    select: (c) => c.self.chrolloBook?.pages[c.self.chrolloBook.page],
    edge: 'change',
    anchors: selfPart('hands'),
  },
  {
    id: 'bookmark',
    label: ['Double Face · Marque-page', 'Double Face · Bookmark'],
    select: (c) => c.self.chrolloBook?.bookmark,
    edge: 'change',
    anchors: selfPart('hands'),
  },
  {
    id: 'steal',
    label: ['Bandit’s Secret · Acquisition', 'Bandit’s Secret · Acquired'],
    select: (c) => chrolloManifestations(c.state, c.side).acquiredCount,
    edge: 'increase',
    anchors: selfPart('hands'),
    priority: 2.5,
    isolate: true,
  },
  {
    id: 'sun-mark',
    label: ['Sun and Moon · Soleil', 'Sun and Moon · Sun'],
    select: (c) => c.target.hatsuEffects.sunMark > 0,
    anchors: targetPart('chest'),
  },
  {
    id: 'moon-mark',
    label: ['Sun and Moon · Lune', 'Sun and Moon · Moon'],
    select: (c) => c.target.hatsuEffects.moonMark > 0,
    anchors: targetPart('chest'),
  },
  {
    id: 'detonation',
    label: ['Sun and Moon · Détonation', 'Sun and Moon · Detonation'],
    select: (c) =>
      Number(c.target.hatsuEffects.sunMark > 0) + Number(c.target.hatsuEffects.moonMark > 0),
    // The second mark detonates during impact resolution: a completed state never holds both.
    matches: (a, b) => (a === 1 || a === 2) && b === 0,
    guard: (c) =>
      actualSunMoonAttack(c.state, c.side) &&
      c.state.impact?.attacker === c.side &&
      !c.state.impact.blocked &&
      !c.state.impact.avoided &&
      !c.state.impact.invulnerable &&
      (c.target.hitStun > 0 || c.target.health <= 0),
    anchors: targetPart('body'),
    priority: 3,
  },
  {
    id: 'black-voice',
    label: ['Black Voice · Manipulation', 'Black Voice · Control'],
    select: (c) => c.target.hatsuEffects.manipulatedFrames > 0,
    anchors: (c) => [
      node(`black-voice-antenna:${c.side}`, rig(c.other, 'head')),
      node(`black-voice-phone:${c.side}`, rig(c.side, 'hands')),
    ],
    priority: 2.5,
  },
  ...manifestationRules(),
  {
    id: 'black-voice-end',
    label: ['Black Voice · Fin du contrôle', 'Black Voice · Control ended'],
    select: (c) => c.target.hatsuEffects.manipulatedFrames > 0,
    edge: 'leave',
    anchors: targetPart('head'),
  },
])

function manifestationRules(): Omit<CameraRule, 'source'>[] {
  return [
    {
      id: 'copy',
      label: ['Gallery Fake · Copie', 'Gallery Fake · Copy'],
      edge: 'increase',
      select: (c) => chrolloManifestations(c.state, c.side).copyCount,
      anchors: (c) => [
        node(`prepared:${chrolloManifestations(c.state, c.side).copyId}`, rig(c.side, 'hands')),
      ],
    },
    {
      id: 'puppet',
      label: ['Order Stamp · Ordre donné', 'Order Stamp · Order issued'],
      edge: 'increase',
      select: (c) => chrolloManifestations(c.state, c.side).puppetCount,
      anchors: (c) => [
        node(`prepared:${chrolloManifestations(c.state, c.side).puppetId}`, rig(c.side, 'hands')),
      ],
    },
    {
      id: 'appearance',
      label: ['Convert Hands · Apparence échangée', 'Convert Hands · Appearance changed'],
      select: (c) => chrolloManifestations(c.state, c.side).appearance,
      anchors: (c) => [rig(c.side, 'chest'), rig(c.other, 'chest')],
    },
    {
      id: 'cloth',
      label: ['Fun Fun Cloth · Capture', 'Fun Fun Cloth · Capture'],
      select: (c) => chrolloManifestations(c.state, c.side).cloth,
      anchors: (c) => [node(`chrollo-cloth:${c.side}`, rig(c.side, 'hands'), 0.9)],
    },
    {
      id: 'fish',
      label: ['Indoor Fish · Manifestation', 'Indoor Fish · Manifestation'],
      select: (c) => chrolloManifestations(c.state, c.side).fish,
      anchors: (c) => [
        node(`chrollo-fish:${c.side}:0`, rig(c.other, 'chest'), 1),
        node(`chrollo-fish:${c.side}:1`, rig(c.other, 'chest'), 1),
      ],
      isolate: false,
    },
  ]
}
