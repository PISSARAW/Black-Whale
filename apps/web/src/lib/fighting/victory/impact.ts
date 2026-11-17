import {
  AdditiveBlending,
  BufferGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'

const grain = `float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}`
function dust(seed: number) {
  return new Mesh(
    new PlaneGeometry(1, 1),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { time: { value: 0 }, seed: { value: seed } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUv;uniform float time;uniform float seed;${grain}void main(){vec2 p=(vUv-.5)*2.;float n=noise(p*6.+vec2(seed,-time*.8))*.7+noise(p*13.+seed)*.3;float edge=.7+(n-.5)*.4;float a=smoothstep(edge+.2,edge-.2,length(p))*max(0.,1.-time/3.2)*.65;gl_FragColor=vec4(mix(vec3(.18,.14,.13),vec3(.48,.38,.29),n),a);}`,
    }),
  )
}
export function createCinematicImpact() {
  const root = new Group(),
    charge = new Group()
  root.name = 'cinematic-impact-effects'
  const energy = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { time: { value: 0 }, intensity: { value: 0 } },
    vertexShader:
      'varying vec3 vNormal;varying vec3 vView;varying vec3 vP;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);vP=position;gl_Position=projectionMatrix*p;}',
    fragmentShader:
      'varying vec3 vNormal;varying vec3 vView;varying vec3 vP;uniform float time;uniform float intensity;void main(){float rim=pow(1.-abs(dot(vNormal,vView)),2.);float n=.5+.5*sin(vP.y*38.+time*9.+sin(vP.x*31.));gl_FragColor=vec4(mix(vec3(1.,.12,.025),vec3(1.,.9,.58),rim),(.12+rim*.65+n*.12)*intensity);}',
  })
  charge.add(new Mesh(new SphereGeometry(1, 32, 24), energy))
  const bolts = new LineSegments(
    new BufferGeometry().setFromPoints(Array.from({ length: 80 }, () => new Vector3())),
    new LineBasicMaterial({ color: 0xffd8a5, transparent: true, opacity: 0.9 }),
  )
  charge.add(bolts)
  root.add(charge)
  const rings = Array.from({ length: 3 }, () => {
    const ring = new Mesh(
      new RingGeometry(0.95, 1, 100),
      new MeshBasicMaterial({
        color: 0xffd6a0,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    )
    root.add(ring)
    return ring
  })
  rings[0].rotation.x = -Math.PI / 2
  rings[2].rotation.y = Math.PI / 2
  const clouds = Array.from({ length: 9 }, (_, i) => dust(i * 7.3))
  root.add(...clouds)
  const sparks = new InstancedMesh(
    new SphereGeometry(0.012, 4, 3),
    new MeshBasicMaterial({ color: 0xffc57c }),
    90,
  )
  root.add(sparks)
  const dummy = new Object3D()
  return {
    root,
    sync(options: { age: number; fist: Vector3; camera: Object3D; target: Vector3 }) {
      const { age, fist, camera, target } = options,
        t = Math.max(0, (age - 240) / 60)
      const power = Math.max(0, Math.min(1, (age - 55) / 150))
      charge.visible = age >= 55 && age < 254
      charge.position.copy(fist)
      charge.scale.setScalar(0.13 + power * 0.13 + Math.sin(age * 0.67) * 0.008)
      energy.uniforms.time.value = age / 60
      energy.uniforms.intensity.value = power
      const positions = bolts.geometry.getAttribute('position')
      for (let i = 0; i < 80; i++) {
        const segment = Math.floor(i / 8),
          point = Math.floor(((i % 8) + 1) / 2),
          radius = 0.9 + point * 0.28
        const a = segment * 2.39996 + Math.floor(age / 3) * 0.37 + point * 0.17
        positions.setXYZ(
          i,
          Math.cos(a) * radius,
          Math.sin(a) * radius,
          Math.sin(segment * 3.1) * 0.7,
        )
      }
      positions.needsUpdate = true
      rings.forEach((ring, i) => {
        ring.visible = age >= 240 && t < 0.7 + i * 0.1
        ring.position.set(target.x, i === 0 ? 0.04 : target.y, target.z)
        ring.scale.setScalar(0.1 + t * (10 + i * 2))
        ring.material.opacity = Math.max(0, 0.95 - t * 1.3)
      })
      clouds.forEach((part, i) => {
        const secondary = i >= 6,
          elapsed = (age - (secondary ? 333 : 245)) / 60 - (i % 6) * 0.045
        part.visible = elapsed >= 0 && elapsed < 3.2 && age < 420
        part.material.uniforms.time.value = Math.max(0, elapsed)
        part.position.set(
          target.x + (secondary ? 2.9 : 0) + Math.sin(i * 2.1) * (0.2 + Math.max(0, elapsed) * 0.7),
          0.25 + Math.max(0, elapsed) * (0.25 + (i % 3) * 0.09),
          target.z + 0.1 + i * 0.018,
        )
        part.scale.set(0.7 + Math.max(0, elapsed) * 2.8, 0.6 + Math.max(0, elapsed) * 1.4, 1)
        part.quaternion.copy(camera.quaternion)
      })
      sparks.visible = age >= 240 && age < 360
      for (let i = 0; i < 90; i++) {
        const a = i * 2.39996,
          speed = 1.4 + (i % 8) * 0.32
        dummy.position.set(
          target.x + Math.cos(a) * t * speed,
          target.y + Math.sin(a) * t * speed - t * t,
          target.z + Math.sin(i * 8) * t,
        )
        dummy.scale.setScalar(Math.max(0, 1 - t / 1.8))
        dummy.updateMatrix()
        sparks.setMatrixAt(i, dummy.matrix)
      }
      sparks.instanceMatrix.needsUpdate = true
    },
  }
}
