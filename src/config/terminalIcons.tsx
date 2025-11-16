import {
  Terminal as TerminalIcon,
  Bot,
  Sparkles,
  Code2,
  Theater,
  Shell,
  Zap,
  FileCode,
  Monitor,
  GitBranch,
  Database,
  Cpu,
  Boxes,
  FileJson,
  Wrench,
  Activity,
  FolderTree,
  Music,
  FileText,
  MessageSquare,
  ScrollText,
  ChartBar,
  Gamepad2,
  Edit3,
  LayoutGrid,
  Flame,
  Rocket,
  Star,
  Zap as Lightning,
  Network,
  Globe,
  Lock,
  Unlock,
  Shield,
  Clock,
  Timer,
  Palette,
  Camera,
  Video,
  Server,
  Cloud,
  HardDrive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TerminalIconConfig {
  icon: LucideIcon;
  color: string;
  bgGradient: string;
  label: string;
  category: 'agent' | 'utility' | 'tool';
}

export const TERMINAL_ICON_MAP: Record<string, TerminalIconConfig> = {
  'claude-code': {
    icon: Bot,
    color: '#ff6b35',
    bgGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
    label: 'Claude Code',
    category: 'agent',
  },
  'opencode': {
    icon: Code2,
    color: '#9333ea',
    bgGradient: 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)',
    label: 'OpenCode',
    category: 'agent',
  },
  'codex': {
    icon: FileJson,
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    label: 'Codex',
    category: 'agent',
  },
  'orchestrator': {
    icon: Theater,
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #fde047 100%)',
    label: 'Orchestrator',
    category: 'agent',
  },
  'gemini': {
    icon: Sparkles,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    label: 'Gemini',
    category: 'agent',
  },
  'bash': {
    icon: Shell,
    color: '#737373',
    bgGradient: 'linear-gradient(135deg, #737373 0%, #a3a3a3 100%)',
    label: 'Bash',
    category: 'utility',
  },
  'python': {
    icon: FileCode,
    color: '#3776ab',
    bgGradient: 'linear-gradient(135deg, #3776ab 0%, #4b8bbe 100%)',
    label: 'Python',
    category: 'utility',
  },
  'script': {
    icon: FileCode,
    color: '#a3a3a3',
    bgGradient: 'linear-gradient(135deg, #a3a3a3 0%, #d4d4d4 100%)',
    label: 'Script',
    category: 'utility',
  },
  'tui-tool': {
    icon: Monitor,
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    label: 'TUI Tool',
    category: 'utility',
  },
  'lazygit': {
    icon: GitBranch,
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    label: 'LazyGit',
    category: 'tool',
  },
  'database': {
    icon: Database,
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    label: 'Database',
    category: 'tool',
  },
  'htop': {
    icon: Activity,
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    label: 'htop',
    category: 'tool',
  },
  'docker': {
    icon: Boxes,
    color: '#0ea5e9',
    bgGradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    label: 'Docker',
    category: 'tool',
  },
  'tfe': {
    icon: FolderTree,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    label: 'TFE',
    category: 'tool',
  },
  'gitui': {
    icon: GitBranch,
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    label: 'GitUI',
    category: 'tool',
  },
  'micro': {
    icon: Edit3,
    color: '#22c55e',
    bgGradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
    label: 'Micro',
    category: 'tool',
  },
  'vim': {
    icon: FileText,
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    label: 'Vim',
    category: 'tool',
  },
  'spotify': {
    icon: Music,
    color: '#1db954',
    bgGradient: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
    label: 'Spotify',
    category: 'tool',
  },
  'lnav': {
    icon: ScrollText,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    label: 'lnav',
    category: 'tool',
  },
  'aichat': {
    icon: MessageSquare,
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    label: 'AIChat',
    category: 'agent',
  },
  'bottom': {
    icon: ChartBar,
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    label: 'Bottom',
    category: 'tool',
  },
  'games': {
    icon: Gamepad2,
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
    label: 'Games',
    category: 'tool',
  },
  'tmuxplexer': {
    icon: LayoutGrid,
    color: '#14b8a6',
    bgGradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
    label: 'Tmuxplexer',
    category: 'tool',
  },
  // Generic icons for custom use
  'fire': {
    icon: Flame,
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    label: 'Fire',
    category: 'utility',
  },
  'rocket': {
    icon: Rocket,
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    label: 'Rocket',
    category: 'utility',
  },
  'star': {
    icon: Star,
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #fde047 100%)',
    label: 'Star',
    category: 'utility',
  },
  'lightning': {
    icon: Lightning,
    color: '#eab308',
    bgGradient: 'linear-gradient(135deg, #eab308 0%, #facc15 100%)',
    label: 'Lightning',
    category: 'utility',
  },
  'network': {
    icon: Network,
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    label: 'Network',
    category: 'utility',
  },
  'globe': {
    icon: Globe,
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    label: 'Globe',
    category: 'utility',
  },
  'lock': {
    icon: Lock,
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    label: 'Lock',
    category: 'utility',
  },
  'unlock': {
    icon: Unlock,
    color: '#22c55e',
    bgGradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
    label: 'Unlock',
    category: 'utility',
  },
  'shield': {
    icon: Shield,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    label: 'Shield',
    category: 'utility',
  },
  'clock': {
    icon: Clock,
    color: '#6b7280',
    bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    label: 'Clock',
    category: 'utility',
  },
  'timer': {
    icon: Timer,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    label: 'Timer',
    category: 'utility',
  },
  'palette': {
    icon: Palette,
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    label: 'Palette',
    category: 'utility',
  },
  'camera': {
    icon: Camera,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    label: 'Camera',
    category: 'utility',
  },
  'video': {
    icon: Video,
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    label: 'Video',
    category: 'utility',
  },
  'server': {
    icon: Server,
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    label: 'Server',
    category: 'utility',
  },
  'cloud': {
    icon: Cloud,
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    label: 'Cloud',
    category: 'utility',
  },
  'storage': {
    icon: HardDrive,
    color: '#64748b',
    bgGradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
    label: 'Storage',
    category: 'utility',
  },
  'default': {
    icon: TerminalIcon,
    color: '#6b7280',
    bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    label: 'Terminal',
    category: 'utility',
  },
};

export function getTerminalIcon(terminalType: string): TerminalIconConfig {
  return TERMINAL_ICON_MAP[terminalType] || TERMINAL_ICON_MAP.default;
}

// Get all available icon types for the icon picker
export function getAllIconTypes(): string[] {
  return Object.keys(TERMINAL_ICON_MAP).filter(key => key !== 'default');
}

// Group icons by category for organized display
export function getIconsByCategory(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {
    agent: [],
    utility: [],
    tool: [],
  };

  Object.entries(TERMINAL_ICON_MAP).forEach(([key, config]) => {
    if (key !== 'default') {
      grouped[config.category].push(key);
    }
  });

  return grouped;
}
