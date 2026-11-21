/**
 * The authored character models: one entry per identity that has a GLB.
 *
 * An identity absent from this table keeps the procedural body built by
 * `humanFigure.ts`; an identity present here still builds that body — it is
 * the skeleton the combat and the walk animate — and wears the GLB over it.
 * Adding a character is a file in `static/models/characters/` and an entry
 * here, nothing else.
 */

/** The skeleton joints a model must name for the rig adapter to drive it. */
export interface CharacterModelBones {
  hips: string
  torso: string
  head: string
  leftUpperArm: string
  leftForearm: string
  leftHand: string
  rightUpperArm: string
  rightForearm: string
  rightHand: string
  leftThigh: string
  leftShin: string
  leftFoot: string
  rightThigh: string
  rightShin: string
  rightFoot: string
}

export interface CharacterModel {
  /** Served from `apps/web/static`. */
  url: string
  /** Height of the model in its own units, feet to crown. */
  height: number
  /** Past this distance the walk shows the procedural body instead. */
  nearDistance: number
  /** Clip names inside the GLB, by the role the walk gives them. */
  animations: { walk?: string }
  bones: CharacterModelBones
}

/** Meshy's auto-rig names, shared by every model it rigs. */
const MESHY_BONES: CharacterModelBones = {
  hips: 'Hips',
  torso: 'Spine02',
  head: 'Head',
  leftUpperArm: 'LeftArm',
  leftForearm: 'LeftForeArm',
  leftHand: 'LeftHand',
  rightUpperArm: 'RightArm',
  rightForearm: 'RightForeArm',
  rightHand: 'RightHand',
  leftThigh: 'LeftUpLeg',
  leftShin: 'LeftLeg',
  leftFoot: 'LeftFoot',
  rightThigh: 'RightUpLeg',
  rightShin: 'RightLeg',
  rightFoot: 'RightFoot',
}

export const CHARACTER_MODELS: Readonly<Record<string, CharacterModel>> = {
  'feitan-portor': {
    url: '/models/characters/feitan.glb',
    height: 1.7,
    nearDistance: 18,
    animations: { walk: 'Walking' },
    bones: MESHY_BONES,
  },
}

export function characterModel(modelId: string | undefined): CharacterModel | undefined {
  return modelId ? CHARACTER_MODELS[modelId] : undefined
}
