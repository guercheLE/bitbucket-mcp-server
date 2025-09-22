#!/usr/bin/env bash
# Orchestration Engine for Spec-Driven Development
set -e

# --- Configuration ---
REPO_ROOT=$(git rev-parse --show-toplevel)
EXECUTION_PLAN="$REPO_ROOT/execution-plan.json"

# --- Helper Functions ---

# Usage: log "message"
log() {
    echo "[ORCHESTRATE] $1" >&2
}

# Usage: get_json_value ".key"
get_json_value() {
    jq -r "$1" "$EXECUTION_PLAN"
}

# Usage: update_json ".key" "value"
update_json() {
    local key=$1
    local value=$2
    local temp_file
    temp_file=$(mktemp)
    jq --argjson val "$value" "$key = \$val" "$EXECUTION_PLAN" > "$temp_file" && mv "$temp_file" "$EXECUTION_PLAN"
}

# Usage: get_feature_branch "001-some-feature"
get_feature_branch() {
    local feature_id=$1
    get_json_value ".features[] | select(.id == \"$feature_id\") | .branch"
}

# --- Command Functions ---

cmd_init() {
    log "Initializing project..."
    # This preserves the original script's init logic
    local project_description=$1
    if [ -z "$project_description" ]; then
        log "ERROR: Project description cannot be empty for init."
        exit 1
    fi
    
    local specs_dir="$REPO_ROOT/specs"
    mkdir -p "$specs_dir"

    log "Analyzing project state..."
    local project_state_result
    project_state_result=$("$REPO_ROOT/.specify/scripts/bash/analyze-project-state.sh" --json)
    local project_type
    project_type=$(echo "$project_state_result" | jq -r '.project_type')
    local next_branch_number
    next_branch_number=$(echo "$project_state_result" | jq -r '.next_branch_number')

    log "Creating execution plan..."
    cat > "$EXECUTION_PLAN" << EOF
{
  "project_description": "$project_description",
  "project_type": "$project_type",
  "next_branch_number": $next_branch_number,
  "project_state": $project_state_result,
  "features": [],
  "dependencies": {},
  "execution_order": [],
  "status": "initialized"
}
EOF
    log "Initialization complete. execution-plan.json created."
}

cmd_get_next_action() {
    log "Determining next action..."
    local execution_order
    execution_order=$(get_json_value '.execution_order[]')
    for id in $execution_order; do
        local feature_status
        feature_status=$(jq -r --arg feature_id "$id" '.features[] | select(.id == $feature_id) | .status' "$EXECUTION_PLAN")
        if [ "$feature_status" == "specified" ]; then
            log "Next action is to implement feature: $id"
            echo "{\"action\": \"implement\", \"feature_id\": \"$id\"}"
            return
        fi
    done

    log "All features are implemented. Project is complete."
    echo "{\"action\": \"complete\", \"feature_id\": null}"
}

cmd_pre_implement_check() {
    local feature_id=$1
    log "Running pre-implementation checks for $feature_id..."

    # 1. Dependency Check
    log "Checking dependencies..."
    local dependencies
    dependencies=$(jq -r --arg feature_id "$feature_id" '.dependencies[$feature_id][]?' "$EXECUTION_PLAN")
    if [ -n "$dependencies" ]; then
        for dep_id in $dependencies; do
            local dep_status
            dep_status=$(jq -r --arg dep_id "$dep_id" '.features[] | select(.id == $dep_id) | .status' "$EXECUTION_PLAN")
            if [ "$dep_status" != "implemented" ]; then
                log "ERROR: Dependency '$dep_id' is not implemented. Current status: $dep_status"
                exit 1
            fi
        done
    fi
    log "All dependencies are met."

    # 2. Rebase from dependency branches
    local feature_branch
    feature_branch=$(get_feature_branch "$feature_id")
    log "Checking out branch: $feature_branch"
    git checkout "$feature_branch"
    git status # CRITICAL GIT FIX

    log "Rebasing from dependency branches..."
    if [ -n "$dependencies" ]; then
        for dep_id in $dependencies; do
            local dep_branch
            dep_branch=$(get_feature_branch "$dep_id")
            log "Rebasing onto $dep_branch..."
            if ! git rebase "$dep_branch"; then
                log "ERROR: Rebase onto $dep_branch failed. Please resolve conflicts manually."
                exit 1
            fi
            git status # CRITICAL GIT FIX
        done
    fi
    log "Rebase successful."
    
    echo "{\"status\": \"success\", \"message\": \"Pre-implementation checks passed for $feature_id\"}"
}

cmd_get_task() {
    local feature_id=$1
    local tasks_file="$REPO_ROOT/specs/$feature_id/tasks.md"
    if [ ! -f "$tasks_file" ]; then
        log "ERROR: tasks.md not found for $feature_id at $tasks_file"
        exit 1
    fi
    
    local task
    task=$(grep -n -m 1 -- "- \[ \]" "$tasks_file")
    if [ -z "$task" ]; then
        log "No more tasks to implement for $feature_id."
        echo "{\"status\": \"complete\"}"
        return
    fi
    
    local line_num
    line_num=$(echo "$task" | cut -d: -f1)
    local task_desc
    task_desc=$(echo "$task" | sed -e 's/^[0-9]*:- \[ \] //')

    echo "{\"status\": \"found\", \"task_number\": $line_num, \"description\": \"$task_desc\"}"
}

cmd_complete_task() {
    local feature_id=$1
    local task_number=$2
    local tasks_file="$REPO_ROOT/specs/$feature_id/tasks.md"
    
    log "Marking task #$task_number as complete for $feature_id"
    sed -i '' "${task_number}s/- \[ \]/- [x]/" "$tasks_file"

    local task_desc
    task_desc=$(sed -n "${task_number}p" "$tasks_file" | sed -e 's/.*- [x] //')
    local commit_message="feat($feature_id): Complete task $task_number - $task_desc"

    log "Committing completion: $commit_message"
    git add "$tasks_file"
    git commit -m "$commit_message"
    git status # CRITICAL GIT FIX
    
    echo "{\"status\": \"success\", \"message\": \"Task $task_number completed and committed.\"}"
}

cmd_finalize_implementation() {
    local feature_id=$1
    log "Finalizing implementation for $feature_id..."
    local feature_branch
    feature_branch=$(get_feature_branch "$feature_id")

    log "Checking out main and merging $feature_branch..."
    git checkout main
    git status # CRITICAL GIT FIX
    git merge --no-ff "$feature_branch"
    git status # CRITICAL GIT FIX

    log "Updating execution plan..."
    local feature_index
    feature_index=$(get_json_value ".features | map(.id == \"$feature_id\") | index(true)")
    update_json ".features[$feature_index].status" "\"implemented\""
    
    log "Feature $feature_id has been successfully implemented and merged to main."
    echo "{\"status\": \"success\", \"feature_id\": \"$feature_id\"}"
}

# --- Main Command Router ---
COMMAND=$1
shift || true

case "$COMMAND" in
    init)
        cmd_init "$@"
        ;;
    get-next-action)
        cmd_get_next_action
        ;;
    pre-implement-check)
        cmd_pre_implement_check "$@"
        ;;
    get-task)
        cmd_get_task "$@"
        ;;
    complete-task)
        cmd_complete_task "$@"
        ;;
    finalize-implementation)
        cmd_finalize_implementation "$@"
        ;;
    *)
        echo "Usage: $0 <command> [options]"
        echo
        echo "Commands:"
        echo "  init <description>         Initializes the project and creates planning files."
        echo "  get-next-action            Determines and returns the next logical workflow step."
        echo "  pre-implement-check <id>   Verifies dependencies and performs a rebase for a feature."
        echo "  get-task <id>              Retrieves the next incomplete task for a feature."
        echo "  complete-task <id> <num>   Marks a task as complete and commits the change."
        echo "  finalize-implementation <id> Merges a completed feature branch into main."
        exit 1
        ;;
esac
