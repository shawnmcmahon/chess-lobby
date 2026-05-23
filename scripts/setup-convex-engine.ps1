# Point production Convex at a hosted Stockfish engine service.
# Usage:
#   $env:ENGINE_API_URL = "https://chess-lobby-engine.xxxxx.us-east-1.cs.amazonlightsail.com"
#   $env:ENGINE_API_KEY = "your-generated-secret"
#   .\scripts\setup-convex-engine.ps1

$ErrorActionPreference = "Stop"

if (-not $env:ENGINE_API_URL) {
    Write-Host "Set ENGINE_API_URL to your public engine base URL first, e.g.:" -ForegroundColor Yellow
    Write-Host '  $env:ENGINE_API_URL = "https://chess-lobby-engine.xxxxx.us-east-1.cs.amazonlightsail.com"'
    exit 1
}

if (-not $env:ENGINE_API_KEY) {
    Write-Host "Set ENGINE_API_KEY to match the engine service secret, e.g.:" -ForegroundColor Yellow
    Write-Host '  $env:ENGINE_API_KEY = "your-generated-secret"'
    exit 1
}

$url = $env:ENGINE_API_URL.TrimEnd("/")
if ($url -match "localhost|127\.0\.0\.1") {
    Write-Host "ENGINE_API_URL cannot be localhost — cloud Convex cannot reach it." -ForegroundColor Red
    exit 1
}

Write-Host "Setting ENGINE_API_URL on production: $url"
npx convex env set ENGINE_API_URL $url --prod

Write-Host "Setting ENGINE_API_KEY on production (value hidden)."
npx convex env set ENGINE_API_KEY $env:ENGINE_API_KEY --prod

Write-Host ""
Write-Host "Production Convex will use Stockfish when ENGINE_API_URL is reachable." -ForegroundColor Green
Write-Host "Revert to built-in engine:" -ForegroundColor Cyan
Write-Host "  npx convex env unset ENGINE_API_URL --prod"
Write-Host "  npx convex env unset ENGINE_API_KEY --prod"
Write-Host ""
Write-Host "See docs/deploy-engine-lightsail.md for hosting steps."
