#!/usr/bin/env bash

# /**
#  * @file update-dependencies.sh
#  * @description Applies non-major dependency updates using npm-check-updates followed by npm install.
#  * @param --dry-run When supplied, prints the pending upgrades without modifying lockfiles or installing packages.
#  * @throws Exits with code 1 when dependency discovery or installation fails.
#  * @returns Exit code 0 on success, 1 on failure, and 2 when no updates are available.
#  */

set -euo pipefail

DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

echo "Checking for outdated dependencies (minor and patch updates)..."

if ! UPDATES=$(ncu --target minor --jsonUpgraded); then
    echo "Failed to check for dependency updates." >&2
    exit 1
fi

if [[ -z "$UPDATES" || "$UPDATES" == "{}" ]]; then
    echo "All dependencies are up-to-date."
    exit 2
fi

echo "Updates available:"
echo "$UPDATES"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "Dry run requested -- not applying updates."
    exit 0
fi

echo "Applying dependency updates..."
if ! ncu -u --target minor; then
    echo "Failed to update package manifests." >&2
    exit 1
fi

echo "Installing updated dependencies..."
if ! npm install; then
    echo "Failed to install updated dependencies." >&2
    exit 1
fi

echo "Dependency update complete."
exit 0
