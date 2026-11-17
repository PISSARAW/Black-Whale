import {
  AdditiveBlending,
  BoxGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
} from 'three'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import type { FightState } from '../../src/lib/fighting/types'

const fragment = `
varying vec2 vUv;
uniform float u_time;
uniform float u_seed;
uniform float u_smoke;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+4.7;a*=.5;}return v;}
void main(){
 vec2 p=(vUv-.5)*2.;
 float t=max(0.,u_time);
 float n=fbm(p*3.8+vec2(u_seed,-t*1.7));
 float cloud=fbm(p*7.3+vec2(-t*.6,u_seed));
 float radius=length(p*vec2(1.,.92));
 float edge=.67+(n-.5)*.65;
 float alpha=smoothstep(edge+.12,edge-.13,radius)*(.5+cloud*.65);
 float life=mix(max(0.,1.-t/1.7),max(0.,1.-t/4.8),u_smoke);
 float heat=clamp(1.-radius*.8+(n-.5)*.8-t*.28,0.,1.);
 vec3 fire=mix(vec3(.7,.075,.008),vec3(1.,.65,.12),smoothstep(.2,.75,heat));
 fire=mix(fire,vec3(1.,.96,.68),smoothstep(.82,1.,heat));
 vec3 soot=mix(vec3(.075,.065,.075),vec3(.27,.23,.23),cloud);
 gl_FragColor=vec4(mix(fire,soot,u_smoke),alpha*life*mix(.85,.58,u_smoke));
 if(gl_FragColor.a<.01)discard;
}`
const vertex =
  'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
function puff(smoke: boolean, seed: number) {
  return new Mesh(
    new PlaneGeometry(1, 1),
    new ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_seed: { value: seed },
        u_smoke: { value: smoke ? 1 : 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: smoke ? undefined : AdditiveBlending,
    }),
  )
}

/** Turbulent fire, rising soot, ballistic debris and a ground-level pressure wave. */
export function createChrolloSpectacleBlast() {
  const group = new Group()
  group.name = 'chrollo-spectacle-detonation'
  const fire = Array.from({ length: 3 }, (_, i) => puff(false, 3.1 + i * 7.9))
  const smoke = Array.from({ length: 7 }, (_, i) => puff(true, i * 4.39))
  const ring = new Mesh(
    new RingGeometry(0.94, 1, 96),
    new MeshBasicMaterial({
      color: 0xddbd87,
      transparent: true,
      opacity: 0,
      side: DoubleSide,
      depthWrite: false,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -0.96
  group.add(...fire, ...smoke, ring)
  const debris = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: 0x28212a }),
    48,
  )
  const embers = new InstancedMesh(
    new BoxGeometry(0.007, 0.055, 0.007),
    new MeshBasicMaterial({
      color: 0xffb25d,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    80,
  )
  debris.frustumCulled = false
  embers.frustumCulled = false
  group.add(debris, embers)
  const dummy = new Object3D()
  return {
    group,
    sync(state: FightState, age: number) {
      const t = (age - 180) / 60
      group.visible = t >= 0
      group.position.set(fightWorldX(state.player.x), 1, -0.28)
      fire.forEach((part, i) => {
        const life = t - i * 0.055
        part.visible = life >= 0 && life < 1.7
        part.material.uniforms.u_time.value = life
        part.position.set((i - 1) * 0.35, 0.06 + t * (0.32 + i * 0.1), 0.05 + i * 0.015)
        part.rotation.z = i * 1.7
        part.scale.setScalar(0.5 + Math.min(1.2, Math.max(0, life) * 8) * 2.3)
      })
      smoke.forEach((part, i) => {
        const life = t - 0.12 - i * 0.06
        part.visible = life >= 0 && life < 5
        part.material.uniforms.u_time.value = life
        part.position.set(
          Math.sin(i * 2.4) * (0.18 + t * 0.32),
          -0.35 + t * (0.24 + (i % 3) * 0.12),
          -0.16 - i * 0.02,
        )
        part.rotation.z = i * 0.9
        part.scale.setScalar(0.6 + Math.max(0, life) * 0.7)
      })
      ring.scale.setScalar(0.4 + Math.max(0, t) * 5.2)
      ring.material.opacity = Math.max(0, 0.65 - Math.max(0, t) * 0.55)
      for (let i = 0; i < 48; i++) {
        const a = i * 2.39996,
          speed = 1 + (i % 7) * 0.23,
          size = 0.025 + (i % 4) * 0.015
        dummy.position.set(
          Math.cos(a) * t * speed,
          Math.max(-0.95, Math.sin(i * 3.7) * 0.2 + t * (1 + (i % 5) * 0.35) - 1.6 * t * t),
          -0.2 + Math.sin(a) * t * speed * 0.4,
        )
        dummy.rotation.set(t * ((i % 4) + 1), i * 0.7 + t * 2, t * 3)
        dummy.scale.setScalar(t > 4 ? 0 : size)
        dummy.updateMatrix()
        debris.setMatrixAt(i, dummy.matrix)
      }
      for (let i = 0; i < 80; i++) {
        const a = i * 2.39996,
          speed = 0.6 + (i % 9) * 0.13
        dummy.position.set(
          Math.cos(a) * t * speed,
          Math.sin(a) * t * speed + t * 0.55 - t * t * 0.09,
          -0.15 + Math.sin(i * 0.7) * 0.1,
        )
        dummy.rotation.set(0, 0, -a)
        dummy.scale.setScalar(Math.max(0, 1 - t / 7))
        dummy.updateMatrix()
        embers.setMatrixAt(i, dummy.matrix)
      }
      debris.instanceMatrix.needsUpdate = true
      embers.instanceMatrix.needsUpdate = true
    },
  }
}
