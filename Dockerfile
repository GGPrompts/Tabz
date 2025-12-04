# Tabz - Multi-stage Dockerfile
# Supports running multiple feature branches simultaneously

FROM node:20-alpine AS base

# Install tmux for terminal session management + build tools for native modules
RUN apk add --no-cache \
    tmux \
    bash \
    git \
    python3 \
    make \
    g++

WORKDIR /app

# Branch identifier to prevent layer sharing between branches
ARG BRANCH_NAME=master
LABEL branch=$BRANCH_NAME

# Copy all source code first (including branch-specific package.json)
COPY . .

# Install dependencies based on the actual package.json from each branch
# This ensures each branch gets its specific dependencies
RUN npm install
RUN cd backend && npm install

# Rebuild native modules (node-pty) for container environment
RUN cd backend && npm rebuild node-pty

# Skip build for dev mode - we'll run dev servers instead
# Production builds have TypeScript errors in experimental branches

# Expose ports (can be remapped in docker-compose)
# Frontend Vite dev server
EXPOSE 5173
# Backend WebSocket + API
EXPOSE 8127

# Start script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Use bash to run the script explicitly
CMD ["/bin/bash", "/app/docker-entrypoint.sh"]
