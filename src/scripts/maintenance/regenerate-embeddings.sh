#!/usr/bin/env bash

# /**
#  * @file regenerate-embeddings.sh
#  * @description Detects changes in external API documentation and signals when embedding regeneration is required.
#  * @env API_DOCS_URL Optional override for the documentation endpoint to monitor (default: https://developer.atlassian.com).
#  * @env CHECKSUM_FILE Optional override for where to persist the last known checksum (default: .specify/state/api-checksum.json).
#  * @returns Exit code 0 when no change is detected, 1 on operational failures, and 2 when updates are detected and manual review is required.
#  */

set -euo pipefail

API_DOCS_URL="${API_DOCS_URL:-https://developer.atlassian.com}"
CHECKSUM_FILE="${CHECKSUM_FILE:-.specify/state/api-checksum.json}"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

echo "Fetching API documentation from $API_DOCS_URL..."
if ! curl -sSf -o "$tmp_file" "$API_DOCS_URL"; then
    echo "Failed to download API documentation." >&2
    exit 1
fi

if [[ ! -s "$tmp_file" ]]; then
    echo "Downloaded API documentation appears to be empty." >&2
    exit 1
fi

NEW_CHECKSUM=$(shasum -a 256 "$tmp_file" | awk '{print $1}')
if [[ -z "$NEW_CHECKSUM" ]]; then
    echo "Failed to calculate checksum for downloaded documentation." >&2
    exit 1
fi

if [[ ! -f "$CHECKSUM_FILE" ]]; then
    mkdir -p "$(dirname "$CHECKSUM_FILE")"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat <<EOF >"$CHECKSUM_FILE"
{"url":"$API_DOCS_URL","checksum":"$NEW_CHECKSUM","lastChecked":"$TIMESTAMP"}
EOF
    echo "Stored initial checksum at $CHECKSUM_FILE."
    echo "Manual review recommended before running embedding regeneration for the first time."
    exit 0
fi

if ! OLD_CHECKSUM=$(node -e 'const fs=require("fs"); const file=process.argv[1]; try { const data = JSON.parse(fs.readFileSync(file, "utf8")); if (typeof data.checksum === "string") { process.stdout.write(data.checksum); } } catch (error) { process.exit(1); }' "$CHECKSUM_FILE"); then
    echo "Existing checksum file is invalid. Replacing with fresh checksum." >&2
    mkdir -p "$(dirname "$CHECKSUM_FILE")"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat <<EOF >"$CHECKSUM_FILE"
{"url":"$API_DOCS_URL","checksum":"$NEW_CHECKSUM","lastChecked":"$TIMESTAMP"}
EOF
    exit 0
fi

if [[ "$OLD_CHECKSUM" == "$NEW_CHECKSUM" ]]; then
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    node -e 'const fs=require("fs"); const file=process.argv[1]; const url=process.argv[2]; const checksum=process.argv[3]; const lastChecked=process.argv[4]; let data={}; try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {} data.url = url; data.checksum = checksum; data.lastChecked = lastChecked; fs.writeFileSync(file, JSON.stringify(data));' "$CHECKSUM_FILE" "$API_DOCS_URL" "$NEW_CHECKSUM" "$TIMESTAMP"
    echo "API documentation has not changed since the last check."
    exit 0
fi

echo "API documentation has changed (checksum $OLD_CHECKSUM -> $NEW_CHECKSUM). Manual review required before regenerating embeddings." >&2
exit 2
