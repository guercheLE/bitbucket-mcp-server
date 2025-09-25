#!/bin/bash
#
# Contract: update-dependencies.sh
#
# Description: Checks for outdated npm dependencies, updates them according to the
# specified policy (no major versions), and installs them.
#
# Usage: ./update-dependencies.sh [--dry-run]
#
# Options:
#   --dry-run:  Show what would be updated without actually changing package.json or node_modules.
#
# Exit Codes:
#   0: Success
#   1: Error during update process
#   2: No updates were needed

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

echo "Checking for outdated dependencies (excluding major versions)..."

# Use npm-check-updates to find outdated packages, ignoring major versions.
# The output will be in JSON format.
UPDATES=$(ncu --target minor --jsonUpgraded)

if [[ -z "$UPDATES" || "$UPDATES" == "{}" ]]; then
  echo "All dependencies are up-to-date."
  exit 2
fi

echo "The following dependencies will be updated:"
echo "$UPDATES" | jq .

if [ "$DRY_RUN" = true ]; then
  echo "Dry run complete. No changes were made."
  exit 0
fi

echo "Updating package.json..."
ncu -u --target minor

echo "Installing updated dependencies..."
npm install

echo "Dependency update complete."
exit 0
