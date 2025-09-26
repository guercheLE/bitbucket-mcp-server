#!/usr/bin/env bash

# /**
#  * @file monitor-vulnerabilities.sh
#  * @description Runs npm audit with a configurable severity threshold to detect actionable vulnerabilities.
#  * @param --level <severity> Overrides the minimum severity (default: critical) forwarded to npm audit.
#  * @returns Exit code 0 when the audit passes, or 1 when vulnerabilities at or above the threshold are detected.
#  */

set -euo pipefail

AUDIT_LEVEL="critical"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --level=*)
            AUDIT_LEVEL="${1#*=}"
            shift
            ;;
        --level)
            shift
            if [[ $# -eq 0 ]]; then
                echo "Missing value for --level option." >&2
                exit 1
            fi
            AUDIT_LEVEL="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

echo "Running npm audit with severity threshold '$AUDIT_LEVEL'..."

if npm audit --audit-level="$AUDIT_LEVEL"; then
    echo "No vulnerabilities found at or above '$AUDIT_LEVEL'."
    exit 0
else
    echo "Vulnerabilities detected. Review the audit report above." >&2
    exit 1
fi
