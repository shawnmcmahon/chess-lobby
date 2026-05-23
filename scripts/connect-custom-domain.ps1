# Connect a Route 53 domain to the chess-lobby-demo CloudFront distribution.
# Usage:
#   $env:AWS_PROFILE = "shawnmdev"
#   .\scripts\connect-custom-domain.ps1 -Domain thechesslobby.com

param(
    [string]$Domain = "thechesslobby.com",
    [string]$StackName = "chess-lobby-demo",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"
$CloudFrontZoneId = "Z2FDTNDATAQYW2"

Write-Host "AWS identity:"
aws sts get-caller-identity

$zone = aws route53 list-hosted-zones-by-name --dns-name $Domain --query "HostedZones[0]" --output json | ConvertFrom-Json
if (-not $zone) {
    Write-Error "No hosted zone for $Domain in this account. Use the same AWS profile as CloudFront (shawnmdev)."
}
$zoneId = $zone.Id -replace "^/hostedzone/", ""
Write-Host "Hosted zone: $zoneId"

$distId = aws cloudformation describe-stacks --stack-name $StackName --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text
$cfDomain = aws cloudfront get-distribution --id $distId --query "Distribution.DomainName" --output text
Write-Host "CloudFront: $cfDomain ($distId)"

Write-Host "Requesting ACM certificate..."
$certArn = aws acm request-certificate `
    --domain-name $Domain `
    --subject-alternative-names "www.$Domain" `
    --validation-method DNS `
    --region $Region `
    --query CertificateArn --output text

Write-Host "Certificate: $certArn"
Write-Host "Waiting for validation records..."
Start-Sleep -Seconds 5

$options = aws acm describe-certificate --certificate-arn $certArn --region $Region `
    --query "Certificate.DomainValidationOptions" --output json | ConvertFrom-Json

$changes = @()
foreach ($opt in $options) {
    $rr = $opt.ResourceRecord
    $changes += @{
        Action = "UPSERT"
        ResourceRecordSet = @{
            Name = $rr.Name
            Type = $rr.Type
            TTL = 300
            ResourceRecords = @(@{ Value = $rr.Value })
        }
    }
}
$batch = @{ Changes = $changes } | ConvertTo-Json -Depth 6
$batchFile = Join-Path $env:TEMP "r53-acm-$Domain.json"
$batch | Set-Content -Path $batchFile -Encoding ascii
aws route53 change-resource-record-sets --hosted-zone-id $zoneId --change-batch "file://$batchFile"

Write-Host "Waiting for certificate validation (may take several minutes)..."
aws acm wait certificate-validated --certificate-arn $certArn --region $Region

Write-Host "Updating CloudFront distribution..."
$configPath = Join-Path $env:TEMP "cf-config-$distId.json"
aws cloudfront get-distribution-config --id $distId --output json | Set-Content $configPath -Encoding utf8
$raw = Get-Content $configPath -Raw | ConvertFrom-Json
$etag = $raw.ETag
$config = $raw.DistributionConfig
$config.Aliases = @{
    Quantity = 2
    Items = @($Domain, "www.$Domain")
}
$config.ViewerCertificate = @{
    ACMCertificateArn = $certArn
    SSLSupportMethod = "sni-only"
    MinimumProtocolVersion = "TLSv1.2_2021"
    Certificate = $certArn
    CertificateSource = "acm"
}
$updatePath = Join-Path $env:TEMP "cf-update-$distId.json"
$config | ConvertTo-Json -Depth 20 | Set-Content $updatePath -Encoding utf8
aws cloudfront update-distribution --id $distId --if-match $etag --distribution-config "file://$updatePath"

Write-Host "Creating Route 53 alias records..."
$aliasBatch = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = $Domain
                Type = "A"
                AliasTarget = @{
                    HostedZoneId = $CloudFrontZoneId
                    DNSName = $cfDomain
                    EvaluateTargetHealth = $false
                }
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "www.$Domain"
                Type = "A"
                AliasTarget = @{
                    HostedZoneId = $CloudFrontZoneId
                    DNSName = $cfDomain
                    EvaluateTargetHealth = $false
                }
            }
        }
    )
} | ConvertTo-Json -Depth 8
$aliasPath = Join-Path $env:TEMP "r53-alias-$Domain.json"
$aliasBatch | Set-Content $aliasPath -Encoding ascii
aws route53 change-resource-record-sets --hosted-zone-id $zoneId --change-batch "file://$aliasPath"

Write-Host ""
Write-Host "Done. Site URLs (DNS may take up to 48h globally; often minutes):" -ForegroundColor Green
Write-Host "  https://$Domain"
Write-Host "  https://www.$Domain"
Write-Host ""
Write-Host "Update Convex auth:" -ForegroundColor Cyan
Write-Host "  `$env:SITE_URL = `"https://$Domain`""
Write-Host "  node scripts/setup-auth.mjs --prod"
