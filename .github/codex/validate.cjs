const cp = require('node:child_process');
const fs = require('node:fs');
const chessTests = process.argv[2] === 'chess-lobby' ? fs.readdirSync(`${process.argv[3]}/tests`).filter(name=>/\.test\.mjs$/.test(name)).sort().map(name=>`tests/${name}`) : [];
const profiles = {
  'chess-lobby': [['node',['node_modules/typescript/bin/tsc','--project','convex/tsconfig.json','--noEmit']],['npm',['run','build:web']],['node',['--experimental-strip-types','--test',...chessTests]],['pwsh',['-File','tests/deploy-engine-lambda.tests.ps1']],['dotnet',['test','tests/ChessEngine.Tests/ChessEngine.Tests.csproj','-c','Release']]],
  'community-tier-list': [['npm',['run','typecheck']],['npm',['test']],['npm',['run','lint']],['npm',['run','build']]],
  'adonea-metro-district': [['npm',['run','typecheck']],['npm',['run','verify']],['npm',['run','build']]],
  'tollgate-crossing-metro-district': [['npm',['run','typecheck']],['npm',['run','verify']],['npm',['run','build']]],
  'portfolio2.0': [['npx',['tsc','--noEmit']],['npm',['run','build']]],
  'pristine-management': [['npm',['run','lint']],['npm',['run','build']],['npm',['run','typecheck']],['npm',['test']],['npm',['run','synth']],['npm',['run','synth:dns']]],
};
const profile = profiles[process.argv[2]];
if (!profile) throw new Error('Unknown validation profile.');
// Dependencies were downloaded without repository source or lifecycle scripts.
// Rebuild lifecycle hooks and all candidate-controlled commands only offline.
for (const [command,args] of [['npm',['rebuild','--offline']],...profile]) {
  process.stdout.write(`Running ${command} ${args.join(' ')}\n`);
  cp.execFileSync(command,args,{cwd:process.argv[3],stdio:'inherit',env:{...process.env,VITE_CONVEX_URL:'https://placeholder.convex.cloud',NEXT_PUBLIC_CONVEX_URL:'https://example.convex.cloud'},timeout:12*60*1000});
}
