import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { coinBox, obstacleBox, overlaps, playerBox } from '../src/game/collision';
import { PLAYER_COL } from '../src/game/config';
import type { Box } from '../src/game/types';

const box = (lane: 0 | 1 | 2, x: number, y: number, w: number, h: number): Box => ({ lane, x, y, w, h });

describe('overlaps (AABB por pista)', () => {
  it('retângulos sobrepostos na mesma pista colidem', () => {
    assert.equal(overlaps(box(1, 0, 0, 5, 3), box(1, 4, 2, 4, 1)), true);
  });

  it('mesmo retângulo em pistas diferentes não colide', () => {
    assert.equal(overlaps(box(0, 0, 0, 5, 3), box(1, 0, 0, 5, 3)), false);
    assert.equal(overlaps(box(2, 0, 0, 5, 3), box(1, 0, 0, 5, 3)), false);
  });

  it('bordas encostadas não colidem', () => {
    assert.equal(overlaps(box(1, 0, 0, 5, 3), box(1, 5, 0, 4, 3)), false);
    assert.equal(overlaps(box(1, 0, 0, 5, 3), box(1, 0, 3, 5, 1)), false);
  });

  it('é simétrica', () => {
    const a = box(1, 2, 1, 5, 3);
    const b = box(1, 6, 3, 4, 1);
    assert.equal(overlaps(a, b), overlaps(b, a));
  });
});

describe('hitboxes das entidades', () => {
  const low = { kind: 'LOW' as const, lane: 1 as const, x: PLAYER_COL + 1, hit: false };
  const high = { kind: 'HIGH' as const, lane: 1 as const, x: PLAYER_COL + 1, hit: false };

  it('em pé, bate no obstáculo baixo; pulando, passa por cima', () => {
    assert.equal(overlaps(playerBox(1, 0, false), obstacleBox(low)), true);
    assert.equal(overlaps(playerBox(1, 0, true), obstacleBox(low)), false);
  });

  it('o obstáculo alto pega o jogador mesmo pulando', () => {
    assert.equal(overlaps(playerBox(1, 0, false), obstacleBox(high)), true);
    assert.equal(overlaps(playerBox(1, 0, true), obstacleBox(high)), true);
  });

  it('coin no chão: pega em pé; coin elevada: pega pulando', () => {
    const ground = { lane: 1 as const, x: PLAYER_COL, elevated: false };
    const up = { lane: 1 as const, x: PLAYER_COL, elevated: true };
    assert.equal(overlaps(playerBox(1, 0, false), coinBox(ground)), true);
    assert.equal(overlaps(playerBox(1, 0, false), coinBox(up)), false);
    assert.equal(overlaps(playerBox(1, 0, true), coinBox(up)), true);
  });

  it('a caixa do jogador acompanha o scroll do mundo', () => {
    const far = { ...low, x: PLAYER_COL + 50 };
    assert.equal(overlaps(playerBox(1, 0, false), obstacleBox(far)), false);
    assert.equal(overlaps(playerBox(1, 49, false), obstacleBox(far)), true);
  });
});
