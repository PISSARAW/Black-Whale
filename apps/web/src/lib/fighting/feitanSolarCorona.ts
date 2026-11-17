import type { EffectSceneOptions } from './fighterEffectScene'
import { feitanEase, SOLAR_ENTRY_FRAMES } from './feitanPresentation'

/** Plasma, limb glow and curved prominences surround the unchanged reference solar core. */
export function createFeitanSolarCorona(THREE: EffectSceneOptions['THREE']) {
  const root = new THREE.Group()
  root.name = 'rising-sun-corona'
  const geometry = new THREE.SphereGeometry(1.3, 32, 20)
  const material = new THREE.ShaderMaterial({
    uniforms: { solarTime: { value: 0 }, solarStrength: { value: 1 } },
    vertexShader: `
      uniform float solarTime;
      varying vec3 vSolarPosition;
      varying vec3 vSolarNormal;
      varying vec3 vSolarView;
      void main() {
        vSolarPosition = position;
        vSolarNormal = normalize(normalMatrix * normal);
        float wave = sin(position.y * 11.0 + solarTime * 3.0) * sin(position.x * 9.0 - solarTime * 2.0);
        vec3 p = position + normal * wave * 0.075;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vSolarView = -view.xyz;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float solarTime;
      uniform float solarStrength;
      varying vec3 vSolarPosition;
      varying vec3 vSolarNormal;
      varying vec3 vSolarView;
      void main() {
        vec3 p = vSolarPosition * 4.0;
        float a = sin(p.x + sin(p.y * 1.7 + solarTime * 0.7) + cos(p.z * 1.3 - solarTime * 0.4));
        float b = sin(p.y * 1.4 + cos(p.z * 1.8 + a * 1.2) - solarTime);
        float c = sin(p.z * 1.6 + sin(p.x * 1.2 + b) - solarTime * 0.6);
        float current = a * 0.5 + b * 0.3 + c * 0.2;
        float limb = pow(1.0 - abs(dot(normalize(vSolarNormal), normalize(vSolarView))), 1.7);
        float filament = 1.0 - smoothstep(0.0, 0.075, abs(current));
        vec3 colour = mix(vec3(1.0, 0.15, 0.015), vec3(1.0, 0.85, 0.29), filament);
        float alpha = (limb * 0.6 + filament * 0.18) * solarStrength;
        gl_FragColor = vec4(colour, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const shell = new THREE.Mesh(geometry, material)
  root.add(shell)
  const flareMaterial = new THREE.MeshBasicMaterial({
    color: 0xffa636,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const flares = Array.from({ length: 9 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 9 + Math.sin(i * 1.8) * 0.08
    const reach = 1.45 + Math.sin(i * 2.31) * 0.22
    const point = (radius: number, offset: number, z: number) =>
      new THREE.Vector3(Math.cos(angle + offset) * radius, Math.sin(angle + offset) * radius, z)
    const curve = new THREE.CatmullRomCurve3([
      point(1.02, -0.12, 0.05),
      point(reach * 0.91, -0.1, 0.13),
      point(reach, 0.12, Math.sin(i) * 0.12),
      point(1.15, 0.3, -0.05),
    ])
    const shape = new THREE.TubeGeometry(curve, 18, 0.018, 5, false)
    const mesh = new THREE.Mesh(shape, flareMaterial)
    root.add(mesh)
    return mesh
  })
  return {
    root,
    sync(age: number, options: { reduced: boolean; flashes: boolean }) {
      const time = options.reduced ? 0 : age / 60
      const arrival = options.reduced ? 1 : feitanEase(age / 12)
      const release = options.reduced
        ? 0
        : Math.sin(Math.min(1, age / SOLAR_ENTRY_FRAMES) * Math.PI)
      root.scale.setScalar(1 + release * 0.12)
      shell.rotation.y = time * 0.13
      material.uniforms.solarTime.value = time
      material.uniforms.solarStrength.value =
        arrival * (0.7 + (options.flashes ? release * 0.3 : 0))
      flareMaterial.opacity = arrival * 0.55
      flares.forEach((flare, i) => {
        flare.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.07)
        flare.rotation.z = time * (i % 2 ? 0.09 : -0.09)
      })
      root.userData.age = age
    },
    dispose() {
      root.removeFromParent()
      geometry.dispose()
      material.dispose()
      flares.forEach((flare) => flare.geometry.dispose())
      flareMaterial.dispose()
    },
  }
}
