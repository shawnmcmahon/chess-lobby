# A mocked command harness: this never launches Docker, connects to AWS, or invokes Convex.
$ErrorActionPreference = 'Stop'
$testRoot = Split-Path $PSScriptRoot -Parent
$global:EngineDeployCalls = [Collections.Generic.List[object]]::new()
$global:EngineParameterFiles = [Collections.Generic.List[string]]::new()
$global:EngineExistingStack = $false
$global:EngineNoChanges = $false
$global:EngineFailSmoke = $false
$global:EngineHasCurrentPin = $false
$global:EngineDigest = 'sha256:' + ('a' * 64)
$oldKey = $env:ENGINE_API_KEY
$env:ENGINE_API_KEY = 'test-only-deployment-key-never-used-in-production'
function Assert-True($Value, $Message) { if (!$Value) { throw $Message } }
function global:aws {
    $a = @($args)
    $global:EngineDeployCalls.Add($a)
    $global:LASTEXITCODE = 0
    if ($a[0] -eq '--version') { return 'aws-cli/2.mock' }
    if ($a[0] -eq 'sts') { return '{"Account":"123456789012"}' }
    if ($a[1] -eq 'describe-stacks') {
        if ($a -contains '--query') {
            $query = $a[$a.IndexOf('--query') + 1]
            if ($query -match "'RepositoryName'") { return 'chess-lobby-engine-lambda-ecr-images' }
            if ($query -match "'RepositoryUri'") { return '123456789012.dkr.ecr.us-east-1.amazonaws.com/chess-lobby-engine-lambda-ecr-images' }
            return 'https://mock.lambda-url.us-east-1.on.aws/'
        }
        if ($global:EngineExistingStack) { return '{"Stacks":[{}]}' }
        $global:LASTEXITCODE = 1
        return 'Stack does not exist'
    }
    if ($a[1] -eq 'create-change-set') {
        $path = $a[$a.IndexOf('--parameters') + 1].Substring(7)
        $global:EngineParameterFiles.Add($path)
        $parameters = Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
        $keyParam = @($parameters | Where-Object ParameterKey -eq 'EngineApiKey')
        if ($keyParam.Count) { Assert-True ($keyParam[0].ParameterValue -eq $env:ENGINE_API_KEY) 'Key must be passed via file' }
        Assert-True (!($a -contains $env:ENGINE_API_KEY)) 'Key must not be a command argument'
        return '{}'
    }
    if ($a[1] -eq 'describe-change-set') {
        if ($global:EngineNoChanges) { return '{"Status":"FAILED","StatusReason":"The submitted information did not contain changes. No updates are to be performed."}' }
        return '{"Status":"CREATE_COMPLETE"}'
    }
    if ($a[1] -eq 'get-login-password') { return 'test-only-token' }
    if ($a[1] -eq 'describe-images') { return "{`"imageDetails`": [{`"imageDigest`":`"$global:EngineDigest`",`"imageSizeInBytes`":123456}]}" }
    if ($a[1] -eq 'batch-get-image') {
        if ($a -contains 'imageTag=keep-current') {
            if ($global:EngineHasCurrentPin) { return ('{"images":[{"imageId":{"imageDigest":"sha256:' + ('b' * 64) + '"},"imageManifest":"{}","imageManifestMediaType":"application/vnd.docker.distribution.manifest.v2+json"}]}') }
            return '{"images":[]}'
        }
        return '{"images":[{"imageManifest":"{}","imageManifestMediaType":"application/vnd.docker.distribution.manifest.v2+json"}]}'
    }
    return '{}'
}
function global:docker { $global:EngineDeployCalls.Add(@('mock-docker') + @($args)); $global:LASTEXITCODE = 0; return 'mock-docker-success' }
function global:node {
    $global:EngineDeployCalls.Add(@('mock-node') + @($args))
    $global:LASTEXITCODE = if ($global:EngineFailSmoke -and ($args -contains '--url')) { 1 } else { 0 }
}
try {
    & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -Profile shawnmdev
    Assert-True (@($global:EngineDeployCalls | Where-Object { $_[1] -eq 'execute-change-set' }).Count -eq 2) 'Both stacks must deploy'
    Assert-True (@($global:EngineDeployCalls | Where-Object { $_ -contains '--url' }).Count -eq 1) 'Replacement must be tested'
    Assert-True (@($global:EngineDeployCalls | Where-Object { $_[0] -match 'convex|lightsail|npx' }).Count -eq 0) 'No production cutover or retirement'
    foreach ($path in $global:EngineParameterFiles) { Assert-True (!(Test-Path -LiteralPath $path)) 'Temporary parameter file must be removed' }
    $global:EngineDeployCalls.Clear()
    $global:EngineExistingStack = $true
    $global:EngineNoChanges = $true
    & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild
    Assert-True (@($global:EngineDeployCalls | Where-Object { $_[1] -eq 'execute-change-set' }).Count -eq 0) 'No-op update must not execute a failed change set'
    $global:EngineNoChanges = $false
    $global:EngineHasCurrentPin = $true
    $global:EngineDeployCalls.Clear()
    & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild
    $pins = @($global:EngineDeployCalls | Where-Object { $_[1] -eq 'put-image' })
    Assert-True ($pins.Count -eq 2) 'Protect both old and new deployments'
    Assert-True ($pins[0] -contains 'keep-rollback') 'Preserve the old pin before replacing current'
    Assert-True ($pins[1] -contains 'keep-current') 'Pin the active deployment'
    $global:EngineFailSmoke = $true
    $caught = $false
    try { & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild }
    catch { $caught = $_.Exception.Message -match 'Deployed endpoint validation failed' }
    Assert-True $caught 'A failed deployed endpoint must fail the deployment command'
    foreach ($path in $global:EngineParameterFiles) { Assert-True (!(Test-Path -LiteralPath $path)) 'Temporary parameter file must be removed on every path' }
    Write-Host 'PASS: deployment sequencing, secret files, cleanup, no-op updates, rollback pins, smoke failure, and no cutover (all commands mocked)'
}
finally {
    $env:ENGINE_API_KEY = $oldKey
    Remove-Item Function:/aws, Function:/docker, Function:/node
}
