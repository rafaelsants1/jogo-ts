import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InputQueue, parseKeys } from '../src/terminal/input';

describe('parseKeys', () => {
  it('setas e WASD', () => {
    assert.deepEqual(parseKeys('\x1b[A\x1b[B\x1b[C\x1b[D'), ['UP', 'DOWN', 'RIGHT', 'LEFT']);
    assert.deepEqual(parseKeys('\x1bOA\x1bOB'), ['UP', 'DOWN']);
    assert.deepEqual(parseKeys('wWsS'), ['UP', 'UP', 'DOWN', 'DOWN']);
  });

  it('espaço, Enter, P, M, Q e Ctrl+C', () => {
    assert.deepEqual(parseKeys(' \rpmq\x03'), ['JUMP', 'CONFIRM', 'PAUSE', 'MENU', 'QUIT', 'QUIT']);
  });

  it('ignora teclas sem ação e sequências de escape desconhecidas', () => {
    assert.deepEqual(parseKeys('x\x1b[15~z\x1b[1;5A9'), []);
    assert.deepEqual(parseKeys('\x1b[H w'), ['JUMP', 'UP']);
  });
});

describe('InputQueue', () => {
  it('cada evento é consumido uma única vez', () => {
    const q = new InputQueue();
    q.push('JUMP');
    q.push('UP');
    assert.deepEqual(q.drain(), ['JUMP', 'UP']);
    assert.deepEqual(q.drain(), []);
  });
});
