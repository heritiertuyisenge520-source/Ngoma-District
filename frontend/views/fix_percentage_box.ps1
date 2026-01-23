$content = Get-Content "FillFormView.tsx"
# Fix line 2045 to exclude indicator '43' from generic percentage calculation
$content[2044] = $content[2044] -replace "'67', '89']", "'67', '89', '43']"
$content | Set-Content "FillFormView.tsx"
