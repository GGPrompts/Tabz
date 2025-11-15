import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { CanvasAddon } from '@xterm/addon-canvas';

interface UseTerminalInstanceOptions {
  containerId: string;
  onData?: (data: string) => void;
  theme?: {
    background?: string;
    foreground?: string;
    cursor?: string;
    [key: string]: string | undefined;
  };
  fontSize?: number;
  fontFamily?: string;
}

export function useTerminalInstance(options: UseTerminalInstanceOptions) {
  const {
    containerId,
    onData,
    theme,
    fontSize = 14,
    fontFamily = 'Menlo, Monaco, "Courier New", monospace'
  } = options;

  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const canvasAddonRef = useRef<CanvasAddon | null>(null);
  const [ready, setReady] = useState(false);

  // Use refs for callbacks to prevent recreating terminal
  const onDataRef = useRef(onData);
  useEffect(() => { onDataRef.current = onData; }, [onData]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[useTerminalInstance] Container #${containerId} not found`);
      return;
    }

    // Check container dimensions
    const rect = container.getBoundingClientRect();
    console.log('[useTerminalInstance] Container dimensions:', {
      width: rect.width,
      height: rect.height,
      containerId
    });

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily,
      theme: theme || {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#00ff00',
      },
      allowProposedApi: true,
    });

    // Load fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Use Canvas addon for better performance (load BEFORE opening)
    // This ensures the renderer is ready before fit() is called
    try {
      const canvasAddon = new CanvasAddon();
      canvasAddonRef.current = canvasAddon;
      term.loadAddon(canvasAddon);
      console.log('[useTerminalInstance] Canvas addon loaded');
    } catch (err) {
      console.warn('[useTerminalInstance] Canvas addon failed, using default renderer', err);
    }

    // Open terminal with renderer already loaded
    term.open(container);

    // Don't fit immediately - let the delayed retries handle it
    // This prevents "dimensions undefined" errors before renderer is ready
    console.log('[useTerminalInstance] Terminal opened, waiting for delayed fit...');

    // Set up data handler using ref to prevent recreating terminal
    const dataHandler = term.onData((data) => {
      onDataRef.current?.(data);
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;
    setReady(true);

    console.log('[useTerminalInstance] Terminal initialized:', {
      cols: term.cols,
      rows: term.rows,
      containerId
    });

    // Auto-fit after a short delay to ensure container has proper dimensions
    const fitTimers: NodeJS.Timeout[] = [];
    fitTimers.push(setTimeout(() => {
      try {
        fitAddon.fit();
        console.log('[useTerminalInstance] Delayed fit (50ms):', {
          cols: term.cols,
          rows: term.rows
        });
      } catch (err) {
        console.warn('[useTerminalInstance] Delayed fit (50ms) failed:', err);
      }
    }, 50));
    fitTimers.push(setTimeout(() => {
      try {
        fitAddon.fit();
        console.log('[useTerminalInstance] Delayed fit (150ms):', {
          cols: term.cols,
          rows: term.rows
        });
      } catch (err) {
        console.warn('[useTerminalInstance] Delayed fit (150ms) failed:', err);
      }
    }, 150));
    fitTimers.push(setTimeout(() => {
      try {
        fitAddon.fit();
        console.log('[useTerminalInstance] Delayed fit (300ms):', {
          cols: term.cols,
          rows: term.rows
        });
      } catch (err) {
        console.warn('[useTerminalInstance] Delayed fit (300ms) failed:', err);
      }
    }, 300));

    // Handle window resize
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.warn('[useTerminalInstance] Window resize fit failed:', err);
      }
    };
    window.addEventListener('resize', handleResize);

    // Watch for container size changes using ResizeObserver
    // Debounce to prevent infinite resize loops
    let resizeTimeout: NodeJS.Timeout | null = null;
    const resizeObserver = new ResizeObserver(() => {
      // Only fit if terminal is fully initialized (has a renderer)
      if (!term.element) {
        console.log('[useTerminalInstance] ResizeObserver: Terminal not ready yet, skipping fit');
        return;
      }

      // Debounce: wait for resizing to stabilize before fitting
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        const newRect = container.getBoundingClientRect();
        console.log('[useTerminalInstance] ResizeObserver triggered (debounced):', {
          width: newRect.width,
          height: newRect.height,
          beforeFit: { cols: term.cols, rows: term.rows }
        });

        try {
          fitAddon.fit();
          console.log('[useTerminalInstance] After fit:', {
            cols: term.cols,
            rows: term.rows
          });
        } catch (err) {
          console.warn('[useTerminalInstance] Fit failed, terminal may not be ready:', err);
        }
      }, 100); // Wait 100ms after last resize event
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      // Clear all fit timers
      fitTimers.forEach(timer => clearTimeout(timer));

      // Clear resize timeout if pending
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // Disconnect resize observer
      resizeObserver.disconnect();

      window.removeEventListener('resize', handleResize);
      dataHandler.dispose();
      canvasAddonRef.current?.dispose();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      canvasAddonRef.current = null;
      setReady(false);
    };
  }, [containerId, fontSize, fontFamily]);

  const write = useCallback((data: string) => {
    if (termRef.current) {
      termRef.current.write(data);
    }
  }, []);

  const writeln = useCallback((data: string) => {
    if (termRef.current) {
      termRef.current.writeln(data);
    }
  }, []);

  const clear = useCallback(() => {
    if (termRef.current) {
      termRef.current.clear();
    }
  }, []);

  const fit = useCallback(() => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
      return {
        cols: termRef.current?.cols || 0,
        rows: termRef.current?.rows || 0
      };
    }
    return { cols: 0, rows: 0 };
  }, []);

  const focus = useCallback(() => {
    if (termRef.current) {
      termRef.current.focus();
    }
  }, []);

  return {
    term: termRef.current,
    ready,
    write,
    writeln,
    clear,
    fit,
    focus,
    dimensions: {
      cols: termRef.current?.cols || 0,
      rows: termRef.current?.rows || 0
    }
  };
}
