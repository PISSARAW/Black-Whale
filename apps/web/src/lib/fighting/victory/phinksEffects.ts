import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import { ease } from './resources'
import {
  PHINKS_CONTACT,
  PHINKS_FLOOR_CRACK,
  PHINKS_FRACTURE,
  PHINKS_DISINTEGRATED,
  PHINKS_WIDE_SHOT,
  PHINKS_WINDUP_END,
} from './phinksTiming'
import type { VictoryActor } from './types'

function aura(colour: Vector3, additive: boolean) {
  return new Mesh(
    new SphereGeometry(1, 24, 16),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      ...(additive ? { blending: AdditiveBlending } : {}),
      uniforms: { colour: { value: colour }, power: { value: 0 }, time: { value: 0 } },
      vertexShader:
        'varying vec3 n,v,p;void main(){vec4 q=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-q.xyz);p=position;gl_Position=projectionMatrix*q;}',
      fragmentShader:
        'varying vec3 n,v,p;uniform vec3 colour;uniform float power,time;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),2.4);float ripples=.5+.5*sin(p.y*25.+sin(p.x*8.)-time);gl_FragColor=vec4(colour,(.05+rim*(.64+.23*ripples))*power);}',
    }),
  )
}

function floorLight(colour: Vector3) {
  const light = new Mesh(
    new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { colour: { value: colour }, opacity: { value: 0 } },
      vertexShader:
        'varying vec2 point;void main(){point=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 point;uniform vec3 colour;uniform float opacity;void main(){float rim=1.-smoothstep(.05,1.,length(point));gl_FragColor=vec4(colour,rim*rim*opacity);}',
    }),
  )
  return light
}

function floorFracture() {
  const root = new Group()
  root.name = 'phinks-floor-crack'
  const material = new MeshBasicMaterial({
    color: 0x221c21,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  })
  const strip = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.39996
    const start = new Vector3()
    for (let part = 0; part < 3; part++) {
      const bend = angle + Math.sin(i * 4 + part * 2) * 0.34
      const end = start
        .clone()
        .add(
          new Vector3(Math.cos(bend), 0, Math.sin(bend)).multiplyScalar(
            0.06 + ((i + part) % 4) * 0.045,
          ),
        )
      const line = new Mesh(strip, material)
      line.position.copy(start).lerp(end, 0.5)
      line.rotation.y = -bend
      line.scale.set(start.distanceTo(end) + 0.006, 1, 0.012 - part * 0.003)
      root.add(line)
      start.copy(end)
    }
  }
  return root
}

function windingTrails() {
  const root = new Group()
  root.name = 'phinks-winding-trails'
  const ribbons = [0xcc7b26, 0xffc86d, 0xffefbf].map((color) => {
    const mesh = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({
        color,
        side: DoubleSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    )
    mesh.frustumCulled = false
    root.add(mesh)
    return mesh
  })
  return {
    root,
    sync(points: Vector3[], age: number, focus: number) {
      root.visible = points.length > 1
      if (!root.visible) return
      const tail = 1 - ease((age - PHINKS_WINDUP_END) / 8)
      const view = new Vector3(0.38, 0.08, 1).normalize()
      for (const [layer, ribbon] of ribbons.entries()) {
        if (!ribbon.geometry.getAttribute('position')) {
          const positions = new BufferAttribute(new Float32Array(points.length * 6), 3)
          const indices = points.slice(1).flatMap((_, i) => {
            const j = i * 2
            return [j, j + 2, j + 1, j + 1, j + 2, j + 3]
          })
          ribbon.geometry.setAttribute('position', positions)
          ribbon.geometry.setIndex(indices)
        }
        const positions = ribbon.geometry.getAttribute('position')
        for (const [index, point] of points.entries()) {
          const tangent = points[Math.min(points.length - 1, index + 1)]
            .clone()
            .sub(points[Math.max(0, index - 1)])
          const taper = 1 - index / (points.length - 1)
          const width = (0.049 - layer * 0.015) * (1 - focus * 0.28) * taper
          const cross = tangent.cross(view).normalize().multiplyScalar(width)
          positions.setXYZ(index * 2, point.x + cross.x, point.y + cross.y, point.z + cross.z)
          positions.setXYZ(index * 2 + 1, point.x - cross.x, point.y - cross.y, point.z - cross.z)
        }
        positions.needsUpdate = true
        ribbon.material.opacity = (0.43 + focus * 0.45) * tail
      }
    },
  }
}

function impactPressure() {
  const root = new Group()
  root.name = 'phinks-impact-pressure'
  const arcs = Array.from({ length: 3 }, (_, i) => {
    const arc = new Mesh(
      new TorusGeometry(1, 0.029 - i * 0.006, 5, 30, 2.65),
      new MeshBasicMaterial({
        color: i === 0 ? 0xffd089 : 0xe4b87d,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    )
    arc.rotation.set(0.25, 1.04, 0.5 + i * 2.25)
    root.add(arc)
    return arc
  })
  return {
    root,
    sync(age: number, fist: Vector3, force: number, flashes: boolean) {
      const elapsed = age - PHINKS_CONTACT - 3
      root.visible = flashes && elapsed >= 0 && elapsed < 26
      if (!root.visible) return
      root.position.copy(fist)
      root.position.x += 0.09 + elapsed * 0.019
      for (const [index, arc] of arcs.entries()) {
        const spread = 0.12 + (0.032 + index * 0.009) * elapsed
        arc.scale.set(spread * 0.72, spread * 1.24, spread)
        arc.material.opacity = (0.86 - index * 0.24) * force * (1 - ease(elapsed / 26))
      }
    },
  }
}

function floorBurst(count: number) {
  const root = new Group()
  root.name = 'phinks-floor-debris'
  const debris = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: 0x756452 }),
    count,
  )
  debris.frustumCulled = false
  const dust = floorLight(new Vector3(0.6, 0.48, 0.37))
  dust.position.y = 0.027
  root.add(debris, dust)
  const piece = new Object3D()
  return {
    root,
    sync(age: number, origin: Vector3) {
      const elapsed = (age - PHINKS_FLOOR_CRACK) / 60
      root.visible = elapsed >= 0 && elapsed < 1.25
      if (!root.visible) return
      root.position.set(origin.x, 0, origin.z)
      for (let i = 0; i < count; i++) {
        const angle = i * 2.39996
        const speed = 0.38 + ((i * 7) % 19) / 10
        const height = elapsed * (0.68 + ((i * 5) % 17) / 8) - elapsed * elapsed * 4.6
        const size = (0.022 + (i % 5) * 0.014) * (1 - ease((elapsed - 0.55) / 0.7))
        piece.position.set(
          Math.cos(angle) * (0.09 + elapsed * speed),
          0.034 + Math.max(0, height),
          Math.sin(angle) * (0.09 + elapsed * speed),
        )
        piece.rotation.set(i + elapsed * 7, angle + elapsed * 4, elapsed * 9)
        piece.scale.set(size * 1.5, size * 0.58, size)
        piece.updateMatrix()
        debris.setMatrixAt(i, piece.matrix)
      }
      debris.instanceMatrix.needsUpdate = true
      dust.scale.set(0.5 + elapsed * 3.7, 1, 0.48 + elapsed * 2.5)
      dust.material.uniforms.opacity.value =
        Math.min(1, elapsed * 16) * (1 - ease(elapsed / 1.25)) * 0.55
    },
  }
}

export function createPhinksEffects() {
  const root = new Group()
  root.name = 'phinks-cyclotron-cinematic'
  const fistAura = aura(new Vector3(1, 0.72, 0.28), false)
  const armAura = aura(new Vector3(1, 0.68, 0.21), true)
  const defence = aura(new Vector3(0.59, 0.81, 0.95), false)
  const renAura = aura(new Vector3(0.91, 0.55, 0.22), false)
  const crack = floorFracture()
  const trails = windingTrails()
  const pressure = impactPressure()
  const supportBurst = floorBurst(40)
  const stageLight = floorLight(new Vector3(0.42, 0.33, 0.26))
  const supportShadow = floorLight(new Vector3(0.04, 0.033, 0.036))
  const rivalShadow = floorLight(new Vector3(0.04, 0.033, 0.036))
  fistAura.name = 'phinks-fist-aura'
  defence.name = 'phinks-rival-aura'
  renAura.name = 'phinks-ren'
  root.add(stageLight, supportShadow, rivalShadow, armAura, fistAura, defence, renAura, crack)
  root.add(trails.root, pressure.root, supportBurst.root)
  const vertical = new Vector3(0, 1, 0)
  return {
    root,
    sync(options: {
      age: number
      fist: Vector3
      shoulder: Vector3
      rearFoot: Vector3
      trail: Vector3[]
      hero: VictoryActor
      victim: VictoryActor
      charge: number
      winding: boolean
      ko: boolean
      ken: boolean
      ten: boolean
      ren: boolean
      flashes: boolean
    }) {
      const {
        age,
        fist,
        shoulder,
        rearFoot,
        trail,
        hero,
        victim,
        charge,
        winding,
        ko,
        ken,
        ten,
        ren,
        flashes,
      } = options
      const spent = 1 - ease((age - PHINKS_CONTACT) / (PHINKS_WIDE_SHOT - PHINKS_CONTACT))
      const focus = 1 - Math.exp(-charge / 5)
      const koFocus = ko ? ease((age - PHINKS_WINDUP_END) / 36) : 0
      const auraPower = Math.max(0.98 * koFocus, Math.min(0.94, focus * 1.19)) * spent
      const fall = ease((age - PHINKS_WIDE_SHOT) / 34)
      stageLight.position.set((hero.root.position.x + victim.root.position.x) / 2, 0.021, 0)
      stageLight.scale.set(4.8 + fall * 2, 1, 3.4)
      stageLight.material.uniforms.opacity.value = 0.36 + 0.2 * auraPower
      supportShadow.position.set(rearFoot.x + 0.12, 0.024, rearFoot.z * 0.45)
      supportShadow.scale.set(0.95, 1, 0.61)
      supportShadow.material.uniforms.opacity.value = 0.58
      rivalShadow.position.set(victim.root.position.x + fall * 0.56, 0.024, victim.root.position.z)
      rivalShadow.scale.set(0.92 + fall * 0.93, 1, 0.65)
      const intact = 1 - ease((age - PHINKS_FRACTURE) / (PHINKS_DISINTEGRATED - PHINKS_FRACTURE))
      rivalShadow.material.uniforms.opacity.value =
        (0.52 * intact) / (1 + Math.max(0, victim.root.position.y) * 2.4)

      fistAura.visible = auraPower > 0
      fistAura.position.copy(fist)
      fistAura.scale.setScalar((0.165 - 0.045 * focus - 0.02 * koFocus) * (0.65 + 0.35 * spent))
      fistAura.material.uniforms.power.value = auraPower
      fistAura.material.uniforms.time.value = age * 0.14

      armAura.visible = winding && flashes
      const arm = fist.clone().sub(shoulder)
      armAura.position.copy(shoulder).lerp(fist, 0.55 + 0.3 * focus)
      armAura.quaternion.setFromUnitVectors(vertical, arm.clone().normalize())
      const spread = 0.14 - 0.07 * focus
      armAura.scale.set(spread, arm.length() * (0.65 - 0.32 * focus), spread)
      armAura.material.uniforms.power.value = 0.18 + focus * 0.45
      armAura.material.uniforms.time.value = age * 0.21

      const resisted = ease((age - PHINKS_CONTACT) / 20)
      const defended = 1 - ease((age - PHINKS_CONTACT - (ken ? 18 : 0)) / (ken ? 36 : 17))
      defence.visible = (ken || ten) && defended > 0 && intact > 0
      defence.position.copy(victim.root.localToWorld(new Vector3(0, victim.height * 0.47, 0)))
      defence.quaternion.copy(victim.root.getWorldQuaternion(new Quaternion()))
      defence.scale.set(
        victim.width * ((ken ? 0.66 : 0.52) - 0.11 * resisted),
        victim.height * (ken ? 0.55 : 0.51),
        victim.width * (ken ? 0.64 : 0.51),
      )
      defence.material.uniforms.power.value =
        defended * intact * (ken ? 0.57 + 0.23 * resisted : 0.31)
      defence.material.uniforms.time.value = age * 0.12

      const rise = ease((age - PHINKS_WINDUP_END) / 46)
      const renPower = rise * (1 - ease((age - PHINKS_CONTACT) / 21))
      renAura.visible = ren && renPower > 0
      renAura.position.copy(hero.root.localToWorld(new Vector3(0, hero.height * 0.48, 0)))
      renAura.quaternion.copy(hero.root.getWorldQuaternion(new Quaternion()))
      renAura.scale.set(hero.width * (0.5 + 0.17 * rise), hero.height * 0.55, hero.width * 0.65)
      renAura.material.uniforms.power.value = renPower * 0.46
      renAura.material.uniforms.time.value = age * 0.18

      crack.visible = age >= PHINKS_FLOOR_CRACK
      crack.position.set(rearFoot.x, 0.031, rearFoot.z)
      crack.scale.setScalar(0.43 + 1.55 * ease((age - PHINKS_FLOOR_CRACK) / 13))
      trails.sync(trail, age, focus)
      pressure.sync(age, fist, 0.48 + 0.52 * Math.max(focus, koFocus), flashes)
      supportBurst.sync(age, rearFoot)
    },
  }
}
