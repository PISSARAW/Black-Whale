import type { Material, Mesh, Object3D, ShaderMaterial, SkinnedMesh } from 'three'

type Three = typeof import('three')

/**
 * Ten, Ren and Ken on a worn GLB.
 *
 * `humanAuraSkin` inflates each procedural mesh along its normals. Those
 * shells hug a body the camera no longer sees, so they go with it, and the
 * GLB gets one shell of its own: its mesh again, bound to the same skeleton,
 * with the same fragment shader and the *same uniform objects* — the colour,
 * the level and the shared `SKIN_TIME` clock stay a single write a frame.
 */

/** The aura shells the procedural body put on its own meshes. */
export function bodyAuraSkins(body: Mesh[]): Mesh[] {
  return body.flatMap((mesh) =>
    mesh.children.filter((child): child is Mesh => child.name.startsWith('nen-skin-')),
  )
}

const skinnedVertexShader = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
  uniform float u_inflate;
  varying float vRim;
  varying float vY;
  void main() {
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    vec3 bent = normalize(objectNormal);
    vec4 world = modelMatrix * vec4(transformed + bent * u_inflate, 1.0);
    vY = world.y;
    vec3 n = normalize(mat3(modelMatrix) * bent);
    vec3 toEye = normalize(cameraPosition - world.xyz);
    vRim = 1.0 - abs(dot(n, toEye));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const skinned = new WeakMap<Material, ShaderMaterial>()

function skinnedMaterial(THREE: Three, source: ShaderMaterial): ShaderMaterial {
  const held = skinned.get(source)
  if (held) return held
  const made = new THREE.ShaderMaterial({
    vertexShader: skinnedVertexShader,
    fragmentShader: source.fragmentShader,
    uniforms: source.uniforms,
    transparent: source.transparent,
    depthWrite: source.depthWrite,
    blending: source.blending,
  })
  skinned.set(source, made)
  return made
}

/**
 * Wrap every skinned mesh of the instance in the aura the procedural body
 * wore. Returns a sync that shows the shell exactly when the source shell is
 * shown, so whatever the aura loop decides keeps deciding.
 */
export function wrapModelInAura(
  THREE: Three,
  instance: Object3D,
  skins: Mesh[],
): (() => void) | undefined {
  const source = skins[0]
  const material = source?.material as ShaderMaterial | undefined
  if (!source || !material?.isShaderMaterial) return undefined
  const shells: Array<[SkinnedMesh, Object3D]> = []
  instance.traverse((node) => {
    const mesh = node as SkinnedMesh
    if (!mesh.isSkinnedMesh || !mesh.parent) return
    const shell = new THREE.SkinnedMesh(mesh.geometry, skinnedMaterial(THREE, material))
    shell.name = source.name
    shell.renderOrder = source.renderOrder
    shell.frustumCulled = false
    shell.position.copy(mesh.position)
    shell.quaternion.copy(mesh.quaternion)
    shell.scale.copy(mesh.scale)
    shell.bind(mesh.skeleton, mesh.bindMatrix)
    shells.push([shell, mesh.parent])
  })
  // Added after the walk: a child added during `traverse` would be visited.
  for (const [shell, parent] of shells) parent.add(shell)
  return () => {
    for (const [shell] of shells) shell.visible = source.visible
  }
}
