/** The explicitly fictional participant's printed portrait remains an ordinary paper image. */
export function paintFortunePortrait(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#ddd6c5'
  context.fillRect(58, 105, 140, 180)
  context.fillStyle = '#39434b'
  context.fillRect(86, 210, 84, 72)
  context.fillStyle = '#d5ae8d'
  context.beginPath()
  context.ellipse(128, 168, 29, 39, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#453d36'
  context.beginPath()
  context.ellipse(128, 137, 30, 17, 0, Math.PI, Math.PI * 2)
  context.fill()
  context.fillStyle = '#29262b'
  context.fillRect(114, 166, 5, 3)
  context.fillRect(139, 166, 5, 3)
  context.fillRect(121, 189, 14, 2)
}
