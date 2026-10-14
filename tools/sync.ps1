# Sync source: upstream nautilus_trader docs (develop branch = nightly/live docs).
# Extracts the docs tree, then mirrors it into ./docs via tools/sync.mjs.
param([string]$Ref = 'refs/upstream/develop')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot/..

if (-not (Test-Path .sync)) { New-Item -ItemType Directory .sync | Out-Null }
Remove-Item -Recurse -Force .sync/en -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force .sync/en | Out-Null

git fetch upstream --quiet 2>$null
git archive --format=tar -o .sync/docs.tar $Ref docs
tar -x -f .sync/docs.tar -C .sync/en
Remove-Item .sync/docs.tar

node tools/sync.mjs
