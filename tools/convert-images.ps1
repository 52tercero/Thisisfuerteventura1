param(
    [string]$InputPath = "images/header_image.png"
)

$ErrorActionPreference = 'Stop'

function Ensure-Tool($name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "Tool '$name' not found. Please install ImageMagick or libwebp."
        exit 1
    }
}

# Prefer ImageMagick if available
$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) {
    # Try ImageMagick on Windows path (magick.exe)
    $magick = Get-Command magick.exe -ErrorAction SilentlyContinue
}

$inFile = Join-Path $PSScriptRoot "..\$InputPath"
if (-not (Test-Path $inFile)) { Write-Host "Input not found: $inFile"; exit 1 }

$dir = Split-Path $inFile
$base = [System.IO.Path]::GetFileNameWithoutExtension($inFile)
$webp = Join-Path $dir "$base.webp"
$avif = Join-Path $dir "$base.avif"

if ($magick) {
    Write-Host "Converting with ImageMagick..."
    & $magick.Source "$inFile" -strip -quality 82 -define webp:method=6 "$webp"
    & $magick.Source "$inFile" -strip -quality 50 "$avif"
} else {
    Ensure-Tool 'cwebp'
    & cwebp -q 82 "$inFile" -o "$webp"
    # avif via magick is preferred; if not available, skip avif
    Write-Host "AVIF conversion requires ImageMagick (magick). Skipping AVIF."
}

Write-Host "Done: $webp"; if (Test-Path $avif) { Write-Host "Done: $avif" }
