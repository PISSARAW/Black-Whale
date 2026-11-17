import { DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three'

/** The two brands are attached to the skull, on both anatomical sides. */
export function createFishBrand(sun: boolean) {
  const root = new Group()
  root.name = sun ? 'indoor-fish-sun-brand' : 'indoor-fish-moon-brand'
  const material = new ShaderMaterial({
    uniforms: { sun: { value: sun ? 1 : 0 }, power: { value: 1 } },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexShader:
      'varying vec2 uvMark;void main(){uvMark=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 uvMark;uniform float sun;uniform float power;
    void main(){vec2 p=(uvMark-.5)*2.;float r=length(p);float a=atan(p.y,p.x);
    float disc=1.-smoothstep(.39,.43,r);
    float rays=(1.-smoothstep(.09,.19,abs(sin(a*4.))))*smoothstep(.48,.52,r)*(1.-smoothstep(.76,.8,r));
    float moon=(1.-smoothstep(.63,.67,r))*smoothstep(.52,.56,length(p-vec2(.32,.18)));
    float shape=mix(moon,max(disc,rays),sun);if(shape<.01)discard;
    vec3 c=mix(vec3(.65,.87,1.),vec3(1.,.58,.13),sun);
    gl_FragColor=vec4(c*(.8+power*.4),shape);}`,
  })
  for (const side of [-1, 1]) {
    const mark = new Mesh(new PlaneGeometry(0.68, 0.68), material)
    mark.position.set(-1.18, 0.13, side * 0.255)
    root.add(mark)
  }
  return { root, material }
}
