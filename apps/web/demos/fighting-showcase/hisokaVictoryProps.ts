import { CanvasTexture, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'

export function createVictoryCard() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff5e6'
  ctx.fillRect(0, 0, 512, 768)
  ctx.strokeStyle = '#b99a70'
  ctx.lineWidth = 9
  ctx.strokeRect(24, 24, 464, 720)
  ctx.fillStyle = '#992543'
  ctx.font = 'bold 104px Georgia'
  ctx.fillText('A', 48, 122)
  ctx.fillText('♦', 43, 218)
  ctx.font = '290px Georgia'
  ctx.fillText('♦', 122, 465)
  ctx.save()
  ctx.translate(512, 768)
  ctx.rotate(Math.PI)
  ctx.font = 'bold 104px Georgia'
  ctx.fillText('A', 48, 122)
  ctx.fillText('♦', 43, 218)
  ctx.restore()
  const card = new Mesh(
    new PlaneGeometry(0.125, 0.188),
    new MeshBasicMaterial({ map: new CanvasTexture(canvas), side: DoubleSide }),
  )
  card.name = 'hisoka-victory-ace'
  return card
}
