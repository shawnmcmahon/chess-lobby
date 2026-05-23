# Convex production prep for minimal demo (built-in engine, CloudFront SITE_URL).
# Usage:
#   $env:SITE_URL = "https://d1234abcd.cloudfront.net"
#   .\scripts\setup-convex-prod-demo.ps1

$ErrorActionPreference = "Stop"

if (-not $env:SITE_URL) {
    Write-Host "Set SITE_URL to your CloudFront URL first, e.g.:" -ForegroundColor Yellow
    Write-Host '  $env:SITE_URL = "https://d1234abcd.cloudfront.net"'
    exit 1
}

Write-Host "Removing external engine env vars from production (if set)..."
npx convex env unset ENGINE_API_URL --prod 2>$null
npx convex env unset ENGINE_API_KEY --prod 2>$null

Write-Host "Setting SITE_URL on production: $env:SITE_URL"
npx convex env set SITE_URL $env:SITE_URL --prod

Write-Host "Running setup-auth.mjs --prod (JWT keys + JWKS)..."
node (Join-Path (Split-Path $MyInvocation.MyCommand.Path) "setup-auth.mjs") --prod

Write-Host ""
Write-Host "Deploy production when ready:" -ForegroundColor Cyan
Write-Host "  npx convex deploy --prod"
Write-Host "Or use GitHub Actions workflow 'Deploy AWS'."
