import { RiskLevel, RISK_LEVELS } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function RiskBadge({ level, size = 'md', showIcon = true }: RiskBadgeProps) {
  const info = RISK_LEVELS[level];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses[size]} ${
        info.bgColor} ${info.borderColor}`}
      role="status"
      aria-label={`Risk level: ${info.label}`}
    >
      {showIcon && <span>{info.emoji}</span>}
      {info.label}
    </span>
  );
}
