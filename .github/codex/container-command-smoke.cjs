const fs = require('node:fs');
const assert = require('node:assert/strict');
const paths = ['/candidate/source.txt','/candidate/node_modules/tooling.txt'];
for (const path of paths) assert.equal(fs.readFileSync(path,'utf8'),'trusted input\n');
assert.throws(()=>fs.appendFileSync('/dependencies/nuget/marker','cache tampering'),error=>['EACCES','EROFS'].includes(error.code));
assert.throws(()=>fs.appendFileSync('/candidate/baseline.test.mjs','assertion tampering'),error=>['EACCES','EROFS'].includes(error.code));
if (process.argv[4] === '0') {
  for (const path of paths) fs.writeFileSync(path,'tampered input\n');
  process.stdout.write('First check changed only its disposable source/tooling copies.\n');
} else {
  assert.equal(process.argv[4],'1');
  process.stdout.write('Next check received unchanged source/tooling and read-only dependencies.\n');
}
