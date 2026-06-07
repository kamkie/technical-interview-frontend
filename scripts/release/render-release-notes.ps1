param(
    [Parameter(Mandatory = $true)]
    [string]$ChangelogPath,

    [Parameter(Mandatory = $true)]
    [string]$CurrentTag,

    [string]$PreviousPublishedTag,

    [Parameter(Mandatory = $true)]
    [string]$TagImageReference,

    [Parameter(Mandatory = $true)]
    [string]$ShaImageReference,

    [Parameter(Mandatory = $true)]
    [string]$PackagePageUrl,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-ReleaseTag
{
    param(
        [Parameter(Mandatory = $true)]
        [string]$Tag
    )

    $trimmedTag = $Tag.Trim()
    if ($trimmedTag.StartsWith("v", [StringComparison]::OrdinalIgnoreCase))
    {
        return $trimmedTag.Substring(1)
    }
    return $trimmedTag
}

if (-not (Test-Path -LiteralPath $ChangelogPath))
{
    throw "CHANGELOG file '$ChangelogPath' was not found."
}

$changelog = Get-Content -LiteralPath $ChangelogPath -Raw
$sectionHeadingMatches = [Regex]::Matches($changelog, "(?m)^## \[(?<tag>[^\]]+)\](?: - .+)?[ \t]*$")

if ($sectionHeadingMatches.Count -eq 0)
{
    throw "No version sections were found in '$ChangelogPath'."
}

function Get-UniqueSectionHeading
{
    param(
        [Parameter(Mandatory = $true)]
        [string]$Tag,

        [Parameter(Mandatory = $true)]
        [System.Text.RegularExpressions.MatchCollection]$HeadingMatches
    )

    $normalizedTag = Normalize-ReleaseTag -Tag $Tag
    $tagMatches = @($HeadingMatches | Where-Object {
        (Normalize-ReleaseTag -Tag $_.Groups["tag"].Value) -eq $normalizedTag
    })

    if ($tagMatches.Count -eq 0)
    {
        throw "No CHANGELOG.md section matched tag '$Tag'."
    }

    if ($tagMatches.Count -gt 1)
    {
        throw "Multiple CHANGELOG.md sections matched tag '$Tag'."
    }

    return $tagMatches[0]
}

$currentHeading = Get-UniqueSectionHeading -Tag $CurrentTag -HeadingMatches $sectionHeadingMatches
$endIndex = $changelog.Length

if (-not [string]::IsNullOrWhiteSpace($PreviousPublishedTag))
{
    if ((Normalize-ReleaseTag -Tag $CurrentTag) -eq (Normalize-ReleaseTag -Tag $PreviousPublishedTag))
    {
        throw "Current tag '$CurrentTag' matches previous published release tag '$PreviousPublishedTag'."
    }

    $previousHeading = Get-UniqueSectionHeading -Tag $PreviousPublishedTag -HeadingMatches $sectionHeadingMatches
    if ($currentHeading.Index -ge $previousHeading.Index)
    {
        throw "Could not derive cumulative release range from '$PreviousPublishedTag' to '$CurrentTag' from CHANGELOG.md ordering."
    }
    $endIndex = $previousHeading.Index
}
else
{
    $nextHeading = @(
        $sectionHeadingMatches |
            Where-Object { $_.Index -gt $currentHeading.Index } |
            Sort-Object Index
    ) | Select-Object -First 1

    if ($nextHeading)
    {
        $endIndex = $nextHeading.Index
    }
}

$releaseSection = $changelog.Substring($currentHeading.Index, $endIndex - $currentHeading.Index).TrimEnd("`r", "`n")

if ([string]::IsNullOrWhiteSpace($releaseSection))
{
    throw "Derived release section for '$CurrentTag' is empty."
}

$releaseNotes = @(
    $releaseSection
    ""
    "## Release Metadata"
    ""
    "- Container image: ``$TagImageReference``"
    "- Immutable image: ``$ShaImageReference``"
    "- Package page: [GitHub Container Registry package]($PackagePageUrl)"
) -join [Environment]::NewLine

$outputDirectory = Split-Path -Path $OutputPath -Parent
if (-not [string]::IsNullOrWhiteSpace($outputDirectory))
{
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

Set-Content -LiteralPath $OutputPath -Value $releaseNotes
