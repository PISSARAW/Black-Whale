import type * as Three from 'three'

/** A small ink imprint belongs to the existing forehead, never a second head mesh. */
export function addOrderStamp(context: {
  THREE: typeof Three
  root: Three.Group
  box: (size: [number, number, number], color: number) => Three.Mesh
}) {
  const head = context.root.getObjectByName('face-mouth')?.parent
  if (!head) return
  const stamp = new context.THREE.Group()
  stamp.name = 'order-stamp-imprint'
  stamp.position.set(0, 0.22, 0.24)
  for (const x of [-0.025, 0.025]) {
    const stroke = context.box([0.012, 0.065, 0.004], 0x201c22)
    stroke.position.x = x
    stamp.add(stroke)
  }
  stamp.visible = false
  head.add(stamp)
}
