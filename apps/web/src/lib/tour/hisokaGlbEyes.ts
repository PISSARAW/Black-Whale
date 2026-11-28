import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  SRGBColorSpace,
  Vector4,
  type MeshStandardMaterial,
  type SkinnedMesh,
} from 'three'

export interface HisokaGlbEyePose {
  blink?: number
  lookX?: number
  lookY?: number
  squint?: number
}

// Coordinates on the bind-pose mesh of Hisoka.glb, in metres.
const PATCH = { x: -0.065, y: 1.541, width: 0.13, height: 0.033 }
const EYE = { x: 0.037, y: 1.556 }
const POWER = 3900
const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value))

function skinPatch(context: CanvasRenderingContext2D) {
  context.save()
  context.translate(0, 0.0012)
  context.scale(0.027, 0.0142)
  const gradient = context.createRadialGradient(0, 0, 0.74, 0, 0, 1)
  gradient.addColorStop(0, '#fdeded')
  gradient.addColorStop(1, '#fdeded00')
  context.fillStyle = gradient
  context.beginPath()
  context.arc(0, 0, 1, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function upperLid(context: CanvasRenderingContext2D, openness: number) {
  context.moveTo(-0.0195, -0.0014)
  context.bezierCurveTo(
    -0.013,
    -0.003 + 0.009 * openness,
    0.007,
    -0.004 + 0.011 * openness,
    0.021,
    0.002,
  )
}

function paintEye(
  context: CanvasRenderingContext2D,
  side: number,
  pose: Required<HisokaGlbEyePose>,
) {
  context.save()
  context.translate(side * EYE.x, EYE.y)
  context.scale(side, 1)
  skinPatch(context)
  const open = (1 - pose.blink) * (1 - 0.4 * pose.squint)
  const ink = '#483341'
  if (open > 0.01) {
    context.save()
    context.globalAlpha = clamp(open * 6)
    context.beginPath()
    upperLid(context, open)
    context.bezierCurveTo(
      0.01,
      -0.004 - 0.005 * open,
      -0.011,
      -0.003 - 0.005 * open,
      -0.0195,
      -0.0014,
    )
    const white = context.createLinearGradient(0, -0.007, 0, 0.007)
    white.addColorStop(0, '#f8efef')
    white.addColorStop(1, '#cbbbc6')
    context.fillStyle = white
    context.fill()
    context.strokeStyle = '#846675'
    context.lineWidth = 0.0007
    context.stroke()
    context.clip()
    const x = 0.001 + side * pose.lookX * 0.0064
    const y = -0.001 + pose.lookY * 0.0034
    const iris = context.createRadialGradient(x, y, 0.001, x, y, 0.0057)
    iris.addColorStop(0, '#38242d')
    iris.addColorStop(0.42, '#7b483d')
    iris.addColorStop(0.74, '#c08b52')
    iris.addColorStop(1, '#513040')
    context.fillStyle = iris
    context.beginPath()
    context.ellipse(x, y, 0.0056, 0.0066, 0, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#241d2a'
    context.beginPath()
    context.arc(x, y, 0.0023, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#fff5f0'
    context.beginPath()
    context.arc(x - side * 0.0017, y + 0.0018, 0.00105, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
  context.save()
  context.translate(0, 0.0023)
  context.scale(0.94, 1)
  context.beginPath()
  upperLid(context, 0.55 + open * 0.35)
  context.strokeStyle = '#875f7444'
  context.lineWidth = 0.0007
  context.stroke()
  context.restore()
  context.beginPath()
  upperLid(context, open)
  context.strokeStyle = ink
  context.lineWidth = 0.00135
  context.lineCap = 'round'
  context.stroke()
  context.restore()
}

/**
 * Repaint the eye area in bind-space on the original skinned surface.
 * The animated canvas contributes eyelids and iris motion. The depth gate leaves
 * the fringe in front, and the surrounding GLB material and bone weights stay in use.
 */
export function mountHisokaGlbEyes(mesh: SkinnedMesh) {
  const original = mesh.material as MeshStandardMaterial
  if (!original.isMeshStandardMaterial)
    throw new Error('Hisoka.glb doit utiliser un matériau glTF standard.')
  if (!original.map) throw new Error('Texture de visage absente.')
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(PATCH.width * POWER)
  canvas.height = Math.ceil(PATCH.height * POWER)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Impossible de préparer la texture des yeux.')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  const material = original.clone()
  material.name = 'Hisoka · GLB avec regard TypeScript'
  material.onBeforeCompile = (shader, renderer) => {
    original.onBeforeCompile.call(material, shader, renderer)
    shader.uniforms.hisokaEyePaint = { value: texture }
    shader.uniforms.hisokaEyeBounds = {
      value: new Vector4(PATCH.x, PATCH.y, PATCH.width, PATCH.height),
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 hisokaBindPoint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nhisokaBindPoint = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 hisokaBindPoint;
        uniform sampler2D hisokaEyePaint;
        uniform vec4 hisokaEyeBounds;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec2 hisokaUv = (hisokaBindPoint.xy - hisokaEyeBounds.xy) / hisokaEyeBounds.zw;
        float hisokaMask = 0.0;
        if (all(greaterThanEqual(hisokaUv, vec2(0.0))) && all(lessThanEqual(hisokaUv, vec2(1.0)))) {
          float faceDepth = 0.080 - 0.56 * abs(hisokaBindPoint.x) + (hisokaBindPoint.y - 1.555) * 0.50;
          float surface = smoothstep(faceDepth - 0.021, faceDepth - 0.009, hisokaBindPoint.z)
            * (1.0 - smoothstep(faceDepth + 0.005, faceDepth + 0.012, hisokaBindPoint.z));
          vec4 paint = texture2D(hisokaEyePaint, hisokaUv);
          hisokaMask = paint.a * surface;
          diffuseColor.rgb = mix(diffuseColor.rgb, paint.rgb, hisokaMask);
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, 0.86 * hisokaMask));',
      )
  }
  material.customProgramCacheKey = () => 'hisoka-glb-eyes-v1'
  mesh.material = material

  function setPose(input: HisokaGlbEyePose = {}) {
    const pose = {
      blink: clamp(input.blink ?? 0),
      lookX: clamp(input.lookX ?? 0, -1, 1),
      lookY: clamp(input.lookY ?? 0, -1, 1),
      squint: clamp(input.squint ?? 0),
    }
    context!.setTransform(1, 0, 0, 1, 0, 0)
    context!.clearRect(0, 0, canvas.width, canvas.height)
    context!.setTransform(
      canvas.width / PATCH.width,
      0,
      0,
      -canvas.height / PATCH.height,
      (-PATCH.x * canvas.width) / PATCH.width,
      ((PATCH.y + PATCH.height) * canvas.height) / PATCH.height,
    )
    paintEye(context!, -1, pose)
    paintEye(context!, 1, pose)
    texture.needsUpdate = true
  }
  setPose()
  return {
    setPose,
    dispose() {
      if (mesh.material === material) mesh.material = original
      material.dispose()
      texture.dispose()
    },
  }
}
