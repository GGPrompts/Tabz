import React, { useState, useEffect, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './SplitLayout.css';
import { Terminal } from './Terminal';
import { Terminal as StoredTerminal } from '../stores/simpleTerminalStore';
import { Agent } from '../types';
import { useSimpleTerminalStore } from '../stores/simpleTerminalStore';
import { useSettingsStore } from '../stores/useSettingsStore';

const THEME_BACKGROUNDS: Record<string, string> = {
  'amber': 'amber-warmth',
  'green': 'matrix-code',
  'purple': 'cyberpunk-neon',
  'pink': 'vaporwave-dreams',
  'blue': 'holographic',
  'ocean': 'deep-ocean',
  'dark': 'dark-neutral',
  'default': 'dark-neutral',
};

interface SplitLayoutProps {
  terminal: StoredTerminal;
  terminals: StoredTerminal[];
  agents: Agent[];
  onClose: (terminalId: string) => void;
  onCommand: (cmd: string, terminalId: string) => void;
  wsRef: React.RefObject<WebSocket | null>;
  terminalRef?: React.RefObject<any>;
  activeTerminalId: string | null;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  terminal,
  terminals,
  agents,
  onClose,
  onCommand,
  wsRef,
  terminalRef,
  activeTerminalId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { updateTerminal } = useSimpleTerminalStore();

  const { splitLayout } = terminal;

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // If no split layout or single terminal, render simple Terminal component
  if (!splitLayout || splitLayout.type === 'single') {
    const agent = agents.find(a => a.id === terminal.agentId);
    if (!agent) return null;

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <Terminal
          key={`term-${terminal.id}`}
          ref={terminal.id === activeTerminalId ? terminalRef : null}
          agent={agent}
          onClose={() => onClose(terminal.id)}
          onCommand={(cmd) => onCommand(cmd, terminal.id)}
          wsRef={wsRef}
          embedded={true}
          initialTheme={terminal.theme}
          initialBackground={terminal.background || THEME_BACKGROUNDS[terminal.theme || 'default'] || 'dark-neutral'}
          initialOpacity={terminal.transparency !== undefined ? terminal.transparency / 100 : 1}
          initialFontSize={terminal.fontSize}
          initialFontFamily={terminal.fontFamily}
          isSelected={terminal.id === activeTerminalId}
        />
      </div>
    );
  }

  // Vertical split (left/right)
  if (splitLayout.type === 'vertical') {
    const leftPane = splitLayout.panes.find(p => p.position === 'left');
    const rightPane = splitLayout.panes.find(p => p.position === 'right');

    if (!leftPane || !rightPane) return null;

    const leftTerminal = terminals.find(t => t.id === leftPane.terminalId);
    const rightTerminal = terminals.find(t => t.id === rightPane.terminalId);
    const leftAgent = agents.find(a => a.id === leftTerminal?.agentId);
    const rightAgent = agents.find(a => a.id === rightTerminal?.agentId);

    if (!leftTerminal || !rightTerminal || !leftAgent || !rightAgent) return null;

    const leftWidth = (leftPane.size / 100) * containerWidth;

    return (
      <div ref={containerRef} className="split-layout-container split-vertical">
        <ResizableBox
          width={leftWidth || containerWidth * 0.5}
          height={containerHeight}
          axis="x"
          minConstraints={[200, containerHeight]}
          maxConstraints={[containerWidth - 200, containerHeight]}
          onResizeStop={(e, data) => {
            const newSize = (data.size.width / containerWidth) * 100;
            updateTerminal(terminal.id, {
              splitLayout: {
                ...splitLayout,
                panes: splitLayout.panes.map(p =>
                  p.position === 'left' ? { ...p, size: newSize } :
                  p.position === 'right' ? { ...p, size: 100 - newSize } : p
                ),
              },
            });

            // Trigger xterm refit for both terminals
            window.dispatchEvent(new Event('terminal-container-resized'));
          }}
          resizeHandles={['e']}
          className="split-pane split-pane-left"
        >
          <div style={{ width: '100%', height: '100%' }}>
            <Terminal
              key={`term-${leftTerminal.id}`}
              ref={leftTerminal.id === activeTerminalId ? terminalRef : null}
              agent={leftAgent}
              onClose={() => onClose(leftTerminal.id)}
              onCommand={(cmd) => onCommand(cmd, leftTerminal.id)}
              wsRef={wsRef}
              embedded={true}
              initialTheme={leftTerminal.theme}
              initialBackground={leftTerminal.background || THEME_BACKGROUNDS[leftTerminal.theme || 'default'] || 'dark-neutral'}
              initialOpacity={leftTerminal.transparency !== undefined ? leftTerminal.transparency / 100 : 1}
              initialFontSize={leftTerminal.fontSize}
              initialFontFamily={leftTerminal.fontFamily}
              isSelected={leftTerminal.id === activeTerminalId}
            />
          </div>
        </ResizableBox>

        <div className="split-pane split-pane-right" style={{ flex: 1 }}>
          <Terminal
            key={`term-${rightTerminal.id}`}
            ref={rightTerminal.id === activeTerminalId ? terminalRef : null}
            agent={rightAgent}
            onClose={() => onClose(rightTerminal.id)}
            onCommand={(cmd) => onCommand(cmd, rightTerminal.id)}
            wsRef={wsRef}
            embedded={true}
            initialTheme={rightTerminal.theme}
            initialBackground={rightTerminal.background || THEME_BACKGROUNDS[rightTerminal.theme || 'default'] || 'dark-neutral'}
            initialOpacity={rightTerminal.transparency !== undefined ? rightTerminal.transparency / 100 : 1}
            initialFontSize={rightTerminal.fontSize}
            initialFontFamily={rightTerminal.fontFamily}
            isSelected={rightTerminal.id === activeTerminalId}
          />
        </div>
      </div>
    );
  }

  // Horizontal split (top/bottom)
  if (splitLayout.type === 'horizontal') {
    const topPane = splitLayout.panes.find(p => p.position === 'top');
    const bottomPane = splitLayout.panes.find(p => p.position === 'bottom');

    if (!topPane || !bottomPane) return null;

    const topTerminal = terminals.find(t => t.id === topPane.terminalId);
    const bottomTerminal = terminals.find(t => t.id === bottomPane.terminalId);
    const topAgent = agents.find(a => a.id === topTerminal?.agentId);
    const bottomAgent = agents.find(a => a.id === bottomTerminal?.agentId);

    if (!topTerminal || !bottomTerminal || !topAgent || !bottomAgent) return null;

    const topHeight = (topPane.size / 100) * containerHeight;

    return (
      <div ref={containerRef} className="split-layout-container split-horizontal">
        <ResizableBox
          width={containerWidth}
          height={topHeight || containerHeight * 0.5}
          axis="y"
          minConstraints={[containerWidth, 200]}
          maxConstraints={[containerWidth, containerHeight - 200]}
          onResizeStop={(e, data) => {
            const newSize = (data.size.height / containerHeight) * 100;
            updateTerminal(terminal.id, {
              splitLayout: {
                ...splitLayout,
                panes: splitLayout.panes.map(p =>
                  p.position === 'top' ? { ...p, size: newSize } :
                  p.position === 'bottom' ? { ...p, size: 100 - newSize } : p
                ),
              },
            });

            // Trigger xterm refit for both terminals
            window.dispatchEvent(new Event('terminal-container-resized'));
          }}
          resizeHandles={['s']}
          className="split-pane split-pane-top"
        >
          <div style={{ width: '100%', height: '100%' }}>
            <Terminal
              key={`term-${topTerminal.id}`}
              ref={topTerminal.id === activeTerminalId ? terminalRef : null}
              agent={topAgent}
              onClose={() => onClose(topTerminal.id)}
              onCommand={(cmd) => onCommand(cmd, topTerminal.id)}
              wsRef={wsRef}
              embedded={true}
              initialTheme={topTerminal.theme}
              initialBackground={topTerminal.background || THEME_BACKGROUNDS[topTerminal.theme || 'default'] || 'dark-neutral'}
              initialOpacity={topTerminal.transparency !== undefined ? topTerminal.transparency / 100 : 1}
              initialFontSize={topTerminal.fontSize}
              initialFontFamily={topTerminal.fontFamily}
              isSelected={topTerminal.id === activeTerminalId}
            />
          </div>
        </ResizableBox>

        <div className="split-pane split-pane-bottom" style={{ flex: 1 }}>
          <Terminal
            key={`term-${bottomTerminal.id}`}
            ref={bottomTerminal.id === activeTerminalId ? terminalRef : null}
            agent={bottomAgent}
            onClose={() => onClose(bottomTerminal.id)}
            onCommand={(cmd) => onCommand(cmd, bottomTerminal.id)}
            wsRef={wsRef}
            embedded={true}
            initialTheme={bottomTerminal.theme}
            initialBackground={bottomTerminal.background || THEME_BACKGROUNDS[bottomTerminal.theme || 'default'] || 'dark-neutral'}
            initialOpacity={bottomTerminal.transparency !== undefined ? bottomTerminal.transparency / 100 : 1}
            initialFontSize={bottomTerminal.fontSize}
            initialFontFamily={bottomTerminal.fontFamily}
            isSelected={bottomTerminal.id === activeTerminalId}
          />
        </div>
      </div>
    );
  }

  return null;
};
