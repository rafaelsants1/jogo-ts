import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHARACTERS, OBSTACLES, type RunnerSprite } from '../src/content/characters';

/** ASCII imprimível ou box-drawing/blocos (U+2500 a U+259F). Nada de emoji. */
function allowedChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0x2500 && code <= 0x259f);
}

function assertSprite(lines: readonly string[], rows: number, cols: number, label: string): void {
  assert.equal(lines.length, rows, `${label}: ${rows} linhas`);
  for (const line of lines) {
    assert.equal([...line].length, cols, `${label}: linha "${line}" com ${cols} colunas`);
    for (const ch of line) assert.ok(allowedChar(ch), `${label}: caractere proibido "${ch}"`);
  }
}

function assertRunner(sprite: RunnerSprite, label: string): void {
  assert.ok(sprite.frames.length > 0, `${label}: tem quadros`);
  sprite.frames.forEach((f, i) => assertSprite(f, 3, 5, `${label} quadro ${i}`));
  assert.equal(sprite.rowColors.length, 3);
}

describe('sprites de characters.ts', () => {
  it('são 3 personagens', () => {
    assert.deepEqual(
      CHARACTERS.map((c) => c.id),
      ['bolsonaro', 'lula', 'renan'],
    );
  });

  for (const ch of CHARACTERS) {
    it(`${ch.id}: jogador 3x5, vilão 3x5, coin 1x3`, () => {
      assertRunner(ch.player, `${ch.id} jogador`);
      assertRunner(ch.villain, `${ch.id} vilão`);
      assertSprite(ch.coin.sprite, 1, 3, `${ch.id} coin`);
    });
  }

  it('obstáculo baixo 1x4 e alto 3x10', () => {
    assertSprite(OBSTACLES.LOW.sprite, 1, 4, 'obstáculo baixo');
    assertSprite(OBSTACLES.HIGH.sprite, 3, 10, 'obstáculo alto');
  });

  it('cores são RGB válidas', () => {
    const colors = CHARACTERS.flatMap((c) => [
      c.color,
      c.coin.color,
      ...c.player.rowColors,
      ...c.villain.rowColors,
    ]);
    for (const color of [...colors, OBSTACLES.LOW.color, OBSTACLES.HIGH.color]) {
      assert.equal(color.length, 3);
      for (const v of color) assert.ok(Number.isInteger(v) && v >= 0 && v <= 255);
    }
  });
});

describe('tratamento simétrico', () => {
  it('todos têm a mesma quantidade de quadros de jogador e de vilão', () => {
    const [first] = CHARACTERS;
    for (const ch of CHARACTERS) {
      assert.equal(ch.player.frames.length, first?.player.frames.length);
      assert.equal(ch.villain.frames.length, first?.villain.frames.length);
    }
  });

  it('cada personagem tem coin, rótulo e vilão próprios', () => {
    const labels = new Set(CHARACTERS.map((c) => c.coin.label));
    const villains = new Set(CHARACTERS.map((c) => c.villain.name));
    const coins = new Set(CHARACTERS.map((c) => c.coin.sprite.join('')));
    assert.equal(labels.size, CHARACTERS.length);
    assert.equal(villains.size, CHARACTERS.length);
    assert.equal(coins.size, CHARACTERS.length);
  });

  it('rótulos e vilões conforme a especificação', () => {
    const byId = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
    assert.equal(byId.bolsonaro?.coin.label, 'FUZIS');
    assert.equal(byId.bolsonaro?.villain.name, 'Alexandre de Moraes');
    assert.equal(byId.lula?.coin.label, 'PICANHAS');
    assert.equal(byId.lula?.villain.name, 'Petrolão');
    assert.equal(byId.renan?.coin.label, 'ONÇAS');
    assert.equal(byId.renan?.villain.name, 'Flávio Bolsonaro');
  });

  it('cada vilão tem a própria mensagem de captura', () => {
    const byId = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
    assert.equal(byId.bolsonaro?.villain.caughtText, 'te censurou!');
    assert.equal(byId.lula?.villain.caughtText, 'te prendeu!');
    assert.equal(byId.renan?.villain.caughtText, 'te miliciou!');
  });
});
