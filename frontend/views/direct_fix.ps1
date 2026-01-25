# Direct line-by-line replacement
(Get-Content "AnalyticsView.tsx") | ForEach-Object {
    if ($_ -match "const annualCompletion = useMemo") {
        $_
        "    if (!selectedIndicator) return 0;"
        "    "
        "    // Get entries for the selected quarter only (not cumulative)"
        "    const allIndicatorEntries = entriesByIndicator[selectedIndicator.id] || [];"
        "    const quarterEntries = allIndicatorEntries.filter(entry => "
        "      entry.quarterId === selectedQuarterId"
        "    );"
        "    "
        "    // For annual progress, use the current quarter's actual value divided by annual target"
        "    // This matches the requirement: Q1 actual / annual target, Q2 actual / annual target, etc."
        "    const currentQuarterActual = quarterEntries.length > 0 "
        "      ? Math.max(...quarterEntries.map(e => e.value)) // Use latest value in the quarter"
        "      : 0;"
        "    "
        "    const annualTarget = selectedIndicator.targets.annual;"
        "    "
        "    if (annualTarget === 0) return 0;"
        "    "
        "    const performance = (currentQuarterActual / Number(annualTarget)) * 100;"
        "    return Math.min(performance, 100);"
        "  }, [selectedIndicator, entriesByIndicator, selectedQuarterId]);"
    } elseif ($_ -match "// Filter entries to only include up to the end of selected quarter" -or 
              $_ -match "// Get months up to the end of selected quarter" -or
              $_ -match "const getMonthsUpToQuarter" -or
              $_ -match "case 'q1':" -or
              $_ -match "case 'q2':" -or
              $_ -match "case 'q3':" -or
              $_ -match "case 'q4':" -or
              $_ -match "default:" -or
              $_ -match "const allowedMonths" -or
              $_ -match "const filteredEntries" -or
              $_ -match "return calculateAnnualProgress" -or
              $_ -match "}, \[selectedIndicator, entriesByIndicator, selectedQuarterId\];") {
        # Skip these lines
    } else {
        $_
    }
} | Set-Content "AnalyticsView.tsx"

Write-Host "Annual progress calculation has been fixed!"
