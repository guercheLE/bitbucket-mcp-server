#!/usr/bin/env bash
# (Moved to scripts/bash/) Common functions and variables for all scripts

get_repo_root() { git rev-parse --show-toplevel; }
get_current_branch() { git rev-parse --abbrev-ref HEAD; }

check_feature_branch() {
    local branch="$1"
    if [[ ! "$branch" =~ ^feature/[0-9]{3}- ]]; then
        echo "ERROR: Not on a feature branch. Current branch: $branch" >&2
        echo "Feature branches should be named like: feature/001-feature-name" >&2
        return 1
    fi; return 0
}

get_feature_dir() { echo "$1/specs/$2"; }

get_feature_paths() {
    local repo_root=$(get_repo_root)
    local current_branch=$(get_current_branch)
    # Strip 'feature/' prefix to get just the feature name for directory path
    local feature_name=$(echo "$current_branch" | sed 's/^feature\///')
    local feature_dir=$(get_feature_dir "$repo_root" "$feature_name")
    cat <<EOF
REPO_ROOT='$repo_root'
CURRENT_BRANCH='$current_branch'
FEATURE_DIR='$feature_dir'
FEATURE_SPEC='$feature_dir/spec.md'
IMPL_PLAN='$feature_dir/plan.md'
TASKS='$feature_dir/tasks.md'
RESEARCH='$feature_dir/research.md'
DATA_MODEL='$feature_dir/data-model.md'
QUICKSTART='$feature_dir/quickstart.md'
CONTRACTS_DIR='$feature_dir/contracts'
EOF
}

check_file() { [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
check_dir() { [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"; }

# Git timing safety functions (added to fix timing issues with file system)

# Safe checkout with timing to prevent file system issues
safe_checkout() {
    local branch_name="$1"
    local timeout_ms="${2:-300}"  # Default 300ms
    
    echo "[common] Switching to branch: $branch_name" >&2
    
    # Perform checkout
    if git checkout "$branch_name" 2>/dev/null; then
        # Wait for file system to stabilize (300ms default)
        local sleep_time=$(echo "scale=3; $timeout_ms / 1000" | bc)
        sleep "$sleep_time"
        
        # Verify clean state
        local status_output
        status_output=$(git status --porcelain)
        
        if [[ -z "$status_output" ]]; then
            echo "[common] ✅ Branch checkout successful, working tree clean" >&2
            return 0
        else
            echo "[common] ⚠️ Warning: Working tree not clean after checkout" >&2
            echo "$status_output" >&2
            return 1
        fi
    else
        echo "[common] ❌ Failed to checkout branch: $branch_name" >&2
        return 1
    fi
}

# Verify current branch matches expected
verify_branch() {
    local expected_branch="$1"
    local current_branch
    current_branch=$(get_current_branch)
    
    if [[ "$current_branch" == "$expected_branch" ]]; then
        echo "[common] ✅ On correct branch: $current_branch" >&2
        return 0
    else
        echo "[common] ❌ Branch mismatch. Expected: $expected_branch, Current: $current_branch" >&2
        return 1
    fi
}

# Safe branch switching with verification
switch_to_branch() {
    local target_branch="$1"
    local timing_ms="${2:-300}"
    
    # Check if already on target branch
    if verify_branch "$target_branch"; then
        echo "[common] Already on target branch: $target_branch" >&2
        return 0
    fi
    
    # Perform safe checkout
    if safe_checkout "$target_branch" "$timing_ms"; then
        # Double-verify we're on the right branch
        return verify_branch "$target_branch"
    else
        return 1
    fi
}
