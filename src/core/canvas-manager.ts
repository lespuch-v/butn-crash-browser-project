/**
 * Manages the canvas element — sizing, DPI scaling, and context.
 */
export class CanvasManager {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  /** Logical (CSS) width/height */
  public width: number = 0;
  public height: number = 0;

  /** Device pixel ratio for crisp rendering */
  public dpr: number = 1;
  public cameraX: number = 0;
  public cameraY: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas #${canvasId} not found`);

    this.ctx = this.canvas.getContext('2d')!;
    if (!this.ctx) throw new Error('Could not get 2d context');

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Set actual canvas pixel dimensions (for crisp rendering)
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    // Scale context so we can draw in logical pixels
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  /** Clear entire canvas */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /** Fill canvas with a color */
  fill(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** How many grid columns fit on screen */
  gridCols(cellSize: number): number {
    return Math.ceil(this.width / cellSize);
  }

  /** How many grid rows fit on screen */
  gridRows(cellSize: number): number {
    return Math.ceil(this.height / cellSize);
  }

  /** Pan camera in world-space pixels */
  panBy(dx: number, dy: number): void {
    this.cameraX += dx;
    this.cameraY += dy;
  }

  /** Pan camera by full grid cells */
  panByCells(colDelta: number, rowDelta: number, cellSize: number): void {
    this.panBy(colDelta * cellSize, rowDelta * cellSize);
  }

  /** Convert screen-space pixel to world-space pixel */
  screenToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: x + this.cameraX,
      y: y + this.cameraY,
    };
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
  }
}
