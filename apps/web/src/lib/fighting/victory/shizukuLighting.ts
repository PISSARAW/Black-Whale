import { Color, Fog, Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import type { Material, Object3D } from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'

const night = new Color(0x101724)
const stageTint = new Color(0x91a7c2)

function lightActor(source: MeshBasicMaterial) {
  const material = source.clone()
  material.onBeforeCompile = function (shader, renderer) {
    source.onBeforeCompile.call(this, shader, renderer)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 shizukuNormal;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nshizukuNormal = normalize(mat3(modelMatrix) * normal);',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 shizukuNormal;')
      .replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        vec3 filmNormal = normalize(shizukuNormal) * (gl_FrontFacing ? 1.0 : -1.0);
        float key = smoothstep(-0.28, 0.78, dot(filmNormal, normalize(vec3(-0.55, 0.62, 0.61))));
        float edge = pow(max(dot(filmNormal, normalize(vec3(0.70, 0.18, -0.69))), 0.0), 2.4);
        diffuseColor.rgb *= mix(vec3(0.38, 0.48, 0.67), vec3(1.30, 1.11, 0.94), key);
        diffuseColor.rgb += edge * vec3(0.096, 0.052, 0.020);
      `,
      )
  }
  material.customProgramCacheKey = () => `shizuku-key-light:${source.customProgramCacheKey()}`
  return material
}

function createFloorPool() {
  const light = new Mesh(
    new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      vertexShader: `
        varying vec2 groundUV;
        void main() {
          groundUV = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 groundUV;
        void main() {
          float field = 1.0 - smoothstep(0.05, 1.0, length(groundUV));
          vec3 tinted = mix(vec3(0.22, 0.35, 0.46), vec3(0.50, 0.33, 0.20),
                            smoothstep(-0.25, 0.75, groundUV.y));
          gl_FragColor = vec4(tinted, field * field * 0.42);
        }
      `,
    }),
  )
  light.name = 'shizuku-floor-light'
  light.scale.set(7.8, 1, 4.9)
  return light
}

export function createShizukuLighting() {
  const actor = new Map<MeshBasicMaterial, MeshBasicMaterial>()
  const scenery = new Map<MeshBasicMaterial, MeshBasicMaterial>()
  const lightCentre = new Vector3()
  const fog = new Fog(night, 0, 1)
  const pool = createFloorPool()

  function grade(context: VictoryContext, root: Object3D, bank: typeof actor) {
    const materialFor = (source: MeshBasicMaterial) => {
      let material = bank.get(source)
      if (!material) {
        material = bank === actor ? lightActor(source) : source.clone()
        bank.set(source, material)
      }
      material.color.copy(source.color)
      if (bank === scenery) material.color.multiply(stageTint).multiplyScalar(0.46)
      return material
    }
    root.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const mapped = (source: Material) =>
        source instanceof MeshBasicMaterial ? materialFor(source) : source
      context.material(
        node,
        Array.isArray(node.material) ? node.material.map(mapped) : mapped(node.material),
      )
    })
  }

  return {
    apply(context: VictoryContext, options: { focus: Vector3; blinky: Object3D }) {
      const { scene, camera, centre } = context
      const { background, fog: originalFog } = scene
      scene.background = night
      scene.fog = fog
      lightCentre.set(centre + 0.5, 0.9, 0)
      const distance = Math.max(
        camera.position.distanceTo(options.focus),
        camera.position.distanceTo(lightCentre),
      )
      fog.near = Math.max(0.6, distance - 0.2)
      fog.far = fog.near + 4.7
      pool.position.set(centre + 0.48, 0.007, 0.1)
      context.add(pool)
      grade(context, context.scenery, scenery)
      for (const subject of [context.hero.root, context.victim.root, options.blinky])
        grade(context, subject, actor)
      context.defer(() => {
        scene.background = background
        scene.fog = originalFog
      })
    },
    dispose() {
      actor.forEach((item) => item.dispose())
      scenery.forEach((item) => item.dispose())
      actor.clear()
      scenery.clear()
      disposeVictoryObject(pool)
    },
  }
}
