// ==========================================
// Fond animé WebGL (CdC §4.2/§5.1) : ciel + herbe avec nuages qui dérivent,
// rendu par un shader GLSL. Repli automatique : si WebGL est indisponible,
// la fonction renvoie false et le dégradé CSS du terrain reste affiché.
// ==========================================

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec3 sky = vec3(0.61, 0.88, 0.94);
  vec3 grass = vec3(0.56, 0.81, 0.44);
  vec3 col = mix(grass, sky, smoothstep(0.30, 1.0, uv.y));
  float clouds = fbm(uv * vec2(3.0, 2.0) + vec2(u_time * 0.03, 0.0));
  float mask = smoothstep(0.55, 0.9, clouds) * smoothstep(0.45, 1.0, uv.y);
  col = mix(col, vec3(1.0), mask * 0.55);
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountWebGLBackground(container) {
  if (!container) return false;
  const canvas = document.createElement('canvas');
  canvas.className = 'webgl-bg';

  let gl = null;
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (e) {
    gl = null;
  }
  if (!gl) return false; // repli CSS

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false; // repli CSS

  container.insertBefore(canvas, container.firstChild);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = (container.clientWidth || 360) * dpr;
    canvas.height = (container.clientHeight || 300) * dpr;
  };
  resize();
  window.addEventListener('resize', resize);

  const start = performance.now();
  const frame = () => {
    if (canvas.offsetParent !== null) {
      // ne rend que quand le terrain est visible (scène de combat affichée)
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return true;
}
