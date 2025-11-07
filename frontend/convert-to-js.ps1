# PowerShell script to convert TypeScript files to JavaScript
# Run this from the frontend directory

$files = @(
    "src/components/ChatHeader.tsx",
    "src/components/ChatMessages.tsx",
    "src/components/Message.tsx",
    "src/components/ModeNotification.tsx",
    "src/components/Sidebar.tsx",
    "src/components/RoadmapVisualization.tsx",
    "src/app/page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Remove TypeScript type annotations
        $content = $content -replace ': React\.FC<[^>]+>', ''
        $content = $content -replace ': \w+(\[\])?(\s*=)', ' ='
        $content = $content -replace ':\s*\w+(\[\])?(\s*[,\)])', '$2'
        $content = $content -replace '<[^>]+>\s*\(', '('
        $content = $content -replace 'interface\s+\w+\s*{[^}]+}', ''
        $content = $content -replace 'type\s+\w+\s*=\s*[^;]+;', ''
        $content = $content -replace "import\s+type\s+{([^}]+)}\s+from\s+'([^']+)';", ''
        
        # Change file extension
        $newFile = $file -replace '\.tsx$', '.jsx'
        $newFile = $newFile -replace '\.ts$', '.js'
        
        Set-Content $newFile $content -Encoding UTF8
        Write-Host "Converted: $file -> $newFile"
    }
}

Write-Host "`nConversion complete! Please review the files for any remaining TypeScript syntax."
