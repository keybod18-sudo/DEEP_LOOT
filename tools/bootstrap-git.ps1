param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$runtime = Join-Path $root ".runtime\git"
$gitExe = Join-Path $runtime "cmd\git.exe"

if (Test-Path $gitExe) {
    Write-Host "[OK] Portable Git already exists."
    exit 0
}

Write-Host "[SETUP] Downloading portable Git (MinGit)..."
$headers = @{ "User-Agent" = "DEEP-LOOT-Local-Setup" }
$release = Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/git-for-windows/git/releases/latest"

$asset = $release.assets |
    Where-Object { $_.name -match '^MinGit-.*-64-bit\.zip$' -and $_.name -notmatch 'busybox' } |
    Select-Object -First 1

if (-not $asset) {
    throw "Could not find the 64-bit MinGit ZIP in the latest Git for Windows release."
}

$tmp = Join-Path $env:TEMP "deep_loot_mingit.zip"
Invoke-WebRequest -Headers $headers -Uri $asset.browser_download_url -OutFile $tmp

if (Test-Path $runtime) {
    Remove-Item -Recurse -Force $runtime
}
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
Expand-Archive -Path $tmp -DestinationPath $runtime -Force
Remove-Item -Force $tmp -ErrorAction SilentlyContinue

if (-not (Test-Path $gitExe)) {
    throw "Git extraction finished, but git.exe was not found."
}

Write-Host "[OK] Portable Git ready."
& $gitExe --version
