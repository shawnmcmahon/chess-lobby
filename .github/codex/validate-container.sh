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
# Candidate output cannot create runner commands, and the random delimiter is
# never passed into the container. Only candidate source is writable there.
commandToken="$(cat /proc/sys/kernel/random/uuid)"
printf '::stop-commands::%s\n' "$commandToken"
trap 'printf "::%s::\n" "$commandToken"' EXIT
docker run --rm --read-only --user "$(id -u):$(id -g)" \
  --cap-drop=ALL --security-opt=no-new-privileges \
  --memory=4g --cpus=2 --pids-limit=512 \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g \
  --mount "type=bind,source=$candidate,target=/candidate" \
  --mount "type=bind,source=$candidate/.git,target=/candidate/.git,readonly" \
  --mount "type=bind,source=$automation,target=/automation,readonly" \
  --mount "type=bind,source=$nodeRoot,target=/opt/node,readonly" \
  --mount "type=bind,source=$pwshRoot,target=/opt/powershell,readonly" \
  --workdir /candidate \
  --env HOME=/tmp/codex --env DOTNET_CLI_HOME=/tmp/codex \
  --env NUGET_PACKAGES=/tmp/nuget --env DOTNET_NOLOGO=1 \
  --env PATH=/opt/node/bin:/opt/powershell:/usr/share/dotnet:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  "$image" /opt/node/bin/node "$entry" "$profile" /candidate
