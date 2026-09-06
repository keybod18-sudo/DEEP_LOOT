export class Input {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
  }

  isDown(...keys: string[]): boolean {
    return keys.some((key) => this.down.has(key));
  }

  consumePress(...keys: string[]): boolean {
    const key = keys.find((candidate) => this.pressed.has(candidate));
    if (!key) return false;
    this.pressed.delete(key);
    return true;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.down.add(key);

    if (!event.repeat) {
      this.pressed.add(key);
    }

    if ([' ', 'arrowup', 'arrowleft', 'arrowright', 'tab'].includes(key)) {
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.down.delete(event.key.toLowerCase());
  };
}
