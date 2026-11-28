import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

function partedScalp(kit: MangaHairKit, part: number) {
  const scalp = mangaScalpGeometry(kit)
  const position = scalp.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const rise = 0.082 * Math.max(0, 1 - Math.abs(x - part) / 0.15)
    const taper = Math.max(0, (0.218 - y) / 0.118)
    position.setY(i, y + rise * taper * Math.max(0, z / 0.18))
  }
  scalp.computeVertexNormals()
  return scalp
}

function maidBob(kit: MangaHairKit, style: 'loberry' | 'yuri' | 'illardia') {
  const { THREE, parts, lock } = kit
  const loberry = style === 'loberry'
  const illardia = style === 'illardia'
  const hem = illardia ? -0.045 : -0.12
  const part = loberry ? -0.055 : illardia ? 0 : 0.036
  parts.push(
    partedScalp(kit, part),
    new THREE.LatheGeometry(
      [
        [0.17, hem],
        [0.17, -0.015],
        [0.164, 0.13],
        [0.11, 0.201],
      ].map(([radius, y]) => new THREE.Vector2(radius, y)),
      28,
      0.92,
      Math.PI * 2 - 1.84,
    ).scale(1, 1, 0.91),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++) {
      const end = (illardia ? 0.103 : 0.115) + i * 0.009
      lock({
        width: 0.023,
        depth: 0.01,
        points: [
          [part + side * (0.011 + i * 0.007), 0.218, 0.044 - i * 0.013],
          [side * (0.071 + i * 0.012), 0.165, 0.148 - i * 0.011],
          [side * end, illardia ? 0.067 - i * 0.008 : 0.026, 0.134 - i * 0.017],
          [side * (end + (style === 'yuri' ? 0.025 : 0.009)), hem, 0.084 - i * 0.013],
        ],
      })
    }
}

function ladiolus(kit: MangaHairKit) {
  const { THREE, parts, lock } = kit
  parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1]) {
    parts.push(
      new THREE.SphereGeometry(1, 18, 12)
        .scale(0.067, 0.06, 0.057)
        .translate(side * 0.083, -0.088, -0.128),
    )
    for (let i = 0; i < 7; i++)
      lock({
        width: 0.025,
        depth: 0.012,
        points: [
          [side * i * 0.019, 0.191, 0.138 - i * 0.017],
          [side * (0.067 + i * 0.014), 0.126, 0.134 - i * 0.027],
          [side * (0.145 - i * 0.005), 0.015, -0.044 - i * 0.017],
          [side * 0.083, -0.082, -0.146],
        ],
      })
  }
}

function satobi(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++)
      kit.lock({
        width: 0.027,
        depth: 0.012,
        points: [
          [side * (0.047 + i * 0.012), 0.146, -0.102],
          [side * (0.083 + i * 0.01), 0.199, 0.018],
          [side * (0.068 + i * 0.015), 0.215, 0.104],
          [side * (0.021 + i * 0.023), 0.175 + i * 0.012, 0.153 - i * 0.012],
        ],
      })
}

function crest(kit: MangaHairKit, spiky: boolean) {
  const { THREE, parts, lock } = kit
  const width = spiky ? 0.105 : 0.063
  parts.push(
    new THREE.SphereGeometry(1, 20, 12).scale(width, 0.056, 0.15).translate(0, 0.189, 0.008),
  )
  for (let i = -5; i <= 5; i++) {
    const x = (i * width) / 6
    const lift = spiky ? 0.035 + (Math.abs(i) % 3) * 0.012 : 0.011
    lock({
      width: 0.02,
      depth: 0.012,
      points: [
        [x * 0.88, 0.207, -0.118],
        [x, 0.24, -0.038],
        [x * 1.08, 0.234 + lift, 0.051],
        [x * 1.14, 0.182 + lift, 0.151],
      ],
    })
  }
}

function closeCrop(kit: MangaHairKit, flat: boolean) {
  const { THREE, parts, lock } = kit
  parts.push(mangaScalpGeometry(kit))
  const peak = flat ? 0.237 : 0.244
  parts.push(
    new THREE.SphereGeometry(1, 20, 12)
      .scale(0.145, 0.057, 0.128)
      .translate(0, peak - 0.053, -0.01),
  )
  for (let i = -7; i <= 7; i++)
    lock({
      width: flat ? 0.02 : 0.016,
      depth: 0.01,
      points: [
        [i * 0.015, 0.216, -0.08],
        [i * 0.018, 0.236, -0.013],
        [i * 0.018, peak + (flat ? 0 : (Math.abs(i) % 3) * 0.009), 0.064],
        [i * 0.018, flat ? 0.164 - (i === 0 ? 0.022 : 0) : 0.192, 0.153],
      ],
    })
}

function belerainte(kit: MangaHairKit) {
  const { THREE, parts, lock } = kit
  parts.push(partedScalp(kit, 0))
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const y = 0.123 - i * 0.023
      const x = side * (0.144 + Math.sin(i * 0.65) * 0.033)
      parts.push(
        new THREE.SphereGeometry(1, 12, 8).scale(0.034, 0.037, 0.034).translate(x, y, -0.054),
      )
      lock({
        width: 0.023,
        depth: 0.014,
        points: [
          [side * 0.081, 0.187, 0.075 - i * 0.014],
          [x, y + 0.037, 0.039],
          [x + side * 0.016, y, -0.025],
          [x, y - 0.033, -0.075],
        ],
      })
    }
}

function seiko(kit: MangaHairKit) {
  kit.parts.push(partedScalp(kit, -0.055))
  for (const side of [-1, 1])
    for (let i = 0; i < 10; i++) {
      const z = 0.146 - i * 0.024
      const x = side * (0.135 + Math.sin(i * 0.31) * 0.026)
      kit.lock({
        width: 0.028,
        depth: 0.016,
        points: [
          [side * 0.038, 0.23, z * 0.62],
          [side * 0.127, 0.189, z],
          [x, 0.078, z - 0.02],
          [x + side * 0.038, 0.042 + (i % 3) * 0.018, z - 0.035],
        ],
      })
    }
}

export const NEN_CLASS_HAIR: Partial<Record<string, (kit: MangaHairKit) => void>> = {
  loberry: (kit) => maidBob(kit, 'loberry'),
  yuri: (kit) => maidBob(kit, 'yuri'),
  illardia: (kit) => maidBob(kit, 'illardia'),
  ladiolus: ladiolus,
  satobi: satobi,
  belerainte: belerainte,
  tenftory: (kit) => crest(kit, false),
  slakka: (kit) => crest(kit, true),
  yuhirai: (kit) => closeCrop(kit, true),
  myuhan: (kit) => closeCrop(kit, false),
  'seiko-hui-guo-rou': seiko,
  danjin: ({ THREE, parts }) => {
    parts.push(
      new THREE.CylinderGeometry(0.061, 0.065, 0.112, 16)
        .scale(1, 1, 0.86)
        .rotateX(-0.11)
        .translate(0, 0.246, -0.013),
    )
  },
}
