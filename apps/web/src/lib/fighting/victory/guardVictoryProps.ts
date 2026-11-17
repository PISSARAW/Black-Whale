import * as THREE from 'three'
import { disposeVictoryObject } from './resources'

function surface(size: [number, number], background: string) {
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas')
  if (canvas) {
    canvas.width = 1024
    canvas.height = 640
  }
  const ctx = canvas?.getContext('2d'),
    texture = canvas ? new THREE.CanvasTexture(canvas) : null
  if (texture) texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(...size),
    new THREE.MeshBasicMaterial({
      map: texture,
      color: texture ? 0xffffff : 0xcbd8e9,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  )
  let held = ''
  return {
    mesh,
    write(lines: string[], color = '#d8ecff') {
      const key = color + lines.join('\n')
      if (!ctx || !texture || held === key) return
      held = key
      ctx.fillStyle = background
      ctx.fillRect(0, 0, 1024, 640)
      ctx.strokeStyle = color
      ctx.lineWidth = 4
      ctx.strokeRect(18, 18, 988, 604)
      ctx.fillStyle = color
      ctx.font = 'bold 40px monospace'
      lines.forEach((line, i) => ctx.fillText(line, 44, 78 + i * 74, 936))
      texture.needsUpdate = true
    },
  }
}
export function createLonghiVictoryProps() {
  const root = new THREE.Group(),
    sheet = surface([0.66, 0.42], '#e3ebf1')
  root.name = 'longhi-moonlight-voluntary-agreement'
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(0.675, 0.435, 0.008),
    new THREE.MeshBasicMaterial({ color: 0xa4c4ef }),
  )
  border.position.z = -0.007
  root.add(border, sheet.mesh)
  const pen = new THREE.Group()
  pen.name = 'longhi-aura-pen'
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.16, 8),
    new THREE.MeshBasicMaterial({ color: 0x87b3e3 }),
  )
  shaft.position.y = 0.06
  pen.rotation.z = -0.35
  pen.add(shaft)
  return {
    root,
    pen,
    write(age: number, recipient: string) {
      sheet.write(
        [
          'MOONLIGHT ACT',
          'AUCUNE ATTAQUE : 5 SEC',
          'RESPECT : 1 USAGE PRETE',
          'RUPTURE : ZETSU 1 SEMAINE',
          age >= 144
            ? `Longhi  /  ${recipient}`
            : age >= 108
              ? 'Longhi  /  __________'
              : '________  /  __________',
          age >= 144 ? 'ACCORD LIBRE DES DEUX PARTIES' : 'LIRE AVANT DE SIGNER',
        ],
        '#182b49',
      )
    },
    dispose() {
      disposeVictoryObject(root)
      disposeVictoryObject(pen)
    },
  }
}
export function createFurykovVictoryProps() {
  const root = new THREE.Group(),
    lid = new THREE.Group()
  root.name = 'furykov-combo-master-console'
  const shell = new THREE.MeshBasicMaterial({ color: 0x263c50 })
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.3), shell)
  const screen = surface([0.42, 0.255], '#0c1724')
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.29, 0.02), shell)
  lid.position.set(0, 0.015, -0.13)
  back.position.y = 0.145
  screen.mesh.position.set(0, 0.145, 0.011)
  lid.add(back, screen.mesh)
  root.add(base, lid)
  for (let i = 0; i < 4; i++) {
    const row = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.003, 0.012),
      new THREE.MeshBasicMaterial({ color: 0x8094a4 }),
    )
    row.position.set(0, 0.016, -0.075 + i * 0.04)
    root.add(row)
  }
  return {
    root,
    lid,
    write(age: number, preparedLines?: string[]) {
      if (preparedLines) {
        screen.write(preparedLines, '#b6e4d0')
        return
      }
      screen.write(
        age >= 90 && age < 204
          ? [
              'COMBO MASTER',
              '! NEN DISSIMULE',
              'SIGNATURE : ?',
              'AFFECTED USERS : ---',
              'WEAPON / ARMOR / TOOL',
            ]
          : [
              'COMBO MASTER',
              'SELECT',
              'WEAPON / ARMOR / TOOL',
              'DECHIFFRAGE : INACTIF',
              'FABRICATION : INACTIVE',
            ],
        age >= 90 && age < 204 ? '#eda4a1' : '#b6d8ee',
      )
    },
    dispose: () => disposeVictoryObject(root),
  }
}
