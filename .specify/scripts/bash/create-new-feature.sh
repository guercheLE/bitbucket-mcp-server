#!/usr/bin/env bash
# (Moved to scripts/bash/) Create a new feature with branch, directory structure, and template
set -e

JSON_MODE=false
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --json) JSON_MODE=true ;;
        --help|-h) echo "Usage: $0 [--json] <feature_description>"; exit 0 ;;
        *) ARGS+=("$arg") ;;
    esac
done

FEATURE_DESCRIPTION="${ARGS[*]}"
if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Usage: $0 [--json] <feature_description>" >&2
    exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

# Check if feature description already contains numbering (e.g., "001-feature-name")
if [[ "$FEATURE_DESCRIPTION" =~ ^[0-9]{3}- ]]; then
    # Use the provided numbering
    FEATURE_NUM=$(echo "$FEATURE_DESCRIPTION" | grep -o '^[0-9]\{3\}')
    FEATURE_DIR_NAME="$FEATURE_DESCRIPTION"
    BRANCH_NAME="feature/$FEATURE_DIR_NAME"
    echo "[specify] Using provided numbering: $FEATURE_NUM" >&2
    
    # Skip conflict resolution for explicitly numbered features
    echo "[specify] Skipping conflict resolution for explicitly numbered feature" >&2
else
    # Auto-generate numbering for unnumbered features
    HIGHEST=0
    if [ -d "$SPECS_DIR" ]; then
        for dir in "$SPECS_DIR"/*; do
            [ -d "$dir" ] || continue
            dirname=$(basename "$dir")
            number=$(echo "$dirname" | grep -o '^[0-9]\+' || echo "0")
            number=$((10#$number))
            if [ "$number" -gt "$HIGHEST" ]; then HIGHEST=$number; fi
        done
    fi

    NEXT=$((HIGHEST + 1))
    FEATURE_NUM=$(printf "%03d" "$NEXT")

    # Phase 1: Resolve branch naming conflicts BEFORE checkout
    echo "[specify] Phase 1: Resolving branch naming conflicts..." >&2
    RESOLVED_BRANCH_NAME=$("$REPO_ROOT/.specify/scripts/bash/resolve-branch-conflicts.sh" "$FEATURE_DESCRIPTION" "$NEXT")

    if [ $? -eq 0 ] && [ -n "$RESOLVED_BRANCH_NAME" ]; then
        BRANCH_NAME="$RESOLVED_BRANCH_NAME"
        # Extract folder name from resolved branch name
        FEATURE_DIR_NAME=$(echo "$BRANCH_NAME" | sed 's/^feature\///')
        echo "[specify] Using resolved branch: $BRANCH_NAME" >&2
    else
        # Fallback to original logic if conflict resolution fails
        echo "[specify] Conflict resolution failed, using original logic..." >&2
        BRANCH_NAME=$(echo "$FEATURE_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//')
        WORDS=$(echo "$BRANCH_NAME" | tr '-' '\n' | grep -v '^$' | head -3 | tr '\n' '-' | sed 's/-$//')
        FEATURE_DIR_NAME="${FEATURE_NUM}-${WORDS}"
        BRANCH_NAME="feature/${FEATURE_DIR_NAME}"
    fi
fi

# Enhanced branching logic: prioritize develop > main > master > current
function get_base_branch() {
    if git show-ref --verify --quiet refs/heads/develop; then
        echo "develop"
    elif git show-ref --verify --quiet refs/heads/main; then
        echo "main"
    elif git show-ref --verify --quiet refs/heads/master; then
        echo "master"
    else
        git branch --show-current
    fi
}

BASE_BRANCH=$(get_base_branch)
git checkout "$BASE_BRANCH"

# Check if branch already exists (for resumption scenarios)
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "[specify] Branch $BRANCH_NAME already exists, checking out..." >&2
    git checkout "$BRANCH_NAME"
else
    git checkout -b "$BRANCH_NAME"
fi

# Phase 2: Resolve folder naming conflicts AFTER checkout
echo "[specify] Phase 2: Resolving folder naming conflicts..." >&2
RESOLVED_FEATURE_DIR=$("$REPO_ROOT/.specify/scripts/bash/resolve-folder-conflicts.sh" "$BRANCH_NAME")

if [ $? -eq 0 ] && [ -n "$RESOLVED_FEATURE_DIR" ]; then
    FEATURE_DIR="$RESOLVED_FEATURE_DIR"
    echo "[specify] Using resolved folder: $FEATURE_DIR" >&2
else
    # Fallback to creating new directory
    echo "[specify] Using standard folder creation..." >&2
    FEATURE_DIR="$SPECS_DIR/$FEATURE_DIR_NAME"
    mkdir -p "$FEATURE_DIR"
fi

TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
SPEC_FILE="$FEATURE_DIR/spec.md"
if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else touch "$SPEC_FILE"; fi

if $JSON_MODE; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s","BASE_BRANCH":"%s"}\n' "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_NUM" "$BASE_BRANCH"
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    echo "FEATURE_NUM: $FEATURE_NUM"
    echo "BASE_BRANCH: $BASE_BRANCH"
fi
