$content = Get-Content "FillFormView.tsx"
# Replace the entire line 650 with the correct condition
$content[650] = "                  {selectedIndicator && quarterId && !['74', '83', '87', '88', '101', '132', '69', '99', '67', '89', '43'].includes(indicatorId) && ("
$content | Set-Content "FillFormView.tsx"
