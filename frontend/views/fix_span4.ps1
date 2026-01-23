$content = Get-Content "FillFormView.tsx"
# Replace the broken section with the correct structure using single quotes
$content[650] = "                  {selectedIndicator && quarterId && !selectedIndicator.isDual && ("
$content[651] = '                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 italic normal-case tracking-normal">'
$content[652] = "                      Fixed Target: {selectedPillar?.outputs.flatMap(o => o.indicators).find(i => i.id === indicatorId)?.targets[quarterId as keyof Indicator['targets']] || 0}"
$content[653] = "                    </span>"
$content[654] = "                  )}"
$content | Set-Content "FillFormView.tsx"
