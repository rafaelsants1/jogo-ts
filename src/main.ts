import { GameOverScene } from './scenes/gameover';
import { MenuScene } from './scenes/menu';
import { PlayScene } from './scenes/play';
import type { Scene, Transition } from './scenes/scene';
import { BG, DIM, TEXT, wrapText } from './scenes/ui';
import { InputQueue } from './terminal/input';
import { Screen, enterTerminal, restoreTerminal } from './terminal/screen';

const TICKS_PER_SECOND = 30;
const TICK_MS = 1000 / TICKS_PER_SECOND;
/** Limite de atraso acumulado (evita "espiral da morte" após o processo travar). */
const MAX_FRAME_MS = 250;
const MIN_COLS = 80;
const MIN_ROWS = 24;

if (!process.stdout.isTTY || !process.stdin.isTTY) {
  console.error(
    'Erro: este jogo precisa de um terminal interativo (TTY). ' +
      'Rode "npm start" direto num terminal, sem redirecionar a entrada ou a saída.',
  );
  process.exit(1);
}

const screen = new Screen(process.stdout, process.stdout.columns, process.stdout.rows);
const input = new InputQueue();
let scene: Scene = new MenuScene(0);
let running = true;
let timer: NodeJS.Timeout | null = null;
let lastTime = performance.now();
let accumulator = 0;

function newSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
}

function tooSmall(): boolean {
  return screen.width < MIN_COLS || screen.height < MIN_ROWS;
}

function applyTransition(t: Transition): void {
  switch (t.to) {
    case 'menu':
      scene = new MenuScene(t.selected);
      break;
    case 'play':
      scene = new PlayScene(t.characterIndex, newSeed());
      break;
    case 'gameover':
      scene = new GameOverScene(t.result);
      break;
  }
}

function render(): void {
  if (tooSmall()) {
    screen.clear(BG);
    const lines = wrapText('Aumente o terminal para pelo menos 80×24', Math.max(1, screen.width - 2));
    const top = Math.max(0, Math.floor((screen.height - lines.length - 2) / 2));
    lines.forEach((line, i) => screen.textCentered(top + i, line, TEXT));
    screen.textCentered(top + lines.length + 1, `atual: ${screen.width}×${screen.height}`, DIM);
  } else {
    scene.render(screen);
  }
  screen.flush();
}

/** Game loop de timestep fixo com acumulador; renderiza após cada ciclo de updates. */
function frame(): void {
  if (!running) return;
  const now = performance.now();
  accumulator += Math.min(now - lastTime, MAX_FRAME_MS);
  lastTime = now;

  let ticked = false;
  while (accumulator >= TICK_MS) {
    accumulator -= TICK_MS;
    ticked = true;
    // Ações acumuladas desde o último tick: só o primeiro tick do ciclo as recebe.
    const actions = input.drain();
    if (actions.includes('QUIT')) {
      shutdown(0);
      return;
    }
    // Terminal pequeno = jogo pausado: nenhuma cena avança.
    if (tooSmall()) continue;
    const transition = scene.tick(actions, TICK_MS);
    if (transition !== null) applyTransition(transition);
  }

  if (ticked) render();
  timer = setTimeout(frame, Math.max(1, TICK_MS - accumulator));
}

function onResize(): void {
  screen.resize(process.stdout.columns, process.stdout.rows);
  if (running) render();
}

/** Encerra pelo caminho que for (Q, Ctrl+C, sinal, erro). Seguro de chamar mais de uma vez. */
function shutdown(code: number, error?: unknown): void {
  if (running) {
    running = false;
    if (timer !== null) clearTimeout(timer);
    input.detach();
    process.stdout.off('resize', onResize);
  }
  restoreTerminal();
  if (error !== undefined) {
    console.error('O jogo encontrou um erro e foi encerrado:');
    console.error(error);
  }
  process.exitCode = code;
  // Deixa o stdout esvaziar; se algo segurar o processo, força a saída.
  setTimeout(() => process.exit(code), 300).unref();
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));
process.on('uncaughtException', (err) => shutdown(1, err));
process.on('unhandledRejection', (reason) => shutdown(1, reason));
process.on('exit', restoreTerminal);

try {
  enterTerminal();
  process.stdout.on('resize', onResize);
  input.attach(process.stdin);
  render();
  lastTime = performance.now();
  timer = setTimeout(frame, TICK_MS);
} catch (err) {
  shutdown(1, err);
}
