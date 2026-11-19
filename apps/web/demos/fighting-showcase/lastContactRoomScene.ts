import {
  BoxGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from 'three'
import type { Scene } from 'three'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import type { FightState } from '../../src/lib/fighting/types'

/** Cutaway glazing represents the actual sealed room installed before the duel. */
export function ensureLastContactRoom(scene: Scene, state: FightState) {
  if (scene.getObjectByName('last-contact-room')) return
  const room = state.battlefield?.entities.find((e) => e.kind === 'room' && e.x === 80 && e.sealed)
  if (!room) return
  const root = new Group()
  root.name = 'last-contact-room'
  root.position.set(fightWorldX(room.x), 0, -0.25)
  const glass = new MeshStandardMaterial({
    color: '#6b8898',
    transparent: true,
    opacity: 0.12,
    roughness: 0.25,
    depthWrite: false,
  })
  const frame = new LineBasicMaterial({ color: '#aac8d3', transparent: true, opacity: 0.7 })
  const geometry = new BoxGeometry(1.38, 2.16, 1.4)
  const enclosure = new Mesh(geometry, glass)
  enclosure.position.y = 1.08
  const edges = new LineSegments(new EdgesGeometry(geometry), frame)
  edges.position.y = 1.08
  root.add(enclosure, edges)
  scene.add(root)
}
