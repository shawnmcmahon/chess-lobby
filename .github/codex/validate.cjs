const cp = require('node:child_process');
const profiles = {
  'chess-lobby': [['npm',['run','build:web']],['node',['--experimental-strip-types','--test','tests/computer-engine.test.mjs']],['pwsh',['-File','tests/deploy-engine-lambda.tests.ps1']],['dotnet',['test','tests/ChessEngine.Tests/ChessEngine.Tests.csproj','-c','Release']]],
  'community-tier-list': [['npm',['run','typecheck']],['npm',['test']],['npm',['run','lint']],['npm',['run','build']]],
  'adonea-metro-district': [['npm',['run','typecheck']],['npm',['run','verify']],['npm',['run','build']]],
  'tollgate-crossing-metro-district': [['npm',['run','typecheck']],['npm',['run','verify']],['npm',['run','build']]],
  'portfolio2.0': [['npx',['tsc','--noEmit']],['npm',['run','build']]],
  'pristine-management': [['npm',['run','lint']],['npm',['run','build']],['npm',['run','typecheck']],['npm',['test']],['npm',['run','synth']],['npm',['run','synth:dns']]],
};
const profile = profiles[process.argv[2]];
if (!profile) throw new Error('Unknown validation profile.');
for (const [command,args] of [['npm',['ci']],...profile]) {
  process.stdout.write(`Running ${command} ${args.join(' ')}\n`);
  cp.execFileSync(command,args,{cwd:process.argv[3],stdio:'inherit',env:{...process.env,VITE_CONVEX_URL:'https://placeholder.convex.cloud',NEXT_PUBLIC_CONVEX_URL:'https://example.convex.cloud'},timeout:12*60*1000});
}
