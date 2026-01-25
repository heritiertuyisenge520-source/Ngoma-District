# Apply sub-indicator chart fix
$content = Get-Content "AnalyticsView.tsx" -Raw
$replacement = Get-Content "subindicator_chart_final.txt" -Raw

# Extract the new code (after "// WITH THIS NEW CODE:")
$newCode = $replacement -replace ".*// WITH THIS NEW CODE:`r`n", ""

# Find and replace the old bar chart section
$oldPattern = "(?s)/\* Bar Chart - INCREASED HEIGHT \*/.*?</div>"
$newContent = $content -replace $oldPattern, $newCode.Trim()

Set-Content "AnalyticsView.tsx" $newContent -NoNewline

Write-Host "Sub-indicator chart applied successfully!"
