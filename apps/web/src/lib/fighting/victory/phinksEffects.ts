import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { Material, Quaternion } from 'three'

export function fractureMaterial(original: Material) {
  return new ShaderMaterial({
    uniforms: {
      age: { value: 0 },
      colour: { value: (original as MeshBasicMaterial).color?.clone() ?? new Color('#655959') },
    },
    vertexShader:
      'varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}',
    fragmentShader:
      'varying vec3 vWorld;uniform float age;uniform vec3 colour;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}void main(){vec3 cell=floor(vWorld*17.);float n=hash(cell);float p=clamp((age-278.)/55.,0.,1.);if(n<p)discard;vec3 f=fract(vWorld*17.);float edge=1.-smoothstep(.025,.09,min(f.x,min(f.y,f.z)));float flash=max(0.,1.-(age-270.)/12.);vec3 c=mix(colour,vec3(.95,.89,.68),edge*.7+flash*.8);gl_FragColor=vec4(c,1.);}',
  })
}
export function createPhinksEffects() {
  const root = new Group(),
    trails = new Group()
  root.name = 'phinks-cyclotron-cinematic'
  const ribbons = Array.from({ length: 3 }, (_, i) => {
    const geometry = new BufferGeometry().setFromPoints(
      Array.from({ length: 140 }, () => new Vector3()),
    )
    geometry.setIndex(
      Array.from({ length: 69 }, (_, j) => [
        j * 2,
        j * 2 + 1,
        j * 2 + 2,
        j * 2 + 1,
        j * 2 + 3,
        j * 2 + 2,
      ]).flat(),
    )
    const line = new Mesh(
      geometry,
      new MeshBasicMaterial({
        side: DoubleSide,
        color: i === 0 ? 0xffe6b0 : 0xd7b94a,
        transparent: true,
        opacity: 0.6 - i * 0.14,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    )
    trails.add(line)
    return line
  })
  root.add(trails)
  const glow = new Mesh(
    new SphereGeometry(1, 28, 18),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { power: { value: 0 }, age: { value: 0 } },
      vertexShader:
        'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);vP=position;gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float power;uniform float age;void main(){float rim=pow(1.-abs(dot(vN,vV)),2.);float bands=pow(.5+.5*sin(vP.y*35.+age*.7),6.);gl_FragColor=vec4(1.,.72+rim*.2,.18+rim*.4,(.08+rim*.7+bands*.13)*power);}',
    }),
  )
  root.add(glow)
  const fragments = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: 0xb6a895 }),
    210,
  )
  fragments.frustumCulled = false
  for (let i = 0; i < 210; i++)
    fragments.setColorAt(
      i,
      new Color(
        i % 11 === 0 ? 0xffd475 : i % 7 === 0 ? 0xe6c783 : i % 3 === 0 ? 0xe2dbce : 0x30323b,
      ),
    )
  root.add(fragments)
  const dummy = new Object3D()
  return {
    root,
    sync(options: {
      age: number
      fist: Vector3
      shoulder: Vector3
      rotation: Quaternion
      turns: number
      target: Vector3
      height: number
    }) {
      const { age, fist, shoulder, rotation, turns, target, height } = options
      trails.visible = age >= 36 && age < 246
      ribbons.forEach((ribbon, index) => {
        const array = ribbon.geometry.getAttribute('position')
        for (let i = 0; i < 70; i++) {
          const angle = -turns * Math.PI * 2 + ((69 - i) / 69) * (2.1 + index * 0.55)
          for (let edge = 0; edge < 2; edge++) {
            const radius = 0.5 + index * 0.025 + (edge ? 1 : -1) * 0.006
            const p = new Vector3(
              0.005 + index * 0.01,
              -Math.cos(angle) * radius,
              -Math.sin(angle) * radius,
            )
              .applyQuaternion(rotation)
              .add(shoulder)
            array.setXYZ(i * 2 + edge, p.x, p.y, p.z)
          }
        }
        array.needsUpdate = true
        ribbon.material.opacity = Math.min(1, (age - 36) / 40) * (0.7 - index * 0.17)
      })
      glow.visible = age >= 60 && age < 285
      glow.position.copy(fist)
      glow.scale.setScalar(0.075 + turns * 0.012 + Math.sin(age * 0.43) * 0.003)
      glow.material.uniforms.power.value = Math.min(1, turns / 4)
      glow.material.uniforms.age.value = age
      fragments.visible = age >= 282 && age < 420
      const t = Math.max(0, (age - 282) / 60)
      for (let i = 0; i < 210; i++) {
        const seed = (i * 0.61803398875) % 1,
          a = i * 2.39996
        const y = ((i % 37) / 37) * height
        const velocity = 1.1 + seed * 2.9
        dummy.position.set(
          target.x + Math.sin(a) * 0.13 + t * velocity,
          Math.max(0.025, y + Math.cos(a) * t * 1.4 - t * t * 1.7),
          Math.cos(i * 3.8) * (0.1 + t * (0.35 + seed)),
        )
        dummy.rotation.set(i + t * 4, t * 6, i * 0.7 + t * 3)
        const size = (0.014 + seed * 0.032) * Math.max(0, 1 - t / 2.3)
        dummy.scale.set(size, size * 1.8, size)
        dummy.updateMatrix()
        fragments.setMatrixAt(i, dummy.matrix)
      }
      fragments.instanceMatrix.needsUpdate = true
    },
  }
}
