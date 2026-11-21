import type { Mesh, Object3D } from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import {
  characterBodyMeshes,
  wearCharacterModel,
  wearsCharacterModel,
} from '$lib/tour/characterModelFigure'
import { preloadCharacterModels } from '$lib/tour/characterModelLoader'
import { kameoAppearance } from './kameos/catalogue'
import { battleAppearance } from './battleCantabileRules'
import { fighterDefinition } from './roster'
import type { ArcadeFighter, FightState } from './types'

type Three = typeof import('three')

/** The identity whose body this fighter is drawn with — the key of the GLB registry. */
export function fightModelId(fighter: ArcadeFighter): string {
  return (kameoAppearance(fighter.id) ?? fighterDefinition(battleAppearance(fighter))).modelId
}

/**
 * The scene's figure modules, with both fighters' GLBs already in the cache.
 *
 * `buildFightFigure` is synchronous and stays so: the scene awaits this once,
 * before the first build, and every build after reads the cache. A model that
 * failed to load is simply absent from it, and the procedural body is drawn.
 */
export async function prepareFightFigures(THREE: Three, state: FightState) {
  const [figures] = await Promise.all([
    import('./fighterFigure'),
    preloadCharacterModels(THREE, [fightModelId(state.player), fightModelId(state.opponent)]),
  ])
  return { ...figures, fightHandAnchor }
}

/** The procedural meshes a GLB will replace, taken before any equipment is hung. */
export function fightBodyMeshes(modelId: string, model: HumanFigure): Mesh[] | undefined {
  return wearsCharacterModel(modelId) ? characterBodyMeshes(model.turns) : undefined
}

/**
 * Put the GLB on a finished fight figure. The face pieces the fight adds to the
 * procedural head after the body was taken are the GLB's to replace too;
 * weapons and Nen on the hands stay drawn.
 */
export function wearFightModel(
  THREE: Three,
  model: HumanFigure,
  worn: { modelId: string; body: Mesh[] | undefined },
): void {
  if (!worn.body) return
  const head = humanAnimationRig(model.turns)?.head
  const face = head ? characterBodyMeshes(head).filter((mesh) => !worn.body?.includes(mesh)) : []
  wearCharacterModel({ THREE, figure: model, modelId: worn.modelId, body: [...worn.body, ...face] })
}

/** The hand a hand-anchored effect leaves from: the lead hand follows facing. */
export function fightHandAnchor(
  root: Object3D,
  held: { facing: -1 | 1; hand: 'lead' | 'rear' },
): Object3D | undefined {
  const lead = held.facing === 1 ? 'right' : 'left'
  const limb = held.hand === 'lead' ? lead : lead === 'right' ? 'left' : 'right'
  return root.getObjectByName(`hand-${limb}`)
}
