import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene } from 'three'
import { throwEquipmentBounds } from './cameraAnchors'
import type { ThrowCinematicFrame } from '../throwCinematic'

const bounds = { left: -1, right: 1, bottom: 0.02, top: 2, near: -0.5, far: 0.5 }
const frame: ThrowCinematicFrame = {
  attacker: 'player',
  victim: 'opponent',
  sequence: 1,
  facing: 1,
  active: true,
  age: 30,
  duration: 84,
}

describe('the lens fits real cinematic equipment', () => {
  it('includes the whole staff even when the actor’s root is unnamed', () => {
    const scene = new Scene(),
      actor = new Group()
    const staff = new Mesh(new BoxGeometry(0.1, 4, 0.1), new MeshBasicMaterial())
    staff.name = 'throw-signature:staff'
    staff.position.y = 2
    scene.add(actor, staff)
    expect(throwEquipmentBounds(bounds, actor, { ...frame, performance: 'saiyu-vault' }).top).toBe(
      4,
    )
    staff.geometry.dispose()
    staff.material.dispose()
  })

  it('includes only an actually carried Prologue spear, and excludes a hidden one', () => {
    const actor = new Group()
    const film = { ...frame, performance: 'bonolenov-prologue' as const }
    expect(throwEquipmentBounds(bounds, actor, film)).toEqual(bounds)
    const spear = new Mesh(new BoxGeometry(4, 0.1, 0.1), new MeshBasicMaterial())
    spear.name = 'bonolenov-prologue-spear'
    spear.position.x = 1
    actor.add(spear)
    expect(throwEquipmentBounds(bounds, actor, film).right).toBe(3)
    spear.visible = false
    expect(throwEquipmentBounds(bounds, actor, film)).toEqual(bounds)
    spear.geometry.dispose()
    spear.material.dispose()
  })
})
