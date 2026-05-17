$root    = Split-Path $PSScriptRoot -Parent
$pkgPath = Join-Path $root 'package.json'
$ioPkgPath = Join-Path $root 'io-package.json'

$pkg   = Get-Content $pkgPath   -Raw | ConvertFrom-Json
$ioPkg = Get-Content $ioPkgPath -Raw | ConvertFrom-Json

$parts    = $pkg.version -split '\.'
$parts[2] = [int]$parts[2] + 1
$newVer   = $parts -join '.'

$pkg.version          = $newVer
$ioPkg.common.version = $newVer

# Prepend new news entry
$newNews = [ordered]@{ $newVer = @{ en = "Version $newVer"; de = "Version $newVer" } }
$ioPkg.common.news.PSObject.Properties | ForEach-Object { $newNews[$_.Name] = $_.Value }
$ioPkg.common.news = [PSCustomObject]$newNews

$pkg   | ConvertTo-Json -Depth 10 | Set-Content $pkgPath   -Encoding utf8
$ioPkg | ConvertTo-Json -Depth 10 | Set-Content $ioPkgPath -Encoding utf8

Write-Host "version bumped → $newVer"
