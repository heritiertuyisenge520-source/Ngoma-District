# Add sub-indicator breakdown to monthly chart
$file = "AnalyticsView.tsx"
$content = Get-Content $file

# Find the bar chart section and modify it for sub-indicators
$newContent = @()
$inBarChart = $false

for ($i = 0; $i -lt $content.Length; $i++) {
    $line = $content[$i]
    
    if ($line -match "Bar Chart - INCREASED HEIGHT") {
        $inBarChart = $true
        $newContent += $line
        # Add helper function for sub-indicator monthly values
        $newContent += "              {(() => {"
        $newContent += "                const getSubIndicatorMonthlyValues = (monthName: string) => {"
        $newContent += "                  if (!selectedIndicator?.subIndicatorIds) return [];"
        $newContent += "                  "
        $newContent += "                  const indicatorEntries = entriesByIndicator[selectedIndicatorId] || [];"
        $newContent += "                  const monthEntries = indicatorEntries.filter(e => e.month === monthName);"
        $newContent += "                  "
        $newContent += "                  return Object.entries(selectedIndicator.subIndicatorIds).map(([key, subId]) => {"
        $newContent += "                    const subIndicator = INDICATORS.find(ind => ind.id === subId);"
        $newContent += "                    const subMonthlyValue = monthEntries.reduce((acc, curr) => {"
        $newContent += "                      return acc + (curr.subValues?.[key] || 0);"
        $newContent += "                    }, 0);"
        $newContent += "                    "
        $newContent += "                    return {"
        $newContent += "                      id: subId,"
        $newContent += "                      name: subIndicator?.name || key,"
        $newContent += "                      value: subMonthlyValue,"
        $newContent += "                      color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Object.keys(selectedIndicator.subIndicatorIds).indexOf(key)]"
        $newContent += "                    };"
        $newContent += "                  });"
        $newContent += "                };"
        $newContent += "                "
        $newContent += "                const hasSubIndicators = selectedIndicator?.subIndicatorIds;"
        $newContent += "                "
        $newContent += "                return ("
    }
    
    if ($inBarChart -and $line -match "flex items-end justify-around gap-4 h-80") {
        $newContent += $line
        $newContent += "                {quarterStats.months.map((month, idx) => {"
        $newContent += "                  const val = quarterStats.monthlyValues[idx];"
        $newContent += "                  const maxVal = Math.max(...quarterStats.monthlyValues, 1);"
        $newContent += "                  const heightPercent = Math.max((val / maxVal) * 100, 10);"
        $newContent += "                  const expected = quarterStats.target / 3;"
        $newContent += "                  const mPerf = Math.min((val / expected) * 100, 100);"
        $newContent += "                  const mColor = getPerformanceColor(mPerf);"
        $newContent += "                  "
        $newContent += "                  const subValues = getSubIndicatorMonthlyValues(month);"
        $newContent += "                  "
        $newContent += "                  return ("
        $newContent += "                    <div key={month} className=""flex-1 flex flex-col items-center group cursor-pointer"">"
        $newContent += "                      <div className=""text-sm font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity"">"
        $newContent += "                        {val.toLocaleString()}"
        $newContent += "                      </div>"
        $newContent += "                      <div className=""w-full flex items-end h-64"">"
        $newContent += "                        {hasSubIndicators ? ("
        $newContent += "                          // Show stacked bars for sub-indicators"
        $newContent += "                          <div className=""w-full flex flex-col justify-end"">"
        $newContent += "                            {subValues.map((sub, subIdx) => {"
        $newContent += "                              const subHeight = maxVal > 0 ? (sub.value / maxVal) * 100 : 0;"
        $newContent += "                              return ("
        $newContent += "                                <div"
        $newContent += "                                  key={sub.id}"
        $newContent += "                                  className=""w-full transition-all duration-300 group-hover:scale-105"" "
        $newContent += "                                  style={{"
        $newContent += "                                    height: `${Math.max(subHeight, 2)}%`,"
        $newContent += "                                    backgroundColor: sub.color,"
        $newContent += "                                    opacity: 0.8"
        $newContent += "                                  }}"
        $newContent += "                                  title={`${sub.name}: ${sub.value.toLocaleString()}`}"
        $newContent += "                                />"
        $newContent += "                              );"
        $newContent += "                            })}"
        $newContent += "                          </div>"
        $newContent += "                        ) : ("
        $newContent += "                          // Show single bar for regular indicators"
        $newContent += "                          <div"
        $newContent += "                            className=""w-full rounded-t-xl transition-all duration-300 group-hover:scale-105"""
        $newContent += "                            style={{"
        $newContent += "                              height: `${heightPercent}%`,"
        $newContent += "                              background: `linear-gradient(180deg, ${getHexForColor(mColor)} 0%, ${getHexForColor(mColor)}80 100%)`,"
        $newContent += "                              boxShadow: `0 0 20px ${getHexForColor(mColor)}40`"
        $newContent += "                            }}"
        $newContent += "                          />"
        $newContent += "                        )}"
        $newContent += "                      </div>"
        $newContent += "                      <span className={`text-xs font-semibold mt-3 uppercase tracking-wide transition-colors ${hoveredMonth === month ? 'text-white' : 'text-slate-400'}`}"
        $newContent += "                        onMouseEnter={() => setHoveredMonth(month)}"
        $newContent += "                        onMouseLeave={() => setHoveredMonth(null)}>"
        $newContent += "                        {month.substring(0, 3)}"
        $newContent += "                      </span>"
        $newContent += "                      "
        $newContent += "                      {/* Sub-indicator legend */}"
        $newContent += "                      {hasSubIndicators && idx === 0 && ("
        $newContent += "                        <div className=""mt-2 space-y-1"">"
        $newContent += "                          {subValues.slice(0, 3).map((sub, subIdx) => ("
        $newContent += "                            <div key={sub.id} className=""flex items-center gap-1"">"
        $newContent += "                              <div className=""w-2 h-2 rounded-full"" style={{ backgroundColor: sub.color }} />"
        $newContent += "                              <span className=""text-xs text-slate-400 truncate"">{sub.name.split(' ').slice(0, 2).join(' ')}</span>"
        $newContent += "                            </div>"
        $newContent += "                          ))}"
        $newContent += "                          {subValues.length > 3 && <span className=""text-xs text-slate-400"">+{subValues.length - 3} more</span>}"
        $newContent += "                        </div>"
        $newContent += "                      )}"
        $newContent += "                    </div>"
        $newContent += "                  );"
        $newContent += "                })}"
        $newContent += "                );"
        $newContent += "              })()}"
        
        # Skip the old chart code until we find the closing div
        while ($i + 1 -lt $content.Length -and $content[$i + 1] -notmatch "}</div>") {
            $i++
        }
        $inBarChart = $false
    } else {
        $newContent += $line
    }
}

$newContent | Set-Content $file

Write-Host "Added sub-indicator breakdown to monthly chart!"
