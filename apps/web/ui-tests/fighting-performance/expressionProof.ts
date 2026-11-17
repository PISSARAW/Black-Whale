import type { Scene } from 'three'
import { fightFaceRig } from '../../src/lib/fighting/fightExpressionRig'

/** Inspect once after measurement, never add a per-frame facial traversal. */
export function expressionProof(scene?: Scene) {
  const seen = new Set<ReturnType<typeof fightFaceRig>>()
  scene?.traverse((node) => {
    const rig = fightFaceRig(node)
    if (rig) seen.add(rig)
  })
  return [...seen].map((rig) => ({
    fighter: rig!.fighterId,
    active: rig!.active,
    mode: rig!.mode,
    pose: rig!.pose,
    mouthWeights: rig!.mouth?.morphTargetInfluences?.slice(),
    eyes: rig!.eyes.map(({ node }) => ({ scale: node.scale.y, rotation: node.rotation.z })),
  }))
}
