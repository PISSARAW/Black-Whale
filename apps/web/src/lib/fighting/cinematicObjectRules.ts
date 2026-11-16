import { rulesFor, selfPart, targetPart, prop, node, rig, point } from './cinematicRules'
import { preparedFocus } from './cinematicSupportRules'

export const SHIZUKU_CAMERA_RULES = rulesFor('shizuku', [
  {
    id: 'vacuum',
    label: ['Blinky · Aspiration', 'Blinky · Suction'],
    select: (c) => c.self.hatsuEffects.blinkyFrames > 0,
    anchors: (c) => [prop(c.side, 'shizuku-blinky')],
  },
  {
    id: 'stored',
    label: ['Blinky · Objet absorbé', 'Blinky · Object swallowed'],
    select: (c) => c.self.blinky?.lastObject?.id ?? c.self.blinky?.lastArenaObject,
    anchors: selfPart('hands'),
    priority: 2.5,
  },
  {
    id: 'blood',
    label: ['Blinky · Sang extrait', 'Blinky · Blood drawn'],
    select: (c) => Boolean(c.self.blinky?.lastWasBlood),
    anchors: (c) => [rig(c.side, 'hands'), rig(c.other, 'chest')],
    priority: 2.5,
  },
  {
    id: 'plug',
    label: ['Blinky · Plaies bouchées', 'Blinky · Wounds plugged'],
    select: (c) => Boolean(c.target.pluggingWounds && c.self.hatsuEffects.blinkyFrames),
    anchors: targetPart('hands'),
  },
  {
    id: 'end',
    label: ['Blinky · Aspiration terminée', 'Blinky · Suction ended'],
    select: (c) => c.self.hatsuEffects.blinkyFrames > 0,
    edge: 'leave',
    anchors: selfPart('hands'),
  },
])
export const HINRIGH_CAMERA_RULES = rulesFor('hinrigh', [
  {
    id: 'objects',
    label: ['Biohazard · Transformation et rappel', 'Biohazard · Transformation and recall'],
    select: (c) => c.self.biohazard?.objects.map((o) => `${o.id}:${o.phase}`).join('|'),
    edge: 'change',
    anchors: (c) => {
      const o = c.self.biohazard?.objects.find((o) => !['carried', 'broken'].includes(o.phase))
      return o ? [node(`biohazard:${c.side}:${o.id}`, point(o.x, o.y))] : [rig(c.side, 'hands')]
    },
  },
  {
    id: 'capture',
    label: ['Biohazard · Menottes fermées', 'Biohazard · Handcuffs locked'],
    select: (c) => c.target.biohazardRestraint?.owner === c.side,
    anchors: targetPart('hands'),
    priority: 2.5,
  },
  {
    id: 'release',
    label: ['Biohazard · Libération', 'Biohazard · Released'],
    select: (c) => c.target.biohazardRestraint?.owner === c.side,
    edge: 'leave',
    anchors: targetPart('hands'),
  },
])
export const ZAKURO_CAMERA_RULES = rulesFor('zakuro', [
  {
    id: 'bleed',
    label: ['Bloody Mary · Sang disponible', 'Bloody Mary · Blood available'],
    select: (c) => c.self.openWounds ?? 0,
    edge: 'increase',
    anchors: selfPart('hands'),
    priority: 1,
  },
  {
    id: 'tendril',
    label: ['Bloody Mary · Fil de sang', 'Bloody Mary · Blood tendril'],
    select: (c) => c.self.bloodyMary?.tendril?.phase,
    anchors: (c) => {
      const t = c.self.bloodyMary?.tendril
      return [node(`bloody-mary:${c.side}`, t ? point(t.x, t.y) : rig(c.side, 'hands'))]
    },
  },
  {
    id: 'capture',
    label: ['Bloody Mary · Prise établie', 'Bloody Mary · Capture established'],
    select: (c) => c.target.maryCapture?.owner === c.side,
    anchors: targetPart('body'),
    priority: 2.5,
  },
  {
    id: 'release',
    guard: (c) => c.target.knockdownFrames === 0,
    label: ['Bloody Mary · Prise rompue', 'Bloody Mary · Capture broken'],
    select: (c) => c.target.maryCapture?.owner === c.side,
    edge: 'leave',
    anchors: targetPart('body'),
  },
  {
    id: 'slam',
    label: ['Bloody Mary · Projection au sol', 'Bloody Mary · Ground slam'],
    select: (c) => c.target.knockdownFrames > 0,
    guard: (c) => Boolean(c.self.bloodyMary),
    anchors: targetPart('body'),
    priority: 2.5,
  },
  {
    id: 'scout',
    label: ['Bloody Mary · Gouttes-yeux', 'Bloody Mary · Eyed scouts'],
    select: (c) => c.self.bloodyMary?.drops.map((d) => d.id).join('|'),
    anchors: (c) => {
      const d = c.self.bloodyMary?.drops[0]
      return [node(`bloody-mary-scout:${c.side}:0`, d ? point(d.x, d.y) : rig(c.side, 'hands'))]
    },
    private: true,
  },
  {
    id: 'infusion',
    label: ['Bloody Mary · Perfusion', 'Bloody Mary · Infusion'],
    select: (c) => Boolean(c.self.bloodyMary?.infusion),
    edge: 'change',
    anchors: selfPart('chest'),
  },
])
export const PADAILLE_CAMERA_RULES = rulesFor('padaille', [
  {
    id: 'tool',
    label: ['I’m Coming to Get You · Outil choisi', 'I’m Coming to Get You · Selected tool'],
    select: (c) => c.self.padailleTool,
    edge: 'change',
    anchors: selfPart('right-hand'),
    priority: 2.5,
  },
])
export const TEREBELLUM_CAMERA_RULES = rulesFor('terebellum', [
  {
    id: 'transfer',
    label: ['Sweet Home · Transfert de blessures', 'Sweet Home · Wound transfer'],
    select: (c) =>
      c.state.impact?.transfer?.owner === c.side ? c.state.impact.sequence : undefined,
    anchors: (c) => [rig(c.side, 'left-hand'), rig(c.side, 'right-hand'), rig(c.other, 'chest')],
    priority: 2.5,
  },
  {
    id: 'object-transfer',
    label: ['Sweet Home · Réceptacle de fortune', 'Sweet Home · Improvised recipient'],
    select: (c) =>
      c.state.impact?.objectTransfer?.owner === c.side ? c.state.impact.sequence : undefined,
    anchors: (c) => preparedFocus(c, (e) => e.id === c.state.impact?.objectTransfer?.objectId),
    priority: 2.5,
  },
])
export const BONOLENOV_CAMERA_RULES = rulesFor('bonolenov', [
  {
    id: 'dance',
    label: ['Battle Cantabile · Danse', 'Battle Cantabile · Dance'],
    select: (c) => c.self.battleCantabile?.preparation?.piece,
    anchors: selfPart('body'),
    priority: 1,
    duration: 108,
  },
  {
    id: 'prologue',
    label: ['Battle Cantabile · Prologue', 'Battle Cantabile · Prologue'],
    select: (c) => Boolean(c.self.battleCantabile?.prologue),
    edge: 'change',
    anchors: selfPart('body'),
    priority: 3,
  },
  {
    id: 'metamorphosen',
    label: ['Metamorphosen · Apparence', 'Metamorphosen · Appearance'],
    select: (c) => c.self.battleCantabile?.form?.model,
    edge: 'change',
    anchors: selfPart('body'),
    priority: 3,
  },
  {
    id: 'jupiter',
    label: ['Battle Cantabile · Jupiter', 'Battle Cantabile · Jupiter'],
    select: (c) => c.state.projectiles.find((p) => p.owner === c.side && p.jupiter)?.id,
    anchors: (c) => {
      const p = c.state.projectiles.find((p) => p.owner === c.side && p.jupiter)
      return p ? [{ type: 'projectile', id: p.id, x: p.x, y: p.y }] : [rig(c.side)]
    },
    priority: 3,
  },
  {
    id: 'dance-end',
    label: ['Battle Cantabile · Danse interrompue', 'Battle Cantabile · Dance interrupted'],
    select: (c) => Boolean(c.self.battleCantabile?.preparation),
    edge: 'leave',
    guard: (c) => c.self.hitStun > 0,
    anchors: selfPart('body'),
  },
])
