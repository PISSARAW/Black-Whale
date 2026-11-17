import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  IcosahedronGeometry,
} from 'three'
import { ease as solarEase } from './resources'

const noise = `float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){return noise(p)*.6+noise(p*2.1)*.28+noise(p*4.3)*.12;}`
export function createFatalitySun() {
  const root = new Group()
  root.name = 'feitan-cinematic-sun'
  const material = new ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader:
      'varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vP;varying vec3 vN;uniform float time;${noise}void main(){float n=fbm(vP*7.+vec3(0,time*.6,-time*.24));float crack=smoothstep(.3,.65,n);vec3 c=mix(vec3(.09,.005,.002),vec3(1.,.14,.008),crack);c=mix(c,vec3(1.,.78,.19),smoothstep(.58,.76,n));gl_FragColor=vec4(c,1.);}`,
  })
  const ball = new Mesh(new SphereGeometry(1, 64, 40), material)
  const corona = new Group()
  for (let i = 0; i < 5; i++) {
    const ring = new Mesh(
      new TorusGeometry(1.04 + i * 0.013, 0.012 + (i % 3) * 0.008, 5, 100),
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        uniforms: { time: material.uniforms.time, phase: { value: i * 1.7 } },
        vertexShader:
          'varying vec2 vUv;uniform float time;uniform float phase;void main(){vUv=uv;vec3 p=position;p*=1.+.08*sin(uv.x*44.+time*3.+phase);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
        fragmentShader:
          'varying vec2 vUv;uniform float time;uniform float phase;void main(){float a=pow(.5+.5*sin(vUv.x*34.-time*2.+phase),3.);gl_FragColor=vec4(1.,.29,.025,a*.8);}',
      }),
    )
    ring.rotation.set(i * 0.7, i * 1.3, i * 0.4)
    corona.add(ring)
  }
  const sun = new Group()
  sun.add(ball, corona)
  root.add(sun)
  const heat = new Mesh(
    new TorusGeometry(1, 0.022, 6, 128),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { opacity: { value: 1 } },
      vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float opacity;void main(){gl_FragColor=vec4(1.,.35,.04,opacity);}',
    }),
  )
  heat.rotation.x = -Math.PI / 2
  root.add(heat)
  const ashMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader:
      'varying vec3 vC;void main(){vC=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vC;void main(){gl_FragColor=vec4(vC,.86);}',
  })
  const ash = new InstancedMesh(new IcosahedronGeometry(1, 0), ashMaterial, 220)
  for (let i = 0; i < 220; i++) ash.setColorAt(i, new Color(i % 5 === 0 ? '#ff6d12' : '#60534b'))
  root.add(ash)
  return {
    root,
    sync(options: {
      hero: Vector3
      victim: Vector3
      height: number
      age: number
      sunHeight: number
    }) {
      const { hero, victim, height, age, sunHeight } = options
      const t = (age - 210) / 60
      material.uniforms.time.value = Math.max(0, t)
      sun.visible = age >= 195
      const growth = solarEase((age - 195) / 70)
      sun.position.set(hero.x + 0.15, sunHeight, -0.25)
      sun.scale.setScalar(Math.max(0.008, growth * 1.12 * (1 + Math.sin(age * 0.12) * 0.012)))
      corona.rotation.y = t * 0.13
      const wave = Math.max(0, (age - 270) / 60)
      heat.visible = age >= 270 && age < 420
      heat.position.set(hero.x, 0.045, 0)
      heat.scale.setScalar(0.3 + wave * 5)
      heat.material.uniforms.opacity.value = Math.max(0, 1 - wave / 2.5)
      ash.visible = age >= 300
      const elapsed = Math.max(0, (age - 300) / 60)
      for (let i = 0; i < 220; i++) {
        const seed = (i * 0.61803398875) % 1
        const spawn = (i % 33) / 45
        const a = Math.max(0, elapsed - spawn)
        const x = victim.x + Math.sin(i * 11.3) * (0.2 + a * 0.5)
        const y = ((i % 29) / 29) * height + a * (0.3 + seed * 0.9)
        const z = Math.cos(i * 8.1) * (0.17 + a * 0.35)
        const size = elapsed < spawn ? 0 : (0.007 + seed * 0.016) * Math.max(0, 1 - a / 4)
        ash.setMatrixAt(i, new Matrix4().makeScale(size, size * 1.9, size).setPosition(x, y, z))
      }
      ash.instanceMatrix.needsUpdate = true
    },
  }
}

export function solarDissolve(material: import('three').Material) {
  const colour = (material as import('three').MeshBasicMaterial).color ?? new Color('#66535a')
  return new ShaderMaterial({
    uniforms: { progress: { value: 0 }, colour: { value: colour.clone() } },
    vertexShader:
      'varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}',
    fragmentShader: `varying vec3 vWorld;uniform float progress;uniform vec3 colour;${noise}void main(){float n=fbm(vWorld*24.);float cut=progress*1.4-.18; if(n<cut)discard;float edge=1.-smoothstep(cut,cut+.11,n);vec3 charred=mix(colour,vec3(.035,.019,.015),min(1.,progress*3.));gl_FragColor=vec4(mix(charred,vec3(1.,.3,.015),edge),1.);}`,
  })
}
