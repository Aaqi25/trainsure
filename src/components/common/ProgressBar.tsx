import React from 'react';

interface ProgressBarProps {
  progress: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compliance' | 'risk';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showText = true,
  size = 'md',
  variant = 'default',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  let barColor = 'bg-indigo-600';
  if (variant === 'compliance') {
    if (clamped === 100) barColor = 'bg-emerald-500';
    else if (clamped >= 70) barColor = 'bg-amber-500';
    else barColor = 'bg-rose-500';
  } else if (variant === 'risk') {
    if (clamped >= 60) barColor = 'bg-rose-500';
    else if (clamped >= 30) barColor = 'bg-amber-500';
    else barColor = 'bg-emerald-500';
  } else {
    if (clamped === 100) barColor = 'bg-emerald-500';
    else if (clamped > 0) barColor = 'bg-indigo-600';
    else barColor = 'bg-slate-300';
  }

  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full flex items-center gap-2.5">
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`h-full transition-all duration-300 rounded-full ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showText && (
        <span className="text-xs font-semibold text-slate-700 min-w-9 text-right font-mono">
          {clamped}%
        </span>
      )}
    </div>
  );
};
