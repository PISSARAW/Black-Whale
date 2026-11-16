import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'

type Three = HumanFigureBuild['THREE']
const SHAPES = new WeakMap<Three, ReturnType<typeof shapes>>()
function shapes(THREE: Three) {
  const made = {
    body: new THREE.SphereGeometry(0.13, 10, 8),
    pipe: new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8),
    nozzle: new THREE.BoxGeometry(0.2, 0.08, 0.1),
    eye: new THREE.SphereGeometry(0.027, 7, 5),
  }
  Object.values(made).forEach((shape) => (shape.userData.sharedHuman = true))
  return made
}
export function addBlinky(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  let geometry = SHAPES.get(THREE)
  if (!geometry) {
    geometry = shapes(THREE)
    SHAPES.set(THREE, geometry)
  }
  const vacuum = new THREE.Group()
  vacuum.name = 'shizuku-blinky'
  const body = new THREE.Mesh(geometry.body, glow(0x9663ab, 1))
  body.scale.set(1, 1.5, 1)
  body.position.set(0, 0.12, 0)
  const pipe = new THREE.Mesh(geometry.pipe, glow(0xaeb5bd, 1))
  pipe.position.set(0, -0.25, 0)
  const nozzle = new THREE.Mesh(geometry.nozzle, glow(0x714986, 1))
  nozzle.position.set(0, -0.53, 0.03)
  vacuum.add(body, pipe, nozzle)
  for (const x of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(geometry.eye, glow(0xf6f0df, 1))
    eye.position.set(x, 0.17, 0.115)
    vacuum.add(eye)
  }
  vacuum.position.set(0, -0.02, 0.08)
  model.root.getObjectByName('hand-right')?.add(vacuum)
}
