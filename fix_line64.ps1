# PowerShell script to fix line 64
$file = "FillFormView.tsx"
$content = Get-Content $file
$content[63] = $content[63] -replace "'67', '89'", "'67', '89', '43'"
$content | Set-Content $file
Write-Host "Line 64 updated successfully!"
