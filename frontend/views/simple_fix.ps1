# Simple fix for annual progress calculation
$file = "AnalyticsView.tsx"
$content = Get-Content $file

# Find the start and end of the annualCompletion function
$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -match "const annualCompletion = useMemo") {
        $startLine = $i
    }
    if ($startLine -ne -1 -and $content[$i] -match "}, \[selectedIndicator, entriesByIndicator, selectedQuarterId\];") {
        $endLine = $i
        break
    }
}

if ($startLine -ne -1 -and $endLine -ne -1) {
    # Create the new function
    $newFunction = @()
    $newFunction += "  const annualCompletion = useMemo(() => {"
    $newFunction += "    if (!selectedIndicator) return 0;"
    $newFunction += "    "
    $newFunction += "    // Get entries for the selected quarter only (not cumulative)"
    $newFunction += "    const allIndicatorEntries = entriesByIndicator[selectedIndicator.id] || [];"
    $newFunction += "    const quarterEntries = allIndicatorEntries.filter(entry => "
    $newFunction += "      entry.quarterId === selectedQuarterId"
    $newFunction += "    );"
    $newFunction += "    "
    $newFunction += "    // For annual progress, use the current quarter's actual value divided by annual target"
    $newFunction += "    // This matches the requirement: Q1 actual / annual target, Q2 actual / annual target, etc."
    $newFunction += "    const currentQuarterActual = quarterEntries.length > 0 "
    $newFunction += "      ? Math.max(...quarterEntries.map(e => e.value)) // Use latest value in the quarter"
    $newFunction += "      : 0;"
    $newFunction += "    "
    $newFunction += "    const annualTarget = selectedIndicator.targets.annual;"
    $newFunction += "    "
    $newFunction += "    if (annualTarget === 0) return 0;"
    $newFunction += "    "
    $newFunction += "    const performance = (currentQuarterActual / Number(annualTarget)) * 100;"
    $newFunction += "    return Math.min(performance, 100);"
    $newFunction += "  }, [selectedIndicator, entriesByIndicator, selectedQuarterId]);"
    
    # Replace the lines
    $newContent = $content[0..($startLine-1)] + $newFunction + $content[($endLine+1)..($content.Length-1)]
    $newContent | Set-Content $file
    
    Write-Host "Fixed annual progress calculation!"
} else {
    Write-Host "Could not find the function to replace"
}
