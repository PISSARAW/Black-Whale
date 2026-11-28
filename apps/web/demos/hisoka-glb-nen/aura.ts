import { AdditiveBlending, Color, ShaderMaterial, SkinnedMesh } from 'three'
import { auraConcentration, concentrationShare } from '../../src/lib/fighting/nenConcentration'
import type { ArcadeFighter, FightNenZone } from '../../src/lib/fighting/types'
import { auraLayersFor, type AuraSight } from '../../src/lib/tour/auraSight'

const JOINTS = 32

function region(name: string): { zone: FightNenZone; limb?: 'left' | 'right' } {
  const limb = name.includes('Left') ? 'left' : name.includes('Right') ? 'right' : undefined
  if (/Hand|ForeArm/.test(name)) return { zone: 'hands', limb }
  if (/Leg|Foot|Toe/.test(name)) return { zone: 'feet', limb }
  if (/Head|headfront/.test(name)) return { zone: 'head' }
  return { zone: 'torso' }
}

const vertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  uniform float u_shares[${JOINTS}];
  uniform float u_width;
  varying float v_share;
  varying float v_rim;
  varying float v_height;

  void main() {
    v_share = dot(skinWeight, vec4(
      u_shares[int(skinIndex.x)], u_shares[int(skinIndex.y)],
      u_shares[int(skinIndex.z)], u_shares[int(skinIndex.w)]
    ));
    #include <skinbase_vertex>
    #include <beginnormal_vertex>
    #include <skinnormal_vertex>
    vec3 transformed = position + normal * u_width * v_share;
    #include <skinning_vertex>
    vec4 world = modelMatrix * vec4(transformed, 1.0);
    v_rim = 1.0 - abs(dot(normalize(mat3(modelMatrix) * objectNormal),
      normalize(cameraPosition - world.xyz)));
    v_height = world.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 u_colour;
  uniform float u_time;
  uniform float u_pulse;
  uniform float u_gain;
  varying float v_share;
  varying float v_rim;
  varying float v_height;
  void main() {
    float band = 1.0 + u_pulse * sin(v_height * 31.0 - u_time * 13.0);
    float alpha = pow(v_rim, 1.4) * v_share * band * u_gain;
    gl_FragColor = vec4(u_colour, min(0.95, alpha));
    #include <colorspace_fragment>
  }
`

/** The shell shares the exported skeleton, bind matrix and weights with the body. */
export function mountSkinnedAura(body: SkinnedMesh) {
  if (body.skeleton.bones.length > JOINTS) throw Error('Ce squelette dépasse 32 joints.')
  const regions = body.skeleton.bones.map((bone) => region(bone.name))
  const shares = new Float32Array(JOINTS)
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      u_colour: { value: new Color(0xd279ff) },
      u_shares: { value: shares },
      u_width: { value: 0.01 },
      u_gain: { value: 1 },
      u_pulse: { value: 0 },
      u_time: { value: 0 },
    },
  })
  const shell = new SkinnedMesh(body.geometry, material)
  shell.bindMode = body.bindMode
  shell.bind(body.skeleton, body.bindMatrix)
  shell.name = 'hisoka-nen-skinned-aura'
  shell.frustumCulled = false
  shell.renderOrder = 2
  body.add(shell)

  return (fighter: ArcadeFighter, sight: AuraSight, seconds: number) => {
    const { nen } = fighter
    shell.visible = nen.mode !== 'zetsu' && auraLayersFor(nen, sight).light
    const concentration = auraConcentration(fighter)
    regions.forEach((zone, i) => {
      shares[i] = concentration ? concentrationShare(concentration, zone) : 1
    })
    material.uniforms.u_width.value = concentration
      ? concentration.technique === 'ko'
        ? 0.025
        : 0.026
      : nen.ken
        ? 0.024
        : nen.mode === 'ren'
          ? 0.023
          : 0.009
    material.uniforms.u_pulse.value = nen.mode === 'ren' && !nen.ken ? 0.37 : 0.09
    material.uniforms.u_gain.value =
      nen.ken || concentration ? 1.3 : nen.mode === 'ren' ? 0.94 : 0.6
    material.uniforms.u_time.value = seconds
    return { visible: shell.visible, shares }
  }
}
