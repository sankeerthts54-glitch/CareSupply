import React, { useEffect, useRef } from 'react';

// Helper to parse hex color to [r, g, b] in 0..1
function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16 & 255) / 255, (num >> 8 & 255) / 255, (num & 255) / 255];
}

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_time, u_speed, u_softness, u_ribbons, u_angle, u_amplitude, u_scale, u_contrast, u_grain, u_yfocus, u_bgalpha, u_colorCount;
uniform vec3 u_bg, u_c0, u_c1, u_c2, u_c3, u_c4;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

vec3 pick(float i) {
  float k = mod(i, u_colorCount);
  if (k < 0.5) return u_c0;
  if (k < 1.5) return u_c1;
  if (k < 2.5) return u_c2;
  if (k < 3.5) return u_c3;
  return u_c4;
}

// Smooth multi-stop gradient along curtain height
vec3 ramp(float h) {
  float n = max(u_colorCount - 1.0, 1.0);
  float s = clamp(h, 0.0, 1.0) * n;
  float i = floor(s);
  float f = s - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(pick(i), pick(min(i + 1.0, n)), f);
}

void main() {
  float aspect = u_res.x / max(u_res.y, 1.0);
  float x = v_uv.x * aspect;
  float y = v_uv.y;
  float t = u_time * u_speed;
  float sc = u_scale;
  float tilt = tan(radians(u_angle)) * (x - 0.5 * aspect);
  vec3 A = vec3(0.0);
  float occ = 0.0;

  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    if (fi >= u_ribbons) break;
    float depth = 1.0 / (1.0 + fi * 0.85); // farther curtains dimmer
    float lt = t * (0.8 + fi * 0.22) + fi * 17.0;
    float lx = x * sc + fi * 4.31 + t * 0.06 * (1.0 + fi * 0.4); // slow lateral drift, parallax
    
    // undulating arc path (2 octaves of drifting 1D noise)
    float und = (noise(vec2(lx * 0.5, lt * 0.11)) - 0.5) * 1.5
              + (noise(vec2(lx * 1.3 + 37.0, lt * 0.17)) - 0.5) * 0.5;
    float edge = u_yfocus + tilt + fi * 0.14 + und * u_amplitude;
    float d = y - edge; // + above the bright lower border

    // ray shear: rays lean and gently curve along the curtain
    float lean = (noise(vec2(lx * 0.33 + 11.0, lt * 0.07)) - 0.5) * 0.6;
    float rx = lx + d * lean;

    // vertical ray striations: ridged high-frequency x noise -> needle filaments
    float rA = 1.0 - abs(2.0 * noise(vec2(rx * 9.0, fi * 13.1 + lt * 0.20 + d * 0.4)) - 1.0);
    float rB = 1.0 - abs(2.0 * noise(vec2(rx * 24.0 + 31.0, fi * 7.7 + lt * 0.33 + d * 0.6)) - 1.0);
    float ray = rA * 0.58 + rB * 0.42;
    ray = pow(clamp(ray, 0.0, 1.0), mix(4.5, 1.6, u_softness) * u_contrast);

    // varied ray heights: some rays shoot higher
    float lenVar = noise(vec2(lx * 1.9 + 71.0, lt * 0.13));
    float tall = (0.22 + 0.45 * lenVar * (0.4 + 0.6 * ray)) * (1.0 - fi * 0.10);

    // curtain folds: bright knots and dim gaps along the arc
    float fold = noise(vec2(lx * 0.9 + 131.0, lt * 0.09));
    fold = 0.15 + 1.9 * fold * fold;

    // vertical envelope: bright lower border, long exponential fade upward, soft atmospheric bleed below
    float bleed = mix(0.02, 0.09, u_softness);
    float up = exp(-max(d, 0.0) / tall);
    float dn = mix(exp(min(d, 0.0) / bleed), exp(min(d, 0.0) / (bleed * 4.0)), 0.18);
    float body = up * dn * mix(0.08, 1.0, ray);
    float bw = mix(0.008, 0.05, u_softness);
    float border = exp(-d * d / (bw * bw)) * mix(0.5, 1.0, ray) * 0.9;
    float h = pow(clamp(max(d, 0.0) / tall, 0.0, 1.0), 0.8); // height -> color grade
    float amp = depth * fold * (body * (1.0 + 0.8 * h) + border);

    // atmospheric perspective: farther curtains drift cooler/bluer
    vec3 tint = mix(vec3(1.0), vec3(0.78, 0.92, 1.08), min(fi * 0.30, 0.8));
    A += ramp(h) * tint * amp;
    occ += amp;
  }

  // filmic compression: keeps hue, prevents additive blowout
  A = 1.0 - exp(-A * 1.5);

  // background: subtle vertical depth + vignette
  vec2 vc = (v_uv - 0.5) * vec2(1.15, 1.25);
  float vig = 1.0 - 0.30 * dot(vc, vc);
  vec3 col = u_bg * (0.80 + 0.50 * exp(-y * 2.4)) * vig;

  // sparse twinkling stars (only when bg is opaque, hidden behind bright aurora)
  vec2 px = v_uv * u_res;
  float sh = hash(floor(px / 3.0));
  float star = smoothstep(0.9982, 1.0, sh) * (0.35 + 0.30 * sin(u_time * (0.4 + sh * 2.0) + sh * 40.0));
  star *= u_bgalpha * (1.0 - clamp(occ * 2.0, 0.0, 1.0)) * (0.3 + 0.7 * y);
  col += star * vec3(0.8, 0.9, 1.0);
  col += A;

  // film grain + banding dither
  col += (hash(px + fract(t) * 61.7) - 0.5) * (u_grain + 0.008);
  float lum = max(A.r, max(A.g, A.b));
  float alpha = clamp(max(u_bgalpha, lum * 1.3), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

export const AuroraFlow = ({
  colors = ['#17e8a8', '#2fc3f2', '#9a6cf8'], // Default Aurora Flow palette
  bg = '#040a16',                             // Deep night sky
  bgAlpha = 1.0,
  speed = 0.45,
  softness = 0.65,
  ribbons = 3,
  angle = 7,
  amplitude = 0.3,
  scale = 1.4,
  contrast = 1.3,
  grain = 0.05,
  yFocus = 0.36,
  className = '',
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false }) ||
               canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported for AuroraFlow');
      return;
    }

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen triangle
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Uniform helpers
    const uniforms = new Map();
    const getUniform = (name) => {
      if (!uniforms.has(name)) {
        uniforms.set(name, gl.getUniformLocation(program, name));
      }
      return uniforms.get(name);
    };

    const set1f = (name, val) => {
      const loc = getUniform(name);
      if (loc) gl.uniform1f(loc, val);
    };
    const set2f = (name, x, y) => {
      const loc = getUniform(name);
      if (loc) gl.uniform2f(loc, x, y);
    };
    const setColor = (name, hex) => {
      const loc = getUniform(name);
      if (loc) {
        const [r, g, b] = hexToRgb(hex);
        gl.uniform3f(loc, r, g, b);
      }
    };

    // Apply uniforms
    const updateUniforms = () => {
      const colorStops = colors.slice(0, 5);
      set1f('u_colorCount', colorStops.length);
      ['u_c0', 'u_c1', 'u_c2', 'u_c3', 'u_c4'].forEach((uniformName, idx) => {
        const color = colorStops[Math.min(idx, colorStops.length - 1)];
        setColor(uniformName, color);
      });

      setColor('u_bg', bg);
      set1f('u_bgalpha', bgAlpha);
      set1f('u_speed', speed);
      set1f('u_softness', softness);
      set1f('u_ribbons', Math.round(ribbons));
      set1f('u_angle', angle);
      set1f('u_amplitude', amplitude);
      set1f('u_scale', scale);
      set1f('u_contrast', contrast);
      set1f('u_grain', grain);
      set1f('u_yfocus', yFocus);
    };

    updateUniforms();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(container.clientWidth * dpr));
      const height = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        set2f('u_res', width, height);
      }
    };

    resize();

    let animId = null;
    let isVisible = true;
    const startTime = performance.now();

    const render = () => {
      if (isVisible) {
        const elapsed = (performance.now() - startTime) / 1000;
        set1f('u_time', elapsed);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isVisible) {
        isVisible = true;
        animId = requestAnimationFrame(render);
      } else if (!entry.isIntersecting && isVisible) {
        isVisible = false;
        if (animId) cancelAnimationFrame(animId);
      }
    });
    intersectionObserver.observe(container);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.remove();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
  }, [colors, bg, bgAlpha, speed, softness, ribbons, angle, amplitude, scale, contrast, grain, yFocus]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};

export default AuroraFlow;
