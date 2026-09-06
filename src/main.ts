import './style.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const floorEl = document.querySelector<HTMLElement>('#floor');
const hpEl = document.querySelector<HTMLElement>('#hp');
const attackEl = document.querySelector<HTMLElement>('#attack');
const defenseEl = document.querySelector<HTMLElement>('#defense');
const goldEl = document.querySelector<HTMLElement>('#gold');
const resetButton = document.querySelector<HTMLButtonElement>('#reset');
const menuButton = document.querySelector<HTMLButtonElement>('#menu-button');
const menuRoot = document.querySelector<HTMLElement>('#game-menu');

if (!canvas || !floorEl || !hpEl || !attackEl || !defenseEl || !goldEl || !resetButton || !menuButton || !menuRoot) {
  throw new Error('DEEP LOOTのDOM要素が不足しています。');
}

const game = new Game(canvas, {
  floor: floorEl,
  hp: hpEl,
  attack: attackEl,
  defense: defenseEl,
  gold: goldEl,
}, menuRoot);

resetButton.addEventListener('click', () => game.reset());
menuButton.addEventListener('click', () => game.toggleMenu());

void game.start().catch((error: unknown) => {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  const context = canvas.getContext('2d');
  if (context) {
    context.save();
    context.fillStyle = '#151d25';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ff7a7a';
    context.font = 'bold 16px system-ui';
    context.fillText('起動エラー', 24, 36);
    context.fillStyle = '#ffffff';
    context.font = '13px monospace';
    context.fillText(message.slice(0, 88), 24, 62);
    context.restore();
  }
});
