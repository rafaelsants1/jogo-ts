import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHUNK_LEN, COIN_SPACING, HIGH_W } from '../src/game/config';
import { Rng } from '../src/game/rng';
import { spawnChunk, type Chunk } from '../src/game/spawner';

function generate(seed: number, count: number): Chunk[] {
  const chunks: Chunk[] = [];
  let rng = seed;
  let x = 0;
  for (let i = 0; i < count; i++) {
    const chunk = spawnChunk(rng, x);
    chunks.push(chunk);
    rng = chunk.rng;
    x = chunk.nextX;
  }
  return chunks;
}

describe('Rng', () => {
  it('mesma seed gera a mesma sequência', () => {
    const a = new Rng(123);
    const b = new Rng(123);
    for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
  });

  it('seeds diferentes geram sequências diferentes', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const sa = Array.from({ length: 10 }, () => a.next());
    const sb = Array.from({ length: 10 }, () => b.next());
    assert.notDeepEqual(sa, sb);
  });

  it('int fica dentro do intervalo', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 6);
      assert.ok(v >= 3 && v <= 6);
    }
  });
});

describe('spawner', () => {
  it('mesma seed gera a mesma sequência de padrões', () => {
    assert.deepEqual(generate(2024, 50), generate(2024, 50));
  });

  it('seeds diferentes geram padrões diferentes', () => {
    assert.notDeepEqual(generate(1, 20), generate(2, 20));
  });

  it('cada bloco avança CHUNK_LEN colunas', () => {
    const chunks = generate(5, 10);
    chunks.forEach((c, i) => assert.equal(c.nextX, (i + 1) * CHUNK_LEN));
  });

  it('em qualquer coluna existe pelo menos uma pista sem obstáculo ALTO', () => {
    for (const seed of [1, 2, 3, 42, 999, 123456]) {
      const highs = generate(seed, 300)
        .flatMap((c) => c.obstacles)
        .filter((o) => o.kind === 'HIGH');
      const end = 300 * CHUNK_LEN;
      for (let col = 0; col < end; col++) {
        const blocked = new Set(highs.filter((o) => col >= o.x && col < o.x + HIGH_W).map((o) => o.lane));
        assert.ok(blocked.size < 3, `seed ${seed}, coluna ${col}: as 3 pistas bloqueadas`);
      }
    }
  });

  it('obstáculos ALTOS não passam da borda do bloco', () => {
    generate(77, 200).forEach((c, i) => {
      const start = i * CHUNK_LEN;
      for (const o of c.obstacles.filter((ob) => ob.kind === 'HIGH')) {
        assert.ok(o.x >= start && o.x + HIGH_W <= start + CHUNK_LEN);
      }
    });
  });

  it('coins vêm em fileiras de 3 a 6, na mesma pista, numa pista sem ALTO', () => {
    for (const c of generate(31, 200)) {
      assert.ok(c.coins.length >= 3 && c.coins.length <= 6);
      const lane = c.coins[0]?.lane;
      const elevated = c.coins[0]?.elevated;
      c.coins.forEach((coin, k) => {
        assert.equal(coin.lane, lane);
        assert.equal(coin.elevated, elevated);
        if (k > 0) assert.equal(coin.x - (c.coins[k - 1]?.x ?? 0), COIN_SPACING);
      });
      const highLanes = c.obstacles.filter((o) => o.kind === 'HIGH').map((o) => o.lane);
      assert.ok(!highLanes.includes(lane as 0 | 1 | 2));
    }
  });

  it('gera coins no chão e elevadas', () => {
    const coins = generate(8, 200).flatMap((c) => c.coins);
    assert.ok(coins.some((c) => c.elevated));
    assert.ok(coins.some((c) => !c.elevated));
  });
});
