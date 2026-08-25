#!/bin/bash

# Load environment variables from .env.local
if [ -f "$(dirname "$0")/.env.local" ]; then
  export $(grep -v '^#' "$(dirname "$0")/.env.local" | xargs)
fi

# Start Notion MCP server
exec node "$(dirname "$0")/node_modules/@notionhq/notion-mcp-server/dist/index.js"
