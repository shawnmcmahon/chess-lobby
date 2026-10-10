const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
for (const name of ['GITHUB_ENV','GITHUB_OUTPUT','GITHUB_PATH','GITHUB_TOKEN','OPENAI_API_KEY','ACTIONS_RUNTIME_TOKEN','BASH_ENV']) assert.equal(process.env[name],undefined,`${name} must not reach candidate code`);
const readOnly = path => assert.throws(()=>fs.appendFileSync(path,'attempted host mutation'),error=>['EACCES','EROFS'].includes(error.code));
readOnly('/candidate/.git/config');
readOnly('/automation/container-smoke.cjs');
assert.throws(()=>fs.readFileSync('/tmp/codex-host-command-probe'),error=>error.code==='ENOENT');
assert.match(cp.execFileSync('dotnet',['--version'],{encoding:'utf8'}),/^10\./);
assert.match(cp.execFileSync('pwsh',['-NoLogo','-NoProfile','-Command','$PSVersionTable.PSVersion.ToString()'],{encoding:'utf8'}),/^7\./);
fs.writeFileSync('/candidate/isolation-passed.txt','Candidate source is writable; host command channels are inaccessible.\n');
// These adversarial command strings must remain plain log output.
process.stdout.write('::set-output name=smoke-bypass::true\n::set-env name=BASH_ENV::/tmp/hook\n::add-path::/tmp/hijack\n');
process.stdout.write('Container isolation assertions passed.\n');
