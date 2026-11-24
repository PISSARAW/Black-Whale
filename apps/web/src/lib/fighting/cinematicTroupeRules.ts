import { rulesFor, selfPart, targetPart, pair, node, rig } from './cinematicRules'
import { motionOf } from './fighterMovement'

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
export { CHROLLO_CAMERA_RULES } from './cinematicChrolloRules'
export const FEITAN_CAMERA_RULES = rulesFor('feitan', [
  {
    id: 'speed',
    label: ['Feitan · Accélération', 'Feitan · Acceleration'],
    select: (c) => motionOf(c.self).dash?.frame ?? 0,
    edge: 'increase',
    anchors: (c) => [rig(c.side, 'body'), rig(c.other, 'body')],
    kind: 'body',
    priority: 1.7,
    duration: 24,
    strength: 0.72,
  },
  {
    id: 'umbrella',
    label: ['Feitan · Écran du parapluie', 'Feitan · Umbrella screen'],
    select: (c) => c.self.umbrellaFeintFrames ?? 0,
    edge: 'change',
    anchors: (c) => [node(`feitan-umbrella:${c.side}`, rig(c.side, 'hands'))],
    priority: 2.2,
    duration: 42,
  },
  {
    id: 'spike',
    label: ['Feitan · Pointe du parapluie', 'Feitan · Umbrella spike'],
    select: (c) => c.self.attack?.kind === 'ranged' && Boolean(c.self.attack.projectileSpawned),
    anchors: selfPart('hands'),
    priority: 2.5,
    duration: 32,
  },
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
