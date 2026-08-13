import * as Three from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'

export class LensDirtPass extends Pass {
  public uniforms: {
    tDiffuse: { value: Three.Texture | null }
    tDirt: { value: Three.Texture | null }
    dirtIntensity: { value: number }
    threshold: { value: number }
    resolution: { value: Three.Vector2 }
  }
  public material: Three.ShaderMaterial
  public fsQuad: FullScreenQuad

  constructor(dirtTexture: Three.Texture, width: number = 800, height: number = 600) {
    super()

    this.uniforms = {
      tDiffuse: { value: null },
      tDirt: { value: dirtTexture },
      dirtIntensity: { value: 1.0 },
      threshold: { value: 0.7 },
      resolution: { value: new Three.Vector2(width, height) },
    }

    this.material = new Three.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDirt;
        uniform float dirtIntensity;
        uniform float threshold;
        uniform vec2 resolution;

        varying vec2 vUv;

        float getLuminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          
          // Scale UV to preserve texture aspect ratio (cover mode)
          vec2 dirtUv = vUv - 0.5;
          float aspect = resolution.x / resolution.y;
          if (aspect > 1.0) {
            dirtUv.x *= aspect;
          } else {
            dirtUv.y /= aspect;
          }
          dirtUv += 0.5;
          
          vec4 dirt = texture2D(tDirt, dirtUv);
          
          float lum = getLuminance(texel.rgb);
          float brightness = max(0.0, lum - threshold);
          
          // Scale brightness to avoid excessive blowing out, then multiply by dirt and intensity
          vec3 dirtColor = dirt.rgb * min(brightness * 2.0, 3.0) * dirtIntensity;
          
          gl_FragColor = vec4(texel.rgb + dirtColor, texel.a);
        }
      `,
    })

    this.fsQuad = new FullScreenQuad(this.material)
  }

  public render(
    renderer: Three.WebGLRenderer,
    writeBuffer: Three.WebGLRenderTarget,
    readBuffer: Three.WebGLRenderTarget,
  ) {
    this.uniforms['tDiffuse'].value = readBuffer.texture

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
    }

    this.fsQuad.render(renderer)
  }

  public setSize(width: number, height: number) {
    this.uniforms['resolution'].value.set(width, height)
  }
}
