import { useEffect, useRef } from 'react';

/**
 * Hook for handling mouse coordinate transformation when terminal is zoomed.
 *
 * Transforms mouse coordinates from visual space (what user sees after CSS transform)
 * to layout space (what xterm.js expects). This is critical for accurate mouse
 * interactions when the terminal is rendered at non-100% zoom levels.
 *
 * @param terminalRef - Ref to the terminal container element
 * @param isSelected - Whether terminal is currently selected (for wheel event handling)
 */
export function useTerminalMouse(
  terminalRef: React.RefObject<HTMLDivElement | null>,
  isSelected: boolean
) {
  // Use WeakSet to track processed events (prevents infinite recursion)
  const processedEventsRef = useRef(new WeakSet<Event>());

  useEffect(() => {
    if (!terminalRef.current) return;

    const processedEvents = processedEventsRef.current;

    /**
     * CRITICAL: Mouse coordinate transformation for canvas zoom
     * The key insight from diagnostics:
     * - Browser zoom changes the coordinate system (devicePixelRatio, viewport size)
     * - CSS transform only changes visual rendering (boundingRect ≠ offsetWidth)
     * - We need to transform using the visual-to-layout ratio, NOT just canvasZoom
     */
    const mouseTransformHandler = (e: MouseEvent) => {
      if (!terminalRef.current) return;

      // Check if we've already processed this event (prevent infinite recursion)
      if (processedEvents.has(e)) {
        return;
      }

      // CRITICAL: For wheel events, only intercept if terminal is selected OR focused
      // This allows canvas zoom when hovering over unselected/unfocused terminals
      // But ensures wheel scrolling works reliably in TUI apps when terminal has focus
      if (e.type === 'wheel' && !isSelected) {
        // Check if the terminal or any of its children has focus
        const hasFocus = terminalRef.current.contains(document.activeElement);
        if (!hasFocus) {
          return; // Let event bubble to App's handleWheel for canvas zoom
        }
        // Terminal has focus (orange border) - intercept wheel for scrolling
      }

      // CRITICAL: Don't intercept mouse events during active drag operations
      // When dragging terminals, react-draggable tracks global mousemove events
      // Transforming these coordinates breaks dragging at non-100% zoom
      const terminalWrapper = terminalRef.current.closest('.draggable-terminal-wrapper');
      if (terminalWrapper && terminalWrapper.classList.contains('dragging')) {
        // A drag is in progress - let react-draggable handle the event
        return;
      }

      // Mark this event as processed
      processedEvents.add(e);

      const rect = terminalRef.current.getBoundingClientRect();
      const offsetWidth = terminalRef.current.offsetWidth;
      const offsetHeight = terminalRef.current.offsetHeight;

      // Calculate the ratio between visual size and layout size
      // This accounts for BOTH browser zoom AND canvas zoom
      const visualToLayoutRatioX = rect.width / offsetWidth;
      const visualToLayoutRatioY = rect.height / offsetHeight;

      // Only transform if there's a visual/layout mismatch (i.e., canvas is zoomed)
      if (Math.abs(visualToLayoutRatioX - 1) > 0.01 || Math.abs(visualToLayoutRatioY - 1) > 0.01) {
        e.stopImmediatePropagation(); // Prevent xterm from seeing original event

        // Get click position relative to terminal (in visual coordinates)
        const visualX = e.clientX - rect.left;
        const visualY = e.clientY - rect.top;

        // Transform to layout coordinates (what xterm expects)
        const layoutX = visualX / visualToLayoutRatioX;
        const layoutY = visualY / visualToLayoutRatioY;

        // Create new event with transformed coordinates
        // CRITICAL: Use WheelEvent for wheel events to preserve deltaY/deltaX
        const transformedEvent = e.type === 'wheel'
          ? new WheelEvent(e.type, {
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              view: e.view,
              detail: e.detail,
              screenX: e.screenX,
              screenY: e.screenY,
              clientX: rect.left + layoutX,
              clientY: rect.top + layoutY,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              altKey: e.altKey,
              metaKey: e.metaKey,
              button: e.button,
              buttons: e.buttons,
              relatedTarget: e.relatedTarget,
              deltaX: (e as WheelEvent).deltaX,
              deltaY: (e as WheelEvent).deltaY,
              deltaZ: (e as WheelEvent).deltaZ,
              deltaMode: (e as WheelEvent).deltaMode,
            })
          : new MouseEvent(e.type, {
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              view: e.view,
              detail: e.detail,
              screenX: e.screenX,
              screenY: e.screenY,
              clientX: rect.left + layoutX,
              clientY: rect.top + layoutY,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              altKey: e.altKey,
              metaKey: e.metaKey,
              button: e.button,
              buttons: e.buttons,
              relatedTarget: e.relatedTarget,
            });

        // Mark the transformed event as processed too
        processedEvents.add(transformedEvent);

        // Dispatch to the xterm viewport element, NOT the terminal wrapper
        // This prevents re-triggering our capture handler
        const xtermViewport = terminalRef.current.querySelector('.xterm-viewport, .xterm-screen');
        if (xtermViewport) {
          xtermViewport.dispatchEvent(transformedEvent);
        } else {
          // Fallback to terminal element if xterm not ready
          terminalRef.current.dispatchEvent(transformedEvent);
        }
      }
    };

    // Add mouse transform handler in capture phase (intercepts BEFORE xterm sees events)
    const mouseEventTypes = ['mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'contextmenu', 'wheel'];

    mouseEventTypes.forEach(eventType => {
      terminalRef.current?.addEventListener(eventType, mouseTransformHandler as EventListener, { capture: true });
    });

    // Cleanup
    return () => {
      mouseEventTypes.forEach(eventType => {
        terminalRef.current?.removeEventListener(eventType, mouseTransformHandler as EventListener, { capture: true });
      });
    };
  }, [isSelected]); // Re-run when selection state changes
}
