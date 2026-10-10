// Estimate only; no AWS API calls. Rates checked 2026-10-09 for us-east-1 x86 on-demand.
const args = process.argv.slice(2);
function number(name, fallback) {
  const value = args.includes(name) ? Number(args[args.indexOf(name) + 1]) : fallback;
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be nonnegative`);
  return value;
}
const games = number('--games', 10);
const requests = games * number('--moves', 60);
const seconds = number('--billed-seconds', 2);
const coldStarts = Math.min(requests, games * number('--cold-starts-per-game', 0));
const coldSeconds = number('--cold-billed-seconds', seconds);
const totalSeconds = (requests - coldStarts) * seconds + coldStarts * coldSeconds;
const memoryGiB = number('--memory-mib', 2048) / 1024;
const ecrGiB = number('--retained-ecr-gib', 1);
const compute = totalSeconds * memoryGiB * 0.0000166667;
const requestCost = requests / 1_000_000 * 0.20;
const ecr = ecrGiB * 0.10;
// Estimate compact START/END/REPORT messages plus native cold-start diagnostics.
const logGiB = number('--log-bytes-per-request', 600) * requests / 2 ** 30 + coldStarts * 250 / 2 ** 30;
const logs = logGiB * 0.50 + logGiB * (7 / 30) * 0.03;
console.log(JSON.stringify({
  estimateOnly: true, region: 'us-east-1', requests, assumedBilledSecondsPerRequest: seconds,
  coldStarts, coldBilledSeconds: coldSeconds, estimatedTotalBilledSeconds: +totalSeconds.toFixed(3),
  lambdaComputeUSD: +compute.toFixed(6), lambdaRequestsUSD: +requestCost.toFixed(6), ecrStorageUSD: +ecr.toFixed(6),
  estimatedLogUSD: +logs.toFixed(6), engineMonthlyUSD: +(compute + requestCost + ecr + logs).toFixed(6),
  excludes: ['Free allowances and credits', 'Data transfer', 'Existing website, Convex, DNS and domain renewal'],
}, null, 2));
