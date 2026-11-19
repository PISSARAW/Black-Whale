import { moveById } from './movesets'
import { bodyguardShotDetail } from './bodyguardCamera'
import { needleFaceCamera } from './illumiNeedleCamera'
import { fighterDefinition } from './roster'
import { rig, prop, node } from './cinematicRules'
import type { CameraDetail, CameraPart } from './cinematicTypes'
import type { FightSide, FightState, FighterId } from './types'

/** Physical focus for every selectable fighter; copied attacks use the executed source's lens. */
export const FIGHTER_CAMERA_PARTS = {
  kurapika: 'right-hand',
  hisoka: 'hands',
  chrollo: 'hands',
  benjamin: 'hands',
  tserriednich: 'head',
  feitan: 'body',
  saiyu: 'hands',
  theta: 'hands',
  biscuit: 'body',
  phinks: 'right-hand',
  franklin: 'hands',
  machi: 'hands',
  illumi: 'hands',
  kalluto: 'hands',
  bonolenov: 'body',
  shizuku: 'hands',
  hinrigh: 'hands',
  mizaistom: 'hands',
  leorio: 'right-hand',
  hanzo: 'body',
  rihan: 'head',
  zakuro: 'hands',
  melody: 'head',
  basho: 'hands',
  camilla: 'hands',
  halkenburg: 'hands',
  gel: 'right-hand',
  lynch: 'head',
  luini: 'body',
  bill: 'hands',
  furykov: 'hands',
  cluck: 'hands',
  beyond: 'body',
  longhi: 'hands',
  musse: 'hands',
  padaille: 'right-hand',
  sayird: 'head',
  terebellum: 'hands',
  voconte: 'body',
  yokotani: 'body',
} satisfies Partial<Record<FighterId, CameraPart>>
const TIPS: Record<string, string> = {
  neutralSpecial: 'claw',
  forwardSpecial: 'pendulum',
  downSpecial: 'cross',
  backSpecial: 'syringe',
  finisher: 'blade',
}
function executedMove(state: FightState, side: FightSide, source: FighterId) {
  const actor = state[side]
  const held = actor.kurapika?.held
  const id = held?.used && held.source === source ? held.moveId : actor.attack?.moveId
  return moveById(id)
}
const CAST_PROPS: Partial<Record<FighterId, string>> = {
  chrollo: 'chrollo-open-book',
  shizuku: 'shizuku-blinky',
  melody: 'signature-flute',
}
function sourceLens(source: FighterId, side: FightSide) {
  const part = FIGHTER_CAMERA_PARTS[source as keyof typeof FIGHTER_CAMERA_PARTS] ?? 'hands'
  if (source === 'gel')
    return { anchors: [node(`gel-snake-arm:${side}`, rig(side, part))], frontal: false }
  if (source === 'halkenburg')
    return { anchors: [node(`halkenburg-arrow:${side}`, rig(side, part))], frontal: false }
  if (source === 'saiyu')
    return { anchors: [node(`priest-staff:${side}`, rig(side, part))], frontal: false }
  const object = CAST_PROPS[source]
  return {
    anchors: object ? [prop(side, object, part)] : [rig(side, part)],
    frontal: part === 'head',
  }
}
function chainTip(source: FighterId, slot?: string) {
  return source === 'kurapika' ? TIPS[slot ?? 'neutralSpecial'] : undefined
}
export function castCameraDetail(state: FightState, side: FightSide): CameraDetail {
  const detail = bodyguardShotDetail(state, side) ?? ordinaryCastCameraDetail(state, side)
  return needleFaceCamera(detail, state[side].attack?.illumiNeedleMode)
}

function ordinaryCastCameraDetail(state: FightState, side: FightSide): CameraDetail {
  const attack = state[side].attack!
  const source = attack.hatsuSource ?? state[side].id
  const move = executedMove(state, side, source)
  const tip = chainTip(source, move?.slot)
  const definition = fighterDefinition(source)
  return {
    kind: tip ? 'chain' : 'focus',
    tip,
    side,
    source,
    sourceSide: side,
    aura: attack.concealed,
    eventId: `cast:${side}:${attack.moveId ?? attack.kind}:${state.frame}`,
    labelFr: move?.nameFr ?? definition.specialFr,
    labelEn: move?.nameEn ?? definition.specialEn,
    ...sourceLens(source, side),
    isolate: true,
  }
}
