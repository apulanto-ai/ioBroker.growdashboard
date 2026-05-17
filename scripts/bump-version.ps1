$root      = Split-Path $PSScriptRoot -Parent
$pkgPath   = Join-Path $root 'package.json'
$ioPkgPath = Join-Path $root 'io-package.json'
$enc       = [System.Text.Encoding]::UTF8

# ── Determine new version from package.json ──────────────
$pkgText = [System.IO.File]::ReadAllText($pkgPath, $enc)
$current = [regex]::Match($pkgText, '"version"\s*:\s*"([\d.]+)"').Groups[1].Value
$parts   = $current -split '\.'
$parts[2] = [int]$parts[2] + 1
$newVer  = $parts -join '.'

# ── package.json: replace version only ───────────────────
$pkgText = [regex]::Replace($pkgText, '("version"\s*:\s*")[^"]+(")', "`${1}$newVer`${2}")
[System.IO.File]::WriteAllText($pkgPath, $pkgText, $enc)

# ── io-package.json: replace version + prepend news entry ─
$ioPkgText = [System.IO.File]::ReadAllText($ioPkgPath, $enc)

# Bump version field
$ioPkgText = [regex]::Replace($ioPkgText, '("version"\s*:\s*")[^"]+(")', "`${1}$newVer`${2}")

# Insert new news entry right after "news": {
$newsEntry = "      `"$newVer`": {`n        `"en`": `"Version $newVer`",`n        `"de`": `"Version $newVer`"`n      },"
$ioPkgText = [regex]::Replace($ioPkgText, '("news"\s*:\s*\{)', "`${1}`n$newsEntry")

[System.IO.File]::WriteAllText($ioPkgPath, $ioPkgText, $enc)

Write-Host "version bumped $current → $newVer"
