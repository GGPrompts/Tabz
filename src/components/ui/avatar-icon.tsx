import React from 'react';
import { getTerminalIcon } from '@/config/terminalIcons';

interface AvatarIconProps {
  terminalType: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  xs: {
    icon: 'w-3 h-3',
    iconPx: 12,
  },
  sm: {
    icon: 'w-4 h-4',
    iconPx: 16,
  },
  md: {
    icon: 'w-5 h-5',
    iconPx: 20,
  },
  lg: {
    icon: 'w-6 h-6',
    iconPx: 24,
  },
  xl: {
    icon: 'w-8 h-8',
    iconPx: 32,
  },
};

// Variant for inline use (just the icon, no wrapper)
export function InlineTerminalIcon({
  terminalType,
  size = 'md',
  className = '',
}: Omit<AvatarIconProps, 'showLabel'>) {
  const config = getTerminalIcon(terminalType);
  const Icon = config.icon;
  const sizes = sizeMap[size];

  return (
    <Icon
      className={className}
      style={{ color: config.color, width: sizes.iconPx, height: sizes.iconPx }}
      strokeWidth={2.5}
    />
  );
}
