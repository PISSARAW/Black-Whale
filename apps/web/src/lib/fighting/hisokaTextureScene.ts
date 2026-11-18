import { createHisokaPresentationClock, HISOKA_ACCENT_FRAMES } from './hisokaPresentation'
import { hisokaChest, hisokaReduced } from './hisokaEffectAnchors'
import { gyoSight } from './nenPerception'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

const fragment = `
varying vec2 vUv;
uniform float u_time;
uniform float u_reverse;
void main(){
  float y=mix(1.-u_time,u_time,u_reverse);
  float band=1.-smoothstep(.015,.16,abs(vUv.y-y));
  float edge=smoothstep(0.,.07,vUv.x)*(1.-smoothstep(.93,1.,vUv.x));
  float grain=.75+.25*sin(vUv.x*160.)*sin(vUv.y*220.);
  float alpha=band*edge*grain*sin(3.14159*u_time)*.62;
  gl_FragColor=vec4(mix(vec3(.94,.88,.8),vec3(1.,.76,.88),u_reverse),alpha);
}`

/** A brief sweep on the existing shirt. The game's actual cloth disguise remains authoritative. */
export function createHisokaTextureScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE } = options
  const clock = createHisokaPresentationClock()
  const geometry = new THREE.PlaneGeometry(0.42, 0.42)
  const panels = (['player', 'opponent'] as const).map((side) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { u_time: { value: 0 }, u_reverse: { value: 0 } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const root = new THREE.Mesh(geometry, material)
    root.name = `hisoka-texture-accent:${side}`
    root.visible = false
    options.scene.add(root)
    return { side, root, material }
  })
  return {
    sync(state) {
      const frames = clock(state)
      for (const panel of panels) {
        const frame = frames[panel.side]
        const age = frame.texture ?? frame.textureEnd
        const torso = torsoOf(options, panel.side)
        panel.root.visible =
          age !== null && Boolean(torso) && textureVisible(options, state, panel.side)
        panel.root.userData.frame = age
        if (!panel.root.visible || age === null || !torso) continue
        panel.root.position.copy(hisokaChest(options, state, panel.side))
        torso.getWorldQuaternion(panel.root.quaternion)
        panel.material.uniforms.u_time.value = age / HISOKA_ACCENT_FRAMES
        panel.material.uniforms.u_reverse.value = frame.textureEnd === null ? 0 : 1
      }
    },
    dispose() {
      panels.forEach(({ root, material }) => {
        root.removeFromParent()
        material.dispose()
      })
      geometry.dispose()
    },
  }
}
function textureVisible(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const viewer = options.viewer?.() ?? 'player'
  if (hisokaReduced(options) || options.comfort?.().flashes === false) return false
  return side === viewer || !state[side].nen.in || gyoSight(state[viewer])
}

function torsoOf(options: EffectSceneOptions, side: FightSide) {
  return options.figureOf?.(side)?.getObjectByName('torso')
}
