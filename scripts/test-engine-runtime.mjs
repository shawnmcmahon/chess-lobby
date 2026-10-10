// Docker-free verification of .NET's real Lambda RuntimeSupport/ASP.NET adapter.
// This local Runtime API stub does not validate the Linux container or AWS infrastructure.
// Usage: node scripts/test-engine-runtime.mjs --dotnet /path/to/dotnet --assembly /path/to/ChessEngine.dll
// Requires STOCKFISH_PATH pointing to a native binary for the local OS.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
assert.ok(process.env.STOCKFISH_PATH, 'Set STOCKFISH_PATH to a local native Stockfish executable');
const key = randomBytes(32).toString('base64');
const pending = new Map();
const queue = [];
let nextResponse;
let logs = '';
function deliver() {
  if (!nextResponse || !queue.length) return;
  const job = queue.shift();
  nextResponse.writeHead(200, {
    'content-type': 'application/json', 'lambda-runtime-aws-request-id': job.id,
    'lambda-runtime-deadline-ms': String(Date.now() + 10_000),
    'lambda-runtime-invoked-function-arn': 'arn:aws:lambda:us-east-1:123456789012:function:local-test',
  });
  nextResponse.end(job.body);
  nextResponse = undefined;
}
const server = createServer(async (req, res) => {
  if (req.url === '/2018-06-01/runtime/invocation/next') {
    nextResponse = res;
    deliver();
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();
  const match = req.url.match(/^\/2018-06-01\/runtime\/invocation\/([^/]+)\/(response|error)$/);
  if (match) {
    const client = pending.get(match[1]);
    pending.delete(match[1]);
    if (client) { client.writeHead(200, { 'content-type': 'application/json' }); client.end(body); }
    res.writeHead(202); res.end(); return;
  }
  if (req.url === '/invoke') {
    const id = randomBytes(10).toString('hex');
    pending.set(id, res);
    queue.push({ id, body });
    deliver();
    return;
  }
  res.writeHead(404); res.end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = `127.0.0.1:${server.address().port}`;
const engine = spawn(option('--dotnet', 'dotnet'), [option('--assembly', 'apps/chess-engine/bin/Release/net10.0/ChessEngine.dll')], {
  env: { ...process.env, ENGINE_API_KEY: key, AWS_LAMBDA_FUNCTION_NAME: 'local-test', AWS_LAMBDA_RUNTIME_API: address, AWS_EXECUTION_ENV: 'AWS_Lambda_dotnet10', _HANDLER: 'ChessEngine', ASPNETCORE_ENVIRONMENT: 'Production' },
  windowsHide: true,
});
engine.stdout.on('data', chunk => { logs += chunk; });
engine.stderr.on('data', chunk => { logs += chunk; });
try {
  const check = spawn(process.execPath, ['scripts/test-engine-lambda.mjs', '--runtime', `http://${address}/invoke`], { env: { ...process.env, ENGINE_API_KEY: key }, stdio: 'inherit', windowsHide: true });
  const exit = await new Promise((resolve, reject) => { check.on('exit', resolve); check.on('error', reject); });
  assert.equal(exit, 0, logs);
  console.log('PASS: real .NET 10 Lambda runtime client on the local OS; Linux image and AWS checks remain separate');
} finally {
  // Only terminate the process tree created by this script, including its native engine child.
  if (process.platform === 'win32') {
    const { spawnSync } = await import('node:child_process');
    spawnSync('taskkill', ['/PID', String(engine.pid), '/T', '/F'], { windowsHide: true });
  } else engine.kill();
  server.closeAllConnections();
  server.close();
}
