# A mocked command harness: this never launches Docker, connects to AWS, or invokes Convex.
$ErrorActionPreference = 'Stop'
$testRoot = Split-Path $PSScriptRoot -Parent
$global:EngineDeployCalls = [Collections.Generic.List[object]]::new()
$global:EngineParameterFiles = [Collections.Generic.List[string]]::new()
$global:EngineChangeRecords = [Collections.Generic.List[object]]::new()
$global:EngineEvents = [Collections.Generic.List[string]]::new()
$global:EngineTemplateFiles = [Collections.Generic.List[string]]::new()
$global:EngineExistingStack = $false
$global:EngineNoChanges = $false
$global:EngineFailSmoke = $false
$global:EngineFailEverySmoke = $false
$global:EngineSmokeCount = 0
$global:EngineFailFunctionUpdate = $false
$global:EngineFunctionUpdates = 0
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
        if ($global:EngineExistingStack) {
            return ('{"Stacks":[{"Parameters":[{"ParameterKey":"ImageUri","ParameterValue":"123456789012.dkr.ecr.us-east-1.amazonaws.com/chess-lobby-engine-lambda-ecr-images@sha256:' + ('b' * 64) + '"},{"ParameterKey":"EngineApiKey","ParameterValue":"****"},{"ParameterKey":"ReservedConcurrency","ParameterValue":"2"}]}]}')
        }
        $global:LASTEXITCODE = 1
        return 'Stack does not exist'
    }
    if ($a[1] -eq 'create-change-set') {
        $path = $a[$a.IndexOf('--parameters') + 1].Substring(7)
        $global:EngineParameterFiles.Add($path)
        $parameters = Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
        $keyParam = @($parameters | Where-Object ParameterKey -eq 'EngineApiKey')
        if ($keyParam.Count) { Assert-True ($keyParam[0].UsePreviousValue -eq $true -or $keyParam[0].ParameterValue -eq $env:ENGINE_API_KEY) 'Key must be passed via file or preserved' }
        Assert-True (!($a -contains $env:ENGINE_API_KEY)) 'Key must not be a command argument'
        $templatePath = $a[$a.IndexOf('--template-body') + 1].Substring(7)
        $templateText = Get-Content -Raw -LiteralPath $templatePath
        if ($templateText -eq 'previous-template-body') { $global:EngineTemplateFiles.Add($templatePath) }
        $global:EngineChangeRecords.Add(@{ Stack = $a[$a.IndexOf('--stack-name') + 1]; Parameters = $parameters; Template = $templateText })
        return '{}'
    }
    if ($a[1] -eq 'describe-change-set') {
        if ($global:EngineNoChanges) { return '{"Status":"FAILED","StatusReason":"The submitted information did not contain changes. No updates are to be performed."}' }
        return '{"Status":"CREATE_COMPLETE"}'
    }
    if ($a[1] -eq 'execute-change-set' -and $a[$a.IndexOf('--stack-name') + 1] -eq 'chess-lobby-engine-lambda') {
        $global:EngineFunctionUpdates++
        if ($global:EngineFailFunctionUpdate -and $global:EngineFunctionUpdates -eq 1) { $global:LASTEXITCODE = 1 }
    }
    if ($a[1] -eq 'get-login-password') { return 'test-only-token' }
    if ($a[1] -eq 'get-template') { return '"previous-template-body"' }
    if ($a[1] -eq 'put-image') { $global:EngineEvents.Add('pin:' + $a[$a.IndexOf('--image-tag') + 1]) }
    if ($a[1] -eq 'describe-images') { return "{`"imageDetails`": [{`"imageDigest`":`"$global:EngineDigest`",`"imageSizeInBytes`":123456}]}" }
    if ($a[1] -eq 'batch-get-image') {
        if ($a -contains 'imageTag=keep-current') {
            if ($global:EngineHasCurrentPin) { return ('{"images":[{"imageId":{"imageDigest":"sha256:' + ('b' * 64) + '"},"imageManifest":"{}","imageManifestMediaType":"application/vnd.docker.distribution.manifest.v2+json"}]}') }
            return '{"images":[]}'
        }
        $digest = $a[$a.IndexOf('--image-ids') + 1].Substring('imageDigest='.Length)
        return "{`"images`": [{`"imageId`":{`"imageDigest`":`"$digest`"},`"imageManifest`":`"{}`",`"imageManifestMediaType`":`"application/vnd.docker.distribution.manifest.v2+json`"}]}"
    }
    return '{}'
}
function global:docker { $global:EngineDeployCalls.Add(@('mock-docker') + @($args)); $global:LASTEXITCODE = 0; return 'mock-docker-success' }
function global:node {
    $global:EngineDeployCalls.Add(@('mock-node') + @($args))
    if ($args -contains '--url') {
        $global:EngineSmokeCount++
        $global:LASTEXITCODE = if ($global:EngineFailEverySmoke -or ($global:EngineFailSmoke -and $global:EngineSmokeCount -eq 1)) { 1 } else { 0 }
        $global:EngineEvents.Add('smoke:' + $global:LASTEXITCODE)
    }
    else { $global:LASTEXITCODE = 0 }
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
    $global:EngineEvents.Clear()
    & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild
    $pins = @($global:EngineDeployCalls | Where-Object { $_[1] -eq 'put-image' })
    Assert-True ($pins.Count -eq 2) 'Protect both old and new deployments'
    Assert-True ($pins[0] -contains 'keep-rollback') 'Preserve the old pin before replacing current'
    Assert-True ($pins[1] -contains 'keep-current') 'Pin the active deployment'
    Assert-True ($global:EngineEvents.IndexOf('smoke:0') -lt $global:EngineEvents.IndexOf('pin:keep-current')) 'Promote only after endpoint validation'
    $global:EngineFailSmoke = $true
    $global:EngineSmokeCount = 0
    $global:EngineDeployCalls.Clear()
    $global:EngineChangeRecords.Clear()
    $caught = $false
    try { & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild }
    catch { $caught = $_.Exception.Message -match 'previous image and template were restored and validated' }
    Assert-True $caught 'A failed candidate must restore and validate the previous deployment before reporting failure'
    Assert-True ($global:EngineSmokeCount -eq 2) 'Validate the restored endpoint after candidate failure'
    Assert-True (@($global:EngineDeployCalls | Where-Object { $_[1] -eq 'put-image' }).Count -eq 0) 'Never promote failed candidate pins'
    $changes = @($global:EngineChangeRecords | Where-Object Stack -eq 'chess-lobby-engine-lambda')
    Assert-True ($changes.Count -eq 2) 'Candidate and rollback must both deploy'
    Assert-True (($changes[1].Parameters | Where-Object ParameterKey -eq 'ImageUri').ParameterValue.EndsWith(('b' * 64))) 'Restore the actual previous digest'
    Assert-True ($changes[1].Template -eq 'previous-template-body') 'Restore the previous infrastructure template'
    Assert-True (($changes[0].Parameters | Where-Object ParameterKey -eq 'EngineApiKey').UsePreviousValue) 'Preserve the production key during candidate deployment'
    Assert-True (($changes[1].Parameters | Where-Object ParameterKey -eq 'ReservedConcurrency').UsePreviousValue) 'Preserve capacity controls during rollback'
    $global:EngineFailEverySmoke = $true
    $global:EngineSmokeCount = 0
    $caught = $false
    try { & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild }
    catch { $caught = $_.Exception.Message -match 'rollback could not be validated' }
    Assert-True $caught 'A failed rollback validation must request stack inspection and report failure'
    $global:EngineFailEverySmoke = $false
    $global:EngineFailSmoke = $false
    $global:EngineFailFunctionUpdate = $true
    $global:EngineFunctionUpdates = 0
    $global:EngineSmokeCount = 0
    $caught = $false
    try { & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild }
    catch { $caught = $_.Exception.Message -match 'previous image and template were restored and validated' }
    Assert-True $caught 'A failed stack update must restore the previous deployment too'
    Assert-True ($global:EngineFunctionUpdates -eq 2 -and $global:EngineSmokeCount -eq 1) 'Validate rollback after a stack-update failure'
    $global:EngineFailFunctionUpdate = $false
    $global:EngineFailSmoke = $true
    $global:EngineExistingStack = $false
    $global:EngineSmokeCount = 0
    $global:EngineDeployCalls.Clear()
    $caught = $false
    try { & "$testRoot/scripts/deploy-engine-lambda.ps1" -ImageTag 'release-test' -SkipBuild }
    catch { $caught = $_.Exception.Message -match 'No previous deployment exists to restore' }
    Assert-True $caught 'A failed initial deployment must report that no rollback exists'
    Assert-True (@($global:EngineDeployCalls | Where-Object { $_[1] -eq 'put-image' }).Count -eq 0) 'Never pin a failed initial deployment'
    foreach ($path in $global:EngineParameterFiles) { Assert-True (!(Test-Path -LiteralPath $path)) 'Temporary parameter file must be removed on every path' }
    foreach ($path in $global:EngineTemplateFiles) { Assert-True (!(Test-Path -LiteralPath $path)) 'Temporary rollback template must be removed on every path' }
    # GitHub's pwsh wrapper propagates LASTEXITCODE; the failure above was expected and asserted.
    $global:LASTEXITCODE = 0
    Write-Host 'PASS: sequencing, secret files, cleanup, no-op updates, validated promotion, automatic rollback, rollback failure, initial failure, and no Convex cutover (all commands mocked)'
}
finally {
    $env:ENGINE_API_KEY = $oldKey
    Remove-Item Function:/aws, Function:/docker, Function:/node
}
