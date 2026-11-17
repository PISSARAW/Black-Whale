import {
  BoxGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three'

export function createFatalityDust() {
  const root = new Group()
  root.name = 'kurapika-fatality-floor-impact'
  const dust = new Mesh(
    new PlaneGeometry(4, 2),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { u_age: { value: 0 } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUv;uniform float u_age;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 p=(vUv-.5)*2.;float n=h(floor(p*22.));float a=smoothstep(1.,.1,length(p*vec2(1.,1.5)))*(.45+n*.2)*max(0.,1.-u_age/1.1);gl_FragColor=vec4(.29,.26,.25,a);}`,
    }),
  )
  dust.position.y = 0.28
  const pieces = new InstancedMesh(
    new BoxGeometry(0.035, 0.04, 0.055),
    new MeshBasicMaterial({ color: 0x8b7770 }),
    32,
  )
  pieces.frustumCulled = false
  const points: Vector3[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5
    let previous = new Vector3(0, 0.02, 0)
    for (let j = 1; j <= 4; j++) {
      const p = new Vector3(
        Math.cos(a + Math.sin(i + j) * 0.1) * j * 0.23,
        0.02,
        Math.sin(a) * j * 0.14,
      )
      points.push(previous, p)
      previous = p
    }
  }
  const cracks = new LineSegments(
    new BufferGeometry().setFromPoints(points),
    new LineBasicMaterial({ color: 0xc0a7a0, transparent: true, opacity: 0.42 }),
  )
  root.add(dust, pieces, cracks)
  const dummy = new Object3D()
  return {
    root,
    sync(victim: Object3D, age: number) {
      const t = (age - 330) / 60
      root.visible = t >= 0 && t < 1.5
      root.position.set(victim.position.x + 0.6, 0.015, victim.position.z)
      dust.material.uniforms.u_age.value = Math.max(0, t)
      dust.scale.setScalar(0.4 + Math.max(0, t) * 1.5)
      cracks.scale.setScalar(Math.min(1, Math.max(0, t) * 12))
      cracks.material.opacity = Math.max(0, 0.5 - t * 0.25)
      for (let i = 0; i < 32; i++) {
        const a = i * 2.39996,
          v = 0.3 + (i % 7) * 0.12
        dummy.position.set(
          Math.cos(a) * t * v,
          Math.max(0, t * (0.3 + (i % 4) * 0.2) - t * t * 1.2),
          Math.sin(a) * t * v,
        )
        dummy.rotation.set(i + t * 2, i * 0.7 + t * 4, t * 3)
        dummy.scale.setScalar(Math.max(0, 1 - t))
        dummy.updateMatrix()
        pieces.setMatrixAt(i, dummy.matrix)
      }
      pieces.instanceMatrix.needsUpdate = true
    },
  }
}
