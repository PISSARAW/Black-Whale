import { CanvasTexture, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import type { Object3D } from 'three'

function pageTexture(cover: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 768
  const c = canvas.getContext('2d')!
  c.fillStyle = cover ? '#493760' : '#eee6d4'
  c.fillRect(0, 0, 512, 768)
  c.strokeStyle = cover ? '#b29971' : '#332936'
  c.lineWidth = 4
  c.strokeRect(22, 22, 468, 724)
  c.fillStyle = cover ? '#e6d9b6' : '#29232c'
  c.textAlign = 'center'
  c.font = 'bold 33px Georgia'
  c.fillText(cover ? 'BANDIT’S SECRET' : 'SUN AND MOON', 256, 75)
  if (cover) {
    c.beginPath()
    c.ellipse(256, 420, 70, 95, 0, 0, Math.PI * 2)
    c.fill()
    for (let i = 0; i < 5; i++) {
      c.lineWidth = 23
      c.lineCap = 'round'
      c.strokeStyle = '#e6d9b6'
      c.beginPath()
      c.moveTo(198 + i * 29, 380)
      c.lineTo(192 + i * 32, 255 - Math.sin((i / 4) * Math.PI) * 35)
      c.stroke()
    }
  } else {
    c.beginPath()
    c.arc(180, 205, 44, 0, Math.PI * 2)
    c.stroke()
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      c.beginPath()
      c.moveTo(180 + Math.cos(a) * 55, 205 + Math.sin(a) * 55)
      c.lineTo(180 + Math.cos(a) * 74, 205 + Math.sin(a) * 74)
      c.stroke()
    }
    c.beginPath()
    c.arc(340, 205, 53, -Math.PI / 2, Math.PI / 2)
    c.quadraticCurveTo(285, 205, 340, 152)
    c.fill()
    c.lineWidth = 2
    for (let i = 0; i < 14; i++) {
      const y = 335 + i * 24
      c.beginPath()
      c.moveTo(65, y)
      c.lineTo(447 - (i % 4) * 25, y)
      c.stroke()
    }
  }
  const texture = new CanvasTexture(canvas)
  if (cover) {
    texture.center.set(0.5, 0.5)
    texture.rotation = Math.PI
  }
  return texture
}

let materials: { page: MeshBasicMaterial; cover: MeshBasicMaterial } | undefined
const books = new WeakMap<Object3D, ReturnType<typeof build>>()
function build(book: Object3D) {
  materials ??= {
    page: new MeshBasicMaterial({ map: pageTexture(false), side: DoubleSide }),
    cover: new MeshBasicMaterial({ map: pageTexture(true), side: DoubleSide }),
  }
  const additions: Array<{ parent: Object3D; node: Mesh }> = []
  for (const side of [-1, 1]) {
    const leaf = book.getObjectByName(`book-leaf:${side}:combat-joint`)!
    for (const cover of [false, true]) {
      const panel = new Mesh(
        new PlaneGeometry(0.91, 1.25),
        cover ? materials.cover : materials.page,
      )
      panel.rotation.x = cover ? Math.PI / 2 : -Math.PI / 2
      panel.position.set(side * 0.5, cover ? -0.019 : 0.016, 0)
      additions.push({ parent: leaf, node: panel })
    }
  }
  const flutter = Array.from({ length: 3 }, (_, i) => {
    const sheet = new Mesh(new PlaneGeometry(0.86, 1.2), materials!.page)
    sheet.geometry.translate(0.43, 0, 0)
    sheet.rotation.x = -Math.PI / 2
    sheet.position.y = 0.023 + i * 0.006
    return sheet
  })
  return { additions, flutter }
}

export function enhanceChrolloBook(book: Object3D, age: number) {
  const props = books.get(book) ?? build(book)
  books.set(book, props)
  props.additions.forEach(({ parent, node }) => parent.add(node))
  const body = book.getObjectByName('book-leaf:1:combat-joint')!.parent!
  const fluttering = age >= 75 && age < 148
  props.flutter.forEach((sheet, i) => {
    sheet.rotation.z = -0.18 - Math.sin(((age - 75) / 73) * Math.PI) * (0.3 + i * 0.18)
    sheet.position.z = Math.sin(age * 0.1 + i) * 0.012
    if (fluttering) body.add(sheet)
  })
  const ribbons: Array<() => void> = []
  book.traverse((node) => {
    if (node.name !== 'chrollo-bookmark') return
    const q = node.quaternion.clone()
    const wind =
      age >= 180
        ? Math.exp(-(age - 180) / 120) * Math.sin(age * 0.31) * 0.24
        : Math.sin(age * 0.08) * 0.035
    node.rotation.x += wind
    ribbons.push(() => node.quaternion.copy(q))
  })
  book.updateWorldMatrix(true, true)
  return () => {
    ribbons.forEach((restore) => restore())
    props.additions.forEach(({ parent, node }) => parent.remove(node))
    props.flutter.forEach((sheet) => body.remove(sheet))
  }
}
