#!/bin/bash
# WSL2 Chrome DevTools Helper
# Wrapper to connect to Windows Chrome from WSL2 using PowerShell bridge

CHROME_PORT="${CHROME_DEBUG_PORT:-9222}"

# Function to execute Chrome DevTools Protocol via PowerShell
chrome_devtools_request() {
    local endpoint="$1"
    powershell.exe -Command "Invoke-WebRequest -Uri 'http://localhost:${CHROME_PORT}${endpoint}' -UseBasicParsing | Select-Object -ExpandProperty Content" 2>/dev/null
}

# Function to check if Chrome debugging is available
chrome_debug_check() {
    if chrome_devtools_request "/json/version" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to list all Chrome tabs
chrome_list_tabs() {
    chrome_devtools_request "/json/list"
}

# Function to get Chrome version
chrome_version() {
    chrome_devtools_request "/json/version"
}

# Export functions
export -f chrome_devtools_request
export -f chrome_debug_check
export -f chrome_list_tabs
export -f chrome_version
