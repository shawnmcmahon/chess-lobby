param(
    [string]$Profile = '',
    [ValidateSet('us-east-1')][string]$Region = 'us-east-1',
    [ValidatePattern('^chess-lobby-engine-[a-z0-9-]+$')][string]$StackName = 'chess-lobby-engine-lambda',
    [string]$ImageTag = '',
    [switch]$SkipBuild
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $repoRoot
if ($env:ENGINE_API_KEY -notmatch '^[A-Za-z0-9+/=_-]{32,256}$') {
    throw 'Set ENGINE_API_KEY to a high-entropy 32+ character key in this process environment.'
}
if (!$ImageTag) { $ImageTag = 'release-' + (Get-Date -Format 'yyyyMMddHHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,8) }
if ($ImageTag -notmatch '^release-[a-zA-Z0-9_.-]+$') { throw 'ImageTag must begin release-.' }
$awsOptions = @('--region', $Region, '--no-cli-pager')
if ($Profile) { $awsOptions += @('--profile', $Profile) }
function Invoke-Aws([string[]]$Arguments) {
    $result = & aws @Arguments @awsOptions
    if ($LASTEXITCODE -ne 0) { throw "AWS $($Arguments[0]) $($Arguments[1]) failed (exit $LASTEXITCODE)." }
    return ($result -join "`n")
}
function Deploy-Stack([string]$Name, [string]$Template, [object[]]$Parameters) {
    # The secret is sent in a temporary file, not a shell argument, template, or build context.
    $parameterFile = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($parameterFile, (ConvertTo-Json -InputObject @($Parameters) -Depth 5), [Text.UTF8Encoding]::new($false))
        $existing = & aws cloudformation describe-stacks --stack-name $Name @awsOptions 2>&1
        if ($LASTEXITCODE -eq 0) { $kind = 'UPDATE' }
        elseif (($existing -join "`n") -match 'does not exist') { $kind = 'CREATE' }
        else { throw "Cannot inspect stack $Name; verify AWS credentials and permissions." }
        $change = 'engine-' + [Guid]::NewGuid().ToString('N')
        Invoke-Aws @('cloudformation','create-change-set','--stack-name',$Name,'--change-set-name',$change,'--change-set-type',$kind,'--template-body',"file://$Template",'--parameters',"file://$parameterFile",'--capabilities','CAPABILITY_IAM') | Out-Null
        & aws cloudformation wait change-set-create-complete --stack-name $Name --change-set-name $change @awsOptions 2>$null
        $details = (Invoke-Aws @('cloudformation','describe-change-set','--stack-name',$Name,'--change-set-name',$change,'--output','json')) | ConvertFrom-Json
        if ($details.Status -ne 'CREATE_COMPLETE') {
            if ($details.StatusReason -match "didn't contain changes|No updates") {
                Invoke-Aws @('cloudformation','delete-change-set','--stack-name',$Name,'--change-set-name',$change) | Out-Null
                Write-Host "$Name has no changes."
                return
            }
            throw "Change set failed for ${Name}: $($details.StatusReason)"
        }
        # CloudFormation validates account state before execution. Review events on failure.
        Write-Host "Deploying $Name ($kind)."
        Invoke-Aws @('cloudformation','execute-change-set','--stack-name',$Name,'--change-set-name',$change) | Out-Null
        Invoke-Aws @('cloudformation','wait',"stack-$($kind.ToLower())-complete",'--stack-name',$Name) | Out-Null
    }
    finally { Remove-Item -LiteralPath $parameterFile -Force -ErrorAction SilentlyContinue }
}
function Stack-Output([string]$Name, [string]$Key) {
    return Invoke-Aws @('cloudformation','describe-stacks','--stack-name',$Name,'--query',"Stacks[0].Outputs[?OutputKey=='$Key'].OutputValue | [0]",'--output','text')
}
function Pin-Image([string]$Repository, [object]$Image, [string]$Tag) {
    $manifestFile = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($manifestFile, $Image.imageManifest, [Text.UTF8Encoding]::new($false))
        Invoke-Aws @('ecr','put-image','--repository-name',$Repository,'--image-tag',$Tag,'--image-manifest',"file://$manifestFile",'--image-manifest-media-type',$Image.imageManifestMediaType) | Out-Null
    }
    finally { Remove-Item -LiteralPath $manifestFile -Force -ErrorAction SilentlyContinue }
}

& aws --version
if ($LASTEXITCODE -ne 0) { throw 'AWS CLI v2 is required.' }
Invoke-Aws @('sts','get-caller-identity','--output','json') | Out-Null
& docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop with its Linux engine.' }
if (!$SkipBuild) {
    & docker buildx build --platform linux/amd64 --provenance=false --load -f apps/chess-engine/Dockerfile.lambda -t chess-engine-lambda:test .
    if ($LASTEXITCODE -ne 0) { throw 'Image build failed.' }
}
& node scripts/test-engine-lambda.mjs --image chess-engine-lambda:test
if ($LASTEXITCODE -ne 0) { throw 'Local image validation failed.' }

$repositoryStack = "$StackName-ecr"
Deploy-Stack $repositoryStack "$repoRoot/infra/engine-lambda/ecr.yaml" @()
$repository = Stack-Output $repositoryStack 'RepositoryName'
$repositoryUri = Stack-Output $repositoryStack 'RepositoryUri'
$registry = $repositoryUri.Split('/')[0]
Invoke-Aws @('ecr','get-login-password') | & docker login --username AWS --password-stdin $registry
if ($LASTEXITCODE -ne 0) { throw 'ECR login failed.' }
& docker tag chess-engine-lambda:test "${repositoryUri}:$ImageTag"
if ($LASTEXITCODE -ne 0) { throw 'Image tagging failed.' }
& docker push "${repositoryUri}:$ImageTag"
if ($LASTEXITCODE -ne 0) { throw 'Image push failed.' }
$image = (Invoke-Aws @('ecr','describe-images','--repository-name',$repository,'--image-ids',"imageTag=$ImageTag",'--output','json') | ConvertFrom-Json).imageDetails[0]
$imageUri = "$repositoryUri@$($image.imageDigest)"
$existing = & aws cloudformation describe-stacks --stack-name $StackName @awsOptions 2>&1
$previousStack = $null
if ($LASTEXITCODE -eq 0) { $previousStack = (($existing -join "`n") | ConvertFrom-Json).Stacks[0] }
elseif (($existing -join "`n") -notmatch 'does not exist') { throw "Cannot inspect stack $StackName before deployment." }
$rollbackTemplateFile = $null
$previousImage = $null
try {
    $parameters = @(
        @{ ParameterKey = 'ImageUri'; ParameterValue = $imageUri },
        @{ ParameterKey = 'EngineApiKey'; ParameterValue = $env:ENGINE_API_KEY }
    )
    if ($previousStack) {
        $previousImageUri = ($previousStack.Parameters | Where-Object ParameterKey -eq 'ImageUri').ParameterValue
        if (!$previousImageUri -or !$previousImageUri.StartsWith("$repositoryUri@sha256:")) {
            throw 'The previous deployment must use a digest from this repository for automatic rollback.'
        }
        $previousDigest = $previousImageUri.Split('@')[1]
        $previousImage = (Invoke-Aws @('ecr','batch-get-image','--repository-name',$repository,'--image-ids',"imageDigest=$previousDigest",'--output','json') | ConvertFrom-Json).images[0]
        if (!$previousImage) { throw 'The previous deployed image is missing; restore it before deploying.' }
        $pinned = (Invoke-Aws @('ecr','batch-get-image','--repository-name',$repository,'--image-ids','imageTag=keep-current','--output','json') | ConvertFrom-Json).images
        if ($pinned.Count -eq 0 -or $pinned[0].imageId.imageDigest -ne $previousDigest) {
            Pin-Image $repository $previousImage 'keep-current'
        }
        $previousTemplate = Invoke-Aws @('cloudformation','get-template','--stack-name',$StackName,'--query','TemplateBody','--output','json') | ConvertFrom-Json
        $rollbackTemplateFile = [IO.Path]::GetTempFileName()
        $templateText = if ($previousTemplate -is [string]) { $previousTemplate } else { ConvertTo-Json $previousTemplate -Depth 100 }
        [IO.File]::WriteAllText($rollbackTemplateFile, $templateText, [Text.UTF8Encoding]::new($false))
        # Preserve the existing key and capacity settings. Key rotation is a separate operation.
        $parameters = @(@{ ParameterKey = 'ImageUri'; ParameterValue = $imageUri })
        $parameters += @($previousStack.Parameters | Where-Object ParameterKey -ne 'ImageUri' | ForEach-Object {
            @{ ParameterKey = $_.ParameterKey; UsePreviousValue = $true }
        })
        $rollbackParameters = @($parameters | Where-Object ParameterKey -ne 'ImageUri')
        $rollbackParameters += @{ ParameterKey = 'ImageUri'; ParameterValue = $previousImageUri }
    }
    try {
        Deploy-Stack $StackName "$repoRoot/infra/engine-lambda/function.yaml" $parameters
        $engineUrl = (Stack-Output $StackName 'EngineUrl').TrimEnd('/')
        & node scripts/test-engine-lambda.mjs --url $engineUrl
        if ($LASTEXITCODE -ne 0) { throw 'Deployed endpoint validation failed.' }
    }
    catch {
        $deploymentFailure = $_.Exception.Message
        if (!$previousStack) { throw "$deploymentFailure No previous deployment exists to restore; the candidate was not pinned." }
        try {
            Deploy-Stack $StackName $rollbackTemplateFile $rollbackParameters
            $rollbackUrl = (Stack-Output $StackName 'EngineUrl').TrimEnd('/')
            & node scripts/test-engine-lambda.mjs --url $rollbackUrl
            if ($LASTEXITCODE -ne 0) { throw 'Restored endpoint validation failed.' }
        }
        catch { throw "Deployment failed ($deploymentFailure), and rollback could not be validated: $($_.Exception.Message) Inspect stack events before retrying." }
        throw "$deploymentFailure The previous image and template were restored and validated; image pins were not promoted."
    }
    # Promote only after the real endpoint passed, preserving the previous validated release.
    if ($previousImage -and $previousDigest -ne $image.imageDigest) { Pin-Image $repository $previousImage 'keep-rollback' }
    if (!$previousImage -or $previousDigest -ne $image.imageDigest) {
        $current = (Invoke-Aws @('ecr','batch-get-image','--repository-name',$repository,'--image-ids',"imageDigest=$($image.imageDigest)",'--output','json') | ConvertFrom-Json).images[0]
        Pin-Image $repository $current 'keep-current'
    }
}
finally {
    if ($rollbackTemplateFile) { Remove-Item -LiteralPath $rollbackTemplateFile -Force -ErrorAction SilentlyContinue }
}
Write-Host "Validated replacement: $engineUrl"
Write-Host "Image digest: $($image.imageDigest); ECR compressed image size: $([Math]::Round($image.imageSizeInBytes / 1MB, 1)) MiB"
Write-Host 'No Convex cutover or Lightsail retirement was performed. Follow docs/deploy-engine-lambda.md.'
