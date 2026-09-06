export class GameLoop {
  private lastTime = 0;
  private running = false;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly draw: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
  }

  private readonly frame = (time: number): void => {
    if (!this.running) return;

    const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    this.update(dt);
    this.draw();
    requestAnimationFrame(this.frame);
  };
}
