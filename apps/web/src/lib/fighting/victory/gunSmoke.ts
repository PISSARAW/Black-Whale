import { DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import type { Object3D } from 'three'

function smokeCycle(age: number, elapsed: number, index: number) {
  if (index >= 6) return Math.max(0, elapsed) % 2.1
  if (age < 350) return Math.max(0, elapsed) % 1.4
  return (age - 350) / 60 + (index % 3) * 0.15
}

export function createFranklinSmoke() {
  const root = new Group()
  root.name = 'franklin-gun-smoke'
  const puffs = Array.from(
    { length: 12 },
    (_, seed) =>
      new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          uniforms: { time: { value: 0 }, seed: { value: seed * 4.7 } },
          vertexShader:
            'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader:
            'varying vec2 vUv;uniform float time;uniform float seed;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1)),f.x),f.y);}void main(){vec2 p=(vUv-.5)*2.;float cloud=n(p*5.+vec2(seed,-time*.7))*.7+n(p*11.+seed)*.3;float edge=.65+(cloud-.5)*.45;float a=smoothstep(edge+.2,edge-.12,length(p))*max(0.,1.-time/2.5)*.37;gl_FragColor=vec4(mix(vec3(.14,.12,.13),vec3(.55,.5,.47),cloud),a);}',
        }),
      ),
  )
  root.add(...puffs)
  return {
    root,
    sync(options: { age: number; hands: Object3D[]; victim: Object3D; camera: Object3D }) {
      const { age, hands, victim, camera } = options
      puffs.forEach((puff, i) => {
        const handSmoke = i < 6
        const elapsed = (age - (handSmoke ? 156 : 215)) / 60 - (i % 6) * 0.15
        const cycle = smokeCycle(age, elapsed, i)
        puff.visible = elapsed >= 0 && cycle < 2.5 && (handSmoke || age < 420)
        puff.material.uniforms.time.value = cycle
        const anchor = handSmoke
          ? hands[i % 2].getWorldPosition(new Vector3())
          : victim.position.clone().add(new Vector3(0, 0.6, 0))
        puff.position
          .copy(anchor)
          .add(new Vector3(Math.sin(i * 2.4) * cycle * 0.18, 0.1 + cycle * 0.35, 0.04 + i * 0.004))
        const size = (handSmoke ? 0.12 : 0.55) + cycle * (handSmoke ? 0.32 : 0.6)
        puff.scale.set(size, size * 1.2, 1)
        puff.quaternion.copy(camera.quaternion)
      })
    },
  }
}
