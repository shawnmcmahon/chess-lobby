const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function packageReferences(xml) {
  return [...xml.matchAll(/<PackageReference\b([^>]*?)\/?\s*>/g)].map(([, attributes]) => {
    const name = attributes.match(/\bInclude="([A-Za-z0-9_.-]+)"/)?.[1];
    const version = attributes.match(/\bVersion="([0-9][A-Za-z0-9.+-]*)"/)?.[1];
    if (!name || !version) throw new Error('Dependency restore requires literal package names and versions; use manual validation.');
    return `<PackageReference Include="${name}" Version="${version}" />`;
  });
}

function restore(profile, cwd) {
  cp.execFileSync('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd,stdio:'inherit',timeout:12*60*1000});
  if (profile !== 'chess-lobby') return;
  // Never run MSBuild against repository projects while networking is enabled.
  // Only literal PackageReference data enters this generated dependency project.
  const references = ['engine.csproj','tests.csproj'].flatMap(name => packageReferences(fs.readFileSync(path.join(cwd,'manifests',name),'utf8')));
  const project = path.join(cwd,'dependency-restore.csproj');
  fs.writeFileSync(project,`<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup><ItemGroup>${references.join('')}</ItemGroup></Project>`);
  cp.execFileSync('dotnet',['restore',project,'-p:NuGetAudit=false'],{cwd,stdio:'inherit',timeout:12*60*1000});
}
if (require.main === module) restore(process.argv[2],process.argv[3]);
module.exports = { packageReferences };
