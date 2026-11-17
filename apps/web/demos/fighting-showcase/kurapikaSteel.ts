import { ShaderMaterial } from 'three'

/** Directional steel highlights for the native link geometry, including instanced links. */
export function cinematicChainSteel() {
  return new ShaderMaterial({
    vertexShader: `
    varying vec3 vNormal;
    void main(){
      vec4 p=vec4(position,1.);
      vec3 n=normal;
      #ifdef USE_INSTANCING
        p=instanceMatrix*p;
        n=mat3(instanceMatrix)*n;
      #endif
      vNormal=normalize(normalMatrix*n);
      gl_Position=projectionMatrix*modelViewMatrix*p;
    }`,
    fragmentShader: `
    varying vec3 vNormal;
    void main(){
      vec3 n=normalize(vNormal), light=normalize(vec3(.4,.75,.8));
      float lit=max(0.,dot(n,light));
      float shine=pow(max(0.,dot(reflect(-light,n),vec3(0.,0.,1.))),28.);
      vec3 steel=mix(vec3(.17,.22,.27),vec3(.78,.86,.92),.25+lit*.75)+shine*vec3(.7,.75,.8);
      gl_FragColor=vec4(steel,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  })
}
