import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { VictoryContext } from './types'
import { LEORIO_CEILING } from './leorioPose'
import { disposeVictoryObject, ease } from './resources'

/** A temporary ceiling section continues the current arena, with its own disposable damage. */
export function createLeorioRoof() {
  const root = new Group(),
    material = new ShaderMaterial({
      side: DoubleSide,
      uniforms: {
        centre: { value: new Vector3() },
        broken: { value: 0 },
        colour: { value: new Color(0x69635b) },
      },
      vertexShader:
        'varying vec3 pWorld;void main(){pWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(pWorld,1.);}',
      fragmentShader: `varying vec3 pWorld;uniform vec3 centre;uniform float broken;uniform vec3 colour;
    void main(){vec2 d=pWorld.xz-centre.xz;float a=atan(d.y,d.x);float edge=.45+.08*sin(a*9.)+.05*cos(a*17.);
    if(length(d)<edge*broken)discard;
    vec2 grid=abs(fract(pWorld.xz*1.2)-.5);float seam=step(.48,max(grid.x,grid.y));
    gl_FragColor=vec4(colour*(1.-seam*.35),1.);}`,
    })
  const slab = new Mesh(new BoxGeometry(7, 0.18, 3.8), material)
  root.name = 'leorio-ceiling-impact'
  root.add(slab)
  const beamMaterial = new MeshBasicMaterial({ color: 0x393b3f })
  for (const z of [-1.5, 1.5]) {
    const beam = new Mesh(new BoxGeometry(7.2, 0.2, 0.13), beamMaterial)
    beam.position.set(0, 0.12, z)
    root.add(beam)
  }
  const points: Vector3[] = []
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996
    for (let j = 0; j < 5; j++) {
      const r = 0.4 + j * 0.22,
        next = r + 0.22,
        wobble = Math.sin(i * j) * 0.07
      points.push(
        new Vector3(Math.cos(a) * r, -0.095, Math.sin(a) * r),
        new Vector3(Math.cos(a + wobble) * next, -0.095, Math.sin(a + wobble) * next),
      )
    }
  }
  const cracks = new LineSegments(
    new BufferGeometry().setFromPoints(points),
    new LineBasicMaterial({ color: 0x111115 }),
  )
  root.add(cracks)
  const debris = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: 0xaaa394 }),
    90,
  )
  debris.frustumCulled = false
  root.add(debris)
  const dummy = new Object3D()
  return {
    root,
    sync(context: VictoryContext, pose: { origin: Vector3; height: number }) {
      const age = context.age,
        t = Math.max(0, (age - LEORIO_CEILING) / 60)
      root.position.set(pose.origin.x, pose.height + 0.09, 0)
      root.visible = age >= 300
      material.uniforms.centre.value.set(pose.origin.x, pose.height, 0)
      material.uniforms.broken.value = ease((age - LEORIO_CEILING) / 6)
      material.uniforms.colour.value.setHex(
        context.state.environment.stageId === 'whale-hold' ? 0x53616b : 0x69635b,
      )
      cracks.visible = age >= LEORIO_CEILING
      debris.visible = age >= LEORIO_CEILING && age < 560
      for (let i = 0; i < 90; i++) {
        const a = i * 2.39996,
          v = 0.5 + (i % 9) * 0.1
        dummy.position.set(
          Math.cos(a) * (0.3 + t * v),
          -0.12 - t * (0.5 + (i % 3)) - t * t * 1.8,
          Math.sin(a) * (0.3 + t * v),
        )
        dummy.rotation.set(i + t * 3, t * 4, a)
        const size = (0.035 + (i % 5) * 0.018) * Math.max(0, 1 - t / 2.4)
        dummy.scale.set(size * 2, size * 0.5, size)
        dummy.updateMatrix()
        debris.setMatrixAt(i, dummy.matrix)
      }
      debris.instanceMatrix.needsUpdate = true
    },
    dispose() {
      disposeVictoryObject(root)
    },
  }
}
