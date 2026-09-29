// Native WebGL is used only to shade/depth-test the original scene meshes.
let renderer;
export function smoothSolids() {
  if (renderer) return renderer;
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('Scene AQ requires WebGL for smooth solid shading');
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(
    program,
    shader(
      gl.VERTEX_SHADER,
      `
 attribute vec3 position;attribute vec3 normal;
 uniform mat3 rotation;uniform vec4 screen;uniform vec4 basis;uniform float size;
 varying vec3 n;varying vec3 local;
 void main(){vec3 p=rotation*position*size;local=position;n=rotation*normal;
 vec2 xy=vec2(basis.x*p.x+basis.z*p.y,basis.y*p.x+basis.w*p.y)+screen.xy;
 gl_Position=vec4(xy.x/480.0-1.0,1.0-xy.y/270.0,-(p.z*screen.w+screen.z)/1200.0,1.0);}`,
    ),
  );
  gl.attachShader(
    program,
    shader(
      gl.FRAGMENT_SHADER,
      `
 precision mediump float;varying vec3 n;varying vec3 local;uniform vec3 color;uniform float time;
 void main(){vec3 nn=normalize(n);float light=.18+.82*max(0.0,dot(nn,normalize(vec3(-.3,-.65,.8))));
 float sheen=pow(max(0.0,dot(nn,normalize(vec3(.1,-.4,1.0)))),12.0)*.12;
 float band=.5+.5*sin(local.x*1.8+local.y*2.0+time*.17);
 vec3 lit=color*light+vec3(.025,.025,.05)+sheen;
 lit=mix(lit,lit.bgr,.16*band);gl_FragColor=vec4(clamp(lit,0.0,1.0),1.0);}`,
    ),
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const loc = {};
  for (const name of ['rotation', 'screen', 'basis', 'size', 'color', 'time'])
    loc[name] = gl.getUniformLocation(program, name);
  const pa = gl.getAttribLocation(program, 'position'),
    na = gl.getAttribLocation(program, 'normal'),
    cache = new Map();
  function buffer(mesh, type) {
    if (cache.has(mesh)) return cache.get(mesh);
    const data = [];
    for (const face of mesh.faces) {
      const a = mesh.vertices[face[0]],
        b = mesh.vertices[face[1]],
        c = mesh.vertices[face[2]];
      const u = b.map((v, i) => v - a[i]),
        v = c.map((v, i) => v - a[i]);
      const flat = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      for (let k = 1; k < face.length - 1; k++)
        for (const id of [face[0], face[k], face[k + 1]]) {
          const p = mesh.vertices[id];
          let n = flat;
          if (type === 0) n = p;
          if (type === 1) {
            const len = Math.hypot(p[0], p[1]);
            n = [p[0] - (p[0] / len) * 0.8, p[1] - (p[1] / len) * 0.8, p[2]];
          }
          if ((type === 2 || type === 3) && face.length === 4) {
            const fallback = mesh.vertices[face[0]],
              x = p[0] || fallback[0],
              z = p[2] || fallback[2];
            n = [x, type === 3 ? (Math.hypot(x, z) * 0.62) / 2.6 : 0, z];
          }
          data.push(...p, ...n);
        }
    }
    const result = { handle: gl.createBuffer(), count: data.length / 6 };
    gl.bindBuffer(gl.ARRAY_BUFFER, result.handle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    cache.set(mesh, result);
    return result;
  }
  renderer = {
    canvas,
    begin(t) {
      gl.useProgram(program);
      gl.viewport(0, 0, 960, 540);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(loc.time, t);
    },
    draw(mesh, type, size, rotation, color, matrix, depth) {
      const b = buffer(mesh, type);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.handle);
      gl.enableVertexAttribArray(pa);
      gl.vertexAttribPointer(pa, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(na);
      gl.vertexAttribPointer(na, 3, gl.FLOAT, false, 24, 12);
      gl.uniformMatrix3fv(loc.rotation, false, rotation);
      gl.uniform4f(loc.screen, matrix.e, matrix.f, depth, matrix.a);
      gl.uniform4f(loc.basis, matrix.a, matrix.b, matrix.c, matrix.d);
      gl.uniform1f(loc.size, size);
      gl.uniform3fv(
        loc.color,
        color.map((v) => v / 255),
      );
      gl.drawArrays(gl.TRIANGLES, 0, b.count);
    },
  };
  return renderer;
}
