  const annualCompletion = useMemo(() => {
    if (!selectedIndicator) return 0;
    
    // Get entries for the selected quarter only (not cumulative)
    const allIndicatorEntries = entriesByIndicator[selectedIndicator.id] || [];
    const quarterEntries = allIndicatorEntries.filter(entry => 
      entry.quarterId === selectedQuarterId
    );
    
    // For annual progress, use the current quarter's actual value divided by annual target
    // This matches the requirement: Q1 actual / annual target, Q2 actual / annual target, etc.
    const currentQuarterActual = quarterEntries.length > 0 
      ? Math.max(...quarterEntries.map(e => e.value)) // Use latest value in the quarter
      : 0;
    
    const annualTarget = selectedIndicator.targets.annual;
    
    if (annualTarget === 0) return 0;
    
    const performance = (currentQuarterActual / Number(annualTarget)) * 100;
    return Math.min(performance, 100);
  }, [selectedIndicator, entriesByIndicator, selectedQuarterId]);
