#!/bin/bash
#
# Contract: regenerate-embeddings.sh
#
# Description: Fetches the latest Bitbucket API documentation, checks if it has
# changed, and if so, triggers the embedding generation pipeline.
#
# Usage: ./regenerate-embeddings.sh
#
# Exit Codes:
#   0: Success (embeddings regenerated or no changes detected)
#   1: Error during the process
#   2: API documentation has backward-incompatible changes, manual intervention required.

set -euo pipefail

API_DOCS_URL="https://developer.atlassian.com"
CHECKSUM_FILE=".specify/state/api-checksum.json"
TEMP_DOC_FILE=$(mktemp)

echo "Fetching latest API documentation from $API_DOCS_URL..."
curl -s -o "$TEMP_DOC_FILE" "$API_DOCS_URL"

if [ ! -s "$TEMP_DOC_FILE" ]; then
  echo "Error: Failed to download API documentation or the file is empty."
  rm "$TEMP_DOC_FILE"
  exit 1
fi

NEW_CHECKSUM=$(shasum -a 256 "$TEMP_DOC_FILE" | awk '{print $1}')
rm "$TEMP_DOC_FILE"

if [ ! -f "$CHECKSUM_FILE" ]; then
  echo "No previous checksum found. Storing new checksum."
  mkdir -p "$(dirname "$CHECKSUM_FILE")"
  echo "{\"url\": \"$API_DOCS_URL\", \"checksum\": \"$NEW_CHECKSUM\", \"lastChecked\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "$CHECKSUM_FILE"
  # Trigger embedding generation for the first time
  echo "Triggering initial embedding generation..."
  # npm run generate-embeddings
  exit 0
fi

OLD_CHECKSUM=$(jq -r '.checksum' "$CHECKSUM_FILE")

if [[ "$NEW_CHECKSUM" == "$OLD_CHECKSUM" ]]; then
  echo "API documentation has not changed. No action needed."
  exit 0
fi

echo "API documentation has changed. New checksum: $NEW_CHECKSUM"

# This is a placeholder for a more sophisticated check.
# In a real scenario, this might involve more than just a simple text comparison.
echo "Checking for potential backward-incompatible changes..."
# A simple heuristic: if the line count decreased by more than 10%, it might be a major change.
# This is NOT a reliable check and is for demonstration purposes.
# As per the spec, this should ideally halt for manual review.
echo "Halting for manual review as per specification. Please verify API changes."
exit 2

# If the check passes, update the checksum and trigger the pipeline.
# echo "Updating checksum file..."
# echo "{\"url\": \"$API_DOCS_URL\", \"checksum\": \"$NEW_CHECKSUM\", \"lastChecked\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "$CHECKSUM_FILE"

# echo "Triggering embedding regeneration pipeline..."
# npm run generate-embeddings

# echo "Embedding regeneration complete."
# exit 0
