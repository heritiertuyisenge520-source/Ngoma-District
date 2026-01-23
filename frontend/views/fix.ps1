$content = Get-Content "FillFormView.tsx"
$lineIndex = 63
$content[$lineIndex] = $content[$lineIndex] -replace "'67', '89'", "'67', '89', '43'"
$content | Set-Content "FillFormView.tsx"
