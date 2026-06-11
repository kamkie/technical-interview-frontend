# Starts the sibling backend with the GitHub and fake OAuth login providers,
# then runs the frontend dev server against it.
#
# Usage:
#   ./scripts/dev-live-auth.ps1
#   ./scripts/dev-live-auth.ps1 -GitHubAdminLogin your-github-login
#   ./scripts/dev-live-auth.ps1 -BackendOnly
#   ./scripts/dev-live-auth.ps1 -BackendRepo D:\path\to\technical-interview-demo

[CmdletBinding()]
param(
    [string] $BackendRepo = (Join-Path $PSScriptRoot "..\..\technical-interview-demo"),

    [string] $GitHubAdminLogin,

    [switch] $BackendOnly,

    [int] $ReadyTimeoutSeconds = 300
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $BackendRepo)) {
    throw "Backend repository not found: $BackendRepo. Pass -BackendRepo <path> for a non-default checkout."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendRoot = Resolve-Path $BackendRepo
$backendOrigin = "http://127.0.0.1:8080"
$frontendOrigin = "http://127.0.0.1:5173"
$gitHubCallback = "$frontendOrigin/api/session/login/oauth2/code/github"
$requiredProviders = @("github", "smoke")

$runningOnWindows = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform(
    [System.Runtime.InteropServices.OSPlatform]::Windows
)
$gradlewName = "gradlew"
if ($runningOnWindows) {
    $gradlewName = "gradlew.bat"
}
$gradlewPath = Join-Path $backendRoot $gradlewName
if (-not (Test-Path -LiteralPath $gradlewPath)) {
    throw "Missing backend Gradle wrapper: $gradlewPath"
}

function Test-BackendReady {
    try {
        $response = Invoke-WebRequest -Uri "$backendOrigin/actuator/health/readiness" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Get-LoginProviderIds {
    try {
        $session = Invoke-RestMethod -Uri "$backendOrigin/api/session" -TimeoutSec 5
        return @($session.loginProviders | ForEach-Object { $_.registrationId })
    }
    catch {
        return @()
    }
}

function Get-MissingProviderIds {
    $providerIds = Get-LoginProviderIds
    return @($requiredProviders | Where-Object { $providerIds -notcontains $_ })
}

function Test-LocalPortOpen {
    param([int] $Port)

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        return $client.ConnectAsync("127.0.0.1", $Port).Wait(1000) -and $client.Connected
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

# Load the backend .env the way the backend's build.ps1 does, for JAVA_HOME,
# database settings, and GitHub client credentials. The loader overrides
# already-set environment variables, so the provider profiles and bootstrap
# identities must be forced after it runs.
$dotenvScript = Join-Path $backendRoot "scripts\load-dotenv.ps1"
$dotenvFile = Join-Path $backendRoot ".env"
if ((Test-Path -LiteralPath $dotenvScript) -and (Test-Path -LiteralPath $dotenvFile)) {
    & $dotenvScript -Path $dotenvFile -Quiet
}

$env:SPRING_PROFILES_ACTIVE = "local,oauth,fake-oauth"

$adminIdentities = "smoke:smoke-user"
if (-not [string]::IsNullOrWhiteSpace($GitHubAdminLogin)) {
    $adminIdentities = "$adminIdentities,github:$GitHubAdminLogin"
}
$env:APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES = $adminIdentities

if ([string]::IsNullOrWhiteSpace($env:GITHUB_CLIENT_ID) -or [string]::IsNullOrWhiteSpace($env:GITHUB_CLIENT_SECRET)) {
    throw "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be non-empty for the github provider. Set them in the backend .env or the current shell, and register the OAuth app callback $gitHubCallback for the same-origin frontend flow."
}

Write-Host "Backend repository: $backendRoot"
Write-Host "Backend profiles: $($env:SPRING_PROFILES_ACTIVE)"
Write-Host "Bootstrap admin identities: $adminIdentities"
Write-Host "GitHub OAuth callback for the same-origin frontend flow: $gitHubCallback"

if (Test-BackendReady) {
    $missingProviders = Get-MissingProviderIds
    if ($missingProviders.Count -gt 0) {
        throw "A backend is already running on $backendOrigin without the required login providers (missing: $($missingProviders -join ', ')). Stop it, then rerun this script so the backend starts with the combined provider profiles."
    }
    Write-Host "Reusing the backend already running on $backendOrigin; GET /api/session advertises: $((Get-LoginProviderIds) -join ', ')"
}
else {
    Push-Location $backendRoot
    try {
        if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
            & docker-compose up -d
        }
        else {
            & docker compose up -d
        }
        if ($LASTEXITCODE -ne 0) {
            throw "Starting backend Docker dependencies failed in $backendRoot"
        }
    }
    finally {
        Pop-Location
    }

    # Mirror the backend build.ps1 -SkipTests local-loop shortcut: bootRun depends on
    # REST Docs generation and the test suite, and the forced provider environment
    # variables would leak into the test JVMs and fail their bootstrap assertions.
    $bootRunArgs = @(
        "bootRun",
        "-x", "test",
        "-x", "jacocoTestReport",
        "-x", "jacocoCoverageSummary",
        "-x", "jacocoTestCoverageVerification",
        "-x", "asciidoctor"
    )
    $backendProcess = Start-Process -FilePath $gradlewPath -ArgumentList $bootRunArgs -WorkingDirectory $backendRoot -PassThru
    Write-Host "Started backend bootRun in its own window (PID $($backendProcess.Id)). Waiting for readiness on $backendOrigin..."

    $deadline = (Get-Date).AddSeconds($ReadyTimeoutSeconds)
    while (-not (Test-BackendReady)) {
        if ($backendProcess.HasExited) {
            throw "The backend process exited before becoming ready. Check the backend window output."
        }
        if ((Get-Date) -gt $deadline) {
            throw "The backend did not become ready within $ReadyTimeoutSeconds seconds. Check the backend window output, or raise -ReadyTimeoutSeconds for a cold Gradle build."
        }
        Start-Sleep -Seconds 2
    }

    $missingProviders = Get-MissingProviderIds
    if ($missingProviders.Count -gt 0) {
        throw "The backend is ready but GET /api/session does not advertise: $($missingProviders -join ', '). Advertised providers: $((Get-LoginProviderIds) -join ', ')."
    }
    Write-Host "Backend ready on $backendOrigin; GET /api/session advertises: $((Get-LoginProviderIds) -join ', ')"
}

if ($BackendOnly) {
    Write-Host "Backend-only mode: run 'npm run dev' (or reuse the running dev server) and keep browser traffic on $frontendOrigin."
}
else {
    if (Test-LocalPortOpen -Port 5173) {
        throw "Port 5173 is already in use. If that is this repository's dev server, rerun with -BackendOnly and reuse it; otherwise stop it first (npm run dev:list / npm run dev:cleanup). The GitHub callback is registered for $frontendOrigin, so the dev server must own port 5173."
    }

    Write-Host "Starting the frontend dev server on $frontendOrigin. Ctrl+C stops only the frontend; the backend keeps running in its own window."
    Push-Location $repoRoot
    try {
        & npm run dev "--" --strictPort
    }
    finally {
        Pop-Location
        Write-Host "Frontend dev server stopped. The backend and its Docker dependencies may still be running; stop bootRun from the backend window and run 'docker-compose down' in $backendRoot when finished."
    }
}
