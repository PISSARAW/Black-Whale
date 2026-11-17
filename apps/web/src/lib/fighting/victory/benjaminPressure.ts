import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { Material } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'

const noise =
  'float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1)),f.x),f.y),f.z);}'
export function benjaminDisperseMaterial(source: Material) {
  const colour = (source as MeshBasicMaterial).color ?? new Color(0x776e64)
  return new ShaderMaterial({
    side: DoubleSide,
    uniforms: { colour: { value: colour.clone() }, progress: { value: 0 } },
    vertexShader:
      'varying vec3 vW;void main(){vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}',
    fragmentShader: `varying vec3 vW;uniform vec3 colour;uniform float progress;${noise}void main(){float cell=n(vW*29.);float cut=progress*1.35-.15;if(cell<cut)discard;float edge=1.-smoothstep(cut,cut+.08,cell);vec3 c=mix(colour,vec3(.12,.1,.07),progress*.7);gl_FragColor=vec4(mix(c,vec3(1.,.76,.28),edge*.8),1.);}`,
  })
}
function pressureDust(seed: number) {
  return new Mesh(
    new PlaneGeometry(1, 1),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { time: { value: 0 }, seed: { value: seed } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUv;uniform float time;uniform float seed;${noise}void main(){vec2 p=(vUv-.5)*2.;float c=n(vec3(p*5.,seed-time*.2));float a=smoothstep(.95,.2,length(p)+(c-.5)*.4)*max(0.,1.-time/2.3)*.55;gl_FragColor=vec4(mix(vec3(.12,.11,.1),vec3(.55,.47,.32),c),a);}`,
    }),
  )
}
export function createBenjaminPressure() {
  const root = new Group()
  root.name = 'benjamin-air-blow-pressure'
  const core = new Mesh(
    new SphereGeometry(1, 26, 18),
    new MeshBasicMaterial({
      color: 0xffe9b3,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  const rings = Array.from(
    { length: 7 },
    () =>
      new Mesh(
        new RingGeometry(0.88, 1, 64),
        new MeshBasicMaterial({
          color: 0xe9ddbd,
          transparent: true,
          opacity: 0.6,
          blending: AdditiveBlending,
          depthWrite: false,
          side: DoubleSide,
        }),
      ),
  )
  const ground = new Mesh(
    new RingGeometry(0.96, 1, 96),
    new MeshBasicMaterial({
      color: 0xcfc8ab,
      transparent: true,
      opacity: 0.45,
      side: DoubleSide,
      depthWrite: false,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  const scorch = new Mesh(
    new RingGeometry(0.4, 0.65, 48),
    new MeshBasicMaterial({ color: 0x252322, transparent: true, opacity: 0.55, depthWrite: false }),
  )
  scorch.rotation.x = -Math.PI / 2
  const dust = Array.from({ length: 8 }, (_, i) => pressureDust(i * 3.4))
  const shards = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: 0x9c8b64 }),
    180,
  )
  shards.frustumCulled = false
  for (let i = 0; i < 180; i++)
    shards.setColorAt(i, new Color(i % 9 === 0 ? 0xf1d080 : i % 3 === 0 ? 0x27252a : 0x8d8471))
  root.add(core, ...rings, ground, scorch, ...dust, shards)
  const dummy = new Object3D(),
    face = new Vector3(0, 0, 1)
  return {
    root,
    sync(options: { context: VictoryContext; palm: Vector3; target: Vector3 }) {
      const { context, palm, target } = options,
        { age } = context
      const t = (age - 270) / 60,
        direction = target.clone().sub(palm).normalize()
      core.position.copy(palm)
      core.visible = age >= 160 && age < 287
      const charged = ease((age - 160) / 90)
      core.scale.setScalar(age < 270 ? 0.035 + charged * 0.075 : 0.12 + Math.max(0, t) * 2.1)
      core.material.opacity = age < 270 ? charged * 0.4 : Math.max(0, 0.85 - t * 2.6)
      const axis = new Quaternion().setFromUnitVectors(face, direction)
      rings.forEach((ring, i) => {
        const pulse = t - i * 0.027
        ring.visible = pulse >= 0 && pulse < 0.65
        ring.position
          .copy(palm)
          .addScaledVector(direction, 0.12 + Math.max(0, pulse) * (5 + i * 0.3))
        ring.quaternion.copy(axis)
        ring.scale.setScalar(0.1 + Math.max(0, pulse) * (2.8 + i * 0.2))
        ring.material.opacity = Math.max(0, 0.7 - pulse)
      })
      ground.visible = t >= 0 && t < 1.1
      ground.position.set(target.x, 0.03, target.z)
      ground.scale.setScalar(0.2 + Math.max(0, t) * 4)
      ground.material.opacity = Math.max(0, 0.4 - t * 0.36)
      scorch.visible = t >= 0
      scorch.position.set(target.x, 0.024, target.z)
      scorch.scale.setScalar(ease(t * 3))
      dust.forEach((cloud, i) => {
        const elapsed = t - 0.08 - i * 0.035
        cloud.visible = elapsed >= 0 && elapsed < 2.3
        cloud.material.uniforms.time.value = Math.max(0, elapsed)
        cloud.position.set(
          target.x + Math.max(0, elapsed) * (0.45 + i * 0.1),
          0.2 + Math.max(0, elapsed) * 0.3,
          Math.sin(i * 2.4) * Math.max(0, elapsed) * 0.55,
        )
        cloud.quaternion.copy(context.camera.quaternion)
        cloud.scale.setScalar(0.55 + Math.max(0, elapsed) * 1.5)
      })
      const flight = Math.max(0, t - 0.22)
      shards.visible = age >= 283 && age < 420
      for (let i = 0; i < 180; i++) {
        const seed = (i * 0.61803398875) % 1,
          angle = i * 2.39996
        const size = (0.009 + seed * 0.026) * Math.max(0, 1 - flight / 1.9)
        dummy.position.set(
          target.x + Math.sin(angle) * 0.14 + flight * (1.1 + seed * 2),
          Math.max(
            0.025,
            ((i % 31) / 31) * context.victim.height +
              Math.cos(angle) * flight * 0.8 -
              flight * flight * 1.6,
          ),
          target.z + Math.cos(i * 3.2) * (0.1 + flight * 0.7),
        )
        dummy.rotation.set(i + flight * 5, i * 0.7 + flight * 4, flight * 6)
        dummy.scale.set(size, size * 1.5, size)
        dummy.updateMatrix()
        shards.setMatrixAt(i, dummy.matrix)
      }
      shards.instanceMatrix.needsUpdate = true
    },
  }
}
