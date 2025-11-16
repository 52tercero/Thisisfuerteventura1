$ErrorActionPreference = 'Stop'

# Build aggregate URL
$sources = @(
    'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
    'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
    'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
    'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
    'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
) -join ','
$base = 'http://localhost:3000'
$url = "$base/api/aggregate?sources=$sources"

Write-Host "Testing aggregate endpoint: $url" -ForegroundColor Cyan

try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
    $json = $r.Content | ConvertFrom-Json
    if ($null -ne $json.items) {
        Write-Host ("Aggregate items: " + $json.items.Count) -ForegroundColor Green
        exit 0
    } else {
        Write-Host "No 'items' field in response" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host ("Request failed: " + $_.Exception.Message) -ForegroundColor Yellow
    exit 0
}
