# One-time AWS setup for chess-lobby demo (S3 + CloudFront + GitHub OIDC).
# Usage:
#   $env:AWS_PROFILE = "shawnmdev"   # profile for shawnmdevaws2 account
#   .\scripts\setup-aws-demo.ps1
#
# Requires: AWS CLI v2, permissions for CloudFormation, S3, CloudFront, IAM.

$ErrorActionPreference = "Stop"
$StackName = "chess-lobby-demo"
$Region = "us-east-1"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Template = Join-Path $RepoRoot "infra\demo-static-site.yaml"

Write-Host "Checking AWS identity..."
$identity = aws sts get-caller-identity | ConvertFrom-Json
Write-Host "  Account: $($identity.Account)"
Write-Host "  Arn:     $($identity.Arn)"
$confirm = Read-Host "Deploy stack '$StackName' in this account? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted."
    exit 1
}

Write-Host "Ensuring GitHub OIDC provider exists..."
$oidcArn = "arn:aws:iam::$($identity.Account):oidc-provider/token.actions.githubusercontent.com"
$existing = aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, 'token.actions.githubusercontent.com')]" --output json | ConvertFrom-Json
if (-not $existing -or $existing.Count -eq 0) {
    aws iam create-open-id-connect-provider `
        --url "https://token.actions.githubusercontent.com" `
        --client-id-list "sts.amazonaws.com" `
        --thumbprint-list "6938fd4d98bab03fa27189a0bcf4ebfd245d7b5f"
    Write-Host "  Created OIDC provider."
} else {
    Write-Host "  OIDC provider already exists."
}

Write-Host "Deploying CloudFormation stack (may take several minutes)..."
aws cloudformation deploy `
    --template-file $Template `
    --stack-name $StackName `
    --parameter-overrides "GitHubRepo=shawnmcmahon/chess-lobby" `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --no-fail-on-empty-changeset

Write-Host ""
Write-Host "=== Stack outputs (add to GitHub Actions secrets) ===" -ForegroundColor Green
aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" `
    --output table

Write-Host ""
Write-Host "Next: see docs/deploy-demo.md for Convex + GitHub secrets." -ForegroundColor Cyan
