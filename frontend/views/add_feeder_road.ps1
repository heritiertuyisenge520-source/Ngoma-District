$content = Get-Content "FillFormView.tsx"
$insertAfter = 1633
$feederRoadSection = @"

                    {/* Feeder Road Rehabilitation - Percentage Only */}
                    {indicatorId === '43' && (
                      <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <h4 className="font-bold text-blue-800 text-sm">Feeder Road Rehabilitation - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-blue-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of feeder road rehabilitation work completed (0-100)</p>
                        </div>
                      </div>
                    )}
"@

$newContent = $content[0..$insertAfter] + $feederRoadSection + $content[($insertAfter+1)..($content.Length-1)]
$newContent | Set-Content "FillFormView.tsx"
