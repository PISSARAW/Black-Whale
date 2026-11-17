import { rulesFor, selfPart, targetPart, pair, node, rig } from './cinematicRules'

export const HISOKA_CAMERA_RULES = rulesFor('hisoka', [
  {
    id: 'gum',
    label: ['Bungee Gum · Attachement', 'Bungee Gum · Attached'],
    select: (c) => c.state.bungeeGum?.owner === c.side,
    anchors: (c) => [node('hisoka-bungee-gum', rig(c.other, 'chest'))],
  },
  {
    id: 'gum-pull',
    label: ['Bungee Gum · Rétraction', 'Bungee Gum · Retraction'],
    select: (c) => c.state.bungeeGum?.owner === c.side && c.state.bungeeGum.retracting,
    anchors: pair,
  },
  {
    id: 'gum-rebound',
    label: ['Bungee Gum · Propulsion', 'Bungee Gum · Rebound'],
    select: (c) => c.state.bungeeGum?.owner === c.side && c.state.bungeeGum.rebounding,
    anchors: pair,
  },
  {
    id: 'gum-break',
    label: ['Bungee Gum · Rupture', 'Bungee Gum · Broken'],
    select: (c) => c.state.bungeeGum?.owner === c.side,
    edge: 'leave',
    anchors: pair,
  },
  {
    id: 'texture',
    label: ['Texture Surprise · Tissu', 'Texture Surprise · Cloth'],
    select: (c) => Boolean(c.self.textureSurprise),
    edge: 'change',
    anchors: selfPart('chest'),
  },
])
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
    select: (c) => c.self.chrolloBook?.pages.length ?? 0,
    edge: 'increase',
    anchors: selfPart('hands'),
    priority: 2.5,
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
      c.self.attack?.hatsuSource === 'chrollo' &&
      c.state.impact?.attacker === c.side &&
      !c.state.impact.blocked &&
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
  {
    id: 'black-voice-end',
    label: ['Black Voice · Fin du contrôle', 'Black Voice · Control ended'],
    select: (c) => c.target.hatsuEffects.manipulatedFrames > 0,
    edge: 'leave',
    anchors: targetPart('head'),
  },
])
export const FEITAN_CAMERA_RULES = rulesFor('feitan', [
  {
    id: 'injured',
    label: ['Pain Packer · Blessure accumulée', 'Pain Packer · Injury banked'],
    select: (c) => c.self.hatsuEffects.painPacker?.injuries ?? 0,
    edge: 'increase',
    anchors: selfPart('chest'),
    priority: 1,
  },
  {
    id: 'armour',
    label: ['Pain Packer · Armure', 'Pain Packer · Armour'],
    select: (c) => Boolean(c.self.hatsuEffects.painPacker?.armour),
    kind: 'armour',
    anchors: (c) => [
      rig(c.side, 'body'),
      {
        type: 'node',
        actor: c.side,
        name: 'pain-packer-hood:combat-joint',
        fallback: rig(c.side, 'head'),
      },
    ],
    frontal: true,
    priority: 3,
    duration: 108,
    strength: 1.2,
  },
  {
    id: 'sun',
    label: ['Pain Packer · Rising Sun', 'Pain Packer · Rising Sun'],
    select: (c) => Boolean(c.self.hatsuEffects.painPacker?.sun),
    kind: 'sun',
    anchors: (c) => [rig(c.side, 'body'), node(`rising-sun:${c.side}`, rig(c.side, 'head'))],
    priority: 3.2,
    duration: 108,
    strength: 1.2,
  },
  {
    id: 'heat',
    label: ['Rising Sun · Chaleur', 'Rising Sun · Heat'],
    select: (c) => c.self.hatsuEffects.painPacker?.sun?.scored.includes(c.other),
    anchors: targetPart('body'),
    priority: 2.5,
  },
  {
    id: 'sun-end',
    label: ['Rising Sun · Dissipation', 'Rising Sun · Dissipated'],
    select: (c) => Boolean(c.self.hatsuEffects.painPacker?.sun),
    edge: 'leave',
    anchors: selfPart('body'),
  },
  {
    id: 'armour-end',
    label: ['Pain Packer · Fin', 'Pain Packer · End'],
    select: (c) => Boolean(c.self.hatsuEffects.painPacker?.armour),
    edge: 'leave',
    anchors: selfPart('chest'),
  },
])
export const PHINKS_CAMERA_RULES = rulesFor('phinks', [
  {
    id: 'wind',
    label: ['Ripper Cyclotron · Rotations', 'Ripper Cyclotron · Wind-up'],
    select: (c) => Boolean(c.self.cyclotronWindup),
    anchors: selfPart('right-hand'),
    priority: 1,
  },
  {
    id: 'charged',
    label: ['Ripper Cyclotron · Tour accompli', 'Ripper Cyclotron · Completed turn'],
    select: (c) => c.self.hatsuEffects.cyclotronTurns,
    edge: 'increase',
    anchors: selfPart('right-hand'),
  },
  {
    id: 'release',
    label: ['Ripper Cyclotron · Poing engagé', 'Ripper Cyclotron · Punch committed'],
    select: (c) => c.self.attack?.cyclotronTurns,
    anchors: selfPart('right-hand'),
    priority: 2.5,
  },
])
export const FRANKLIN_CAMERA_RULES = rulesFor('franklin', [
  {
    id: 'fire',
    label: ['Double Machine Gun · Rafale', 'Double Machine Gun · Burst'],
    select: (c) => Boolean(c.self.attack?.projectileSpawned),
    guard: (c) => c.self.attack?.hatsuSource === 'franklin' || c.self.id === 'franklin',
    anchors: selfPart('hands'),
    priority: 1,
  },
])
export const BISCUIT_CAMERA_RULES = rulesFor('biscuit', [
  {
    id: 'form',
    label: ['Biscuit · Forme véritable', 'Biscuit · True form'],
    select: (c) => Boolean(c.self.biscuitTrueForm),
    kind: 'body',
    priority: 3,
    duration: 108,
    strength: 1.2,
  },
  {
    id: 'form-end',
    label: ['Biscuit · Retour de forme', 'Biscuit · Form restored'],
    select: (c) => Boolean(c.self.biscuitTrueForm),
    edge: 'leave',
    anchors: selfPart('body'),
  },
])
