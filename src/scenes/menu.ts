import { CHARACTERS } from '../content/characters';
import type { Action } from '../game/types';
import { textWidth, type Screen } from '../terminal/screen';
import { BaseScene } from './base-scene';
import type { Transition } from './scene';
import { ACCENT, BG, DIM, PANEL, TEXT, drawBox } from './ui';

const TITLE = 'C O R R E ,   B R A S Í L I A !';
const SUBTITLE = 'um endless runner satírico de terminal';
const FOOTER = '<- -> ou W/S: escolher  |  Enter: jogar  |  Q: sair';
const CARD_TOP = 5;
const CARD_H = 16;

export class MenuScene extends BaseScene {
  private selected: number;

  constructor(selected = 0) {
    super();
    this.selected = Math.min(Math.max(0, selected), CHARACTERS.length - 1);
  }

  protected onTick(actions: readonly Action[]): Transition | null {
    const n = CHARACTERS.length;
    for (const action of actions) {
      if (action === 'LEFT' || action === 'UP') this.selected = (this.selected + n - 1) % n;
      else if (action === 'RIGHT' || action === 'DOWN') this.selected = (this.selected + 1) % n;
      else if (action === 'CONFIRM') return { to: 'play', characterIndex: this.selected };
    }
    return null;
  }

  protected draw(screen: Screen): void {
    screen.textCentered(1, TITLE, ACCENT);
    screen.textCentered(2, SUBTITLE, DIM);

    const n = CHARACTERS.length;
    const colW = Math.min(30, Math.floor(screen.width / n));
    const startX = Math.floor((screen.width - colW * n) / 2);
    const frame = Math.floor(this.elapsedMs / 180) % 2;

    CHARACTERS.forEach((ch, i) => {
      const x0 = startX + i * colW;
      const selected = i === this.selected;
      const innerW = colW - 2;
      const center = (s: string): number => x0 + 1 + Math.floor((innerW - textWidth(s)) / 2);
      const spriteX = x0 + 1 + Math.floor((innerW - 5) / 2);

      drawBox(screen, x0, CARD_TOP, colW, CARD_H, selected ? ch.color : DIM, selected ? PANEL : BG, selected);

      const playerFrame = ch.player.frames[selected ? frame : 0] ?? [];
      screen.spriteRows(spriteX, CARD_TOP + 2, playerFrame, ch.player.rowColors);
      screen.text(center(ch.name), CARD_TOP + 6, ch.name, selected ? ch.color : TEXT);

      const coinLine = `${ch.coin.sprite[0] ?? ''} ${ch.coin.label}`;
      const coinX = center(coinLine);
      screen.sprite(coinX, CARD_TOP + 8, ch.coin.sprite, ch.coin.color);
      screen.text(coinX + textWidth(ch.coin.sprite[0] ?? '') + 1, CARD_TOP + 8, ch.coin.label, TEXT);

      screen.text(center('Vilão:'), CARD_TOP + 10, 'Vilão:', DIM);
      screen.text(center(ch.villain.name), CARD_TOP + 11, ch.villain.name, TEXT);
      const villainFrame = ch.villain.frames[selected ? frame : 0] ?? [];
      screen.spriteRows(spriteX, CARD_TOP + 12, villainFrame, ch.villain.rowColors);
    });

    screen.textCentered(CARD_TOP + CARD_H + 1, FOOTER, DIM);
  }
}
