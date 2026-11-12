import { OBSTACLES, characterAt, type CharacterDef } from '../content/characters';
import {
  BODY_Y,
  ELEVATED_COIN_Y,
  FEET_Y,
  GROUND_COIN_Y,
  GROUND_Y,
  JUMP_RISE,
  LANE_ROWS,
  PLAYER_COL,
  VILLAIN_CALM_MS,
} from '../game/config';
import type { Action, GameState } from '../game/types';
import { createGame, distanceOf, isJumping, isVillainActive, scoreOf, update } from '../game/update';
import { textWidth, type Screen } from '../terminal/screen';
import { BaseScene, type Transition } from './scene';
import { BG, DANGER, DIM, GROUND, HUD_BG, LANE_BG, TEXT, drawBox } from './ui';

/** Primeira linha da faixa da pista 0 (linha 0 = HUD, linha 1 = status do vilão). */
const LANES_TOP = 2;
const HINT = 'Setas ou W/S: pista  |  Espaço: pular  |  P: pausar  |  Q: sair';
const CALM_BAR_W = 16;
const RUN_FRAME_MS = 150;

export class PlayScene extends BaseScene {
  private state: GameState;
  private readonly character: CharacterDef;

  constructor(
    private readonly characterIndex: number,
    seed: number,
  ) {
    super();
    this.character = characterAt(characterIndex);
    this.state = createGame(seed);
  }

  protected onTick(actions: readonly Action[], dtMs: number): Transition | null {
    this.state = update(this.state, actions, dtMs);
    const s = this.state;
    if (s.over === null) return null;
    return {
      to: 'gameover',
      result: {
        characterIndex: this.characterIndex,
        cause: s.over,
        score: scoreOf(s),
        coins: s.coins,
        distance: distanceOf(s),
      },
    };
  }

  protected draw(screen: Screen): void {
    this.renderHud(screen);
    this.renderVillainStatus(screen);
    for (let lane = 0; lane < 3; lane++) this.renderLane(screen, lane);
    screen.textCentered(LANES_TOP + 3 * LANE_ROWS, HINT, DIM);
    if (this.state.paused) this.renderPause(screen);
  }

  private renderHud(screen: Screen): void {
    const s = this.state;
    const ch = this.character;
    screen.fill(0, 0, screen.width, 1, ' ', TEXT, HUD_BG);
    const rest = ` | ${ch.coin.label}: ${s.coins} | DIST: ${distanceOf(s)} m | SCORE: ${scoreOf(s)}`;
    screen.text(1, 0, ch.hudName, ch.color);
    screen.text(1 + textWidth(ch.hudName), 0, rest, TEXT);
  }

  private renderVillainStatus(screen: Screen): void {
    const v = this.state.villain;
    const name = this.character.villain.name;
    if (isVillainActive(v)) {
      const label = `VILÃO: ${name}  `;
      screen.text(1, 1, label, DANGER);
      const remaining = Math.max(0, 1 - v.calmMs / VILLAIN_CALM_MS);
      const filled = Math.ceil(remaining * CALM_BAR_W);
      const barX = 1 + textWidth(label);
      for (let i = 0; i < CALM_BAR_W; i++) {
        screen.set(barX + i, 1, i < filled ? '█' : '░', i < filled ? DANGER : DIM);
      }
    } else if (v.phase === 'leaving') {
      screen.text(1, 1, `${name} ficou para trás`, DIM);
    }
  }

  private renderLane(screen: Screen, lane: number): void {
    const s = this.state;
    const ch = this.character;
    const top = LANES_TOP + lane * LANE_ROWS;
    const bg = LANE_BG[lane] ?? BG;
    const toScreen = (worldX: number): number => Math.floor(worldX - s.scroll);

    // Faixa e chão rolando.
    screen.fill(0, top, screen.width, GROUND_Y, ' ', TEXT, bg);
    const base = Math.floor(s.scroll);
    for (let x = 0; x < screen.width; x++) {
      screen.set(x, top + GROUND_Y, (base + x) % 8 === 0 ? '┴' : '─', GROUND, bg);
    }

    for (const c of s.coinItems) {
      if (c.lane !== lane) continue;
      const y = top + (c.elevated ? ELEVATED_COIN_Y : GROUND_COIN_Y);
      screen.sprite(toScreen(c.x), y, ch.coin.sprite, ch.coin.color);
    }

    for (const o of s.obstacles) {
      if (o.lane !== lane) continue;
      if (o.kind === 'LOW') {
        screen.sprite(toScreen(o.x), top + FEET_Y, OBSTACLES.LOW.sprite, o.hit ? DIM : OBSTACLES.LOW.color);
      } else {
        screen.sprite(toScreen(o.x), top + BODY_Y, OBSTACLES.HIGH.sprite, OBSTACLES.HIGH.color);
      }
    }

    if (lane !== s.lane) return;

    const frameIndex = Math.floor(s.timeMs / RUN_FRAME_MS) % 2;
    if (s.villain.phase !== 'off') {
      const vf = ch.villain.frames[frameIndex] ?? [];
      screen.spriteRows(Math.floor(s.villain.x), top + BODY_Y, vf, ch.villain.rowColors);
    }
    const jumping = isJumping(s);
    const pf = ch.player.frames[jumping ? 0 : frameIndex] ?? [];
    screen.spriteRows(PLAYER_COL, top + (jumping ? BODY_Y - JUMP_RISE : BODY_Y), pf, ch.player.rowColors);
  }

  private renderPause(screen: Screen): void {
    const w = 24;
    const h = 5;
    const x = Math.floor((screen.width - w) / 2);
    const y = Math.floor((screen.height - h) / 2);
    drawBox(screen, x, y, w, h, TEXT, HUD_BG, true);
    screen.textCentered(y + 1, 'PAUSADO', TEXT);
    screen.textCentered(y + 3, 'P: continuar', DIM);
  }
}
