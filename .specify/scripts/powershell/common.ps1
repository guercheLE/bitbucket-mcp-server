#!/usr/bin/env pwsh
# Common PowerShell functions analogous to common.sh (moved to powershell/)

function Get-RepoRoot {
    git rev-parse --show-toplevel
}

function Get-CurrentBranch {
    git rev-parse --abbrev-ref HEAD
}

function Test-FeatureBranch {
    param([string]$Branch)
    if ($Branch -notmatch '^feature/[0-9]{3}-') {
        Write-Output "ERROR: Not on a feature branch. Current branch: $Branch"
        Write-Output "Feature branches should be named like: feature/001-feature-name"
        return $false
    }
    return $true
}

function Get-FeatureDir {
    param([string]$RepoRoot, [string]$Branch)
    # Extract feature directory name from branch (feature/001-name -> 001-name)
    if ($Branch -match '^feature/(.+)$') {
        $FeatureDirName = $matches[1]
        Join-Path $RepoRoot ".specify/$FeatureDirName"
    } else {
        Join-Path $RepoRoot ".specify/$Branch"
    }
}

function Get-FeaturePathsEnv {
    $repoRoot = Get-RepoRoot
    $currentBranch = Get-CurrentBranch
    $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch
    [PSCustomObject]@{
        REPO_ROOT    = $repoRoot
        CURRENT_BRANCH = $currentBranch
        FEATURE_DIR  = $featureDir
        SPECIFY_REQUEST = Join-Path $featureDir 'specify-request.txt'
        MVP_PLAN     = Join-Path $featureDir 'mvp-plan.md'
        EXECUTION_PLAN = Join-Path $featureDir 'execution-plan.json'
        TASKS        = Join-Path $featureDir 'tasks.md'
        RESEARCH     = Join-Path $featureDir 'research.md'
        CONTEXT      = Join-Path $featureDir 'context.md'
        CONTRACTS_DIR = Join-Path $featureDir 'contracts'
    }
}

function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path -Path $Path -PathType Leaf) {
        Write-Output "  ✓ $Description"
        return $true
    } else {
        Write-Output "  ✗ $Description"
        return $false
    }
}

function Test-DirHasFiles {
    param([string]$Path, [string]$Description)
    if ((Test-Path -Path $Path -PathType Container) -and (Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1)) {
        Write-Output "  ✓ $Description"
        return $true
    } else {
        Write-Output "  ✗ $Description"
        return $false
    }
}
