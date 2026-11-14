import type { Hang, Placed } from './humanSignature'

export function buildFluteSignature({ THREE, body, paint }: Hang): void {
  const flute = body({
    key: 'sig:flute',
    make: () => new THREE.CylinderGeometry(0.015, 0.015, 0.38, 12),
    material: paint.accent,
    at: [0.19, 0.84, 0.1],
    turn: [0, 0, 1.35],
    name: 'signature-flute',
  })
  const child = (shape: Placed, at: [number, number, number]) => {
    const part = body({ ...shape, at: [0, 0, 0] })
    flute.add(part)
    part.position.set(...at)
    return part
  }
  child(
    {
      key: 'sig:flute-embouchure',
      make: () => new THREE.TorusGeometry(0.022, 0.005, 5, 12),
      material: paint.dark,
      at: [0, 0, 0],
      turn: [Math.PI / 2, 0, 0],
      name: 'signature-flute-embouchure',
    },
    [0, -0.135, 0],
  )
  for (const end of [-0.19, 0.19]) {
    child(
      {
        key: 'sig:flute-joint',
        make: () => new THREE.TorusGeometry(0.0165, 0.003, 4, 10),
        material: paint.dark,
        at: [0, 0, 0],
        turn: [Math.PI / 2, 0, 0],
      },
      [0, end, 0],
    )
  }
  for (let index = 0; index < 6; index++) {
    child(
      {
        key: 'sig:flute-key',
        make: () => new THREE.CylinderGeometry(0.014, 0.014, 0.006, 8),
        material: paint.dark,
        at: [0, 0, 0],
        turn: [Math.PI / 2, 0, 0],
        name: `signature-flute-key-${index}`,
      },
      [0, -0.075 + index * 0.045, 0.017],
    )
  }
}
