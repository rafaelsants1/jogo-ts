import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COIN_SCORE,
  JUMP_MS,
  SPEED_COLS_PER_S,
  VILLAIN_CALM_MS,
  VILLAIN_CHASE_COL,
} from '../src/game/config';
import { createGame, distanceOf, isJumping, isVillainActive, scoreOf, update } from '../src/game/update';
import { TICK, makeState, run } from './helpers';

describe('estado inicial', () => {
  it('começa na pista do meio, sem pulo, sem vilão', () => {
    const s = createGame(42);
    assert.equal(s.lane, 1);
    assert.equal(isJumping(s), false);
    assert.equal(s.villain.phase, 'off');
    assert.equal(s.over, null);
  });

  it('rola a velocidade constante', () => {
    const s = run(makeState(), 30); // 1 segundo
    assert.equal(distanceOf(s), SPEED_COLS_PER_S);
  });
});

describe('troca de pista', () => {
  it('não passa da pista 0', () => {
    const s = update(makeState(), ['UP', 'UP', 'UP', 'UP'], TICK);
    assert.equal(s.lane, 0);
  });

  it('não passa da pista 2', () => {
    const s = update(makeState(), ['DOWN', 'DOWN', 'DOWN'], TICK);
    assert.equal(s.lane, 2);
  });

  it('cada ação move uma pista', () => {
    assert.equal(update(makeState(), ['UP'], TICK).lane, 0);
    assert.equal(update(makeState(), ['DOWN'], TICK).lane, 2);
    assert.equal(update(makeState(), ['UP', 'DOWN'], TICK).lane, 1);
  });

  it('pode trocar de pista no ar', () => {
    let s = update(makeState(), ['JUMP'], TICK);
    s = update(s, ['UP'], TICK);
    assert.equal(isJumping(s), true);
    assert.equal(s.lane, 0);
  });
});

describe('pulo', () => {
  const jumpTicks = Math.round(JUMP_MS / TICK); // 18 ticks = 600 ms

  it(`dura ${JUMP_MS} ms`, () => {
    const almost = run(makeState(), jumpTicks - 1, (t) => (t === 0 ? ['JUMP'] : []));
    assert.equal(isJumping(almost), true, 'ainda no ar antes de 600 ms');
    const done = update(almost, [], TICK);
    assert.equal(isJumping(done), false, 'aterrissa aos 600 ms');
  });

  it('não existe pulo duplo', () => {
    let s = update(makeState(), ['JUMP'], TICK);
    s = run(s, 5);
    const remaining = s.jumpMs;
    s = update(s, ['JUMP'], TICK);
    assert.ok(s.jumpMs < remaining, 'o segundo JUMP no ar não reinicia o pulo');
  });

  it('permite passar sobre obstáculo baixo', () => {
    const low = { kind: 'LOW' as const, lane: 1 as const, x: 20, hit: false };
    // O cavalete encosta no jogador com scroll entre 5 e 14 (ticks ~8 a ~21). Pula no tick 6.
    const jumped = run(makeState([low]), 40, (t) => (t === 6 ? ['JUMP'] : []));
    assert.equal(jumped.villain.phase, 'off');
    assert.equal(jumped.obstacles[0]?.hit, false);

    const notJumped = run(makeState([low]), 40);
    assert.equal(notJumped.obstacles[0]?.hit, true, 'sem pular, tropeça');
  });

  it('não permite passar sobre obstáculo alto', () => {
    const high = { kind: 'HIGH' as const, lane: 1 as const, x: 20, hit: false };
    const s = run(makeState([high]), 40, (t) => (t === 6 ? ['JUMP'] : []));
    assert.equal(s.over, 'crash');
  });
});

describe('colisão por pista', () => {
  it('obstáculo alto em outra pista não colide', () => {
    const high = { kind: 'HIGH' as const, lane: 0 as const, x: 20, hit: false };
    const s = run(makeState([high]), 60);
    assert.equal(s.over, null);
  });

  it('obstáculo alto na mesma pista encerra com "crash"', () => {
    const high = { kind: 'HIGH' as const, lane: 1 as const, x: 20, hit: false };
    const s = run(makeState([high]), 60);
    assert.equal(s.over, 'crash');
  });

  it('trocar para a pista de um obstáculo alto também colide', () => {
    const high = { kind: 'HIGH' as const, lane: 2 as const, x: 20, hit: false };
    const s = run(makeState([high]), 60, (t) => (t === 10 ? ['DOWN'] : []));
    assert.equal(s.over, 'crash');
  });
});

describe('coins', () => {
  it('coleta incrementa o contador e o score', () => {
    const coin = { lane: 1 as const, x: 20, elevated: false };
    const s = run(makeState([], [coin]), 30);
    assert.equal(s.coins, 1);
    assert.equal(s.coinItems.length, 0);
    assert.equal(scoreOf(s), distanceOf(s) + COIN_SCORE);
  });

  it('coin em outra pista não é coletada', () => {
    const coin = { lane: 0 as const, x: 20, elevated: false };
    const s = run(makeState([], [coin]), 30);
    assert.equal(s.coins, 0);
  });

  it('coin elevada só é pega pulando', () => {
    const coin = { lane: 1 as const, x: 20, elevated: true };
    assert.equal(run(makeState([], [coin]), 30).coins, 0);
    assert.equal(run(makeState([], [coin]), 30, (t) => (t === 6 ? ['JUMP'] : [])).coins, 1);
  });
});

describe('vilão', () => {
  const low = (x: number) => ({ kind: 'LOW' as const, lane: 1 as const, x, hit: false });

  it('o primeiro tropeço chama o vilão', () => {
    const s = run(makeState([low(20)]), 40);
    assert.equal(isVillainActive(s.villain), true);
    assert.equal(s.over, null);
  });

  it('o vilão corre 4 colunas atrás do jogador', () => {
    const s = run(makeState([low(20)]), 60);
    assert.equal(s.villain.phase, 'chasing');
    assert.equal(s.villain.x, VILLAIN_CHASE_COL);
  });

  it('segundo tropeço com o vilão ativo encerra com "caught"', () => {
    const s = run(makeState([low(20), low(40)]), 60);
    assert.equal(s.over, 'caught');
  });

  it(`some depois de ${VILLAIN_CALM_MS / 1000} s sem tropeço`, () => {
    let s = run(makeState([low(20)]), 30);
    assert.equal(isVillainActive(s.villain), true);
    s = run(s, Math.ceil(VILLAIN_CALM_MS / TICK));
    assert.equal(isVillainActive(s.villain), false, 'ficou para trás');
    s = run(s, 60);
    assert.equal(s.villain.phase, 'off', 'saiu da tela');
  });

  it('depois que o vilão sai, um novo tropeço chama de novo em vez de encerrar', () => {
    const farLow = low(20 + Math.ceil(((VILLAIN_CALM_MS + 2000) / 1000) * SPEED_COLS_PER_S));
    const s = run(makeState([low(20), farLow]), 30 * 12);
    assert.equal(s.over, null);
    assert.equal(isVillainActive(s.villain), true);
  });
});

describe('pausa', () => {
  it('P congela o jogo e P de novo retoma', () => {
    const paused = run(update(makeState(), ['PAUSE'], TICK), 30, () => ['UP']);
    assert.equal(paused.paused, true);
    assert.equal(paused.scroll, 0);
    assert.equal(paused.lane, 1, 'ações são ignoradas na pausa');
    const resumed = run(update(paused, ['PAUSE'], TICK), 30);
    assert.equal(resumed.paused, false);
    assert.ok(resumed.scroll > 0);
  });
});

describe('fim de jogo', () => {
  it('estado encerrado não muda mais', () => {
    const high = { kind: 'HIGH' as const, lane: 1 as const, x: 20, hit: false };
    const over = run(makeState([high]), 60);
    assert.equal(update(over, ['UP', 'JUMP'], TICK), over);
  });
});
