import { useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getThemeForTerminalType } from '../styles/terminal-themes';

/**
 * Hook for applying terminal theme changes.
 *
 * Handles theme application with proper refitting and refresh logic
 * for both WebGL and canvas renderers. Includes special handling for TUI tools.
 *
 * @param xtermRef - Ref to the xterm instance
 * @param fitAddonRef - Ref to the FitAddon instance
 * @param wsRef - Ref to the WebSocket connection
 * @param agentId - Terminal agent ID
 * @param terminalType - Type of terminal (for WebGL detection)
 * @param isTUITool - Whether this is a TUI tool requiring special handling
 * @param debouncedResize - Debounced resize handler function
 * @returns Function to apply a theme change
 */
export function useTerminalTheme(
  xtermRef: React.RefObject<XTerm | null>,
  fitAddonRef: React.RefObject<FitAddon | null>,
  wsRef: React.MutableRefObject<WebSocket | null>,
  agentId: string,
  terminalType: string,
  isTUITool: boolean,
  debouncedResize: (terminalId: string, cols: number, rows: number) => void
) {
  const applyTheme = useCallback((themeName: string) => {
    // Apply new theme to existing terminal
    if (xtermRef.current && fitAddonRef.current) {
      const newTheme = getThemeForTerminalType(themeName);
      xtermRef.current.options.theme = newTheme.xterm;

      // For WebGL terminals, be more conservative with refitting
      const usesWebGL = !["opencode", "bash", "gemini"].includes(terminalType);

      if (usesWebGL) {
        // For WebGL terminals, just do a simple refresh and single refit
        // Increased delay to ensure theme is fully applied before refresh
        setTimeout(() => {
          if (xtermRef.current && fitAddonRef.current) {
            // Refresh the terminal content
            xtermRef.current.refresh(0, xtermRef.current.rows - 1);

            // Single refit after a longer delay to let WebGL settle
            setTimeout(() => {
              if (fitAddonRef.current && xtermRef.current) {
                // For TUI apps, do a "real" resize to force complete redraw
                if (isTUITool) {
                  const currentCols = xtermRef.current.cols;
                  const currentRows = xtermRef.current.rows;

                  // Resize xterm itself to trigger complete redraw
                  xtermRef.current.resize(currentCols - 1, currentRows);

                  // Send resize to PTY
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        type: "resize",
                        terminalId: agentId,
                        cols: currentCols - 1,
                        rows: currentRows,
                      }),
                    );
                  }

                  // Wait a moment, then resize back to correct size
                  setTimeout(() => {
                    if (xtermRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      xtermRef.current.resize(currentCols, currentRows);
                      wsRef.current.send(
                        JSON.stringify({
                          type: "resize",
                          terminalId: agentId,
                          cols: currentCols,
                          rows: currentRows,
                        }),
                      );
                    }
                  }, 100);
                } else {
                  // For non-TUI, just fit and send resize with Ctrl+L
                  fitAddonRef.current.fit();
                  debouncedResize(
                    agentId,
                    xtermRef.current.cols,
                    xtermRef.current.rows,
                  );
                }
              }
            }, 200);
          }
        }, 150);
      } else {
        // For non-WebGL terminals, use the more aggressive refitting
        // Increased initial delay to ensure theme is fully applied
        setTimeout(() => {
          if (xtermRef.current && fitAddonRef.current) {
            // Strategy 1: Fit the terminal
            fitAddonRef.current.fit();

            // Strategy 2: Force a full refresh
            xtermRef.current.refresh(0, xtermRef.current.rows - 1);

            // Strategy 3: Trigger resize event
            const resizeEvent = new Event("resize");
            window.dispatchEvent(resizeEvent);

            // Strategy 4: Additional refit after animation starts
            setTimeout(() => {
              if (xtermRef.current && fitAddonRef.current) {
                // Scroll to bottom to ensure content is visible
                xtermRef.current.scrollToBottom();
                fitAddonRef.current.fit();
                xtermRef.current.refresh(0, xtermRef.current.rows - 1);
              }
            }, 100);

            // Strategy 5: Final refit after CSS animations settle
            setTimeout(() => {
              if (xtermRef.current && fitAddonRef.current) {
                // For TUI apps, do a "real" resize to force complete redraw
                if (isTUITool) {
                  const currentCols = xtermRef.current.cols;
                  const currentRows = xtermRef.current.rows;

                  // Resize xterm itself to trigger complete redraw
                  xtermRef.current.resize(currentCols - 1, currentRows);

                  // Send resize to PTY
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        type: "resize",
                        terminalId: agentId,
                        cols: currentCols - 1,
                        rows: currentRows,
                      }),
                    );
                  }

                  // Wait a moment, then resize back to correct size
                  setTimeout(() => {
                    if (xtermRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      xtermRef.current.resize(currentCols, currentRows);
                      wsRef.current.send(
                        JSON.stringify({
                          type: "resize",
                          terminalId: agentId,
                          cols: currentCols,
                          rows: currentRows,
                        }),
                      );
                    }
                  }, 100);
                } else {
                  // For non-TUI, fit and use debounced resize with Ctrl+L (fixes stuck terminals)
                  fitAddonRef.current.fit();
                  xtermRef.current.refresh(0, xtermRef.current.rows - 1);
                  debouncedResize(
                    agentId,
                    xtermRef.current.cols,
                    xtermRef.current.rows,
                  );
                }
              }
            }, 300);
          }
        }, 10);
      }
    }
  }, [xtermRef, fitAddonRef, wsRef, agentId, terminalType, isTUITool, debouncedResize]);

  return applyTheme;
}
