$content = Get-Content "FillFormView.tsx"
# Fix the template literal syntax on line 1656
$content[1655] = $content[1655] -replace '\$\{inputClasses\}', '${inputClasses}'
$content | Set-Content "FillFormView.tsx"
