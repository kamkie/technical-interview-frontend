[CmdletBinding()]
param(
    [string] $BackendRepo = (Join-Path $PSScriptRoot "..\..\technical-interview-demo")
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendRoot = Resolve-Path $BackendRepo
$targetDir = Join-Path $repoRoot "docs\backend"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Copy-TextFileNormalized {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Source,

        [Parameter(Mandatory = $true)]
        [string] $Destination
    )

    $content = [System.IO.File]::ReadAllText($Source)
    $normalized = ($content -replace "`r`n", "`n") -replace "`r", "`n"
    [System.IO.File]::WriteAllText($Destination, $normalized, $utf8NoBom)
}

$frontendContract = Join-Path $backendRoot "docs\FRONTEND_AI_CONTRACT.md"
$openApiContract = Join-Path $backendRoot "src\test\resources\openapi\approved-openapi.json"

if (-not (Test-Path -LiteralPath $frontendContract)) {
    throw "Missing backend frontend contract: $frontendContract"
}

if (-not (Test-Path -LiteralPath $openApiContract)) {
    throw "Missing backend OpenAPI contract: $openApiContract"
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

Copy-TextFileNormalized -Source $frontendContract -Destination (Join-Path $targetDir "FRONTEND_AI_CONTRACT.md")
Copy-TextFileNormalized -Source $openApiContract -Destination (Join-Path $targetDir "approved-openapi.json")

$backendCommit = "unknown"
$gitOutput = & git -C $backendRoot rev-parse HEAD 2>$null
if ($LASTEXITCODE -eq 0 -and $gitOutput) {
    $backendCommit = $gitOutput.Trim()
}

$sourceLines = @(
    "# Backend Contract Source",
    "",
    "Source repository: technical-interview-demo",
    "Backend commit: $backendCommit",
    "",
    "Imported files:",
    "",
    "- docs/FRONTEND_AI_CONTRACT.md -> docs/backend/FRONTEND_AI_CONTRACT.md",
    "- src/test/resources/openapi/approved-openapi.json -> docs/backend/approved-openapi.json",
    "",
    "Refresh command:",
    "",
    '```powershell',
    "./scripts/sync-backend-contract.ps1",
    '```'
)

$sourcePath = Join-Path $targetDir "SOURCE.md"
[System.IO.File]::WriteAllText($sourcePath, (($sourceLines -join "`n") + "`n"), $utf8NoBom)

Write-Host "Imported backend contract artifacts from technical-interview-demo@$backendCommit"
