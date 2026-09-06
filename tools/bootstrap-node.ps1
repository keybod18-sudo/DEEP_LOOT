$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$runtimeRoot = Join-Path $projectRoot '.runtime'
$nodeDir = Join-Path $runtimeRoot 'node'
$nodeExe = Join-Path $nodeDir 'node.exe'

if (Test-Path $nodeExe) {
    Write-Host "[OK] Local Node.js runtime already exists."
    exit 0
}

New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

Write-Host "[SETUP] Node.js is not installed."
Write-Host "[SETUP] Downloading a private Node.js LTS runtime for this project..."
Write-Host "        No global Node.js install or administrator setup is required."

$indexUrl = 'https://nodejs.org/dist/index.json'
$releases = Invoke-RestMethod -Uri $indexUrl -UseBasicParsing

# Pick newest x64 Windows ZIP release that is an even-numbered LTS line.
$release = $releases | Where-Object {
    $_.lts -and
    $_.files -contains 'win-x64-zip' -and
    ([int](($_.version -replace '^v','').Split('.')[0]) % 2 -eq 0)
} | Select-Object -First 1

if (-not $release) {
    throw 'Could not find a suitable Windows x64 Node.js LTS release.'
}

$version = $release.version
$zipName = "node-$version-win-x64.zip"
$downloadUrl = "https://nodejs.org/dist/$version/$zipName"
$zipPath = Join-Path $runtimeRoot $zipName
$extractRoot = Join-Path $runtimeRoot 'extract'

Write-Host "[SETUP] Node.js $version"
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

if (Test-Path $extractRoot) { Remove-Item -Recurse -Force $extractRoot }
New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

$expanded = Get-ChildItem -Path $extractRoot -Directory | Select-Object -First 1
if (-not $expanded) { throw 'Node.js archive extraction failed.' }

if (Test-Path $nodeDir) { Remove-Item -Recurse -Force $nodeDir }
Move-Item -Path $expanded.FullName -Destination $nodeDir

Remove-Item -Force $zipPath
Remove-Item -Recurse -Force $extractRoot

if (-not (Test-Path $nodeExe)) {
    throw 'node.exe was not found after setup.'
}

Write-Host "[OK] Local Node.js runtime is ready: $nodeDir"
exit 0
