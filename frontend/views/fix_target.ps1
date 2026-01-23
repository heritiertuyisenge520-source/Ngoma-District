$content = Get-Content "FillFormView.tsx"
# Fix line 650 to show targets for percentage indicators except the specific percentage-only ones
$content[650] = $content[650] -replace "!selectedIndicator.isDual &&", "!['74', '83', '87', '88', '101', '132', '69', '99', '67', '89', '43'].includes(indicatorId) &&"
$content | Set-Content "FillFormView.tsx"
