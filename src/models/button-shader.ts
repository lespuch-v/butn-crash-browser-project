export const VERTEX_SHADER_WEBGL1 = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const VERTEX_SHADER_WEBGL2 = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT_WRAPPER_WEBGL1_TEMPLATE = `
precision mediump float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform float iFadeIn;

// Insert one of the fragment shaders below here.

void main() {
    vec4 fragColor;
    mainImage(fragColor, gl_FragCoord.xy);
    gl_FragColor = vec4(fragColor.rgb * iFadeIn, fragColor.a);
}
`;

export const FRAGMENT_WRAPPER_WEBGL2_TEMPLATE = `#version 300 es
precision mediump float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform float iFadeIn;

out vec4 outColor;

// Insert one of the fragment shaders below here.

void main() {
    vec4 fragColor;
    mainImage(fragColor, gl_FragCoord.xy);
    outColor = vec4(fragColor.rgb * iFadeIn, fragColor.a);
}
`;

export const BUTTON_SHADER_PRESETS = [
  'geometric-flow',
  'particle-drift',
  'math-grid',
  'universe-within',
  'warp-tunnel',
  'liquid-surface',
  'mandelbrot',
  'wave-interference',
  'cosmic-kaleidoscope',
  'rotating-tiles',
] as const;

export type ButtonShaderPreset = (typeof BUTTON_SHADER_PRESETS)[number];

export interface ButtonShaderDefinition {
  id: ButtonShaderPreset;
  label: string;
  accentColor: string;
  fragmentSource: string;
}

export const DEFAULT_BUTTON_SHADER: ButtonShaderPreset = 'geometric-flow';

export const BUTTON_SHADER_DEFINITIONS: readonly ButtonShaderDefinition[] = [
  {
    id: 'geometric-flow',
    label: 'Geometric Flow',
    accentColor: '#2dd4bf',
    fragmentSource: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    float t = iTime * 0.3;
    float d = length(p);
    float angle = atan(p.y, p.x);

    float spiral1 = sin(d * 10.0 - t * 2.0 + angle * 3.0) * 0.5 + 0.5;
    float spiral2 = sin(d * 8.0 + t * 1.5 + angle * 3.0) * 0.5 + 0.5;
    float spiral3 = sin(d * 12.0 - t * 1.8 + angle * 6.0) * 0.5 + 0.5;

    float rings = sin(d * 16.0 - t * 2.5) * 0.5 + 0.5;
    rings = smoothstep(0.35, 0.65, rings);

    float flow = mix(spiral1, spiral2, 0.5 + 0.2 * sin(t * 0.4));
    flow = mix(flow, spiral3, 0.2);
    flow = mix(flow, rings, 0.12);

    float segments = abs(sin(angle * 6.0 + t * 0.3));
    flow *= 0.88 + 0.12 * segments;

    vec3 col1 = vec3(0.05, 0.08, 0.11);
    vec3 col2 = vec3(0.06, 0.46, 0.40);
    vec3 col3 = vec3(0.08, 0.55, 0.48);

    vec3 col = mix(col1, col2, flow * 0.55);
    col = mix(col, col3, rings * 0.15 * (1.0 - d));
    col *= 0.75 + 0.45 * flow;

    float edgeGlow = smoothstep(0.03, 0.0, abs(fract(d * 4.0 - t * 0.5 + angle * 0.477) - 0.5) - 0.42);
    col += vec3(0.03, 0.22, 0.20) * edgeGlow * 0.3;

    col *= 1.0 - d * 0.45;

    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'particle-drift',
    label: 'Particle Drift',
    accentColor: '#34d399',
    fragmentSource: `
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;
    vec3 col = vec3(0.04, 0.06, 0.09);

    float t = iTime * 0.12;

    for(float i = 0.0; i < 8.0; i++) {
        float h1 = hash(vec2(i, 0.0));
        float h2 = hash(vec2(i, 1.0));
        float h3 = hash(vec2(i, 2.0));
        float h4 = hash(vec2(i, 3.0));
        float h5 = hash(vec2(i, 4.0));

        vec2 pos = vec2(
            fract(h1 + t * (0.015 + h3 * 0.025) + sin(t * 2.0 + h1 * 6.28) * 0.008),
            fract(h2 + t * (0.012 + h4 * 0.018) + cos(t * 1.8 + h2 * 6.28) * 0.006)
        );

        float baseSize = h3 < 0.3 ? 0.008 + 0.012 * h3 : (h3 < 0.7 ? 0.018 + 0.022 * h3 : 0.035 + 0.02 * h3);
        float twinkle = 0.6 + 0.4 * sin(t * (8.0 + h5 * 6.0) + h1 * 6.28);
        float size = baseSize * (0.8 + 0.4 * twinkle);

        vec2 diff = uv - pos;
        diff.x *= aspect;
        float d = length(diff);

        float glow = smoothstep(size * 2.5, size * 0.5, d);
        float core = smoothstep(size * 0.6, size * 0.1, d);
        float brightness = glow * 0.6 + core * 0.5;
        brightness *= twinkle;

        vec3 particleColor;
        if(h5 < 0.4) {
            particleColor = vec3(0.05, 0.42, 0.38);
        } else if(h5 < 0.7) {
            particleColor = vec3(0.04, 0.38, 0.45);
        } else {
            particleColor = vec3(0.08, 0.45, 0.52);
        }
        particleColor *= (0.7 + 0.3 * h4);

        col += particleColor * brightness * 0.5;
    }

    for(float i = 0.0; i < 4.0; i++) {
        float h1 = hash(vec2(i + 50.0, 0.0));
        float h2 = hash(vec2(i + 50.0, 1.0));
        vec2 pos = vec2(h1, h2);
        float twinkle = max(0.0, sin(t * (12.0 + h1 * 8.0) + h2 * 6.28));
        twinkle = twinkle * twinkle * twinkle;
        vec2 diff = uv - pos;
        diff.x *= aspect;
        float d = length(diff);
        float sparkle = smoothstep(0.012, 0.002, d) * twinkle;
        col += vec3(0.15, 0.5, 0.48) * sparkle * 0.3;
    }

    col += vec3(0.015, 0.03, 0.035) * (1.0 - uv.y);

    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'math-grid',
    label: 'Math Grid',
    accentColor: '#10b981',
    fragmentSource: `
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    float gridSize = 6.0;
    vec2 grid = fract(uv * gridSize) - 0.5;
    vec2 id = floor(uv * gridSize);

    float t = iTime * 0.4;
    float pulse = sin(t + hash(id) * 6.28) * 0.5 + 0.5;

    float lineX = smoothstep(0.02, 0.04, abs(grid.x));
    float lineY = smoothstep(0.02, 0.04, abs(grid.y));
    float gridLine = min(lineX, lineY);

    float node = length(grid);
    float nodeDot = smoothstep(0.12, 0.06, node) * pulse;

    vec3 col = vec3(0.05, 0.08, 0.10);
    col += vec3(0.02, 0.12, 0.10) * (1.0 - gridLine) * 0.4;
    col += vec3(0.06, 0.46, 0.40) * nodeDot * 0.6;

    float dist = length(grid);
    if(dist < 0.35) {
        col += vec3(0.03, 0.2, 0.18) * (1.0 - dist / 0.35) * pulse * 0.2;
    }

    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'universe-within',
    label: 'The Universe Within',
    accentColor: '#a78bfa',
    fragmentSource: `
#define S(a, b, t) smoothstep(a, b, t)
#define NUM_LAYERS 1.

float N21(vec2 p) {
    vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
    a += dot(a, a.yzx + 79.76);
    return fract((a.x + a.y) * a.z);
}

vec2 GetPos(vec2 id, vec2 offs, float t) {
    float n = N21(id+offs);
    float n1 = fract(n*10.);
    float n2 = fract(n*100.);
    float a = t+n;
    return offs + vec2(sin(a*n1), cos(a*n2))*.4;
}

float df_line( in vec2 a, in vec2 b, in vec2 p) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba) / dot(ba,ba), 0., 1.);
    return length(pa - ba * h);
}

float line(vec2 a, vec2 b, vec2 uv) {
    float r1 = .02;
    float r2 = .005;

    float d = df_line(a, b, uv);
    float d2 = length(a-b);
    float fade = S(1.5, .5, d2);

    fade += S(.05, .02, abs(d2-.75));
    return S(r1, r2, d)*fade;
}

float NetLayer(vec2 st, float n, float t) {
    vec2 id = floor(st)+n;

    st = fract(st)-.5;

    vec2 p[9];
    int i=0;
    for(float y=-1.; y<=1.; y++) {
        for(float x=-1.; x<=1.; x++) {
            p[i++] = GetPos(id, vec2(x,y), t);
        }
    }

    float m = 0.;
    float sparkle = 0.;

    for(int i=0; i<9; i++) {
        m += line(p[4], p[i], st);

        float d = length(st-p[i]);

        float s = (.005/(d*d));
        s *= S(1., .7, d);
        float pulse = sin((fract(p[i].x)+fract(p[i].y)+t)*5.)*.4+.6;
        pulse = pow(pulse, 20.);

        s *= pulse;
        sparkle += s;
    }

    m += line(p[1], p[3], st);
    m += line(p[1], p[5], st);
    m += line(p[7], p[5], st);
    m += line(p[7], p[3], st);

    float sPhase = (sin(t+n)+sin(t*.1))*.25+.5;
    sPhase += pow(sin(t*.1)*.5+.5, 50.)*5.;
    m += sparkle*sPhase;

    return m;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord-iResolution.xy*.5)/iResolution.y;
    vec2 M = iMouse.xy/iResolution.xy-.5;

    float t = iTime*.1;

    float s = sin(t);
    float c = cos(t);
    mat2 rot = mat2(c, -s, s, c);
    vec2 st = uv*rot;
    M *= rot*2.;

    float m = 0.;
    for(float i=0.; i<1.; i+=1./NUM_LAYERS) {
        float z = fract(t+i);
        float size = mix(15., 1., z);
        float fade = S(0., .6, z)*S(1., .8, z);

        m += fade * NetLayer(st*size-M*z, i, iTime);
    }

    vec3 baseCol = vec3(s, cos(t*.4), -sin(t*.24))*.4+.6;
    vec3 col = baseCol*m;

    col *= 1.-dot(uv,uv);
    t = mod(iTime, 230.);
    col *= S(0., 20., t)*S(224., 200., t);

    fragColor = vec4(col,1);
}
`,
  },
  {
    id: 'warp-tunnel',
    label: 'Warp Tunnel',
    accentColor: '#93c5fd',
    fragmentSource: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 r = iResolution.xy;
    float t = iTime;

    vec3 c;
    float l, z = t * 0.4;

    for(int i = 0; i < 3; i++) {
        vec2 uv, p = fragCoord.xy / r;
        uv = p;
        p -= 0.5;
        p.x *= r.x / r.y;
        z += 0.07;
        l = length(p);
        uv += p / l * (sin(z) + 1.0) * abs(sin(l * 5.0 - z - z));
        c[i] = 0.015 / length(mod(uv, 0.6) - 0.3);
    }

    float brightness = (c.r + c.g + c.b) / 3.0;

    vec3 col1 = vec3(0.03, 0.05, 0.10);
    vec3 col2 = vec3(0.15, 0.35, 0.55);
    vec3 col3 = vec3(0.6, 0.75, 0.9);

    vec3 col = mix(col1, col2, brightness * 0.7);
    col = mix(col, col3, smoothstep(0.4, 1.2, brightness));

    col.r += c.r * 0.08;
    col.g += c.g * 0.12;
    col.b += c.b * 0.2;

    float vignette = 1.0 - l * 0.25;
    col *= vignette;

    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'liquid-surface',
    label: 'Papercut Parallax',
    accentColor: '#6ee7b7',
    fragmentSource: `
vec2 warp(vec2 p) {
    p = (p + 3.0) * 4.0;
    float t = iTime * 0.4;

    for (int i = 0; i < 2; i++) {
        p += cos(p.yx * 3.0 + vec2(t, 1.57)) / 3.0;
        p += sin(p.yx + t + vec2(1.57, 0.0)) / 2.0;
        p *= 1.2;
    }

    return mod(p, 2.0) - 1.0;
}

float getHeight(vec2 p) {
    return length(warp(p)) * 0.7071;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - iResolution.xy * 0.5) / iResolution.y;
    vec3 bg = vec3(0.2, 0.2, 0.25);
    vec3 col = bg;

    float thresholds[4];
    thresholds[0] = 0.2;
    thresholds[1] = 0.4;
    thresholds[2] = 0.6;
    thresholds[3] = 0.75;

    vec3 colors[4];
    colors[0] = vec3(0.24, 0.57, 0.65);
    colors[1] = vec3(0.40, 0.75, 0.65);
    colors[2] = vec3(0.95, 0.60, 0.55);
    colors[3] = vec3(0.95, 0.85, 0.60);

    vec2 shadowOffset = vec2(-0.015, 0.015);

    float h = getHeight(uv);
    float hShadow = getHeight(uv + shadowOffset);

    for(int i = 0; i < 4; i++) {
        float thresh = thresholds[i];
        float mask = smoothstep(thresh - 0.01, thresh, h);
        float shadowMask = smoothstep(thresh - 0.01, thresh, hShadow);
        float shadow = shadowMask * (1.0 - mask);
        col = mix(col, col * 0.6, shadow);
        col = mix(col, colors[i], mask);
    }

    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233) * iTime)) * 43758.5453);
    col += (grain - 0.5) * 0.04;

    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'mandelbrot',
    label: 'Mandelbrot',
    accentColor: '#14b8a6',
    fragmentSource: `
float mandelbrot(vec2 c) {
    float c2 = dot(c, c);
    if (256.0 * c2 * c2 - 96.0 * c2 + 32.0 * c.x - 3.0 < 0.0) return 0.0;
    if (16.0 * (c2 + 2.0 * c.x + 1.0) - 1.0 < 0.0) return 0.0;

    const float B = 256.0;
    float n = 0.0;
    vec2 z = vec2(0.0);

    for (int i = 0; i < 96; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > B * B) break;
        n += 1.0;
    }

    if (n > 95.0) return 0.0;

    float sn = n - log2(log2(dot(z, z))) + 4.0;
    float al = smoothstep(-0.1, 0.0, sin(0.5 * 6.2831 * iTime));
    return mix(n, sn, al);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = (-iResolution.xy + 2.0 * fragCoord) / iResolution.y;
    float time = iTime;

    float zoo = 0.62 + 0.38 * cos(0.07 * time);
    float coa = cos(0.15 * (1.0 - zoo) * time);
    float sia = sin(0.15 * (1.0 - zoo) * time);
    zoo = pow(zoo, 8.0);

    vec2 xy = vec2(p.x * coa - p.y * sia, p.x * sia + p.y * coa);
    vec2 c = vec2(-0.745, 0.186) + xy * zoo;

    float l = mandelbrot(c);

    vec3 col;
    if (l < 0.5) {
        col = vec3(0.02, 0.04, 0.06);
    } else {
        vec3 emerald = vec3(0.06, 0.46, 0.40);
        vec3 teal = vec3(0.04, 0.35, 0.50);
        vec3 dark = vec3(0.02, 0.12, 0.14);

        float shade = l * 0.05;
        col = dark + 0.5 * cos(3.0 + shade + vec3(0.0, 0.6, 1.0));
        col = mix(col, emerald, 0.4 + 0.3 * sin(shade * 2.0));
        col = mix(col, teal, 0.2 * sin(shade * 3.0 + 1.0));
        col *= 0.7 + 0.3 * cos(shade * 0.5);
    }

    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'wave-interference',
    label: 'Wave Interference',
    accentColor: '#fb7185',
    fragmentSource: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    for(float i = 1.0; i < 6.0; i++) {
        uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
        uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
    }

    float intensity = 1.0 / abs(sin(iTime - uv.y - uv.x));
    vec3 col = vec3(0.12, 0.02, 0.01) * intensity;
    fragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'cosmic-kaleidoscope',
    label: 'Cosmic Kaleidoscope',
    accentColor: '#c084fc',
    fragmentSource: `
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    float r = length(uv);
    float theta = atan(uv.y, uv.x);

    theta = (3.0 / 4.0) * theta;

    uv.x = r * cos(theta);
    uv.y = r * sin(theta);

    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 2.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i * 0.4 + iTime * 0.4);

        d = sin(d * 8.0 + iTime) / 8.0;
        d = abs(d);
        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }

    fragColor = vec4(finalColor, 1.0);
}
`,
  },
  {
    id: 'rotating-tiles',
    label: 'Rotating Tiles',
    accentColor: '#60a5fa',
    fragmentSource: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float aspect_ratio = iResolution.y / iResolution.x;
    vec2 uv = fragCoord.xy / iResolution.x;
    uv -= vec2(0.5, 0.5 * aspect_ratio);
    float rot = radians(-30.0 - iTime);
    mat2 rotation_matrix = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    uv = rotation_matrix * uv;
    vec2 scaled_uv = 20.0 * uv;
    vec2 tile = fract(scaled_uv);
    float tile_dist = min(min(tile.x, 1.0 - tile.x), min(tile.y, 1.0 - tile.y));
    float square_dist = length(floor(scaled_uv));

    float edge = sin(iTime - square_dist * 20.0);
    edge = mod(edge * edge, edge / edge);

    float value = mix(tile_dist, 1.0 - tile_dist, step(1.0, edge));
    edge = pow(abs(1.0 - edge), 2.2) * 0.5;

    value = smoothstep(edge - 0.05, edge, 0.95 * value);

    value += square_dist * 0.1;
    value *= 0.6;
    fragColor = vec4(pow(value, 2.0), pow(value, 1.5), pow(value, 1.2), 1.0);
}
`,
  },
] as const;

const BUTTON_SHADER_MAP: Record<ButtonShaderPreset, ButtonShaderDefinition> = Object.fromEntries(
  BUTTON_SHADER_DEFINITIONS.map((shader) => [shader.id, shader]),
) as Record<ButtonShaderPreset, ButtonShaderDefinition>;

export function getButtonShader(shader: ButtonShaderPreset): ButtonShaderDefinition {
  return BUTTON_SHADER_MAP[shader];
}

export function buildButtonShaderFragmentSource(
  shader: ButtonShaderPreset,
  useWebGL2: boolean,
): string {
  const wrapper = useWebGL2
    ? FRAGMENT_WRAPPER_WEBGL2_TEMPLATE
    : FRAGMENT_WRAPPER_WEBGL1_TEMPLATE;

  return wrapper.replace(
    '// Insert one of the fragment shaders below here.',
    getButtonShader(shader).fragmentSource.trim(),
  );
}

export function randomButtonShader(): ButtonShaderPreset {
  const index = Math.floor(Math.random() * BUTTON_SHADER_PRESETS.length);
  return BUTTON_SHADER_PRESETS[index];
}
