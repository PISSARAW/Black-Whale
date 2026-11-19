import { expect, it } from 'vitest'
import { Group } from 'three'
import { beginHumanJointFrame, endHumanJointFrame } from './humanJointMotion'
import { keepHumanJoint } from './humanJointLimits'

it('bounds a phase cut once per displayed frame, freezes in pause and releases its reference', () => {
  const shoulder = new Group()
  shoulder.name = 'shoulder-right'
  shoulder.rotation.x = -0.5
  const from = shoulder.rotation.clone()
  const reference = shoulder.quaternion.clone()
  beginHumanJointFrame(shoulder, from, 1 / 60)
  const pose = () => {
    shoulder.rotation.set(-3.1, 1.3, 2)
    keepHumanJoint(shoulder)
    return shoulder.quaternion.clone()
  }
  const first = pose()
  expect(first.angleTo(reference)).toBeLessThanOrEqual(30 / 60)
  expect(pose().angleTo(first)).toBeLessThan(1e-7)
  beginHumanJointFrame(shoulder, shoulder.rotation.clone(), 0)
  expect(pose().angleTo(first)).toBeLessThan(1e-7)
  endHumanJointFrame(shoulder)
  pose()
  expect(shoulder.rotation.x).toBe(-3.1)
})

it('permits an unseen pose reset while a body is inside a portal', () => {
  const body = new Group(),
    elbow = new Group()
  elbow.name = 'elbow-right'
  body.add(elbow)
  beginHumanJointFrame(elbow, elbow.rotation.clone(), 1 / 60)
  body.visible = false
  elbow.rotation.x = -2
  keepHumanJoint(elbow)
  expect(elbow.rotation.x).toBe(-2)
  endHumanJointFrame(elbow)
})
