# Script to rename "Unknown-" folders to correct names based on color codes
# Run from project root: pwsh scripts/rename_unknown_folders.ps1

$basePath = "public/images/products/lvt/colors/creation-40-clic"

$renames = @{
    "Unknown-ballerina" = "0347-ballerina"
    "Unknown-cedar-brown" = "0850-cedar-brown"
    "Unknown-cedar-natural" = "1607-cedar-natural"
    "Unknown-honey-oak" = "0441-honey-oak"
    "Unknown-longboard" = "0455-long-board"
    "Unknown-quartet" = "0503-quartet"
    "Unknown-quartet-honey" = "0870-quartet-honey"
    "Unknown-ranch" = "0456-ranch"
    "Unknown-twist" = "0504-twist"
    "Unknown-white-lime" = "0584-white-lime"
}

foreach ($oldName in $renames.Keys) {
    $oldPath = Join-Path $basePath $oldName
    $newPath = Join-Path $basePath $renames[$oldName]
    
    if (Test-Path $oldPath) {
        Write-Host "Renaming: $oldName -> $($renames[$oldName])"
        Rename-Item -Path $oldPath -NewName $renames[$oldName] -ErrorAction Stop
        Write-Host "  ✓ Success" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Not found: $oldPath" -ForegroundColor Yellow
    }
}

Write-Host "`nAll folders renamed!" -ForegroundColor Green
