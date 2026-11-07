import type { BufferGeometry, Material } from 'three'

type Three = typeof import('three')

export interface PlacedShape {
  key: string
  make: () => BufferGeometry
  material: Material
  at: [number, number, number]
  turn?: [number, number, number]
  scale?: [number, number, number]
  name?: string
}

export interface KakinHang {
  THREE: Three
  head: (shape: PlacedShape) => void
  body: (shape: PlacedShape) => void
  paint: { ink: Material; skin: Material; accent: Material; cloth: Material; dark: Material }
}

/**
 * Coiffe royale bulbeuse kakine et traits faciaux du Roi Nasubi (ch. 358).
 *
 * Contrairement au cylindre crénelé générique de l'ADR-005, la véritable couronne
 * de Kakin est une mitre bulbeuse arrondie (forme d'aubergine/urne rituelle)
 * bordée d'un bourrelet doré, surmontée d'un écusson frontal vertical et
 * entourée de médaillons/cabochons circulaires. Un double menton charnu
 * complète le visage jovial et glabre du monarque.
 */
export function buildKakinCrown(hang: KakinHang): void {
  const { THREE, head, paint } = hang

  // Calot bulbeux royal (tissu pourpre d'apparat)
  head({
    key: 'sig:kakin-crown-dome',
    make: () => new THREE.SphereGeometry(0.205, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.68),
    material: paint.cloth,
    at: [0, 0.13, 0.01],
    scale: [1.06, 0.82, 1.05],
    name: 'signature-crown',
  })

  // Bourrelet circulaire doré ceignant la base du front
  head({
    key: 'sig:kakin-crown-brim',
    make: () => new THREE.TorusGeometry(0.185, 0.022, 5, 16),
    material: paint.accent,
    at: [0, 0.125, 0.01],
    turn: [0.12, 0, 0],
  })

  // Écusson / armoirie frontale verticale
  head({
    key: 'sig:kakin-crown-crest-v',
    make: () => new THREE.BoxGeometry(0.065, 0.085, 0.02),
    material: paint.accent,
    at: [0, 0.165, 0.19],
    turn: [-0.08, 0, 0],
  })
  head({
    key: 'sig:kakin-crown-crest-h',
    make: () => new THREE.BoxGeometry(0.09, 0.024, 0.024),
    material: paint.accent,
    at: [0, 0.18, 0.192],
    turn: [-0.08, 0, 0],
  })

  // Cabochons / médaillons dorés tout autour de la coiffe
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    head({
      key: 'sig:kakin-crown-cabochon',
      make: () => new THREE.SphereGeometry(0.026, 6, 5),
      material: paint.accent,
      at: [Math.cos(angle) * 0.182, 0.185, Math.sin(angle) * 0.182 + 0.01],
    })
  }

  // Double menton charnu sous la mâchoire (souverain glabre sans barbe)
  head({
    key: 'sig:kakin-double-chin',
    make: () => new THREE.SphereGeometry(0.13, 8, 5),
    material: paint.skin,
    at: [0, -0.1, 0.08],
    scale: [1.12, 0.45, 0.95],
    name: 'kakin-double-chin',
  })
}

/**
 * Tenue d'apparat impériale du Roi Nasubi (ch. 358).
 *
 * Manteau royal pourpre ouvert sur le devant révélant le pantalon ample,
 * grand plastron pectoral cérémoniel à écailles et ceinture à boucle médaillon.
 */
export function buildKakinRobe(hang: KakinHang): void {
  const { THREE, body, paint } = hang

  // Panneaux latéraux et bordures du manteau ouvert
  for (const side of [-1, 1]) {
    body({
      key: 'attire:kakin-coat-flank',
      make: () => new THREE.BoxGeometry(0.14, 0.76, 0.28),
      material: paint.cloth,
      at: [side * 0.22, 0.76, 0],
      name: side === -1 ? 'attire-kakin-robe' : undefined,
    })
    body({
      key: 'attire:kakin-coat-trim',
      make: () => new THREE.PlaneGeometry(0.05, 0.76),
      material: paint.accent,
      at: [side * 0.15, 0.76, 0.142],
    })
  }

  // Pan arrière du manteau d'apparat
  body({
    key: 'attire:kakin-coat-back',
    make: () => new THREE.PlaneGeometry(0.42, 0.76),
    material: paint.cloth,
    at: [0, 0.76, -0.142],
  })

  // Grand plastron pectoral cérémoniel (écailles d'or)
  body({
    key: 'attire:kakin-pectoral-bib',
    make: () => new THREE.BoxGeometry(0.34, 0.22, 0.03),
    material: paint.accent,
    at: [0, 1.25, 0.185],
    name: 'kakin-pectoral',
  })
  body({
    key: 'attire:kakin-pectoral-collar',
    make: () => new THREE.TorusGeometry(0.14, 0.016, 4, 12, Math.PI),
    material: paint.accent,
    at: [0, 1.38, 0.07],
    turn: [0.4, 0, 0],
  })

  // Ceinture d'apparat et boucle circulaire médaillon
  body({
    key: 'attire:kakin-belt',
    make: () => new THREE.BoxGeometry(0.44, 0.07, 0.26),
    material: paint.cloth,
    at: [0, 0.84, 0],
  })
  body({
    key: 'attire:kakin-belt-medallion',
    make: () => new THREE.CircleGeometry(0.055, 8),
    material: paint.accent,
    at: [0, 0.84, 0.145],
  })
}
