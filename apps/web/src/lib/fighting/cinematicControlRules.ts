import { rulesFor, selfPart, targetPart, pair, node, rig } from './cinematicRules'

export const MACHI_CAMERA_RULES = rulesFor('machi', [
  {
    id: 'suture',
    label: ['Nen Stitches · Suture accomplie', 'Nen Stitches · Stitched'],
    select: (c) => c.self.health,
    edge: 'increase',
    guard: (c) => c.self.attack?.hatsuSource === 'machi',
    anchors: selfPart('chest'),
  },
  {
    id: 'thread',
    label: ['Fils de Nen · Liaison', 'Nen Threads · Linked'],
    select: (c) => (c.target.machiThread?.owner === c.side ? c.target.machiThread.kind : ''),
    anchors: (c) => [node(`machi-thread:${c.other}`, rig(c.other, 'chest')), rig(c.side, 'hands')],
  },
  {
    id: 'thread-end',
    label: ['Fils de Nen · Lien rompu', 'Nen Threads · Tether broken'],
    select: (c) => c.target.machiThread?.owner === c.side,
    edge: 'leave',
    anchors: pair,
  },
  {
    id: 'bind-end',
    label: ['Ligature · Libération', 'Bind · Released'],
    select: (c) => c.target.machiThread?.owner === c.side && c.target.machiThread.kind === 'bind',
    edge: 'leave',
    anchors: targetPart('chest'),
  },
])
export const ILLUMI_CAMERA_RULES = rulesFor('illumi', [
  {
    id: 'face-warp',
    label: ['Visage · Trois aiguilles au front', 'Face · Three forehead needles'],
    select: (c) => c.target.needleFace?.owner === c.side && c.target.needleFace.reshaping,
    anchors: targetPart('head'),
    frontal: true,
    priority: 3,
  },
  {
    id: 'implant',
    label: ['Needle People · Implantation', 'Needle People · Implanted'],
    select: (c) => c.target.needlePuppet?.owner === c.side,
    anchors: targetPart('head'),
    frontal: true,
    priority: 2.5,
  },
  {
    id: 'order',
    label: ['Needle People · Nouvel ordre', 'Needle People · New order'],
    select: (c) => (c.target.needlePuppet?.owner === c.side ? c.target.needlePuppet.order : ''),
    anchors: targetPart('body'),
  },
  {
    id: 'reshape-start',
    label: ['Aiguilles · Remodelage', 'Needles · Reshaping'],
    select: (c) => (c.self.illumi?.preparation ?? 0) > 0,
    anchors: selfPart('head'),
    frontal: true,
    priority: 1,
  },
  {
    id: 'reshape',
    label: ['Visage · Remodelage physique', 'Face · Physical alteration'],
    select: (c) => Boolean(c.self.illumi?.disguised),
    edge: 'change',
    anchors: selfPart('head'),
    frontal: true,
    priority: 3,
  },
])
export const KALLUTO_CAMERA_RULES = rulesFor('kalluto', [
  {
    id: 'plant',
    label: ['Papier · Fragment implanté', 'Paper · Fragment embedded'],
    select: (c) =>
      c.target.plantedPaper
        ?.filter((p) => p.owner === c.side)
        .map((p) => p.zone)
        .join('|'),
    anchors: (c) => {
      const zone = c.target.plantedPaper?.filter((p) => p.owner === c.side).at(-1)?.zone ?? 'torso'
      return [rig(c.other, zone === 'torso' ? 'chest' : zone)]
    },
  },
  {
    id: 'doll',
    label: ['Papier · Poupée de surveillance', 'Paper · Eavesdropping doll'],
    select: (c) => Boolean(c.self.kallutoPaper?.doll),
    anchors: selfPart('hands'),
    private: true,
  },
  {
    id: 'words',
    label: ['Papier · Paroles entendues', 'Paper · Words heard'],
    select: (c) => c.self.kallutoPaper?.heard?.frame,
    anchors: selfPart('hands'),
    private: true,
  },
  {
    id: 'doll-end',
    label: ['Papier · Écoute interrompue', 'Paper · Eavesdropping ended'],
    select: (c) => Boolean(c.self.kallutoPaper?.doll),
    edge: 'leave',
    anchors: selfPart('hands'),
    private: true,
  },
])
export const SAIYU_CAMERA_RULES = rulesFor('saiyu', [
  ...(
    [
      ['Mizaru', 1, 'Vue retirée', 'Sight sealed'],
      ['Kikazaru', 2, 'Ouïe retirée', 'Hearing sealed'],
      ['Iwazaru', 4, 'Parole retirée', 'Speech sealed'],
    ] as const
  ).map(([name, bit, fr, en]) => ({
    id: name.toLowerCase(),
    label: [`${name} · ${fr}`, `${name} · ${en}`] as const,
    select: (c: import('./cinematicRules').CameraContext) =>
      (c.target.hatsuEffects.senseSeals & bit) !== 0,
    anchors: targetPart('head'),
    frontal: true,
    priority: 2.5,
  })),
])
export const MIZAISTOM_CAMERA_RULES = rulesFor('mizaistom', [
  {
    id: 'warning',
    label: ['Cross Game · Avertissement', 'Cross Game · Warning'],
    select: (c) => c.target.crossGame?.owner === c.side && c.target.crossGame.phase === 'warning',
    anchors: (c) => [node(`cross-game-card:${c.other}`, rig(c.side, 'hands'))],
  },
  {
    id: 'confine',
    label: ['Cross Game · Désobéissance', 'Cross Game · Disobedience'],
    select: (c) =>
      c.target.crossGame?.owner === c.side && c.target.crossGame.phase === 'restrained',
    anchors: (c) => [node(`cross-game-cage:${c.other}`, rig(c.other))],
    priority: 2.5,
  },
  {
    id: 'release',
    label: ['Cross Game · Libération', 'Cross Game · Released'],
    select: (c) =>
      c.target.crossGame?.owner === c.side && c.target.crossGame.phase === 'restrained',
    edge: 'leave',
    anchors: targetPart('body'),
  },
])
export const GEL_CAMERA_RULES = rulesFor('gel', [
  {
    id: 'arm',
    label: ['Gel · Bras-serpent', 'Gel · Snake arm'],
    select: (c) => Boolean(c.self.attack?.hatsuSource === 'gel'),
    anchors: (c) => [node(`gel-snake-arm:${c.side}`, rig(c.side, 'right-hand'))],
    priority: 1,
  },
  {
    id: 'retract',
    label: ['Gel · Rétraction', 'Gel · Retraction'],
    select: (c) => Boolean(c.self.attack?.hatsuSource === 'gel'),
    edge: 'leave',
    anchors: selfPart('right-hand'),
    priority: 1,
  },
])
