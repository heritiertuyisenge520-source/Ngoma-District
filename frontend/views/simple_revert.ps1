# Simple revert script
$content = Get-Content "AnalyticsView.tsx" -Raw

# Simple replacement - remove complex chart
$pattern = "/\* Bar Chart - INCREASED HEIGHT \*/.*?\)\(\)\}"
$replacement = @"
              {/* Bar Chart - INCREASED HEIGHT */}
              <div className="flex items-end justify-around gap-4 h-80">
                {quarterStats.months.map((month, idx) => {
                  const val = quarterStats.monthlyValues[idx];
                  const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                  const heightPercent = Math.max((val / maxVal) * 100, 10);
                  const expected = quarterStats.target / 3;
                  const mPerf = Math.min((val / expected) * 100, 100);
                  const mColor = getPerformanceColor(mPerf);

                  return (
                    <div key={month} className="flex-1 flex flex-col items-center group cursor-pointer">
                      <div className="text-sm font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {val.toLocaleString()}
                      </div>
                      <div className="w-full flex items-end h-64">
                        <div
                          className="w-full rounded-t-xl transition-all duration-300 group-hover:scale-105"
                          style={{
                            height: `${heightPercent}%`,
                            background: `linear-gradient(180deg, ${getHexForColor(mColor)} 0%, ${getHexForColor(mColor)}80 100%)`,
                            boxShadow: `0 0 20px ${getHexForColor(mColor)}40`
                          }}
                        />
                      </div>
                      <span className={`text-xs font-semibold mt-3 uppercase tracking-wide transition-colors ${hoveredMonth === month ? 'text-white' : 'text-slate-400'}`}
                        onMouseEnter={() => setHoveredMonth(month)}
                        onMouseLeave={() => setHoveredMonth(null)}>
                        {month.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
"@

$content = $content -replace $pattern, $replacement.Trim()
Set-Content "AnalyticsView.tsx" $content -NoNewline

Write-Host "Chart reverted to original!"
