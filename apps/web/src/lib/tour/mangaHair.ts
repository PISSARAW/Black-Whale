import { mangaFeitanHair } from './mangaFeitanHead'
import { mangaBillFlames, mangaBashoPompadour } from './mangaBodyguardHair'
import { mangaSaiyuCrop } from './mangaSaiyuHead'
import { mangaCluckUpdo } from './mangaCluckHead'
import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mangaGelHair } from './mangaGel'
import { mangaHeillyHair } from './mangaHeillyHair'
import { mangaPadailleHair } from './mangaPadaille'
import { mangaMelodyHair } from './mangaMelody'
import { mangaBiscuitHair } from './mangaBiscuitHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mangaLikeness } from './mangaLikeness'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock, type HairLock } from './kurapikaGeometry'
import {
  mangaBraidedHair,
  mangaLongCurls,
  mangaWingedPart,
  mangaFlameCrest,
} from './mangaUnderworldHair'
import { mangaHairExtras, mangaMessyCrop, mangaRoyalUpdo } from './mangaHairExtras'

export interface MangaHairKit {
  THREE: HumanHeadBuild['THREE']
  parts: BufferGeometry[]
  face?: BufferGeometry
  lock: (lock: HairLock) => void
}

function cap(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
}

function bob(
  kit: MangaHairKit,
  style: 'bob' | 'bowl' | 'hime' | 'curtain' | 'flick' | 'curtain-short',
) {
  cap(kit)
  const ends = { bowl: -0.045, flick: -0.11, hime: -0.39, 'curtain-short': -0.045 }
  const end = ends[style as keyof typeof ends] ?? -0.16
  kit.parts.push(
    new kit.THREE.LatheGeometry(
      [
        new kit.THREE.Vector2(0.165, end),
        new kit.THREE.Vector2(0.188, 0.03),
        new kit.THREE.Vector2(0.17, 0.13),
      ],
      28,
      0.85,
      Math.PI * 2 - 1.7,
    ).scale(1, 1, 0.87),
  )
  for (let i = 0; i < 15; i++) {
    const x = (i - 7) * 0.022
    const centerPart = style.startsWith('curtain')
    const tip = centerPart ? Math.sign(x || 1) * Math.max(0.095, Math.abs(x)) : x
    const bottom = centerPart ? 0.015 : 0.05 + (style === 'bowl' ? 0 : (i % 3) * 0.009)
    kit.lock({
      width: 0.021,
      depth: 0.008,
      points: [
        [x * 0.3, 0.217, 0.03],
        [x * 0.75, 0.16, 0.148],
        [tip * 0.95, 0.1, 0.174],
        [tip, bottom, 0.167],
      ],
    })
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      kit.lock({
        width: 0.024,
        depth: 0.01,
        points: [
          [side * 0.09, 0.2, -i * 0.026],
          [side * 0.18, 0.07, 0.075 - i * 0.047],
          [side * 0.183, -0.06, 0.075 - i * 0.047],
          [
            side * (0.171 + (i % 2) * 0.014 + (style === 'flick' ? 0.04 : 0)),
            end - 0.012 * (i % 3),
            0.075 - i * 0.047,
          ],
        ],
      })
    }
  }
}

function swept(kit: MangaHairKit, quiff: boolean) {
  cap(kit)
  for (let i = 0; i < 17; i++) {
    const x = (i - 8) * 0.02
    kit.lock({
      width: 0.022,
      depth: 0.012,
      points: [
        [x, 0.105, 0.153],
        [x * 0.9, (quiff ? 0.3 : 0.215) - Math.abs(x) * 0.4, 0.13],
        [x * 0.8 - 0.02, (quiff ? 0.37 : 0.245) - Math.abs(x) * 0.55, -0.035],
        [x * 0.7 - 0.035, (quiff ? 0.31 : 0.13) - Math.abs(x) * 0.35 + (i % 3) * 0.012, -0.16],
      ],
    })
  }
}

function short(kit: MangaHairKit, height: number) {
  cap(kit)
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

function long(kit: MangaHairKit, length: number) {
  swept(kit, false)
  kit.parts.push(
    new kit.THREE.LatheGeometry(
      [
        new kit.THREE.Vector2(0.165, -length),
        new kit.THREE.Vector2(0.185, -0.25),
        new kit.THREE.Vector2(0.19, 0.025),
        new kit.THREE.Vector2(0.17, 0.12),
      ],
      28,
      0.93,
      Math.PI * 2 - 1.86,
    ).scale(1, 1, 0.82),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++) {
      const z = 0.07 - i * 0.03
      kit.lock({
        width: 0.025,
        depth: 0.009,
        points: [
          [side * 0.08, 0.2, z],
          [side * 0.18, 0.035, z],
          [side * 0.185, -length * 0.55, z - 0.01],
          [side * (0.16 + i * 0.003), -length - 0.025 * (i % 2), z],
        ],
      })
    }
}

function hairParts(build: HumanHeadBuild, face: BufferGeometry) {
  const { THREE, profile } = build
  const look = mangaLikeness(profile)
  const parts: BufferGeometry[] = []
  const kit: MangaHairKit = {
    THREE,
    parts,
    face: face.clone().scale(0.155 / look.cheek, 1, 1),
    lock: (lock) => parts.push(kurapikaLock(THREE, lock)),
  }
  const style = look.hair === 'curtain' ? 'curtain' : profile.hairStyle
  const variants: Record<string, () => void> = {
    'feitan-crop': () => mangaFeitanHair(kit),
    'bill-flames': () => mangaBillFlames(kit),
    'basho-pompadour': () => mangaBashoPompadour(kit),
    'saiyu-crop': () => mangaSaiyuCrop(kit),
    'cluck-updo': () => mangaCluckUpdo(kit),
    'gel-long': () => mangaGelHair(kit),
    'luini-slick': () => mangaHeillyHair(kit, false),
    'yokotani-bob': () => mangaHeillyHair(kit, true),
    'padaille-crop': () => mangaPadailleHair(kit),
    'melody-long': () => mangaMelodyHair(kit),
    'biscuit-tails': () => mangaBiscuitHair(kit, false),
    'biscuit-braids': () => mangaBiscuitHair(kit, true),
    braided: () => mangaBraidedHair(kit),
    'long-curls': () => mangaLongCurls(kit),
    'winged-part': () => mangaWingedPart(kit),
    'flame-crest': () => mangaFlameCrest(kit),
    'flat-top': () => {
      short(kit, 0.265)
      for (let i = -5; i <= 5; i++)
        kit.lock({
          width: 0.022,
          depth: 0.018,
          points: [
            [i * 0.024, 0.1, 0.12],
            [i * 0.026, 0.19, 0.105],
            [i * 0.025, 0.245, 0.07],
            [i * 0.027, 0.29 + (Math.abs(i) % 2) * 0.018, 0.04],
          ],
        })
    },
    quiff: () => swept(kit, true),
    'flick-bob': () => bob(kit, 'flick'),
    messy: () => mangaMessyCrop(kit),
    'royal-updo': () => mangaRoyalUpdo(kit),
    'side-part': () => bob(kit, 'curtain-short'),
    'tied-part': () => {
      cap(kit)
      for (const side of [-1, 1])
        for (let i = 0; i < 7; i++)
          kit.lock({
            width: 0.023,
            depth: 0.01,
            points: [
              [side * 0.015, 0.21, 0.015 - i * 0.018],
              [side * 0.08, 0.18, 0.14 - i * 0.022],
              [side * 0.145, 0.105, 0.12 - i * 0.022],
              [side * 0.15, 0.035, 0.08 - i * 0.022],
            ],
          })
      for (const side of [-1, 1])
        kit.lock({
          width: 0.038,
          depth: 0.025,
          points: [
            [side * 0.045, 0.11, -0.12],
            [side * 0.04, 0.02, -0.21],
            [side * 0.03, -0.22, -0.22],
            [side * 0.015, -0.43, -0.17],
          ],
        })
    },
    'crew-flat': () => {
      cap(kit)
      kit.parts.push(
        new THREE.CylinderGeometry(0.157, 0.166, 0.105, 28)
          .scale(1, 1, 0.85)
          .translate(0, 0.165, 0),
      )
    },
  }
  const styles: Record<string, () => void> = {
    bob: () => bob(kit, 'bob'),
    hime: () => bob(kit, 'hime'),
    bowl: () => bob(kit, 'bowl'),
    curtain: () => bob(kit, 'curtain'),
    'slicked-back': () => swept(kit, false),
    long: () => long(kit, profile.likeness === 'illumi' ? 0.92 : 0.68),
    military: () => short(kit, 0.185),
    short: () => short(kit, 0.23),
  }
  const make = variants[look.hair] ?? styles[style] ?? (() => mangaHairExtras(kit, build))
  make()
  kit.face!.dispose()
  return mergeHumanDetails(parts)
}

export function addMangaHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, profile, geometry, outlined, materials } = build
  if (profile.hairStyle === 'shaved') return
  const look = mangaLikeness(profile)
  const face = (head.getObjectByName('manga-face')!.children[1] as import('three').Mesh).geometry
  const hair = outlined({
    THREE,
    geometry: geometry(
      THREE,
      `manga:hair:${profile.hairStyle}:${look.hair}:${profile.likeness === 'illumi'}:${profile.likeness === 'melody'}:${look.cheek}:${look.jaw}:${look.chin}`,
      () => hairParts(build, face),
    ),
    material: materials.hairInk,
    ink: materials.ink,
    scale: 1.014,
  })
  hair.scale.x = look.cheek / 0.155
  hair.name = 'manga-layered-hair'
  head.add(hair)
}
