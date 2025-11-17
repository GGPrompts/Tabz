#!/bin/bash

# Chrome Extension Backend Launcher
# Simple script to start the extension backend on port 8128

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Terminal Tabs Extension - Backend    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if backend/.env exists and has PORT=8128
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file...${NC}"
    cat > "$BACKEND_DIR/.env" << EOF
# Extension Worktree - Port 8128 (to avoid conflicts with main worktree on 8127)
PORT=8128
LOG_LEVEL=3
EOF
    echo -e "${GREEN}✓ .env created${NC}"
else
    # Check if PORT is set correctly
    PORT=$(grep "^PORT=" "$BACKEND_DIR/.env" | cut -d= -f2)
    if [ "$PORT" != "8128" ]; then
        echo -e "${YELLOW}⚠️  Warning: .env has PORT=$PORT (expected 8128)${NC}"
        echo -e "${YELLOW}   Updating to PORT=8128...${NC}"
        sed -i 's/^PORT=.*/PORT=8128/' "$BACKEND_DIR/.env"
        echo -e "${GREEN}✓ Port updated${NC}"
    fi
fi

echo ""

# Check if backend dependencies are installed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd "$BACKEND_DIR"
    npm install
    echo ""
fi

# Check if port 8128 is already in use
if lsof -Pi :8128 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Port 8128 is already in use!${NC}"
    echo ""
    echo -e "${YELLOW}Process using port 8128:${NC}"
    lsof -Pi :8128 -sTCP:LISTEN
    echo ""
    read -p "$(echo -e ${YELLOW}Kill the process and continue? [y/N]:${NC} )" KILL_PORT
    if [[ "$KILL_PORT" =~ ^[Yy]$ ]]; then
        PID=$(lsof -ti:8128)
        kill $PID
        echo -e "${GREEN}✓ Process killed${NC}"
        sleep 1
    else
        echo -e "${RED}Exiting...${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}🚀 Starting extension backend...${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Extension Backend:${NC}"
echo -e "  WebSocket: ${YELLOW}ws://localhost:8128${NC}"
echo -e "  REST API:  ${YELLOW}http://localhost:8128${NC}"
echo ""
echo -e "${BLUE}Main App (if running):${NC}"
echo -e "  WebSocket: ${YELLOW}ws://localhost:8127${NC}"
echo -e "  Frontend:  ${YELLOW}http://localhost:5173${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the backend${NC}"
echo ""

# Start the backend
cd "$BACKEND_DIR"
node server.js
