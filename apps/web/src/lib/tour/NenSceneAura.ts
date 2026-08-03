import { NEN_PRESENTATION, type NenTechnique, type NenTechniqueState } from '@black-whale/nen-engine'
import type * as Three from 'three'

type ThreeModule = typeof import('three')

const commonShaderFunctions = `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x); vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < 4; ++i) {
      v += a * cnoise(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }
`;

// TEN
const tenVertexShader = `
  uniform float u_time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 noisePos = position * 0.5;
    noisePos.y += u_time * 0.2;
    float noiseVal = cnoise(noisePos);
    vec3 newPosition = position + normal * noiseVal * 0.05; // very subtle
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const tenFragmentShader = `
  uniform float u_time;
  uniform vec3 u_colorCore;
  uniform vec3 u_colorEdge;
  uniform float u_opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    fresnel = pow(fresnel, 3.0); // very smooth edge
    
    // Extremely subtle base (0.01) + barely visible edge (0.05)
    float alpha = (0.01 + fresnel * 0.05) * u_opacity;
    
    vec3 color = mix(u_colorCore, u_colorEdge, fresnel);
    gl_FragColor = vec4(color, alpha);
  }
`;

// REN
const renVertexShader = `
  uniform float u_time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 noisePos = position * 3.0;
    noisePos.y += u_time * 4.0;
    float noiseVal = cnoise(noisePos);
    vec3 newPosition = position + normal * noiseVal * 0.2;
    if(position.y > 0.0) {
        newPosition.x += cnoise(vec3(position.x, position.y + u_time * 5.0, position.z)) * 0.3 * position.y;
        newPosition.z += cnoise(vec3(position.x + 10.0, position.y + u_time * 5.0, position.z)) * 0.3 * position.y;
    }
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const renFragmentShader = `
  uniform float u_time;
  uniform vec3 u_colorCore;
  uniform vec3 u_colorEdge;
  uniform float u_opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vec2 noiseUv = vUv;
    noiseUv.y -= u_time * 2.5;
    float noiseVal = cnoise(vec3(noiseUv * 8.0, u_time * 1.5));
    noiseVal = noiseVal * 0.5 + 0.5;
    
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = dot(normal, viewDir);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 1.5);
    
    float intensity = noiseVal * fresnel * 2.5;
    vec3 color = mix(u_colorCore, u_colorEdge, min(1.0, intensity));
    
    // Saturate to white at high intensity
    color = mix(color, vec3(1.0), smoothstep(1.5, 2.5, intensity));
    
    float verticalFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    float alpha = intensity * u_opacity * verticalFade;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ON
const onVertexShader = `
  uniform float u_time;
  uniform float u_intensityMultiplier;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 noisePos = position * 4.0;
    noisePos.y += u_time * 2.0;
    // Chaotic FBM
    float noiseVal = abs(fbm(noisePos)) * 2.0 - 1.0; 
    vec3 newPosition = position + normal * noiseVal * 0.25 * u_intensityMultiplier;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const onFragmentShader = `
  uniform float u_time;
  uniform float u_intensityMultiplier;
  uniform vec3 u_colorCore;
  uniform vec3 u_colorEdge;
  uniform float u_opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vec2 noiseUv = vUv;
    noiseUv.y -= u_time * 1.5;
    float noiseVal = abs(fbm(vec3(noiseUv * 6.0, u_time * 1.0)));
    
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    
    // Intensity scales down as u_intensityMultiplier goes down
    float intensity = noiseVal * fresnel * 3.0 * u_intensityMultiplier;
    
    // Subtractive/Multiply blending: we want a dark/purple smoke. 
    // In multiply blending, white = transparent, dark = opaque.
    vec3 darkSmoke = mix(u_colorCore, u_colorEdge, noiseVal);
    // Mix with white based on intensity/opacity so it blends out
    float verticalFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
    float alpha = intensity * u_opacity * verticalFade;
    
    vec3 finalColor = mix(vec3(1.0), darkSmoke, clamp(alpha, 0.0, 1.0));
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// FLUX (Gyo, Ko, Ryu)
const fluxVertexShader = `
  uniform float u_time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 newPosition = position + normal * cnoise(position * 3.0 + u_time) * 0.05;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fluxFragmentShader = `
  uniform float u_time;
  uniform vec3 u_colorCore;
  uniform vec3 u_nodes[8];
  uniform float u_intensities[8];
  uniform float u_opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewPosition;
  ${commonShaderFunctions}
  void main() {
    float nodeIntensity = 0.0;
    for(int i = 0; i < 8; i++) {
       float dist = distance(vWorldPos, u_nodes[i]);
       // falloff
       float influence = smoothstep(0.5, 0.0, dist);
       nodeIntensity += influence * u_intensities[i];
    }
    
    // Scroll noise
    vec2 noiseUv = vUv;
    noiseUv.y -= u_time * 2.0;
    float noiseVal = cnoise(vec3(noiseUv * 6.0, u_time)) * 0.5 + 0.5;
    
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    fresnel = pow(fresnel, 2.0);
    
    // Multiply by 100 for blinding effect on Ko (capped for rendering)
    float finalIntensity = nodeIntensity * noiseVal * fresnel * 5.0;
    
    vec3 color = mix(u_colorCore, vec3(1.0), min(1.0, finalIntensity * 0.5));
    float alpha = min(1.0, finalIntensity) * u_opacity;
    
    if (alpha < 0.01) discard;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// EN (Depth Fade)
const enVertexShader = `
  varying vec2 vUv;
  varying vec4 vScreenPos;
  void main() {
    vUv = uv;
    vScreenPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vScreenPos;
  }
`;

const enFragmentShader = `
  uniform sampler2D tDepth;
  uniform vec2 u_resolution;
  uniform float u_cameraNear;
  uniform float u_cameraFar;
  uniform vec3 u_color;
  uniform float u_opacity;
  
  varying vec2 vUv;
  varying vec4 vScreenPos;
  
  float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, u_cameraNear, u_cameraFar);
    return viewZToOrthographicDepth(viewZ, u_cameraNear, u_cameraFar);
  }
  
  void main() {
    vec2 screenUv = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
    
    float sceneDepth = readDepth(tDepth, screenUv);
    float sphereViewZ = perspectiveDepthToViewZ(gl_FragCoord.z, u_cameraNear, u_cameraFar);
    float sphereDepth = viewZToOrthographicDepth(sphereViewZ, u_cameraNear, u_cameraFar);
    
    // distance between sphere and scene geometry
    float depthDiff = abs(sceneDepth - sphereDepth) * (u_cameraFar - u_cameraNear);
    
    // Line intersection
    float intersection = smoothstep(1.5, 0.0, depthDiff);
    
    // Base sphere opacity
    float base = 0.05;
    
    float alpha = (base + intersection) * u_opacity;
    vec3 color = mix(u_color, vec3(1.0), intersection * 0.8);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export type NenObjectInteraction = 'sense' | 'strike' | 'pressure' | 'channel'

export class NenSceneAura {
  readonly #root: Three.Group
  readonly #world: Three.Group
  readonly #THREE: ThreeModule
  readonly #shu = new Map<string, Three.Mesh>()
  readonly #interactions: Three.Group[] = []
  
  readonly #auraGeom: Three.CylinderGeometry
  
  readonly #ten: Three.Mesh
  readonly #ren: Three.Mesh
  readonly #on: Three.Mesh
  readonly #onTen: Three.Mesh
  readonly #zetsu: Three.Mesh
  readonly #flux: Three.Mesh
  readonly #en: Three.Mesh
  
  readonly #fluxUniforms: any
  readonly #enUniforms: any
  
  #seconds = 0
  #onStartTime = 0
  #wasOn = false

  constructor(THREE: ThreeModule, scene: Three.Scene) {
    this.#THREE = THREE
    this.#root = new THREE.Group()
    this.#world = new THREE.Group()
    
    this.#auraGeom = new THREE.CylinderGeometry(0.7, 0.9, 2.4, 32, 32, true)
    this.#auraGeom.translate(0, 1.2, 0)
    
    // TEN
    this.#ten = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: tenVertexShader,
        fragmentShader: tenFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ten.colours[0]) },
          u_colorEdge: { value: new THREE.Color(NEN_PRESENTATION.ten.colours[0]) },
          u_opacity: { value: 0.8 },
        },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    )
    this.#ten.position.y = -1.2
    
    // REN
    this.#ren = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: renVertexShader,
        fragmentShader: renFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ren.colours[0]) },
          u_colorEdge: { value: new THREE.Color(NEN_PRESENTATION.ren.colours[1] || NEN_PRESENTATION.ren.colours[0]) },
          u_opacity: { value: 0.8 },
        },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    )
    this.#ren.position.y = -1.2
    
    // ON
    this.#on = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: onVertexShader,
        fragmentShader: onFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_intensityMultiplier: { value: 1.0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.on.colours[0]) },
          u_colorEdge: { value: new THREE.Color(NEN_PRESENTATION.on.colours[1] || NEN_PRESENTATION.on.colours[0]) },
          u_opacity: { value: 0.8 },
        },
        transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide
      })
    )
    this.#on.position.y = -1.2
    
    // ON (Settled into Ten state)
    this.#onTen = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: tenVertexShader,
        fragmentShader: tenFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.on.colours[0]) },
          u_colorEdge: { value: new THREE.Color(NEN_PRESENTATION.on.colours[1] || NEN_PRESENTATION.on.colours[0]) },
          u_opacity: { value: 0.0 },
        },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    )
    this.#onTen.position.y = -1.2
    
    // ZETSU (Refraction via MeshPhysicalMaterial)
    this.#zetsu = new THREE.Mesh(
      this.#auraGeom,
      new THREE.MeshPhysicalMaterial({
        transmission: 1.0,
        ior: 1.05, // subtle heat mirage
        roughness: 0.1,
        thickness: 0.5,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
      })
    )
    this.#zetsu.position.y = -1.2
    
    // FLUX (Gyo, Ko, Ryu)
    this.#fluxUniforms = {
      u_time: { value: 0 },
      u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ryu.colours[0]) },
      u_nodes: { value: Array(8).fill(new THREE.Vector3()) },
      u_intensities: { value: Array(8).fill(0.0) },
      u_opacity: { value: 1.0 }
    }
    this.#flux = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: fluxVertexShader,
        fragmentShader: fluxFragmentShader,
        uniforms: this.#fluxUniforms,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    )
    this.#flux.position.y = -1.2
    
    // EN
    this.#enUniforms = {
      tDepth: { value: null },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_cameraNear: { value: 0.1 },
      u_cameraFar: { value: 130.0 }, // match VIEW_DISTANCE
      u_color: { value: new THREE.Color(NEN_PRESENTATION.en.colours[0]) },
      u_opacity: { value: 1.0 }
    }
    this.#en = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: enVertexShader,
        fragmentShader: enFragmentShader,
        uniforms: this.#enUniforms,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide
      })
    )
    
    this.#root.add(this.#ten)
    this.#root.add(this.#ren)
    this.#root.add(this.#on)
    this.#root.add(this.#onTen)
    this.#root.add(this.#zetsu)
    this.#root.add(this.#flux)
    this.#root.add(this.#en)
    scene.add(this.#root, this.#world)
  }

  syncShu(objects: Array<{ id: string; at: readonly [number, number]; y: number; size: readonly [number, number]; height: number }>) {
    const wanted = new Set(objects.map((object) => object.id))
    for (const object of objects) {
      let shell = this.#shu.get(object.id)
      if (!shell) {
        shell = new this.#THREE.Mesh(
          new this.#THREE.BoxGeometry(1, 1, 1),
          new this.#THREE.MeshBasicMaterial({
            color: NEN_PRESENTATION.shu.colours[0],
            transparent: true,
            opacity: 0.28,
            wireframe: true,
          }),
        )
        shell.name = `nen-shu-${object.id}`
        this.#shu.set(object.id, shell)
        this.#world.add(shell)
      }
      shell.position.set(object.at[0], object.y + object.height / 2, object.at[1])
      shell.scale.set(object.size[0] * 1.04, object.height * 1.04, object.size[1] * 1.04)
      shell.userData.shuScale = [object.size[0] * 1.04, object.height * 1.04, object.size[1] * 1.04]
    }
    for (const [id, shell] of this.#shu) {
      if (wanted.has(id)) continue
      this.#world.remove(shell)
      shell.geometry.dispose()
      ;(shell.material as Three.Material).dispose()
      this.#shu.delete(id)
    }
  }

  interact(
    object: { id: string; at: readonly [number, number]; y: number; size: readonly [number, number]; height: number },
    kind: NenObjectInteraction,
  ) {
    const THREE = this.#THREE
    const root = new THREE.Group()
    root.name = `nen-object-${kind}-${object.id}`
    root.position.set(object.at[0], object.y + object.height / 2, object.at[1])
    root.userData.started = this.#seconds
    root.userData.kind = kind
    root.userData.extent = Math.max(object.size[0], object.size[1], object.height, 0.35)
    const colour = kind === 'pressure' ? NEN_PRESENTATION.on.colours[1] : kind === 'strike' ? NEN_PRESENTATION.ko.colours[0] : NEN_PRESENTATION.gyo.colours[0]
    const material = (opacity: number) =>
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    if (kind === 'sense') {
      for (let index = 0; index < 3; index++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.018, 6, 48), material(0.5))
        ring.rotation.set(index === 0 ? Math.PI / 2 : 0, index === 2 ? Math.PI / 2 : 0, 0)
        ring.userData.phase = index / 3
        root.add(ring)
      }
    } else {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.65, 20, 14), material(kind === 'strike' ? 0.48 : 0.3))
      shell.scale.set(
        Math.max(0.4, object.size[0]),
        Math.max(0.4, object.height),
        Math.max(0.4, object.size[1]),
      )
      root.add(shell)
      const wave = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.31, 64), material(0.72))
      wave.rotation.x = -Math.PI / 2
      wave.userData.wave = true
      root.add(wave)
    }
    this.#interactions.push(root)
    this.#world.add(root)
  }

  update(
    state: NenTechniqueState,
    camera: Three.PerspectiveCamera,
    ground: number,
    seconds: number,
    depthTexture?: Three.DepthTexture,
  ) {
    this.#seconds = seconds
    this.#root.position.copy(camera.position)
    this.#root.rotation.set(0, camera.rotation.y, 0)
    
    // Hide all by default
    this.#ten.visible = false;
    this.#ren.visible = false;
    this.#on.visible = false;
    this.#onTen.visible = false;
    this.#zetsu.visible = false;
    this.#flux.visible = false;
    this.#en.visible = false;
    
    const active = state.mode !== 'zetsu'
    const isFlux = active && (state.ko !== null || Object.values(state.ryu).some(v => (v || 0) > 0) || state.gyo)
    
    if (!active) {
       this.#zetsu.visible = true;
       // minor wobble
       const mat = this.#zetsu.material as Three.MeshPhysicalMaterial;
       mat.ior = 1.02 + Math.sin(seconds * 2.0) * 0.02;
    } else if (state.on) {
       if (!this.#wasOn) {
         this.#wasOn = true;
         this.#onStartTime = seconds;
       }
       const elapsed = seconds - this.#onStartTime;
       const progress = Math.min(elapsed / 30.0, 1.0); // transition over 30s
       
       if (progress < 1.0) {
         this.#on.visible = true;
         (this.#on.material as Three.ShaderMaterial).uniforms.u_time.value = seconds;
         (this.#on.material as Three.ShaderMaterial).uniforms.u_opacity.value = (1.0 - progress) * 0.8;
       }
       
       if (progress > 0.0) {
         this.#onTen.visible = true;
         (this.#onTen.material as Three.ShaderMaterial).uniforms.u_time.value = seconds;
         (this.#onTen.material as Three.ShaderMaterial).uniforms.u_opacity.value = progress * 0.8;
       }
    } else if (isFlux) {
       this.#flux.visible = true;
       this.#fluxUniforms.u_time.value = seconds;
       
       const rootPos = this.#root.position;
       // Convert camera local offsets to world coordinates for nodes
       const headPos = rootPos.clone().add(new this.#THREE.Vector3(0, 0.02, -0.25).applyQuaternion(camera.quaternion));
       const torsoPos = rootPos.clone().add(new this.#THREE.Vector3(0, -0.62, -0.42).applyQuaternion(camera.quaternion));
       const handLPos = rootPos.clone().add(new this.#THREE.Vector3(-0.27, -0.48, -0.62).applyQuaternion(camera.quaternion));
       const handRPos = rootPos.clone().add(new this.#THREE.Vector3(0.27, -0.48, -0.62).applyQuaternion(camera.quaternion));
       const footLPos = rootPos.clone().add(new this.#THREE.Vector3(-0.2, -1.45, -0.35).applyQuaternion(camera.quaternion));
       const footRPos = rootPos.clone().add(new this.#THREE.Vector3(0.2, -1.45, -0.35).applyQuaternion(camera.quaternion));
       
       const nodes = [headPos, torsoPos, handLPos, handRPos, footLPos, footRPos, rootPos, rootPos];
       const ints = Array(8).fill(0.0);
       
       if (state.ko) {
          if (state.ko === 'head') ints[0] = 5.0;
          if (state.ko === 'torso') ints[1] = 5.0;
          if (state.ko === 'hands') { ints[2] = 5.0; ints[3] = 5.0; }
          if (state.ko === 'feet') { ints[4] = 5.0; ints[5] = 5.0; }
       } else {
          ints[0] = (state.ryu.head || 0) + (state.gyo ? 2.0 : 0);
          ints[1] = state.ryu.torso || 0;
          ints[2] = state.ryu.hands || 0;
          ints[3] = state.ryu.hands || 0;
          ints[4] = state.ryu.feet || 0;
          ints[5] = state.ryu.feet || 0;
       }
       
       this.#fluxUniforms.u_nodes.value = nodes;
       this.#fluxUniforms.u_intensities.value = ints;
    } else if (state.mode === 'ren' && !state.ken) {
       this.#ren.visible = true;
       (this.#ren.material as Three.ShaderMaterial).uniforms.u_time.value = seconds;
    } else {
       this.#ten.visible = true;
       (this.#ten.material as Three.ShaderMaterial).uniforms.u_time.value = seconds;
       // Ken can just be a slightly scaled Ten for now
       if (state.ken) {
         this.#ten.scale.set(1.2, 1.2, 1.2);
       } else {
         this.#ten.scale.set(1.0, 1.0, 1.0);
       }
    }
    
    if (!state.on) {
      this.#wasOn = false;
    }
    
    if (active && state.en !== null) {
       this.#en.visible = true;
       this.#en.position.set(0, ground + 0.025 - camera.position.y, 0); // world coords relative to root
       this.#en.scale.setScalar(state.en.radius);
       if (depthTexture) {
         this.#enUniforms.tDepth.value = depthTexture;
         this.#enUniforms.u_cameraNear.value = camera.near;
         this.#enUniforms.u_cameraFar.value = camera.far;
       }
    }

    for (const [index, shell] of [...this.#shu.values()].entries()) {
      const shimmer = 1 + Math.sin(seconds * 4.5 + index * 1.7) * 0.018
      const scale = shell.userData.shuScale as [number, number, number] | undefined
      if (scale) shell.scale.set(scale[0] * shimmer, scale[1] * shimmer, scale[2] * shimmer)
      ;(shell.material as Three.MeshBasicMaterial).opacity = 0.22 + Math.sin(seconds * 6 + index) * 0.055
    }
    
    for (let index = this.#interactions.length - 1; index >= 0; index--) {
      const effect = this.#interactions[index]
      const age = seconds - Number(effect.userData.started)
      const kind = effect.userData.kind as NenObjectInteraction
      const duration = kind === 'sense' ? 1.8 : kind === 'pressure' ? 1.25 : 0.8
      if (age >= duration) {
        this.#world.remove(effect)
        effect.traverse((part) => {
          const mesh = part as Three.Mesh
          mesh.geometry?.dispose()
          ;(mesh.material as Three.Material | undefined)?.dispose()
        })
        this.#interactions.splice(index, 1)
        continue
      }
      const progress = Math.max(0, age / duration)
      effect.rotation.y = seconds * (kind === 'pressure' ? 1.8 : 0.7)
      effect.children.forEach((part, partIndex) => {
        const mesh = part as Three.Mesh
        const phase = Number(mesh.userData.phase ?? 0)
        if (kind === 'sense') {
          const sweep = (progress + phase) % 1
          mesh.scale.setScalar((0.45 + sweep * 1.25) * Number(effect.userData.extent))
          ;(mesh.material as Three.MeshBasicMaterial).opacity = (1 - sweep) * 0.55
        } else if (mesh.userData.wave) {
          mesh.scale.setScalar((0.5 + progress * 2.8) * Number(effect.userData.extent))
          ;(mesh.material as Three.MeshBasicMaterial).opacity = (1 - progress) * 0.75
        } else {
          const impact = kind === 'strike' ? 1 + Math.sin(progress * Math.PI) * 0.3 : 1 + Math.sin(seconds * 9 + partIndex) * 0.06
          mesh.scale.multiplyScalar(impact / Number(mesh.userData.lastImpact ?? 1))
          mesh.userData.lastImpact = impact
          ;(mesh.material as Three.MeshBasicMaterial).opacity = (1 - progress) * (kind === 'strike' ? 0.5 : 0.32)
        }
      })
    }
  }

  dispose(scene: Three.Scene) {
    scene.remove(this.#root, this.#world)
    for (const root of [this.#root, this.#world]) root.traverse((part) => {
      const mesh = part as Three.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material as Three.Material | undefined
      material?.dispose()
    })
    this.#auraGeom.dispose()
  }
}
