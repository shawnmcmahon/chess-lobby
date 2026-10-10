#!/usr/bin/env bash
set -euo pipefail
profile="$1"
candidate="$(realpath "$2")"
automation="$(cd "$(dirname "$0")" && pwd)"
nodeRoot="$(dirname "$(dirname "$(readlink -f "$(command -v node)")")")"
pwshRoot="$(dirname "$(readlink -f "$(command -v pwsh)")")"
image='mcr.microsoft.com/dotnet/sdk:10.0-noble@sha256:e70cdb7f80b0348f5cb85f19a8f670fca061f033d57eed12fa003d58b0e06317'
entry='/automation/validate.cjs'
if [[ "$profile" == '--smoke' ]]; then entry='/automation/container-smoke.cjs'; fi
restoreRoot="$(mktemp -d)"
mkdir -p "$restoreRoot/source" "$restoreRoot/nuget"
# Candidate output cannot create runner commands, and the random delimiter is
# never passed into the container. Only candidate source is writable there.
commandToken="$(cat /proc/sys/kernel/random/uuid)"
printf '::stop-commands::%s\n' "$commandToken"
trap 'rm -rf -- "$restoreRoot"; printf "::%s::\n" "$commandToken"' EXIT
runContainer() {
local network="$1" workspace="$2" script="$3"
docker run --rm --read-only --user "$(id -u):$(id -g)" --network "$network" \
  --cap-drop=ALL --security-opt=no-new-privileges \
  --memory=4g --cpus=2 --pids-limit=512 \
  --tmpfs /tmp:rw,exec,nosuid,nodev,size=1g \
  --mount "type=bind,source=$workspace,target=/candidate" \
  "${gitMount[@]}" \
  --mount "type=bind,source=$restoreRoot/nuget,target=/dependencies/nuget" \
  --mount "type=bind,source=$automation,target=/automation,readonly" \
  --mount "type=bind,source=$nodeRoot,target=/opt/node,readonly" \
  --mount "type=bind,source=$pwshRoot,target=/opt/powershell,readonly" \
  --workdir /candidate \
  --env HOME=/tmp/codex --env DOTNET_CLI_HOME=/tmp/codex \
  --env NUGET_PACKAGES=/dependencies/nuget --env DOTNET_NOLOGO=1 \
  --env NuGetAudit=false --env NPM_CONFIG_OFFLINE="$npmOffline" \
  --env PATH=/opt/node/bin:/opt/powershell:/usr/share/dotnet:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  "$image" /opt/node/bin/node "$script" "$profile" /candidate
}
gitMount=()
npmOffline=false
if [[ "$profile" != '--smoke' ]]; then
  # The networked container sees manifests only: no source, .git, repository
  # configuration, lifecycle scripts, or runner credentials/command files.
  cp "$candidate/package.json" "$candidate/package-lock.json" "$restoreRoot/source/"
  if [[ "$profile" == 'community-tier-list' ]]; then
    for workspace in apps/web apps/realtime; do
      mkdir -p "$restoreRoot/source/$workspace"
      cp "$candidate/$workspace/package.json" "$restoreRoot/source/$workspace/"
    done
  fi
  if [[ "$profile" == 'chess-lobby' ]]; then
    mkdir -p "$restoreRoot/source/apps/web"
    cp "$candidate/apps/web/package.json" "$restoreRoot/source/apps/web/"
    mkdir -p "$restoreRoot/source/manifests"
    cp "$candidate/apps/chess-engine/ChessEngine.csproj" "$restoreRoot/source/manifests/engine.csproj"
    cp "$candidate/tests/ChessEngine.Tests/ChessEngine.Tests.csproj" "$restoreRoot/source/manifests/tests.csproj"
  fi
  runContainer bridge "$restoreRoot/source" /automation/restore.cjs
  while IFS= read -r -d '' dependencyDir; do
    relative="${dependencyDir#"$restoreRoot/source/"}"
    mkdir -p "$(dirname "$candidate/$relative")"
    # Validation starts from a fresh checkout, never overlay existing modules.
    test ! -e "$candidate/$relative"
    mv "$dependencyDir" "$candidate/$relative"
  done < <(find "$restoreRoot/source" -type d -name node_modules -prune -print0)
fi
gitMount=(--mount "type=bind,source=$candidate/.git,target=/candidate/.git,readonly")
if [[ "$profile" == '--smoke' ]]; then
  gitMount+=(--mount "type=bind,source=$candidate/baseline.test.mjs,target=/candidate/baseline.test.mjs,readonly")
else
  node -e 'const fs=require("node:fs"),path=require("node:path"),files=require(process.argv[1]).existingTestPaths(process.argv[2]);for(const file of files){if(file.includes(",")||!fs.lstatSync(path.join(process.argv[2],file)).isFile())throw new Error("Existing test must be a regular mountable file");}process.stdout.write(files.join("\0")+"\0")' "$automation/review-engine.cjs" "$candidate" > "$restoreRoot/test-paths"
  while IFS= read -r -d '' existingTest; do
    if [[ -n "$existingTest" ]]; then
      gitMount+=(--mount "type=bind,source=$candidate/$existingTest,target=/candidate/$existingTest,readonly")
    fi
  done < "$restoreRoot/test-paths"
fi
npmOffline=true
runContainer none "$candidate" "$entry"
