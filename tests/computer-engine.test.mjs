import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { getBestMove } from '../convex/lib/computerEngine.ts';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.ENGINE_API_URL;
const originalKey = process.env.ENGINE_API_KEY;
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [name, value] of [['ENGINE_API_URL', originalUrl], ['ENGINE_API_KEY', originalKey]]) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});
test('Function URL trailing slash, server-side key, thinking time, and timeout signal', async () => {
  process.env.ENGINE_API_URL = 'https://example.lambda-url.us-east-1.on.aws/';
  process.env.ENGINE_API_KEY = 'test-server-key';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://example.lambda-url.us-east-1.on.aws/api/best-move');
    assert.equal(options.headers['X-Api-Key'], 'test-server-key');
    assert.deepEqual(JSON.parse(options.body), { fen, skill: 1, movetimeMs: 800 });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ bestMove: 'e7e5' });
  };
  assert.equal(await getBestMove(fen, 1, 800), 'e7e5');
});
for (const result of [401, 429, 503, 'illegal', 'timeout']) {
  test(`engine ${result} retains a legal fallback move`, async () => {
    process.env.ENGINE_API_URL = 'https://example.lambda-url.us-east-1.on.aws';
    globalThis.fetch = async () => {
      if (result === 'timeout') throw new DOMException('Timed out', 'TimeoutError');
      if (result === 'illegal') return Response.json({ bestMove: 'a1a8' });
      return new Response('', { status: result });
    };
    const move = await getBestMove(fen, 1, 800);
    assert.ok(new Chess(fen).move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] }));
  });
}
