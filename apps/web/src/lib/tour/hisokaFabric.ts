import type { BufferGeometry, DataTexture, Material, MeshBasicMaterial } from 'three'
import type { Three } from './silentMajorityParts'

const weaves = new WeakMap<Three, DataTexture>()
const finishes = new WeakMap<Material, Map<boolean, MeshBasicMaterial>>()

function weave(THREE: Three) {
  const existing = weaves.get(THREE)
  if (existing) return existing
  const size = 128
  const texels = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const crossing = (x + y * 2) % 8 < 4 ? x : y
      const value = 233 + (crossing % 4 === 0 ? 7 : 0) + ((x * 13 + y * 7) % 9)
      texels.set([value, value, value, 255], (y * size + x) * 4)
    }
  }
  const texture = new THREE.DataTexture(texels, size, size)
  texture.name = 'hisoka-procedural-weave'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  weaves.set(THREE, texture)
  return texture
}

export function hisokaFabricMaterial(THREE: Three, source: Material, woven = true) {
  let variants = finishes.get(source)
  if (!variants) finishes.set(source, (variants = new Map()))
  const held = variants.get(woven)
  if (held) return held
  const material = (source as MeshBasicMaterial).clone()
  material.vertexColors = true
  if (woven) material.map = weave(THREE)
  variants.set(woven, material)
  return material
}

/** Author broad folds in relief and keep the resulting tones in both modes. */
export function shadeHisokaFabric(THREE: Three, geometry: BufferGeometry) {
  const normal = geometry.getAttribute('normal')
  const positions = geometry.getAttribute('position')
  const colors = new Float32Array(normal.count * 3)
  for (let i = 0; i < normal.count; i++) {
    const key = -normal.getX(i) * 0.34 + normal.getY(i) * 0.53 + normal.getZ(i) * 0.67
    const light = THREE.MathUtils.smoothstep(key, -0.23, 0.74)
    const crease = 0.036 * Math.sin(positions.getY(i) * 28 + positions.getX(i) * 8)
    const tone = 0.68 + light * 0.34 + crease
    colors.set([tone * 0.985, tone * 0.99, tone], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.userData.authoredGarmentTones = true
  return geometry
}

export function hisokaClothGeometry(
  THREE: Three,
  {
    length,
    taper,
    style,
  }: { length: number; taper: readonly number[]; style: 'shirt' | 'trousers' },
) {
  const steps = 24
  const points = [new THREE.Vector2(0, -length * 0.5 - 0.022)]
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const sample = (1 - t) * (taper.length - 1)
    const low = Math.min(taper.length - 2, Math.floor(sample))
    const radius = THREE.MathUtils.lerp(taper[low], taper[low + 1], sample - low)
    points.push(new THREE.Vector2(radius, (t - 0.5) * length))
  }
  points.push(new THREE.Vector2(0, length * 0.5 + 0.036))
  const sleeve = new THREE.LatheGeometry(points, 28)
  const positions = sleeve.getAttribute('position')
  const uv = sleeve.getAttribute('uv')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const angle = Math.atan2(x, z)
    const t = Math.min(1, Math.max(0, y / length + 0.5))
    const folds = 0.07 * Math.sin(angle * 3 + t * 11) * Math.sin(t * Math.PI)
    const gather = 0.105 * Math.sin(t * 38 - angle * 2) * (1 - t) ** 2
    const pressed = 0.07 * Math.cos(angle) ** 18 * Math.sin(t * Math.PI)
    const width = style === 'shirt' ? 1 + folds + gather : 1 + 0.4 * folds + 0.56 * gather + pressed
    positions.setXYZ(i, x * width, y, z * width)
    uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 2)
  }
  sleeve.computeVertexNormals()
  return shadeHisokaFabric(THREE, sleeve)
}
