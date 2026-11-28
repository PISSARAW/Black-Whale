import {
  BackSide,
  Color,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  PointLight,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { Material, Object3D } from 'three'
import { disposeVictoryObject, ease } from './resources'
import { PHINKS_CONTACT, PHINKS_REACTION_SHOT, PHINKS_WINDUP_END } from './phinksTiming'
import type { VictoryContext } from './types'

function overheadShaft(colour: number, opacity: number) {
  return new Mesh(
    new PlaneGeometry(4, 6),
    new ShaderMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: { tint: { value: new Color(colour) }, opacity: { value: opacity } },
      vertexShader: `
      varying vec2 positionInShaft;
      void main() {
        positionInShaft = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec2 positionInShaft;
      uniform vec3 tint;
      uniform float opacity;
      void main() {
        vec2 uv = positionInShaft;
        float spread = mix(0.48, 0.035, uv.y);
        float edge = 1.0 - smoothstep(0.12, 1.0, abs(uv.x - 0.5) / spread);
        float ends = smoothstep(0.0, 0.34, uv.y) * (1.0 - smoothstep(0.85, 1.0, uv.y));
        gl_FragColor = vec4(tint, edge * edge * ends * opacity);
        #include <colorspace_fragment>
      }
    `,
    }),
  )
}

function arenaPracticals() {
  const root = new Group()
  const shell = new PlaneGeometry(0.67, 0.055)
  const sockets = new MeshBasicMaterial({ color: 0x53768d, fog: false, side: DoubleSide })
  const tubes = new MeshBasicMaterial({ color: 0xa1cbd8, fog: false, side: DoubleSide })
  for (const x of [-6, -2.8, 1.1, 4.8, 7.3]) {
    const air = overheadShaft(0x64859f, 0.23)
    air.position.set(x, 2.7, 3.15)
    air.rotation.z = -0.18
    const fixture = new Mesh(shell, sockets)
    fixture.position.set(x + 0.7, 4.7, 3.13)
    const aperture = new Mesh(shell, tubes)
    aperture.position.copy(fixture.position)
    aperture.position.z -= 0.01
    aperture.scale.set(0.75, 0.34, 1)
    root.add(air, fixture, aperture)
  }
  return root
}

export function createPhinksLook() {
  const root = new Group()
  root.name = 'phinks-cinematic-lighting'
  const practicals = arenaPracticals()
  const fill = new HemisphereLight(0x9ab9e6, 0x49435f, 1.04)
  const key = new DirectionalLight(0xffd2a0, 2.35)
  const rim = new DirectionalLight(0x829bdc, 2.1)
  const auraLight = new PointLight(0xffad44, 0, 1.8, 2)
  const mist = new Fog(0x111a2a, 3.9, 13.5)
  const backdrop = new Color(0x080e1c)
  root.add(practicals, fill, key, key.target, rim, rim.target, auraLight)
  const converted = new Map<Material, MeshLambertMaterial>()

  function lightActor(actor: Object3D, context: VictoryContext) {
    actor.traverseVisible((node) => {
      if (!(node instanceof Mesh) || !node.geometry.getAttribute('normal')) return
      const convert = (source: Material) => {
        if (
          !(source instanceof MeshBasicMaterial) ||
          source.side === BackSide ||
          source.transparent ||
          !source.color.getHex()
        )
          return source
        const held = converted.get(source)
        if (held) return held
        const lit = new MeshLambertMaterial({
          color: source.color,
          map: source.map,
          alphaMap: source.alphaMap,
          alphaTest: source.alphaTest,
          vertexColors: source.vertexColors,
          side: source.side,
          depthTest: source.depthTest,
          depthWrite: source.depthWrite,
          polygonOffset: source.polygonOffset,
          polygonOffsetFactor: source.polygonOffsetFactor,
          polygonOffsetUnits: source.polygonOffsetUnits,
          fog: false,
        })
        converted.set(source, lit)
        return lit
      }
      context.material(
        node,
        Array.isArray(node.material) ? node.material.map(convert) : convert(node.material),
      )
    })
  }

  return {
    apply(context: VictoryContext, fist: Vector3, charge: number, ko: boolean) {
      const { age, scene, hero, victim, scenery, state, centre } = context
      const previousFog = scene.fog
      const previousBackground = scene.background
      scene.fog = mist
      scene.background = backdrop
      context.defer(() => {
        scene.fog = previousFog
        scene.background = previousBackground
      })
      if (state.environment.stageId === 'heavens-arena') {
        context.save(scenery)
        scenery.rotation.y += Math.PI
        scenery.updateWorldMatrix(false, true)
      }
      practicals.visible = state.environment.stageId === 'heavens-arena'
      practicals.position.x = centre
      const portrait = ease((age - PHINKS_REACTION_SHOT) / 60)
      key.position.set(centre + 1.4 - 0.7 * portrait, 3.4, -3.2)
      key.target.position.copy(hero.root.position).y += 1.3
      rim.position.set(centre - 2.1, 3.1, 2.85)
      rim.target.position.set(centre + 0.5, 1.05, 0)
      auraLight.position.copy(fist).z -= 0.08
      const release = 1 - ease((age - PHINKS_CONTACT) / 85)
      const focus = Math.max(
        1 - Math.exp(-charge / 4),
        ko ? ease((age - PHINKS_WINDUP_END) / 38) : 0,
      )
      auraLight.intensity = 2.3 * focus * release
      lightActor(hero.root, context)
      lightActor(victim.root, context)
      context.add(root)
    },
    dispose() {
      disposeVictoryObject(root)
      converted.forEach((material) => material.dispose())
      converted.clear()
    },
  }
}
