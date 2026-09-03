import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon?: LucideIcon;
  iconColor?: string;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  className?: string;
}

export default function MetricCard({
  icon: Icon, iconColor = 'text-sky-600',
  label, value, unit, subtext, className = '',
}: MetricCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}
