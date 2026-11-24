import type { BufferGeometry, Mesh, MeshBasicMaterial, Object3D } from 'three'

const shaded = new WeakMap<BufferGeometry, BufferGeometry>()

/**
 * Fight-only three-tone key light with a narrow camera rim. Human materials stay
 * unlit and deterministic; this bakes volume once instead of adding scene lights.
 */
export function improveFightBodyReadability(root: Object3D): void {
  root.traverse((node) => {
    const mesh = node as Mesh<BufferGeometry, MeshBasicMaterial>
    if (!surface(mesh)) return
    mesh.geometry = combatBodyGeometry(mesh.geometry)
  })
}

export function combatBodyGeometry(source: BufferGeometry): BufferGeometry {
  const held = shaded.get(source)
  if (held) return held
  const normal = source.getAttribute('normal')
  const position = source.getAttribute('position')
  if (!normal || !position) return source
  const geometry = source.clone()
  const colour = position.clone()
  for (let i = 0; i < normal.count; i++) {
    const nx = normal.getX(i),
      ny = normal.getY(i),
      nz = normal.getZ(i)
    const key = nx * -0.32 + ny * 0.58 + nz * 0.75
    const tone = key > 0.42 ? 1.04 : key > -0.18 ? 0.86 : 0.66
    const rim = smooth(Math.max(0, 1 - Math.abs(nz))) * 0.1
    const value = Math.min(1.08, tone + rim)
    colour.setXYZ(i, value, value * 0.985, value * 0.965)
  }
  geometry.setAttribute('color', colour)
  geometry.userData = { ...geometry.userData, sharedHuman: true, combatBodyReadability: true }
  shaded.set(source, geometry)
  return geometry
}

function surface(mesh: Mesh<BufferGeometry, MeshBasicMaterial>): boolean {
  return Boolean(
    mesh.isMesh &&
    !Array.isArray(mesh.material) &&
    mesh.material.isMeshBasicMaterial &&
    mesh.material.vertexColors &&
    !mesh.material.transparent &&
    mesh.material.side !== 1,
  )
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value)
}
