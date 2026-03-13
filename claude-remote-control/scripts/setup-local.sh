#!/bin/bash
set -euo pipefail

# 247 Agent - Local Setup Script
# Sets up the agent for local development or production use

echo "Setting up 247 Agent locally..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check for required tools
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is required but not installed."
        echo "$2"
        exit 1
    fi
}

check_dependency "bun" "Install Bun from https://bun.sh"
check_dependency "tmux" "Install tmux with: brew install tmux (macOS) or apt install tmux (Linux)"


echo "Installing dependencies..."
cd "$PROJECT_ROOT"
bun install

echo "Building packages..."
bun run build

# Create data directory
DATA_DIR="$HOME/.247/data"
mkdir -p "$DATA_DIR"
echo "Data directory: $DATA_DIR"

# Create default config if needed
CONFIG_FILE="$HOME/.247/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Creating default config..."
    mkdir -p "$(dirname "$CONFIG_FILE")"
    cat > "$CONFIG_FILE" << 'EOF'
{
  "port": 4678,
  "projects": {
    "basePath": "~/Dev",
    "allowedProjects": ["*"]
  }
}
EOF
    echo "Config created at: $CONFIG_FILE"
fi

echo ""
echo "Setup complete!"
echo ""
echo "To start the agent in development mode:"
echo "  cd $PROJECT_ROOT && bun run dev:agent"
echo ""
echo "To start the agent in production mode:"
echo "  cd $PROJECT_ROOT/apps/agent && bun dist/index.js"
echo ""
echo "To expose via Tailscale Funnel (recommended):"
echo "  tailscale funnel --bg --https=4678 localhost:4678"
echo ""
echo "To install as a macOS service (auto-start on login):"
echo "  $SCRIPT_DIR/setup-agent.sh"
echo ""
echo "Configuration file: $CONFIG_FILE"
echo "Database location: $DATA_DIR/agent.db"
