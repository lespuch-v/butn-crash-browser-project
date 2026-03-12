import {
  buildButtonShaderFragmentSource,
  DEFAULT_BUTTON_SHADER,
  getButtonShader,
  VERTEX_SHADER_WEBGL1,
  VERTEX_SHADER_WEBGL2,
  type ButtonShaderPreset,
} from '@models/button-shader';

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

interface ShaderProgram {
  program: WebGLProgram;
  positionLocation: number;
  timeUniform: WebGLUniformLocation | null;
  resolutionUniform: WebGLUniformLocation | null;
  mouseUniform: WebGLUniformLocation | null;
  fadeInUniform: WebGLUniformLocation | null;
}

function isWebGL2Context(gl: GLContext): gl is WebGL2RenderingContext {
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
}

class ButtonShaderRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: GLContext | null = null;
  private programs = new Map<ButtonShaderPreset, ShaderProgram | null>();
  private vertexBuffer: WebGLBuffer | null = null;
  private useWebGL2 = false;
  private warned = new Set<string>();

  render(
    ctx: CanvasRenderingContext2D,
    shader: ButtonShaderPreset,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (!this.ensureContext()) {
      this.renderFallback(ctx, shader, x, y, width, height);
      return;
    }

    const gl = this.gl!;
    const program = this.getProgram(shader) ?? this.getProgram(DEFAULT_BUTTON_SHADER);
    if (!program || !this.canvas) {
      this.renderFallback(ctx, shader, x, y, width, height);
      return;
    }

    const pixelWidth = Math.max(1, Math.ceil(width));
    const pixelHeight = Math.max(1, Math.ceil(height));

    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }

    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(program.positionLocation);
    gl.vertexAttribPointer(program.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(program.timeUniform, this.timeSeconds());
    gl.uniform3f(program.resolutionUniform, pixelWidth, pixelHeight, 1);
    gl.uniform4f(program.mouseUniform, 0, 0, 0, 0);
    gl.uniform1f(program.fadeInUniform, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    ctx.drawImage(this.canvas, x, y, width, height);
  }

  private ensureContext(): boolean {
    if (this.gl && this.canvas && this.vertexBuffer) {
      return true;
    }

    if (typeof document === 'undefined') {
      return false;
    }

    this.canvas = document.createElement('canvas');
    const webgl2 = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (webgl2) {
      this.gl = webgl2;
      this.useWebGL2 = true;
    } else {
      const webgl1 = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });

      if (!webgl1) {
        this.canvas = null;
        return false;
      }

      this.gl = webgl1;
      this.useWebGL2 = false;
    }

    this.vertexBuffer = this.gl.createBuffer();
    if (!this.vertexBuffer) {
      this.warnOnce('buffer', 'Button shader renderer could not allocate a vertex buffer.');
      this.gl = null;
      this.canvas = null;
      return false;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]),
      this.gl.STATIC_DRAW,
    );

    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }

  private getProgram(shader: ButtonShaderPreset): ShaderProgram | null {
    if (this.programs.has(shader)) {
      return this.programs.get(shader) ?? null;
    }

    const program = this.compileProgram(shader);
    this.programs.set(shader, program);
    return program;
  }

  private compileProgram(shader: ButtonShaderPreset): ShaderProgram | null {
    if (!this.gl) return null;

    const vertexSource = this.useWebGL2 ? VERTEX_SHADER_WEBGL2 : VERTEX_SHADER_WEBGL1;
    const fragmentSource = buildButtonShaderFragmentSource(shader, this.useWebGL2);

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource, shader);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource, shader);
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = this.gl.createProgram();
    if (!program) {
      this.warnOnce(shader, `Button shader "${shader}" could not create a WebGL program.`);
      return null;
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program) ?? 'Unknown link error';
      this.warnOnce(shader, `Button shader "${shader}" failed to link: ${info}`);
      this.gl.deleteProgram(program);
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      return null;
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return {
      program,
      positionLocation: this.gl.getAttribLocation(program, 'position'),
      timeUniform: this.gl.getUniformLocation(program, 'iTime'),
      resolutionUniform: this.gl.getUniformLocation(program, 'iResolution'),
      mouseUniform: this.gl.getUniformLocation(program, 'iMouse'),
      fadeInUniform: this.gl.getUniformLocation(program, 'iFadeIn'),
    };
  }

  private compileShader(type: number, source: string, shader: ButtonShaderPreset): WebGLShader | null {
    if (!this.gl) return null;

    const compiled = this.gl.createShader(type);
    if (!compiled) {
      this.warnOnce(shader, `Button shader "${shader}" could not allocate a shader stage.`);
      return null;
    }

    this.gl.shaderSource(compiled, source);
    this.gl.compileShader(compiled);

    if (!this.gl.getShaderParameter(compiled, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(compiled) ?? 'Unknown compile error';
      this.warnOnce(shader, `Button shader "${shader}" failed to compile: ${info}`);
      this.gl.deleteShader(compiled);
      return null;
    }

    return compiled;
  }

  private renderFallback(
    ctx: CanvasRenderingContext2D,
    shader: ButtonShaderPreset,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const accent = getButtonShader(shader).accentColor;
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(0.5, accent);
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  private timeSeconds(): number {
    if (typeof performance !== 'undefined') {
      return performance.now() * 0.001;
    }

    return Date.now() * 0.001;
  }

  private warnOnce(key: string, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(message);
  }
}

export const buttonShaderRenderer = new ButtonShaderRenderer();
