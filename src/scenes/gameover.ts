import { OBSTACLES, characterAt } from "../content/characters";
import type { Action } from "../game/types";
import type { Screen } from "../terminal/screen";
import { BaseScene } from "./base-scene";
import type { RunResult, Transition } from "./scene";
import { ACCENT, DANGER, DIM, PANEL, TEXT, drawBox } from "./ui";

const BOX_W = 52;
const BOX_H = 16;
const FOOTER = "Enter: jogar de novo | M: menu | Q: sair";

export class GameOverScene extends BaseScene {
  constructor(private readonly result: RunResult) {
    super();
  }

  protected onTick(actions: readonly Action[]): Transition | null {
    for (const action of actions) {
      if (action === "CONFIRM")
        return { to: "play", characterIndex: this.result.characterIndex };
      if (action === "MENU")
        return { to: "menu", selected: this.result.characterIndex };
    }
    return null;
  }

  protected draw(screen: Screen): void {
    const r = this.result;
    const ch = characterAt(r.characterIndex);

    const x = Math.floor((screen.width - BOX_W) / 2);
    const y = Math.floor((screen.height - BOX_H) / 2);
    drawBox(screen, x, y, BOX_W, BOX_H, DANGER, PANEL, true);

    const title =
      r.cause === "caught"
        ? `${ch.villain.name} ${ch.villain.caughtText}`
        : "Você foi cancelado!";
    screen.textCentered(y + 2, title, DANGER);

    const mid = Math.floor(screen.width / 2);
    if (r.cause === "caught") {
      screen.spriteRows(
        mid - 6,
        y + 4,
        ch.villain.frames[0] ?? [],
        ch.villain.rowColors,
      );
      screen.spriteRows(
        mid + 1,
        y + 4,
        ch.player.frames[0] ?? [],
        ch.player.rowColors,
      );
    } else {
      screen.spriteRows(
        mid - 10,
        y + 4,
        ch.player.frames[0] ?? [],
        ch.player.rowColors,
      );
      screen.sprite(
        mid - 4,
        y + 4,
        OBSTACLES.HIGH.sprite,
        OBSTACLES.HIGH.color,
      );
    }

    screen.textCentered(y + 8, `SCORE: ${r.score}`, ACCENT);
    screen.textCentered(y + 9, `${ch.coin.label}: ${r.coins}`, TEXT);
    screen.textCentered(y + 10, `DIST: ${r.distance} m`, TEXT);
    screen.textCentered(y + 13, FOOTER, DIM);
  }
}
