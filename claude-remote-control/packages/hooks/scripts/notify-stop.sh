#!/bin/bash
set -euo pipefail

# Read stdin for hook input
input=$(cat)

# Extract reason if available
reason=$(echo "$input" | jq -r '.reason // "Claude stopped"' 2>/dev/null || echo "Claude stopped")

# Notify local agent
curl -s -X POST "http://localhost:4678/api/hooks/stop" \
  -H "Content-Type: application/json" \
  -d "{\"reason\": \"$reason\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" || true

# Exit successfully (don't block Claude)
exit 0
