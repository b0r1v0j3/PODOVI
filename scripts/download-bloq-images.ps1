# Download BLOQ product images
# This script fetches all product pages and downloads color swatch images

$baseUrl = "https://bloq.nl"
$outputBase = Join-Path $PSScriptRoot ".." "public" "images" "products" "carpet" "bloq"

# All BLOQ product pages
$products = @(
    @{ url = "https://bloq.nl/products/the-trinity-collection/assembly"; folder = "assembly" },
    @{ url = "https://bloq.nl/products/the-trinity-collection/sensity"; folder = "sensity" },
    @{ url = "https://bloq.nl/products/the-trinity-collection/unity"; folder = "unity" },
    @{ url = "https://bloq.nl/products/the-relief-collection/solace"; folder = "solace" },
    @{ url = "https://bloq.nl/products/the-create-collection/small"; folder = "small" },
    @{ url = "https://bloq.nl/products/the-create-collection/medium"; folder = "medium" },
    @{ url = "https://bloq.nl/products/the-create-collection/large"; folder = "large" },
    @{ url = "https://bloq.nl/products/the-binary-collection/flow"; folder = "flow" },
    @{ url = "https://bloq.nl/products/the-binary-collection/grain"; folder = "grain" },
    @{ url = "https://bloq.nl/products/the-binary-collection/renegade"; folder = "renegade" },
    @{ url = "https://bloq.nl/products/the-binary-collection/balance"; folder = "balance" },
    @{ url = "https://bloq.nl/products/the-binary-collection/sculpture"; folder = "sculpture" },
    @{ url = "https://bloq.nl/products/the-workplace-collection/rhythm"; folder = "rhythm" },
    @{ url = "https://bloq.nl/products/the-workplace-collection/connexion"; folder = "connexion" },
    @{ url = "https://bloq.nl/products/the-workplace-collection/tradition"; folder = "tradition" },
    @{ url = "https://bloq.nl/products/the-textured-collection/canvas"; folder = "canvas" },
    @{ url = "https://bloq.nl/products/the-textured-collection/positive"; folder = "positive" },
    @{ url = "https://bloq.nl/products/the-textured-collection/negative"; folder = "negative" }
)

$totalDownloaded = 0
$totalFailed = 0

foreach ($product in $products) {
    $folder = $product.folder
    $pageUrl = $product.url
    $outDir = Join-Path $outputBase $folder

    Write-Host "`n=== Downloading images for: $folder ===" -ForegroundColor Cyan

    # Ensure output directory exists
    if (!(Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    try {
        # Fetch page HTML
        $html = (Invoke-WebRequest -Uri $pageUrl -UseBasicParsing -TimeoutSec 30).Content

        # Extract image URLs matching the pattern
        $matches = [regex]::Matches($html, 'sites/default/files/styles/large/public/[^"''>\s]*\.jpg')
        $imageUrls = $matches | ForEach-Object { $_.Value } | Select-Object -Unique

        if ($imageUrls.Count -eq 0) {
            Write-Host "  No images found for $folder" -ForegroundColor Yellow
            continue
        }

        Write-Host "  Found $($imageUrls.Count) images"

        foreach ($imgPath in $imageUrls) {
            $fullUrl = "$baseUrl/$imgPath"
            
            # Extract code from filename (e.g., "Flow_111.jpg" -> "111", "Sculpture_111-TRUFFLE.jpg" -> "111-truffle")
            $filename = [System.IO.Path]::GetFileName($imgPath)
            # Normalize filename to lowercase
            $filename = $filename.ToLower()
            
            $outFile = Join-Path $outDir $filename

            if (Test-Path $outFile) {
                Write-Host "  SKIP: $filename (already exists)" -ForegroundColor DarkGray
                continue
            }

            try {
                Invoke-WebRequest -Uri $fullUrl -OutFile $outFile -UseBasicParsing -TimeoutSec 15
                Write-Host "  OK: $filename" -ForegroundColor Green
                $totalDownloaded++
            } catch {
                Write-Host "  FAIL: $filename - $($_.Exception.Message)" -ForegroundColor Red
                $totalFailed++
            }

            # Small delay to be nice to the server
            Start-Sleep -Milliseconds 200
        }
    } catch {
        Write-Host "  ERROR fetching page $pageUrl - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Downloaded: $totalDownloaded" -ForegroundColor Green
Write-Host "Failed: $totalFailed" -ForegroundColor $(if ($totalFailed -gt 0) { "Red" } else { "Green" })
