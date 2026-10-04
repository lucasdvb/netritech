// Port a GetLayers gradient HTML into a mount function: (canvas, overrides, opts) => api|null.
// Shader, CONFIG keys and the render/pointer loop are kept as shipped; only the page
// chrome (UI panel, presets, persistence, fade, fps readout) is removed and window-size
// reads are pointed at the canvas.
const fs = require('fs');
function port(name) {
  const html = fs.readFileSync(`${__dirname}/../gl/${name}.html`, 'utf8');
  const start = html.indexOf('const CONFIG = {');
  const end = html.indexOf('/* ====== UI ====== */');
  let s = html.slice(start, end);
  const a = s.indexOf('/* ====== COLOR PRESETS'), b = s.indexOf('function hexToVec3');
  if (a < 0 || b < 0) throw new Error(name + ': presets/hex markers');
  s = s.slice(0, a) + s.slice(b);
  // split JS / template literals
  const parts = s.split('`');
  for (let i = 0; i < parts.length; i += 2) {
    let p = parts[i];
    p = p.replace(/\/\*[\s\S]*?\*\//g, '');
    p = p.replace(/^\s*\/\/.*$/gm, '');
    p = p.replace(/([;,{}\)\]'0-9a-z])\s+\/\/ .*$/gim, '$1');
    p = p.replace(/const canvas = document\.getElementById\('gl'\)\n?/g, '');
    p = p.replace(/if \(!gl\) \{[\s\S]*?\n\}/, 'if (!gl) return null');
    p = p.replace(/document\.getElementById\('(fade|ui-fps)'\)/g, '__dummy');
    p = p.replace(/e\.clientX/g, '(e.clientX - __R().left)').replace(/e\.clientY/g, '(e.clientY - __R().top)');
    p = p.replace(/\binnerWidth\b/g, '__W()').replace(/\binnerHeight\b/g, '__H()');
    p = p.replace(/\n{2,}/g, '\n');
    parts[i] = p;
  }
  s = parts.join('`');
  if (/localStorage|getElementById|ui-panel|no webgl2/.test(s)) throw new Error(name + ': leftover chrome ' + (s.match(/localStorage|getElementById|ui-panel|no webgl2/)||[])[0]);
  // CONFIG overrides right after the CONFIG literal
  s = s.replace(/^(const CONFIG = \{[\s\S]*?\n\})/, '$1\nObject.assign(CONFIG, __ovr || {})');
  // the final kick-off becomes conditional; reduced motion draws one still frame
  const k = s.lastIndexOf('requestAnimationFrame(frame)');
  s = s.slice(0, k) + `new ResizeObserver(() => resize()).observe(canvas)
if (__opts && __opts.still) { gl.useProgram(program); u1f('iTime', __opts.t || 6); u1f('iIntro', 1); u2f('iMouse', 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3) }
else requestAnimationFrame(frame)
return { gl }` + s.slice(k + 'requestAnimationFrame(frame)'.length);
  const head = `function (canvas, __ovr, __opts) {
const __dummy = { style: {}, textContent: '' }
const __R = () => canvas.getBoundingClientRect()
const __W = () => canvas.clientWidth || 1
const __H = () => canvas.clientHeight || 1
`;
  return head + s.trim() + '\n}';
}
// Strip every comment: JS via terser (layout kept readable), GLSL inside the shader
// template literals by hand (GLSL has no strings, so this is safe).
async function clean(fnSrc) {
  const { minify } = require('terser');
  const r = await minify('var __gl = ' + fnSrc, { compress: false, mangle: false, format: { comments: false, beautify: true, indent_level: 1 } });
  let code = r.code.replace(/^var __gl = /, '').replace(/;\s*$/, '');
  code = code.replace(/`#version 300 es[\s\S]*?`/g, (glsl) => glsl
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*?(?=\\n|`)/g, '')
    .replace(/(?:[ \t]*\\n)+/g, '\\n'));
  if (/\u2014/.test(code)) throw new Error('em dash left in gradient code');
  return code;
}
port.clean = clean;
module.exports = port;
if (require.main === module) {
  const out = {};
  for (const n of process.argv.slice(2)) { out[n] = port(n); console.log(n, out[n].length); }
  fs.writeFileSync(`${__dirname}/gl-ported.json`, JSON.stringify(out));
}
