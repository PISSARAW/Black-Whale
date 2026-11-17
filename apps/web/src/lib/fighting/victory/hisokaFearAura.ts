import * as THREE from 'three'
import { HISOKA_FEAR_DEATH } from './hisokaFearPanic'
import type { VictoryContext } from './types'
import { disposeVictoryObject, ease } from './resources'

export function createHisokaFearAura() {
  const root = new THREE.Group(),
    pressure = new THREE.Group(),
    gyo = new THREE.Group()
  root.name = 'hisoka-overwhelming-ren-and-victim-gyo'
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, power: { value: 0 } },
    vertexShader: `varying vec3 p; uniform float time; void main(){p=position; vec3 v=position; float wave=sin(position.y*9.+time*2.+position.x*7.); v.xz*=1.+.07*wave; gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
    fragmentShader: `varying vec3 p; uniform float time; uniform float power; void main(){float flow=pow(abs(sin(atan(p.z,p.x)*9.+p.y*3.-time*2.)),9.); vec3 c=mix(vec3(.055,.012,.085),vec3(.39,.05,.31),flow); gl_FragColor=vec4(c,(.09+flow*.3)*power);}`,
  })
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 32), material)
  shell.scale.set(0.78, 1.6, 0.7)
  shell.position.y = 1.15
  pressure.add(shell)
  const rings = Array.from({ length: 4 }, (_, i) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 + i * 0.27, 0.012, 6, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9c518c,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.025 + i * 0.004
    pressure.add(mesh)
    return mesh
  })
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7cfa2,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
  for (const side of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.0012, 8, 32), eyeMaterial)
    ring.position.set(side * 0.067, 0.012, 0.188)
    ring.scale.y = 0.55
    gyo.add(ring)
  }
  root.add(pressure)
  return {
    root,
    sync(context: VictoryContext) {
      const power = ease(context.age / 96) * (1 - ease((context.age - 450) / 84) * 0.55)
      pressure.position.copy(context.hero.root.position)
      material.uniforms.power.value = power
      material.uniforms.time.value = context.comfort.flashes ? context.age / 60 : 0
      rings.forEach((ring, i) =>
        ring.scale.setScalar(1 + power * 0.25 + Math.sin(context.age * 0.025 + i) * 0.025),
      )
      const focus =
        ease((context.age - 120) / 42) * (1 - ease((context.age - HISOKA_FEAR_DEATH) / 12))
      gyo.visible = focus > 0
      gyo.scale.setScalar(Math.max(0.001, focus))
      context.victim.head.add(gyo)
      context.defer(() => gyo.removeFromParent())
      return { renPower: power, gyo: focus }
    },
    dispose() {
      disposeVictoryObject(root)
      disposeVictoryObject(gyo)
    },
  }
}
