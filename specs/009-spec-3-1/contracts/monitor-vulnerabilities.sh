#!/bin/bash
#
# Contract: monitor-vulnerabilities.sh
#
# Description: Runs npm audit to check for security vulnerabilities and exits
# with a non-zero status code if critical vulnerabilities are found.
#
# Usage: ./monitor-vulnerabilities.sh [--level=critical]
#
# Options:
#   --level=<level>: The minimum severity level to fail on (low, moderate, high, critical). Default: critical.
#
# Exit Codes:
#   0: No vulnerabilities found at or above the specified level.
#   1: Vulnerabilities found.

set -euo pipefail

AUDIT_LEVEL="critical"
if [[ "${1:-}" == --level=* ]]; then
  AUDIT_LEVEL="${1#*=}"
fi

echo "Running npm audit for vulnerabilities at level '$AUDIT_LEVEL' or higher..."

# The command will exit with a non-zero status code if vulnerabilities are found.
# We capture the output to provide more context.
if npm audit --audit-level="$AUDIT_LEVEL"; then
  echo "No vulnerabilities found at level '$AUDIT_LEVEL' or higher."
  exit 0
else
  echo "Vulnerabilities found. See the report above."
  echo "To fix, run 'npm audit fix' or address them manually."
  exit 1
fi
