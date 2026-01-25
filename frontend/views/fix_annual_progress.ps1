# Fix annual progress calculation to use quarterly actual / annual target
$content = Get-Content "AnalyticsView.tsx" -Raw

# Replace the annualCompletion function
$oldFunction = '  const annualCompletion = useMemo\(\(\) => \{
    if \(!selectedIndicator\) return 0;
    
    // Filter entries to only include up to the end of selected quarter
    const allIndicatorEntries = entriesByIndicator\[selectedIndicator\.id\] \|\| \[\];
    
    // Get months up to the end of selected quarter
    const getMonthsUpToQuarter = \(quarterId: string\): string\[\] => \{
      switch \(quarterId\) \{
        case '\''q1'\'': return \['\''July'\'', '\''August'\'', '\''September'\''\];
        case '\''q2'\'': return \['\''July'\'', '\''August'\'', '\''September'\'', '\''October'\'', '\''November'\'', '\''December'\''\];
        case '\''q3'\'': return \['\''July'\'', '\''August'\'', '\''September'\'', '\''October'\'', '\''November'\'', '\''December'\'', '\''January'\'', '\''February'\'', '\''March'\''\];
        case '\''q4'\'': return \['\''July'\'', '\''August'\'', '\''September'\'', '\''October'\'', '\''November'\'', '\''December'\'', '\''January'\'', '\''February'\'', '\''March'\'', '\''April'\'', '\''May'\'', '\''June'\''\];
        default: return \['\''July'\'', '\''August'\'', '\''September'\'', '\''October'\'', '\''November'\'', '\''December'\'', '\''January'\'', '\''February'\'', '\''March'\'', '\''April'\'', '\''May'\'', '\''June'\''\];
      \}
    \};
    
    const allowedMonths = getMonthsUpToQuarter\(selectedQuarterId\);
    const filteredEntries = allIndicatorEntries\.filter\(entry => 
      allowedMonths\.includes\(entry\.month\)
    \);
    
    return calculateAnnualProgress\(selectedIndicator, filteredEntries\);
  \}, \[selectedIndicator, entriesByIndicator, selectedQuarterId\]\);'

$newFunction = '  const annualCompletion = useMemo(() => {
    if (!selectedIndicator) return 0;
    
    // Get entries for the selected quarter only (not cumulative)
    const allIndicatorEntries = entriesByIndicator[selectedIndicator.id] || [];
    const quarterEntries = allIndicatorEntries.filter(entry => 
      entry.quarterId === selectedQuarterId
    );
    
    // For annual progress, use the current quarter''s actual value divided by annual target
    // This matches the requirement: Q1 actual / annual target, Q2 actual / annual target, etc.
    const currentQuarterActual = quarterEntries.length > 0 
      ? Math.max(...quarterEntries.map(e => e.value)) // Use latest value in the quarter
      : 0;
    
    const annualTarget = selectedIndicator.targets.annual;
    
    if (annualTarget === 0) return 0;
    
    const performance = (currentQuarterActual / Number(annualTarget)) * 100;
    return Math.min(performance, 100);
  }, [selectedIndicator, entriesByIndicator, selectedQuarterId]);'

$content = $content -replace $oldFunction, $newFunction
$content | Set-Content "AnalyticsView.tsx"

Write-Host "Annual progress calculation fixed!"
