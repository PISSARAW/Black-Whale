export const BASHO_FLAME_VERTEX = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
export const BASHO_FLAME_FRAGMENT = `varying vec2 vUv;
uniform float uTime; uniform float uSeed; uniform float uOpacity;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
float h=vUv.y;float sway=sin(h*5.-uTime*6.+uSeed)*.08*(h+.2);
float x=vUv.x-.5+sway;
float n=noise(vec2(x*6.+uSeed,h*4.-uTime*3.));
float w=.36*pow(1.-h,.65);
float a=(1.-smoothstep(w-.1,w+.04,abs(x)))*smoothstep(0.,.1,h)*(1.-smoothstep(.85,1.,h));
a*=.65+.35*n;
vec3 c=mix(vec3(1.,.16,.008),vec3(1.,.86,.28),clamp((.65-h)*1.6,0.,1.));
gl_FragColor=vec4(c,a*uOpacity);
}`
