import { Box3, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'
import { groundVictoryActor } from './actors'
import { lowerGuardForProp } from './personalGuardStaging'
import { lynchUpperBodies } from './lynchBody'

export function stageLynch(context: VictoryContext) {
  const { hero, victim, age, centre } = context
  const approach = ease((age - 48) / 60)
  const gap = 0.55 + victim.width * 0.18
  const destination = centre + context.gap / 2 - gap
  hero.root.position.x += (destination - hero.root.position.x) * approach
  hero.root.rotation.y = (Math.PI / 2) * (1 - ease((age - 450) / 30))
  victim.root.rotation.y = -Math.PI / 2
  hero.root.position.z = 0.05 * Math.sin(Math.PI * approach)
  const walk = Math.sin((age - 48) * 0.2) * Math.sin(Math.PI * approach) * 0.24
  for (const side of ['left', 'right']) {
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x = walk * (side === 'left' ? 1 : -1)
  }
  groundVictoryActor(hero)
  groundVictoryActor(victim)
  if (victim.height > hero.height * 1.3) lowerGuardForProp(victim, hero.height * 0.74)
  lynchUpperBodies(context)
  const torso = victim.root.getObjectByName('torso')!
  const bounds = new Box3().setFromObject(torso)
  const contact = bounds.getCenter(new Vector3())
  contact.x = bounds.min.x - 0.018
  contact.z += 0.055
  if (hero.height > victim.height * 1.15) lowerGuardForProp(hero, contact.y + 0.04)
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return contact
}
