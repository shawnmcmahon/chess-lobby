// Exercise the actual image with AWS's Runtime Interface Emulator and HTTP API v2 events.
// Or smoke-test a deployed Function URL: --url https://... (ENGINE_API_KEY required).
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { Chess } from 'chess.js';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const image = option('--image', 'chess-engine-lambda:test');
const url = option('--url');
const runtime = option('--runtime');
const key = url || runtime ? process.env.ENGINE_API_KEY : randomBytes(32).toString('base64');
assert.ok(key, 'Set ENGINE_API_KEY to test the deployed endpoint');
const name = `chess-lambda-test-${randomBytes(5).toString('hex')}`;
let base;
const docker = (...command) => {
  const result = spawnSync('docker', command, { encoding: 'utf8', timeout: 120_000 });
  if (result.status !== 0) throw new Error(`docker ${command[0]} failed: ${result.stderr || result.error}`);
  return result.stdout.trim();
};

async function request(path, body, apiKey = key, method = 'POST') {
  const headers = { 'content-type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) };
  const started = performance.now();
  if (url) {
    const response = await fetch(`${url.replace(/\/+$/, '')}${path}`, { method, headers, ...(method === 'POST' ? { body } : {}), signal: AbortSignal.timeout(20_000) });
    return { status: response.status, body: await response.text(), elapsedMs: performance.now() - started };
  }
  const event = {
    version: '2.0', routeKey: '$default', rawPath: path, rawQueryString: '', headers,
    requestContext: {
      accountId: 'anonymous', apiId: 'local', domainName: 'local.lambda-url.us-east-1.on.aws', domainPrefix: 'local',
      http: { method, path, protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'lambda-engine-test' },
      requestId: randomBytes(8).toString('hex'), routeKey: '$default', stage: '$default', timeEpoch: Date.now(),
    },
    body, isBase64Encoded: false,
  };
  const response = await fetch(runtime || `${base}/2015-03-31/functions/function/invocations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event), signal: AbortSignal.timeout(20_000) });
  const result = await response.json();
  assert.ok(result.statusCode, JSON.stringify(result));
  return { status: result.statusCode, body: result.isBase64Encoded ? Buffer.from(result.body, 'base64').toString() : result.body, elapsedMs: performance.now() - started };
}

async function bestMove(chess, skill = 20, movetimeMs = 100) {
  const result = await request('/api/best-move', JSON.stringify({ fen: chess.fen(), skill, movetimeMs }));
  assert.equal(result.status, 200, result.body);
  const data = JSON.parse(result.body);
  assert.deepEqual(Object.keys(data), ['bestMove']);
  assert.match(data.bestMove, /^[a-h][1-8][a-h][1-8][qrbn]?$/);
  assert.ok(chess.move({ from: data.bestMove.slice(0, 2), to: data.bestMove.slice(2, 4), promotion: data.bestMove[4] }));
  return { ...result, move: data.bestMove };
}

try {
  if (!url && !runtime) {
    // Lambda uses a read-only filesystem and an unprivileged user, with only /tmp writable.
    docker('run', '--detach', '--name', name, '--platform', 'linux/amd64', '--read-only', '--tmpfs', '/tmp:rw,size=512m', '--user', '10001:10001', '--memory', '2g', '--cpus', '1', '-p', '127.0.0.1::8080', '-e', `ENGINE_API_KEY=${key}`, image);
    base = `http://${docker('port', name, '8080/tcp')}`;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { await fetch(`${base}/not-an-invocation`, { signal: AbortSignal.timeout(1000) }); break; }
      catch (error) { if (attempt === 99) throw error; await delay(200); }
    }
    const info = JSON.parse(docker('image', 'inspect', image))[0];
    assert.equal(info.Architecture, 'amd64');
    console.log(`Image: linux/${info.Architecture}, ${(info.Size / 1024 / 1024).toFixed(1)} MiB uncompressed (ECR compressed size must be measured after push)`);
  }
  const first = await bestMove(new Chess(), 20, 800);
  const warm = await bestMove(new Chess(), 1, 800);
  console.log(`First invocation: ${first.elapsedMs.toFixed(0)} ms; warm: ${warm.elapsedMs.toFixed(0)} ms (local timings are not AWS measurements)`);
  assert.equal((await request('/api/best-move', '{', null)).status, 401);
  assert.equal((await request('/api/best-move', '{', 'wrong')).status, 401);
  assert.equal((await request('/api/best-move', '{')).status, 400);
  assert.equal((await request('/api/best-move', JSON.stringify({ fen: new Chess().fen() + '\ngo infinite' }))).status, 400);
  assert.equal((await request('/api/best-move', ' '.repeat(4097))).status, 413);
  assert.equal((await request('/api/best-move', JSON.stringify({ fen: '8/8/8/8/8/8/8/8 w - - 0 1' }))).status, 400);
  const capped = await bestMove(new Chess(), 20, 30000);
  assert.ok(capped.elapsedMs < 8000, 'Thinking time must be clamped');
  const mate = new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1');
  await bestMove(mate, 20, 800);
  assert.ok(mate.isCheckmate(), 'Full-strength Stockfish must find mate in one');
  const game = new Chess();
  for (let ply = 0; ply < 12 && !game.isGameOver(); ply++) await bestMove(game, ply % 2 ? 1 : 20);
  if (!url && !runtime) {
    // Reap a dead process and restart it on a warm invocation.
    docker('exec', name, 'sh', '-c', 'for f in /proc/[0-9]*/comm; do if [ "$(cat "$f")" = stockfish ]; then pid=${f%/comm}; kill -9 "${pid##*/}"; fi; done');
    await bestMove(new Chess());
    docker('pause', name);
    await delay(1000);
    docker('unpause', name);
    await bestMove(new Chess());
    const source = docker('exec', name, 'sh', '-c', 'test -r /opt/licenses/stockfish/Copying.txt && test -r /opt/licenses/stockfish/source.tar.gz && ls /opt/licenses/stockfish/*.nnue');
    assert.ok(source.includes('.nnue'));
  }
  console.log('PASS: HTTP API v2/URL contract, native Stockfish legal moves and mate, skill levels, auth, malformed input, size limit, search cap, warm reuse, and game sequence' + (url || runtime ? '' : ', crash recovery, freeze/thaw, read-only/unprivileged runtime, GPL source packaging'));
} catch (error) {
  if (!url && !runtime) {
    const logs = spawnSync('docker', ['logs', name], { encoding: 'utf8' });
    console.error(logs.stdout, logs.stderr);
  }
  throw error;
} finally {
  if (!url && !runtime) {
    spawnSync('docker', ['rm', '--force', name], { encoding: 'utf8' });
  }
}
