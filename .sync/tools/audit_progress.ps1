# Translation progress audit: CJK ratio of prose lines (fence-aware) per md file.
# Files with prose but ratio < 30% count as untranslated/in-progress.
# api_reference stubs are exempt (their English sentence is intentionally kept).
$files = Get-ChildItem -Recurse -File docs -Include *.md | Where-Object { $_.FullName -notmatch '\\assets\\' }
$done = 0; $todo = 0
$todoList = @()
foreach ($f in $files) {
  $rel = $f.FullName.Replace("$PWD\docs\", '')
  if ($rel -match '^api_reference\\') { $done++; continue }  # stub pages: English kept by design
  $lines = Get-Content $f.FullName -Encoding utf8
  $inFence = $false; $prose = 0; $cjk = 0
  foreach ($l in $lines) {
    if ($l -match '^\s*(```|~~~)') { $inFence = -not $inFence; continue }
    if ($inFence) { continue }
    $t = $l.Trim()
    if ($t -eq '' -or $t -match '^#' -or $t -match '^\{#') { continue }
    if ($t.Length -lt 20) { continue }
    # skip pure table-of-links rows and definition link lines
    if ($t -match '^\[[^\]]*\]:\s' ) { continue }
    $prose++
    if ($t -match '[\u4e00-\u9fff]') { $cjk++ }
  }
  if ($prose -eq 0) { $done++; continue }
  $ratio = 100.0 * $cjk / $prose
  if ($ratio -ge 30) { $done++ } else { $todo++; $todoList += ("{0,5:N0}%  {1}" -f $ratio, $rel) }
}
Write-Output ("DONE: $done   TODO: $todo   TOTAL: $($files.Count)")
Write-Output "--- remaining ---"
$todoList
