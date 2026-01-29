// Temporary fix for sub-indicator display
// Replace the quarterly target display in AnalyticsView.tsx around line 1057-1059

// OLD CODE:
/*
<div className="flex justify-between text-xs text-slate-500">
  <span>{sub.actual.toLocaleString()} actual</span>
  <span>{sub.target.toLocaleString()} quarterly target</span>
</div>
*/

// NEW CODE:
<div className="flex justify-between text-xs text-slate-500">
  <span>{sub.actual.toLocaleString()} actual</span>
  <span>
    {(() => {
      const subIndicatorData = INDICATORS.find(ind => ind.id === sub.id);
      const parentIndicator = INDICATORS.find(ind => 
        ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
      );
      
      // Check if this is a percentage sub-indicator from indicators 69, 99, or 101
      if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id) && subIndicatorData) {
        const quarterId = selectedQuarter?.id || 'q1';
        const percentageTarget = parseValue(subIndicatorData.targets[quarterId as keyof typeof subIndicatorData.targets]);
        return `${percentageTarget}% target`;
      }
      
      return `${sub.target.toLocaleString()} quarterly target`;
    })()}
  </span>
</div>
