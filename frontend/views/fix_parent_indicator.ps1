# Fix parent indicator display to show average instead of target
$file = "AnalyticsView.tsx"
$content = Get-Content $file

# Find and replace the target/actual display section
$newContent = @()
for ($i = 0; $i -lt $content.Length; $i++) {
    $line = $content[$i]
    
    if ($line -match "flex-1 space-y-2") {
        # Add the new conditional logic
        $newContent += $line
        $newContent += "                  {selectedIndicator?.subIndicatorIds ? ("
        $newContent += "                    // Parent indicator with sub-indicators - show average info instead of target"
        $newContent += "                    <div className=""flex justify-between items-center p-2 bg-blue-50 rounded-lg"">"
        $newContent += "                      <span className=""text-xs text-blue-600 font-medium"">Average of Sub-indicators</span>"
        $newContent += "                      <span className=""text-sm font-bold text-blue-700"">{Math.round(quarterStats.performance)}%</span>"
        $newContent += "                    </div>"
        $newContent += "                  ) : ("
        $newContent += "                    // Regular indicator - show target and actual"
        $newContent += "                    <>"
        $newContent += "                      <div className=""flex justify-between items-center p-2 bg-slate-50 rounded-lg"">"
        $newContent += "                        <span className=""text-xs text-slate-500"">Target</span>"
        $newContent += "                        <span className=""text-sm font-bold text-slate-700"">{quarterStats.target.toLocaleString()}</span>"
        $newContent += "                      </div>"
        $newContent += "                      <div className=""flex justify-between items-center p-2 bg-slate-50 rounded-lg"">"
        $newContent += "                        <span className=""text-xs text-slate-500"">Actual</span>"
        $newContent += "                        <span className=""text-sm font-bold text-slate-700"">{quarterStats.totalActual.toLocaleString()}</span>"
        $newContent += "                      </div>"
        $newContent += "                    </>"
        $newContent += "                  )}"
        
        # Skip the next 8 lines (the old target/actual divs)
        $i += 8
    } else {
        $newContent += $line
    }
}

$newContent | Set-Content $file

Write-Host "Fixed parent indicator display!"
