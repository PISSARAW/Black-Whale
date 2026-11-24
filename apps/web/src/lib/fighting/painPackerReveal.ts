import type { Mesh, MeshBasicMaterial } from 'three'
import type { VisitHatsuModel } from './visitHatsuModel'
import { armourReveal } from './feitanPresentation'

/** Local material clones keep the shared reference outfit and other wearers untouched. */
export function createPainPackerReveal(outfit: VisitHatsuModel) {
  const sections: Array<{
    section: keyof ReturnType<typeof armourReveal>
    amount: { value: number }
  }> = []
  for (const [name, joint] of outfit.joints) {
    const section = sectionOf(name)
    joint.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.geometry || !mesh.material || Array.isArray(mesh.material)) return
      // Retained elbow joints are animated separately from the upper sleeve.
      if (sections.some((entry) => entry.amount === mesh.userData.painReveal)) return
      const material = (mesh.material as MeshBasicMaterial).clone()
      const amount = { value: 1 }
      mesh.geometry.computeBoundingBox()
      const bounds = mesh.geometry.boundingBox!
      const bottom = { value: bounds.min.y }
      const height = { value: Math.max(0.001, bounds.max.y - bounds.min.y) }
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, {
          painAmount: amount,
          painBottom: bottom,
          painHeight: height,
        })
        shader.vertexShader =
          `varying float vPainHeight; uniform float painBottom; uniform float painHeight;\n${shader.vertexShader}`.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvPainHeight = (position.y - painBottom) / painHeight;',
          )
        shader.fragmentShader =
          `varying float vPainHeight; uniform float painAmount;\n${shader.fragmentShader}`.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            if (painAmount < 0.001 || vPainHeight > painAmount) discard;
            float seam = smoothstep(painAmount - 0.12, painAmount, vPainHeight);
            seam *= 1.0 - smoothstep(0.96, 1.0, painAmount);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.18, 0.035), seam * 0.9);
          `,
          )
      }
      material.customProgramCacheKey = () => 'clash-pain-packer-reveal-v2'
      mesh.material = material
      mesh.userData.painReveal = amount
      sections.push({ section, amount })
    })
  }
  return {
    sync(frame: number | null) {
      const reveal = armourReveal(frame)
      sections.forEach(({ section, amount }) => {
        amount.value = reveal[section]
      })
      outfit.root.userData.reveal = reveal
      return reveal
    },
  }
}

function sectionOf(name: string): keyof ReturnType<typeof armourReveal> {
  if (name.includes('hood')) return 'hood'
  if (name.includes('coat')) return 'coat'
  if (name.includes('chest')) return 'chest'
  return 'arms'
}
