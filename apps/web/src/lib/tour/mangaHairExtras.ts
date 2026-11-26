import type { MangaHairKit } from './mangaHair'
import type { HumanHeadBuild } from './humanHead'
import { mangaScalpGeometry } from './mangaScalp'
import { legacyMangaHairExtras } from './mangaHairFallback'

function crest(kit: MangaHairKit, wild: boolean) {
  const { parts } = kit
  parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2
    const x = Math.cos(a) * 0.14,
      z = Math.sin(a) * 0.13
    kit.lock({
      width: 0.03,
      depth: 0.02,
      points: [
        [x * 0.7, 0.13, z * 0.7],
        [x, 0.19, z],
        [x * 1.2, 0.23, z * 1.2],
        [x * (wild ? 1.7 : 1.4), 0.26 + (i % 3) * 0.025, z * 1.5],
      ],
    })
  }
}

function curls(kit: MangaHairKit, afro: boolean) {
  const { THREE, parts } = kit
  parts.push(
    new THREE.SphereGeometry(afro ? 0.255 : 0.19, 24, 14, 0, Math.PI * 2, 0, 1.4)
      .scale(1, 1.03, 0.95)
      .translate(0, 0.06, -0.02),
  )
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    parts.push(
      new THREE.SphereGeometry(afro ? 0.055 : 0.046, 10, 8).translate(
        Math.cos(a) * (afro ? 0.22 : 0.17),
        (afro ? 0.13 : 0.08) + Math.sin(a * 3) * 0.025,
        Math.sin(a) * (afro ? 0.2 : 0.15),
      ),
    )
  }
}

function ringlets(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1]) {
    const points = []
    for (let i = 0; i <= 80; i++) {
      const t = i / 80,
        a = t * Math.PI * 8,
        r = 0.065 * (1 - t * 0.65)
      points.push(
        new THREE.Vector3(side * 0.2 + Math.cos(a) * r, 0.06 - t * 0.58, Math.sin(a) * r - 0.035),
      )
    }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 80, 0.025, 6, false))
  }
  fringe(kit)
}

function fringe(kit: MangaHairKit) {
  for (let i = -5; i <= 5; i++)
    kit.lock({
      width: 0.021,
      depth: 0.009,
      points: [
        [i * 0.014, 0.22, 0.04],
        [i * 0.02, 0.15, 0.16],
        [i * 0.022, 0.08, 0.19],
        [i * 0.021, 0.045, 0.18],
      ],
    })
}

function tied(kit: MangaHairKit, options: { loose: boolean; length: number }) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 12; i++) {
    const x = (i - 5.5) * 0.013
    kit.lock({
      width: 0.024,
      depth: 0.014,
      points: [
        [x, 0.2, -0.08],
        [x * 0.9, options.loose ? 0.29 : 0.16, -0.2],
        [x * 1.6, options.loose ? 0.12 : -0.19, -0.24],
        [x * 2, options.loose ? 0.04 : -options.length, -0.14],
      ],
    })
  }
  fringe(kit)
  if (options.loose) crest(kit, true)
}

function baldCrown(kit: MangaHairKit, melody: boolean) {
  const { THREE, parts } = kit
  parts.push(
    new THREE.CylinderGeometry(0.183, 0.189, 0.1, 24, 1, true, Math.PI * 0.2, Math.PI * 1.6)
      .scale(1, 1, 0.88)
      .translate(0, -0.025, -0.01),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++)
      kit.lock({
        width: melody ? 0.025 : 0.02,
        depth: 0.013,
        points: [
          [side * 0.16, 0.04, -i * 0.02],
          [side * 0.185, -0.01, -i * 0.02],
          [side * (melody ? 0.22 : 0.18), -0.07, -i * 0.02],
          [side * (melody ? 0.25 : 0.17), -0.1 - (i % 3) * 0.018, -i * 0.02],
        ],
      })
}

function topknot(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(new THREE.SphereGeometry(0.059, 16, 10).scale(1, 0.8, 0.8).translate(0, 0.27, -0.035))
  parts.push(
    new THREE.CylinderGeometry(0.038, 0.048, 0.16, 12).rotateX(-0.7).translate(0, 0.22, -0.04),
  )
  for (let i = -3; i <= 3; i++)
    kit.lock({
      width: 0.012,
      depth: 0.009,
      points: [
        [i * 0.008, 0.27, -0.035],
        [i * 0.015, 0.32, -0.04],
        [i * 0.023, 0.34, -0.03],
        [i * 0.03, 0.32, -0.02],
      ],
    })
}

export function mangaMessyCrop(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2,
      x = Math.cos(a) * 0.14,
      z = Math.sin(a) * 0.13
    kit.lock({
      width: 0.027,
      depth: 0.013,
      points: [
        [x * 0.6, 0.18, z * 0.6],
        [x, 0.22, z],
        [x * 1.2, 0.27 + (i % 3) * 0.02, z * 1.2],
        [x * 1.55, 0.2 + (i % 3) * 0.05, z * 1.5],
      ],
    })
  }
  for (let i = -5; i <= 5; i++)
    kit.lock({
      width: 0.018,
      depth: 0.009,
      points: [
        [i * 0.015, 0.23, 0.05],
        [i * 0.023, 0.18, 0.15],
        [i * 0.023, 0.135, 0.208],
        [i * 0.021, 0.07 + (Math.abs(i) % 3) * 0.016, 0.205],
      ],
    })
}

export function mangaRoyalUpdo(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 5; i++) {
    parts.push(
      new THREE.TorusGeometry(0.062 - i * 0.004, 0.026, 8, 28)
        .rotateX(0.7)
        .translate(0, 0.2 + i * 0.041, -0.075 - i * 0.025),
    )
  }
  for (const side of [-1, 1])
    for (let i = 0; i < 5; i++)
      kit.lock({
        width: 0.018,
        depth: 0.009,
        points: [
          [side * 0.07, 0.23, -0.04],
          [side * 0.17, 0.08, 0.04],
          [side * (0.19 + i * 0.015), -0.18, 0.03],
          [side * (0.23 + i * 0.012), -0.4 - i * 0.026, 0.08],
          [side * (0.29 + i * 0.01), -0.35 - i * 0.027, 0.1],
        ],
      })
}

export function mangaShortHair(kit: MangaHairKit, height: number) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2
    const x = Math.cos(angle) * 0.135
    const z = Math.sin(angle) * 0.13
    kit.lock({
      width: 0.032,
      depth: 0.022,
      points: [
        [x, 0.12, z],
        [x * 0.96, height * 0.88, z * 0.95],
        [x * 0.91, height, z * 0.9],
        [x * 0.89, height + 0.035, z * 0.87],
      ],
    })
  }
}

export function mangaHairExtras(kit: MangaHairKit, build: HumanHeadBuild): void {
  const { THREE, parts } = kit
  const makers: Partial<Record<HumanHeadBuild['profile']['hairStyle'], () => void>> = {
    spiked: () => crest(kit, false),
    wild: () => crest(kit, true),
    curly: () => curls(kit, false),
    afro: () => curls(kit, true),
    drills: () => ringlets(kit),
    ponytail: () => tied(kit, { loose: build.profile.likeness === 'machi-komacine', length: 0.52 }),
    'bald-crown': () => baldCrown(kit, build.profile.likeness === 'melody'),
    chonmage: () => topknot(kit),
    swept: () => {
      kit.parts.push(mangaScalpGeometry(kit))
      fringe(kit)
    },
    bun: () => {
      tied(kit, { loose: false, length: 0.04 })
      parts.push(new THREE.SphereGeometry(0.09, 14, 10).translate(0, 0.12, -0.18))
    },
    pompadour: () => {
      crest(kit, false)
      parts.push(new THREE.SphereGeometry(0.13, 16, 12).scale(1, 0.7, 1.1).translate(0, 0.24, 0.05))
    },
  }
  const make = makers[build.profile.hairStyle] ?? (() => legacyMangaHairExtras(kit, build))
  make()
}
