import './style.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const floorEl = document.querySelector<HTMLElement>('#floor');
const levelEl = document.querySelector<HTMLElement>('#player-level');
const hpEl = document.querySelector<HTMLElement>('#hp');
const attackEl = document.querySelector<HTMLElement>('#attack');
const defenseEl = document.querySelector<HTMLElement>('#defense');
const goldEl = document.querySelector<HTMLElement>('#gold');
const resetButton = document.querySelector<HTMLButtonElement>('#reset');
const menuButton = document.querySelector<HTMLButtonElement>('#menu-button');
const menuRoot = document.querySelector<HTMLElement>('#game-menu');

if (!canvas || !floorEl || !levelEl || !hpEl || !attackEl || !defenseEl || !goldEl || !resetButton || !menuButton || !menuRoot) {
  throw new Error('DEEP LOOTのDOM要素が不足しています。');
}

const game = new Game(canvas, {
  floor: floorEl,
  level: levelEl,
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
  document.body.insertAdjacentHTML('beforeend', `<pre>起動エラー: ${message}</pre>`);
});
