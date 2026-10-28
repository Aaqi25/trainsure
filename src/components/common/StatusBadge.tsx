import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();

  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700';
  let bgColor = 'bg-slate-50 border-slate-200';
  let label = status;

  switch (s) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'COMPLIANT':
    case 'READY':
    case 'PASS':
    case 'PASSED':
    case 'VERIFIED':
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-700';
      bgColor = 'bg-emerald-50/70 border-emerald-200';
      label = s === 'READY' ? 'Ready' : s === 'COMPLIANT' ? 'Compliant' : s === 'COMPLETED' ? 'Completed' : s;
      break;

    case 'IN_PROGRESS':
    case 'EXPIRING_SOON':
    case 'AT_RISK':
    case 'NEAR_READY':
    case 'PENDING':
    case 'MEDIUM':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800';
      bgColor = 'bg-amber-50/70 border-amber-200';
      label = s === 'EXPIRING_SOON' ? 'Expiring Soon' : s === 'AT_RISK' ? 'At Risk' : s === 'IN_PROGRESS' ? 'In Progress' : s === 'NEAR_READY' ? 'Near Ready' : s;
      break;

    case 'EXPIRED':
    case 'OVERDUE':
    case 'NON_COMPLIANT':
    case 'NEEDS_DEVELOPMENT':
    case 'FAIL':
    case 'FAILED':
    case 'INACTIVE':
    case 'HIGH':
      dotColor = 'bg-rose-500';
      textColor = 'text-rose-700';
      bgColor = 'bg-rose-50/70 border-rose-200';
      label = s === 'NON_COMPLIANT' ? 'Non-Compliant' : s === 'OVERDUE' ? 'Overdue' : s === 'EXPIRED' ? 'Expired' : s === 'NEEDS_DEVELOPMENT' ? 'Gap Identified' : s;
      break;

    case 'ASSIGNED':
    case 'LOW':
    case 'PLANNING':
    case 'DRAFT':
      dotColor = 'bg-sky-500';
      textColor = 'text-sky-700';
      bgColor = 'bg-sky-50/70 border-sky-200';
      label = s;
      break;

    case 'MATCH':
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-700';
      bgColor = 'bg-emerald-50/70 border-emerald-200';
      label = 'Proficiency Match';
      break;

    case 'GAP':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800';
      bgColor = 'bg-amber-50/70 border-amber-200';
      label = 'Partial Gap';
      break;

    case 'MISSING':
      dotColor = 'bg-rose-500';
      textColor = 'text-rose-700';
      bgColor = 'bg-rose-50/70 border-rose-200';
      label = 'Skill Missing';
      break;

    default:
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-600';
      bgColor = 'bg-slate-50 border-slate-200';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${bgColor} ${textColor} ${px}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
