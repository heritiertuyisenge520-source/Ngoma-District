$content = Get-Content "FillFormView.tsx"
# Remove the duplicate line 650
$content = $content[0..649] + $content[651..($content.Length-1)]
$content | Set-Content "FillFormView.tsx"
