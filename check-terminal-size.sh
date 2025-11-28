#!/bin/bash
# Check terminal dimensions in Termux

echo "=== Terminal Dimensions ==="
echo ""

# Method 1: stty
echo "Method 1 (stty):"
stty size 2>/dev/null && echo "  Format: rows columns" || echo "  stty failed"
echo ""

# Method 2: tput
echo "Method 2 (tput):"
echo "  Columns: $(tput cols 2>/dev/null || echo 'N/A')"
echo "  Lines:   $(tput lines 2>/dev/null || echo 'N/A')"
echo ""

# Method 3: Environment variables
echo "Method 3 (env vars):"
echo "  COLUMNS=$COLUMNS"
echo "  LINES=$LINES"
echo ""

# Method 4: Using escape sequences (most reliable)
echo "Method 4 (escape sequences):"
echo -en '\e[18t' && sleep 0.1
echo ""

# Recommended dimensions for TUI apps
echo "=== Recommended Minimum Dimensions ==="
echo "  • Basic TUI: 80x24 (classic terminal)"
echo "  • Modern TUI: 120x30 (comfortable)"
echo "  • Tabz with splits: 160x40+ (2+ panes)"
echo ""

echo "=== Common Mobile Dimensions ==="
echo "  • Phone (portrait):  ~40-60 cols × 60-80 rows"
echo "  • Phone (landscape): ~80-120 cols × 30-40 rows"
echo "  • Tablet (portrait): ~60-80 cols × 80-120 rows"
echo "  • Tablet (landscape): ~120-160 cols × 40-60 rows"
