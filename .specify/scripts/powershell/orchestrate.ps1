# Orchestration Engine for Spec-Driven Development - PowerShell Version

[CmdletBinding()]
param(
    [string]$Command,
    [string[]]$Arguments,
    [switch]$RunTasks = $false
)

$ErrorActionPreference = 'Stop'

# --- Configuration ---
$originalRepoRoot = git rev-parse --show-toplevel
$tmpWorkspace = "/tmp/orchestrate-workspace-$PID"
$repoRoot = $tmpWorkspace
$executionPlan = Join-Path $repoRoot 'execution-plan.json'

# --- Setup Functions ---

function Setup-TempWorkspace {
    Log "Setting up temporary workspace at $tmpWorkspace..."
    
    # Create temp workspace
    New-Item -ItemType Directory -Path $tmpWorkspace -Force | Out-Null
    
    # Copy all necessary files and directories
    Log "Copying .specify directory..."
    Copy-Item -Path "$originalRepoRoot/.specify" -Destination $tmpWorkspace -Recurse -Force
    
    # Copy any existing execution-plan.json
    $originalPlan = Join-Path $originalRepoRoot 'execution-plan.json'
    if (Test-Path $originalPlan) {
        Log "Copying existing execution-plan.json..."
        Copy-Item -Path $originalPlan -Destination $tmpWorkspace -Force
    }
    
    # Copy any existing specs directory
    $originalSpecs = Join-Path $originalRepoRoot 'specs'
    if (Test-Path $originalSpecs) {
        Log "Copying existing specs directory..."
        Copy-Item -Path $originalSpecs -Destination $tmpWorkspace -Recurse -Force
    }
    
    # Create necessary directories
    $specsDir = Join-Path $tmpWorkspace 'specs'
    New-Item -ItemType Directory -Path $specsDir -Force | Out-Null
    
    Log "Temporary workspace setup complete."
}

function Cleanup-TempWorkspace {
    if (Test-Path $tmpWorkspace) {
        Log "Cleaning up temporary workspace..."
        Remove-Item -Path $tmpWorkspace -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Sync-BackToOriginal {
    Log "Syncing results back to original repository..."
    
    # Copy execution-plan.json back
    if (Test-Path $executionPlan) {
        Copy-Item -Path $executionPlan -Destination $originalRepoRoot -Force
    }
    
    # Copy specs directory back
    $tmpSpecs = Join-Path $tmpWorkspace 'specs'
    if (Test-Path $tmpSpecs) {
        Copy-Item -Path $tmpSpecs -Destination $originalRepoRoot -Recurse -Force
    }
    
    Log "Sync complete."
}

# --- Helper Functions ---

function Log([string]$message) {
    Write-Host "[ORCHESTRATE] $message" -ForegroundColor Cyan
}

function Get-JsonValue([string]$key) {
    $plan = Get-Content $executionPlan | ConvertFrom-Json
    return $plan | Select-Object -ExpandProperty $key
}

function Get-FeatureBranch([string]$featureId) {
    $features = Get-JsonValue -key 'features'
    return $features | Where-Object { $_.id -eq $featureId } | Select-Object -ExpandProperty 'branch'
}

# --- Command Functions ---

function Invoke-Init {
    param([string[]]$Arguments)
    Log "Initializing project..."
    
    # Setup temp workspace first
    Setup-TempWorkspace
    
    $projectDescription = $Arguments -join ' '
    if ([string]::IsNullOrEmpty($projectDescription)) {
        throw "Project description cannot be empty for init."
    }

    $specsDir = Join-Path $repoRoot 'specs'
    New-Item -ItemType Directory -Path $specsDir -Force | Out-Null

    Log "Analyzing project state..."
    $env:ORCHESTRATE_REPO_ROOT = $repoRoot
    $projectStateScript = Join-Path $repoRoot '.specify/scripts/powershell/analyze-project-state.ps1'
    $projectStateResult = & $projectStateScript -Json | ConvertFrom-Json
    $projectType = $projectStateResult.project_type
    $nextBranchNumber = $projectStateResult.next_branch_number

    Log "Creating execution plan..."
    $plan = @{
        project_description = $projectDescription
        project_type = $projectType
        next_branch_number = $nextBranchNumber
        project_state = $projectStateResult
        features = @()
        dependencies = @{}
        execution_order = @()
        status = "initialized"
    } | ConvertTo-Json -Depth 5
    $plan | Out-File -FilePath $executionPlan -Encoding UTF8
    Log "Initialization complete. execution-plan.json created."
    
    # Sync results back to original repo
    Sync-BackToOriginal
}

function Get-NextAction {
    Log "Determining next action..."
    
    # Ensure temp workspace is set up if execution plan exists
    if (-not (Test-Path $tmpWorkspace)) {
        Setup-TempWorkspace
    }
    
    $plan = Get-Content $executionPlan | ConvertFrom-Json
    
    # Placeholder for spec/plan/tasks check
    foreach ($featureId in $plan.execution_order) {
        $featureObj = $plan.features | Where-Object { $_.id -eq $featureId }
        if ($featureObj.status -eq 'specified') {
            Log "Next action is to implement feature: $featureId"
            return @{ action = 'implement'; feature_id = $featureId } | ConvertTo-Json
        }
    }

    Log "All features are implemented. Project is complete."
    return @{ action = 'complete'; feature_id = $null } | ConvertTo-Json
}

function Invoke-PreImplementCheck {
    param([string]$featureId)
    Log "Running pre-implementation checks for $featureId..."
    
    # Ensure temp workspace is set up
    if (-not (Test-Path $tmpWorkspace)) {
        Setup-TempWorkspace
    }
    
    $plan = Get-Content $executionPlan | ConvertFrom-Json

    # 1. Dependency Check
    Log "Checking dependencies..."
    $dependencies = $plan.dependencies.$featureId
    if ($null -ne $dependencies) {
        foreach ($depId in $dependencies) {
            $depObj = $plan.features | Where-Object { $_.id -eq $depId }
            if ($depObj.status -ne 'implemented') {
                throw "ERROR: Dependency '$depId' is not implemented. Current status: $($depObj.status)"
            }
        }
    }
    Log "All dependencies are met."

    # Note: Git operations would normally happen here, but since we're working
    # outside git realms, we skip the rebase operations
    Log "Skipping git rebase operations (working outside git realms)."
    
    return @{ status = 'success'; message = "Pre-implementation checks passed for $featureId" } | ConvertTo-Json
}

function Get-Task {
    param([string]$featureId)
    
    # Check if task execution is disabled
    if (-not $RunTasks) {
        Log "Task retrieval is disabled (-RunTasks not specified)"
        return @{ status = 'disabled'; message = 'Task execution disabled. Use -RunTasks to enable.' } | ConvertTo-Json
    }
    
    # Ensure temp workspace is set up
    if (-not (Test-Path $tmpWorkspace)) {
        Setup-TempWorkspace
    }
    
    $tasksFile = Join-Path $repoRoot "specs/$featureId/tasks.md"
    if (-not (Test-Path $tasksFile)) {
        throw "ERROR: tasks.md not found for $featureId at $tasksFile"
    }

    $task = Get-Content $tasksFile | Select-String -Pattern '- \[ \]' -List | Select-Object -First 1
    if ($null -eq $task) {
        Log "No more tasks to implement for $featureId."
        return @{ status = 'complete' } | ConvertTo-Json
    }

    $lineNumber = $task.LineNumber
    $taskDesc = $task.Line -replace '.*- \[ \] ', ''

    return @{ status = 'found'; task_number = $lineNumber; description = $taskDesc } | ConvertTo-Json
}

function Invoke-CompleteTask {
    param([string]$featureId, [int]$taskNumber)
    
    # Check if task execution is disabled
    if (-not $RunTasks) {
        Log "Task completion is disabled (-RunTasks not specified)"
        return @{ status = 'disabled'; message = 'Task completion disabled. Use -RunTasks to enable.' } | ConvertTo-Json
    }
    
    # Ensure temp workspace is set up
    if (-not (Test-Path $tmpWorkspace)) {
        Setup-TempWorkspace
    }
    
    $tasksFile = Join-Path $repoRoot "specs/$featureId/tasks.md"
    Log "Marking task #$taskNumber as complete for $featureId"
    
    $fileContent = Get-Content $tasksFile
    $fileContent[$taskNumber - 1] = $fileContent[$taskNumber - 1] -replace '- \[ \]', '- [x]'
    $fileContent | Set-Content $tasksFile

    $taskDesc = $fileContent[$taskNumber - 1] -replace '.*- \[x\] ', ''
    $commitMessage = "feat($featureId): Complete task $taskNumber - $taskDesc"

    Log "Task marked complete (git operations skipped in temp workspace)"
    
    # Sync changes back to original repo
    Sync-BackToOriginal

    return @{ status = 'success'; message = "Task $taskNumber completed and synced." } | ConvertTo-Json
}

function Invoke-FinalizeImplementation {
    param([string]$featureId)
    Log "Finalizing implementation for $featureId..."
    
    # Ensure temp workspace is set up
    if (-not (Test-Path $tmpWorkspace)) {
        Setup-TempWorkspace
    }

    Log "Updating execution plan..."
    $plan = Get-Content $executionPlan | ConvertFrom-Json
    $featureIndex = [array]::IndexOf($plan.features.id, $featureId)
    $plan.features[$featureIndex].status = 'implemented'
    $plan | ConvertTo-Json -Depth 5 | Out-File -FilePath $executionPlan -Encoding UTF8

    Log "Feature $featureId has been successfully implemented (git merge skipped in temp workspace)."
    
    # Sync changes back to original repo
    Sync-BackToOriginal
    
    return @{ status = 'success'; feature_id = $featureId } | ConvertTo-Json
}


# --- Main Command Router ---
try {
    switch ($Command) {
        'init' { Invoke-Init -Arguments $Arguments }
        'get-next-action' { Get-NextAction }
        'pre-implement-check' { Invoke-PreImplementCheck -featureId $Arguments[0] }
        'get-task' { Get-Task -featureId $Arguments[0] }
        'complete-task' { Invoke-CompleteTask -featureId $Arguments[0] -taskNumber $Arguments[1] }
        'finalize-implementation' { Invoke-FinalizeImplementation -featureId $Arguments[0] }
        default {
            Write-Host "Usage: .\orchestrate.ps1 [-RunTasks] <command> [options]"
            Write-Host ""
            Write-Host "Global Options:"
            Write-Host "  -RunTasks              Enable task execution (default: false)"
            Write-Host ""
            Write-Host "Commands:"
            Write-Host "  init <description>         Initializes the project and creates planning files."
            Write-Host "  get-next-action            Determines and returns the next logical workflow step."
            Write-Host "  pre-implement-check <id>   Verifies dependencies and performs a rebase for a feature."
            Write-Host "  get-task <id>              Retrieves the next incomplete task for a feature."
            Write-Host "  complete-task <id> <num>   Marks a task as complete and commits the change."
            Write-host "  finalize-implementation <id> Merges a completed feature branch into main."
            exit 1
        }
    }
} finally {
    # Cleanup temp workspace
    Cleanup-TempWorkspace
}
