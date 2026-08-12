/**
 * The darkness in the corners the bake cannot see.
 *
 * The walk's light is baked into vertex colours, and the one occlusion term it
 * has is derived from a room's footprint — see the note above `roomLight` in
 * `$lib/tour/mesh`: a wall knows how far it is from the middle of the space it
 * is in, and that is all. It is a good approximation of a room and no
 * approximation at all of a *junction*. Where a bulkhead meets a deck, where a
 * pillar lands, under a stair, behind a crate — every one of those reads as two
 * flat surfaces meeting at a line, because both surfaces were lit by a formula
 * that never asked what was next to them.
 *
 * This is the missing half, and it is screen-space because the geometry that
 * would answer it properly is 314 rooms of it. What makes it affordable here is
 * that the half-float target on the `high` palier already carries a depth
 * buffer — `createHighTierTarget` allocates one so `NenSceneAura` can intersect
 * against it — so the expensive part of an occlusion pass, knowing the shape of
 * the frame, is a buffer that was already paid for. What is added is one
 * full-screen pass of eighteen taps, and only where a machine has been judged
 * able to afford the other five.
 *
 * Three decisions worth stating, because each is the difference between an
 * occlusion pass that belongs on this ship and one that fights it:
 *
 * - **It multiplies.** Same argument as `$lib/tour/contactShadow`: occlusion is
 *   light not arriving, so it takes a share off what the bake put there rather
 *   than laying a grey down. A corner of the hold that was already black stays
 *   black, and no constant per deck is needed to make that true.
 * - **It stops before the fog does.** The air is drawn in the material's own
 *   shader and this runs after it, so occlusion applied at fifty metres would
 *   be darkening haze rather than steel — which reads as a smudge on the lens.
 *   It fades out over the last third of its reach and costs nothing past it.
 * - **It does not touch the lights.** A filament, a pane and an aura are the
 *   three things on this ship written above white on purpose, and a lamp in the
 *   corner of a room is exactly where this pass would most like to put a
 *   shadow. Bright pixels are held out, which is both correct — a source is not
 *   occluded, it is the thing doing the lighting — and what keeps the walk's
 *   system of proof intact.
 */
import type * as Three from 'three'
import type { PostPass } from './postTypes'

/**
 * How far a point looks for something in front of it, in metres.
 *
 * Sized to the ship rather than to a taste: the things this is meant to find
 * are a deck-to-bulkhead junction, the foot of a pillar and the underside of a
 * gantry, all of which are decided within about half a metre. Wider starts
 * darkening whole walls for being near other walls, which is the look people
 * mean when they say a scene is "dirty".
 */
export const OCCLUSION_RADIUS = 0.55

/** How much of the floor's own light a fully enclosed corner loses. */
export const OCCLUSION_STRENGTH = 0.55

/**
 * How far out it works at all, in metres, and where it starts giving up.
 *
 * A hall on this ship is a hundred metres long and the fog is thick enough to
 * close it well before then. Past `OCCLUSION_REACH` the frame is air, and air
 * has no corners.
 */
export const OCCLUSION_REACH = 30

/**
 * The angle below which a neighbour is not in front, it is the same surface.
 *
 * Depth reconstruction is exact only to the precision of the buffer, so a flat
 * wall seen at a grazing angle produces neighbours a hair above and below its
 * own plane. Without a bias every such wall self-occludes and the whole frame
 * takes a uniform dimming, which is the single most common way this effect is
 * shipped wrong.
 */
export const OCCLUSION_BIAS = 0.035

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform mat4 uInverseProjection;
  uniform vec2 uTexel;
  uniform vec2 uProjScale;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uBias;
  uniform float uReach;
  varying vec2 vUv;

  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
  const int TAPS = 12;
  /** The golden angle: the one turn that never lines a spiral up with itself. */
  const float TURN = 2.39996323;

  /**
   * Where a pixel is, in metres, in front of the camera.
   *
   * The inverse projection undoes both the perspective divide and the depth
   * buffer's non-linearity in one multiply, which is why the pass needs no near
   * and far of its own: they are already inside the matrix it was handed.
   */
  vec3 viewPositionAt(vec2 uv) {
    float depth = texture2D(tDepth, uv).x;
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = uInverseProjection * clip;
    return view.xyz / view.w;
  }

  /**
   * The surface direction, from the four neighbours rather than a G-buffer.
   *
   * The nearer of each opposed pair is kept, which is what stops a silhouette
   * from generating a normal that belongs to neither of the two surfaces meeting
   * across it — the halo you otherwise get around every railing.
   */
  vec3 normalAt(vec2 uv, vec3 here) {
    vec3 right = viewPositionAt(uv + vec2(uTexel.x, 0.0)) - here;
    vec3 left = here - viewPositionAt(uv - vec2(uTexel.x, 0.0));
    vec3 up = viewPositionAt(uv + vec2(0.0, uTexel.y)) - here;
    vec3 down = here - viewPositionAt(uv - vec2(0.0, uTexel.y));
    vec3 alongX = abs(right.z) < abs(left.z) ? right : left;
    vec3 alongY = abs(up.z) < abs(down.z) ? up : down;
    vec3 facing = normalize(cross(alongX, alongY));
    // View space looks down -Z, so a surface the camera can see faces +Z. The
    // cross product's sign depends on which pair won above; this settles it.
    return facing.z < 0.0 ? -facing : facing;
  }

  /**
   * A per-pixel turn of the sample disc, from the pixel's own coordinates.
   *
   * Interleaved gradient noise rather than a random texture: twelve taps on an
   * unrotated spiral would put the same twelve directions under every pixel and
   * the occlusion would come out in rings. Rotating each pixel differently
   * trades those rings for a fine noise, which the grain and the dither this
   * frame already carries absorb without a blur pass.
   */
  float turnAt(vec2 fragment) {
    float noise = fract(52.9829189 * fract(dot(fragment, vec2(0.06711056, 0.00583715))));
    return noise * 6.2831853;
  }

  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    float depth = texture2D(tDepth, vUv).x;
    // Nothing was drawn here: the clear colour, which has no geometry to occlude.
    if (depth >= 1.0) { gl_FragColor = texel; return; }

    vec3 here = viewPositionAt(vUv);
    float distance = -here.z;
    // Over the last third of the reach it lets go, so nothing pops at the edge
    // of the effect the way it would with a hard cut.
    float fade = 1.0 - smoothstep(uReach * 0.66, uReach, distance);
    if (fade <= 0.0) { gl_FragColor = texel; return; }

    vec3 facing = normalAt(vUv, here);
    // The disc shrinks with distance exactly as the world does: one radius in
    // metres, projected, so a corner ten metres off is sampled over the same
    // half-metre of ship as one at arm's length. Two scales rather than one,
    // because uv is not square and a single one would sample an ellipse of the
    // room whose shape changed every time the visitor opened the side panel.
    vec2 spread = uProjScale * uRadius / max(distance, 0.001);
    float spin = turnAt(gl_FragCoord.xy);

    float occlusion = 0.0;
    for (int i = 0; i < TAPS; i++) {
      float index = float(i);
      // sqrt of the index spaces the taps evenly over the *area* of the disc
      // rather than over its radius, which would crowd them at the centre.
      float reach = sqrt((index + 0.5) / float(TAPS));
      float angle = index * TURN + spin;
      vec2 tap = vUv + vec2(cos(angle), sin(angle)) * reach * spread;
      vec3 there = viewPositionAt(tap);
      vec3 towards = there - here;
      float span = length(towards);
      if (span < 0.0001) continue;
      // How much of the hemisphere that neighbour stands in, less the bias, and
      // less the further away it is: a wall across the room is in front of this
      // pixel too, and it is not what is darkening the corner.
      float share = max(dot(facing, towards / span) - uBias, 0.0);
      occlusion += share * (uRadius / (uRadius + span));
    }
    occlusion = occlusion / float(TAPS);

    // A source is not occluded; it is the thing doing the lighting.
    float luma = dot(texel.rgb, LUMA);
    float lit = 1.0 - smoothstep(0.75, 1.1, luma);

    float kept = 1.0 - clamp(occlusion * uStrength * fade * lit, 0.0, 1.0);
    gl_FragColor = vec4(texel.rgb * kept, texel.a);
  }
`

/** The uniform block, built as an object so the pass and the tests agree. */
export function occlusionUniforms() {
  return {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uInverseProjection: { value: null },
    uTexel: { value: [1 / 1024, 1 / 1024] },
    uProjScale: { value: [1, 1] },
    uRadius: { value: OCCLUSION_RADIUS },
    uStrength: { value: OCCLUSION_STRENGTH },
    uBias: { value: OCCLUSION_BIAS },
    uReach: { value: OCCLUSION_REACH },
  }
}

export const OCCLUSION_SHADER = {
  uniforms: occlusionUniforms(),
  vertexShader,
  fragmentShader,
}

export interface OcclusionBuild {
  camera: Three.PerspectiveCamera
  depth: Three.DepthTexture
}

/**
 * How wide and how tall one metre at one metre is, in uv.
 *
 * Elements 0 and 5 of a perspective projection are the frustum's width and
 * height at unit distance in clip space — the vertical one is `1 / tan(fov / 2)`
 * and the horizontal one is that divided by the aspect. Halving both puts them
 * in uv, where this pass does its sampling. Kept as a named function because it
 * is the one thing in this file that is a fact about projections rather than a
 * decision about the ship, and a test can hold it against a camera without ever
 * building a renderer.
 */
export function projectionScale(camera: Three.PerspectiveCamera): [number, number] {
  const { elements } = camera.projectionMatrix
  return [elements[0] * 0.5, elements[5] * 0.5]
}

/**
 * The pass, which writes its own uniforms.
 *
 * Every other pass in the walk is fed from the frame loop — the shafts get a
 * source, the grade gets an hour, the refraction gets an amount — because in
 * each case the loop knows something the pass cannot. This one knows everything
 * it needs from the camera it was built with, and the camera is the same object
 * for the life of the scene. So it updates itself in `render`, and the walk's
 * frame loop gains no line at all: `TourScene.svelte` is five thousand lines
 * over the bound, and a pass that can avoid asking it for anything should.
 */
export async function createOcclusionPass(build: OcclusionBuild): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  const { camera, depth } = build

  /**
   * The frame's arguments taken whole rather than named.
   *
   * `ShaderPass.render` takes five, and the walk's bound is three — see
   * ADR-002. Naming them to satisfy it is not available: the signature belongs
   * to three.js and a subclass may not narrow it. Passing them through as one
   * tuple is the honest reading of what this override actually does with them,
   * which is nothing except hand them on.
   */
  type Frame = [
    renderer: Three.WebGLRenderer,
    writeBuffer: Three.WebGLRenderTarget,
    readBuffer: Three.WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean,
  ]

  class OcclusionPass extends ShaderPass {
    override render(...frame: Frame): void {
      const readBuffer = frame[2]
      // Measured off the buffer it is about to read rather than off the
      // renderer: the composer's targets are the thing whose texels these are,
      // and asking the buffer costs no vector to allocate sixty times a second.
      this.uniforms.uTexel.value = [
        1 / Math.max(1, readBuffer.width),
        1 / Math.max(1, readBuffer.height),
      ]
      this.uniforms.uInverseProjection.value = camera.projectionMatrixInverse
      this.uniforms.uProjScale.value = projectionScale(camera)
      super.render(...frame)
    }
  }

  const pass = new OcclusionPass({
    uniforms: occlusionUniforms(),
    vertexShader,
    fragmentShader,
  }) as unknown as PostPass
  pass.uniforms.tDepth.value = depth
  return pass
}
