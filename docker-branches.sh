#!/bin/bash
# Tabz Branch Manager
# Easily run multiple feature branches in Docker containers for comparison

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Branch configurations
declare -A BRANCHES
BRANCHES=(
  ["master"]="5173:8127"
  ["ai-experiments"]="5174:8128"
  ["chrome-extension"]="5175:8129"
  ["component-showcase"]="5176:8130"
  ["tmux-only-simple"]="5177:8131"
)

# Functions
print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Tabz Branch Manager                   ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
  echo ""
}

print_usage() {
  cat << EOF
${BLUE}Usage:${NC}
  $0 start <branch>       Start a specific branch container
  $0 start all            Start all branch containers
  $0 stop <branch>        Stop a specific branch container
  $0 stop all             Stop all branch containers
  $0 restart <branch>     Restart a specific branch container
  $0 list                 List all running containers
  $0 logs <branch>        View logs for a branch
  $0 urls                 Show URLs for all branches
  $0 build <branch>       Rebuild a specific branch container
  $0 build all            Rebuild all branch containers
  $0 clean                Remove all containers and images

${BLUE}Available branches:${NC}
  master                  Baseline (ports 5173:8127)
  ai-experiments          AI experiments (ports 5174:8128)
  chrome-extension        Chrome extension (ports 5175:8129)
  component-showcase      Component showcase (ports 5176:8130)
  tmux-only-simple        Tmux-only simple (ports 5177:8131)

${BLUE}Examples:${NC}
  $0 start ai-experiments     # Start just the AI experiments branch
  $0 start all                # Start all branches simultaneously
  $0 urls                     # Show all URLs
  $0 logs ai-experiments      # View logs for AI experiments
  $0 stop all                 # Stop all running containers

EOF
}

list_containers() {
  echo -e "${GREEN}📦 Running Tabz containers:${NC}"
  echo ""
  docker ps --filter "name=tabz-*" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers running"
  echo ""
}

show_urls() {
  echo -e "${GREEN}🌐 Branch URLs:${NC}"
  echo ""
  for branch in "${!BRANCHES[@]}"; do
    ports="${BRANCHES[$branch]}"
    frontend_port="${ports%%:*}"
    backend_port="${ports##*:}"

    if docker ps --filter "name=tabz-$branch" --format "{{.Names}}" | grep -q "tabz-$branch"; then
      status="${GREEN}●${NC} Running"
    else
      status="${YELLOW}○${NC} Stopped"
    fi

    printf "  %-25s %s\n" "$branch" "$status"
    printf "    Frontend: ${BLUE}http://localhost:$frontend_port${NC}\n"
    printf "    Backend:  ${BLUE}http://localhost:$backend_port${NC}\n"
    echo ""
  done
}

start_branch() {
  local branch=$1

  if [ -z "${BRANCHES[$branch]}" ]; then
    echo -e "${RED}❌ Unknown branch: $branch${NC}"
    echo -e "Available branches: ${!BRANCHES[@]}"
    exit 1
  fi

  echo -e "${GREEN}🚀 Starting branch: $branch${NC}"
  docker-compose --profile "$branch" up -d --build

  ports="${BRANCHES[$branch]}"
  frontend_port="${ports%%:*}"
  backend_port="${ports##*:}"

  echo ""
  echo -e "${GREEN}✅ Branch started!${NC}"
  echo -e "   Frontend: ${BLUE}http://localhost:$frontend_port${NC}"
  echo -e "   Backend:  ${BLUE}http://localhost:$backend_port${NC}"
  echo ""
}

stop_branch() {
  local branch=$1

  if [ "$branch" == "all" ]; then
    echo -e "${YELLOW}🛑 Stopping all branches...${NC}"
    docker-compose --profile all down
    echo -e "${GREEN}✅ All branches stopped${NC}"
    return
  fi

  if [ -z "${BRANCHES[$branch]}" ]; then
    echo -e "${RED}❌ Unknown branch: $branch${NC}"
    exit 1
  fi

  echo -e "${YELLOW}🛑 Stopping branch: $branch${NC}"
  docker-compose --profile "$branch" down
  echo -e "${GREEN}✅ Branch stopped${NC}"
}

restart_branch() {
  local branch=$1
  stop_branch "$branch"
  sleep 1
  start_branch "$branch"
}

build_branch() {
  local branch=$1

  if [ "$branch" == "all" ]; then
    echo -e "${BLUE}🔨 Building all branches...${NC}"
    docker-compose --profile all build
    echo -e "${GREEN}✅ All branches built${NC}"
    return
  fi

  if [ -z "${BRANCHES[$branch]}" ]; then
    echo -e "${RED}❌ Unknown branch: $branch${NC}"
    exit 1
  fi

  echo -e "${BLUE}🔨 Building branch: $branch${NC}"
  docker-compose build "$branch"
  echo -e "${GREEN}✅ Branch built${NC}"
}

view_logs() {
  local branch=$1

  if [ -z "${BRANCHES[$branch]}" ]; then
    echo -e "${RED}❌ Unknown branch: $branch${NC}"
    exit 1
  fi

  echo -e "${BLUE}📋 Viewing logs for: $branch${NC}"
  echo -e "${YELLOW}(Press Ctrl+C to exit)${NC}"
  echo ""
  docker-compose logs -f "$branch"
}

clean_all() {
  echo -e "${RED}⚠️  This will remove all Tabz containers and images${NC}"
  read -p "Are you sure? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker-compose --profile all down -v
    docker images | grep tabz | awk '{print $3}' | xargs -r docker rmi -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
  fi
}

# Main script
print_header

if [ $# -eq 0 ]; then
  print_usage
  exit 0
fi

case "$1" in
  start)
    if [ "$2" == "all" ]; then
      echo -e "${GREEN}🚀 Starting all branches...${NC}"
      docker-compose --profile all up -d --build
      echo ""
      show_urls
    else
      start_branch "$2"
    fi
    ;;

  stop)
    stop_branch "$2"
    ;;

  restart)
    restart_branch "$2"
    ;;

  list)
    list_containers
    ;;

  urls)
    show_urls
    ;;

  build)
    build_branch "$2"
    ;;

  logs)
    view_logs "$2"
    ;;

  clean)
    clean_all
    ;;

  *)
    echo -e "${RED}❌ Unknown command: $1${NC}"
    echo ""
    print_usage
    exit 1
    ;;
esac
