/**
 * The GLSL the aura is drawn with, and nothing else.
 *
 * Kept apart from `NenSceneAura.ts` because it is a different language: the
 * class reads as scene graph assembly, these read as shading, and a reader
 * looking for one had to scroll through three hundred lines of the other.
 */

export const commonShaderFunctions = `
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
`

// TEN
export const tenVertexShader = `
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
`

export const tenFragmentShader = `
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
`

// REN
export const renVertexShader = `
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
`

export const renFragmentShader = `
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
`

// ON
export const onVertexShader = `
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
`

export const onFragmentShader = `
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
`

// FLUX (Gyo, Ko, Ryu)
export const fluxVertexShader = `
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
`

export const fluxFragmentShader = `
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
`

// EN (Depth Fade)
export const enVertexShader = `
  varying vec2 vUv;
  varying vec4 vScreenPos;
  void main() {
    vUv = uv;
    vScreenPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vScreenPos;
  }
`

export const enFragmentShader = `
  #include <packing>
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
`
