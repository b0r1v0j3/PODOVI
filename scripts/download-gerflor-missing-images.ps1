# Download images for Mipolam Evo and Taralay Libertex from Gerflor CDN
# Pattern: https://cdn.gerflor.com/media/1642426083/1/{CDN_ID}.jpg

$CDN_BASE = "https://cdn.gerflor.com/media/1642426083/1"
$baseDir = Join-Path $PSScriptRoot "..\public\images\products\vinyl"

# ============ MIPOLAM EVO ============
$evoDir = Join-Path $baseDir "mipolam-evo"
if (-not (Test-Path $evoDir)) { New-Item -ItemType Directory -Path $evoDir -Force | Out-Null }

# Clean up any previously failed downloads (tiny files)
Get-ChildItem $evoDir -Filter "*.jpg" | Where-Object { $_.Length -lt 5000 } | Remove-Item -Force

$evoImages = @{
    "9005-visby.jpg" = "21904"
    "9006-stockholm.jpg" = "21906"
    "9029-tromso.jpg" = "21908"
    "9030-uppsala.jpg" = "21911"
    "9031-kiruna.jpg" = "21910"
    "9032-copenhagen.jpg" = "21912"
    "9044-bergen.jpg" = "21916"
    "9045-gello.jpg" = "35210"
    "9050-malmo.jpg" = "21913"
    "9055-goteborg.jpg" = "21914"
    "9063-narvik.jpg" = "21917"
}

Write-Host "=== Downloading Mipolam Evo images ===" -ForegroundColor Cyan
$evoCount = 0
foreach ($entry in $evoImages.GetEnumerator()) {
    $outPath = Join-Path $evoDir $entry.Key
    if ((Test-Path $outPath) -and (Get-Item $outPath).Length -gt 5000) {
        Write-Host "  [SKIP] $($entry.Key) already exists" -ForegroundColor Yellow
        $evoCount++
        continue
    }
    $url = "$CDN_BASE/$($entry.Value).jpg"
    try {
        curl.exe -L -s -o $outPath -H "User-Agent: Mozilla/5.0" $url 2>$null
        $size = (Get-Item $outPath -ErrorAction SilentlyContinue).Length
        if ($size -gt 5000) {
            Write-Host "  [OK] $($entry.Key) ($([math]::Round($size/1024))KB)" -ForegroundColor Green
            $evoCount++
        } else {
            Write-Host "  [FAIL] $($entry.Key) - too small ($size bytes)" -ForegroundColor Red
            Remove-Item $outPath -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host "  [FAIL] $($entry.Key): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============ TARALAY LIBERTEX ============
$libertexDir = Join-Path $baseDir "taralay-libertex"
if (-not (Test-Path $libertexDir)) { New-Item -ItemType Directory -Path $libertexDir -Force | Out-Null }

Get-ChildItem $libertexDir -Filter "*.jpg" | Where-Object { $_.Length -lt 5000 } | Remove-Item -Force

$libertexImages = @{
    "0179-valencay-patine.jpg" = "58581"
    "0368-valencay-blond.jpg" = "57635"
    "0636-esterel-blond.jpg" = "58984"
    "0720-pure-oak-clear.jpg" = "57642"
    "0797-habana-ivory.jpg" = "67181"
    "0828-habana-beige.jpg" = "67180"
    "1442-valencay-pecan.jpg" = "57633"
    "1751-pure-oak-grey.jpg" = "57644"
    "2218-rough-taupe.jpg" = "57640"
    "2219-rough-chocolate.jpg" = "57636"
    "2225-rough-light-grey.jpg" = "57638"
    "2226-cordoba-black-white.jpg" = "57631"
    "2284-chicago-storm.jpg" = "57625"
    "2346-azay-cream.jpg" = "57628"
    "2366-chicago-sand.jpg" = "57622"
    "2413-cottage-blond.jpg" = "57616"
    "2415-cottage-clear.jpg" = "57614"
    "2426-cottage-brown.jpg" = "57612"
    "2459-chicago-haze.jpg" = "57618"
    "2460-chicago-cream.jpg" = "57621"
}

Write-Host "`n=== Downloading Taralay Libertex images ===" -ForegroundColor Cyan
$libertexCount = 0
foreach ($entry in $libertexImages.GetEnumerator()) {
    $outPath = Join-Path $libertexDir $entry.Key
    if ((Test-Path $outPath) -and (Get-Item $outPath).Length -gt 5000) {
        Write-Host "  [SKIP] $($entry.Key) already exists" -ForegroundColor Yellow
        $libertexCount++
        continue
    }
    $url = "$CDN_BASE/$($entry.Value).jpg"
    try {
        curl.exe -L -s -o $outPath -H "User-Agent: Mozilla/5.0" $url 2>$null
        $size = (Get-Item $outPath -ErrorAction SilentlyContinue).Length
        if ($size -gt 5000) {
            Write-Host "  [OK] $($entry.Key) ($([math]::Round($size/1024))KB)" -ForegroundColor Green
            $libertexCount++
        } else {
            Write-Host "  [FAIL] $($entry.Key) - too small ($size bytes)" -ForegroundColor Red
            Remove-Item $outPath -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host "  [FAIL] $($entry.Key): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Mipolam Evo: $evoCount/11 images" -ForegroundColor $(if ($evoCount -eq 11) { "Green" } else { "Yellow" })
Write-Host "Taralay Libertex: $libertexCount/20 images" -ForegroundColor $(if ($libertexCount -eq 20) { "Green" } else { "Yellow" })
