import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { mountHisokaGlbEyes } from '../../src/lib/tour/hisokaGlbEyes'

const view = document.getElementById('view')!
const status = document.getElementById('status')!
const WIDTH = 1120
const HEIGHT = 570
const DURATION = 7.2

function bodyOf(root: THREE.Object3D) {
  let body: THREE.SkinnedMesh | undefined
  root.traverse((part) => {
    if ((part as THREE.SkinnedMesh).isSkinnedMesh) body = part as THREE.SkinnedMesh
  })
  if (!body) throw Error('Maillage riggé introuvable.')
  return body
}

function buildScene(actor: THREE.Object3D) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x252738)
  const key = new THREE.DirectionalLight(0xfff5ec, 2.2)
  key.position.set(-2, 3, 4)
  const rim = new THREE.DirectionalLight(0xabaaff, 0.9)
  rim.position.set(2, 2, -4)
  scene.add(actor, key, rim, new THREE.HemisphereLight(0xf0eaff, 0xb08e9d, 1.6))
  return scene
}

const smooth = (x: number, start: number, end: number) => THREE.MathUtils.smoothstep(x, start, end)
function blinkAt(seconds: number, start: number) {
  return smooth(seconds, start, start + 0.07) * (1 - smooth(seconds, start + 0.1, start + 0.23))
}

async function main() {
  const glb = await new GLTFLoader().loadAsync(
    new URL('../../../../Hisoka.glb', import.meta.url).href,
  )
  const hybrid = clone(glb.scene)
  const face = mountHisokaGlbEyes(bodyOf(hybrid))
  const actors = [glb.scene, hybrid]
  const scenes = actors.map(buildScene)
  const heads = actors.map((actor) => {
    const head = bodyOf(actor).skeleton.bones.find((bone) => bone.name.endsWith('Head'))
    if (!head) throw Error('Articulation de la tête introuvable.')
    return { head, rest: head.quaternion.clone() }
  })
  const camera = new THREE.PerspectiveCamera(25, WIDTH / 2 / HEIGHT, 0.01, 10)
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.setSize(WIDTH, HEIGHT)
  renderer.setScissorTest(true)
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT + 50
  const context = canvas.getContext('2d')!
  view.append(canvas)
  status.textContent = ''
  let automatic = true
  const turn = new THREE.Quaternion()
  const angles = new THREE.Euler()

  function render(time: number) {
    const seconds = time % DURATION
    const reveal = smooth(seconds, 2.1, 4.6) * (1 - smooth(seconds, 5.1, 6.95))
    const look =
      0.86 * smooth(seconds, 0.28, 0.64) -
      1.6 * smooth(seconds, 1.65, 2.06) +
      0.74 * smooth(seconds, 4.4, 4.8)
    const blink = Math.max(blinkAt(seconds, 1.04), blinkAt(seconds, 5.2))
    face.setPose({
      blink,
      lookX: look,
      lookY: 0.34 * Math.sin(seconds * 2.1),
      squint: reveal * 0.43,
    })
    turn.setFromEuler(
      angles.set(Math.sin(seconds * 1.55) * 0.037, Math.sin(seconds * 0.8) * 0.12, 0),
    )
    heads.forEach(({ head, rest }) => head.quaternion.copy(rest).multiply(turn))
    const yaw = 0.025 + reveal * 0.64
    const distance = 0.81 + reveal * 0.12
    camera.position.set(Math.sin(yaw) * distance, 1.531, Math.cos(yaw) * distance)
    camera.lookAt(0, 1.521, 0.027)
    scenes.forEach((scene, index) => {
      renderer.setViewport((index * WIDTH) / 2, 0, WIDTH / 2, HEIGHT)
      renderer.setScissor((index * WIDTH) / 2, 0, WIDTH / 2, HEIGHT)
      renderer.render(scene, camera)
    })
    context.drawImage(renderer.domElement, 0, 0)
    context.fillStyle = '#171825'
    context.fillRect(0, HEIGHT, WIDTH, 50)
    context.fillStyle = '#474557'
    context.fillRect(WIDTH / 2 - 1, 0, 2, canvas.height)
    context.fillStyle = '#eee7f4'
    context.font = '600 20px system-ui'
    context.textAlign = 'center'
    context.fillText('HISOKA.GLB ORIGINAL', WIDTH / 4, HEIGHT + 32)
    context.fillText('MÊME GLB · REGARD TYPESCRIPT', WIDTH * 0.75, HEIGHT + 32)
  }
  Object.assign(window, {
    hisokaHybridEyes: {
      capture(time: number, png = false) {
        automatic = false
        render(time)
        return canvas.toDataURL(png ? 'image/png' : 'image/jpeg', 0.89).split(',')[1]
      },
    },
  })
  render(0)
  const start = performance.now()
  renderer.setAnimationLoop(() => {
    if (automatic) render((performance.now() - start) / 1000)
  })
  window.addEventListener(
    'pagehide',
    () => {
      renderer.setAnimationLoop(null)
      face.dispose()
      renderer.dispose()
    },
    { once: true },
  )
}

void main().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error)
  console.error(error)
})
