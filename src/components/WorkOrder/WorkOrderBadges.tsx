import { AlertTriangle } from 'lucide-react';
import type { SeverityType, WorkOrderStatus } from '@/types';
import { SEVERITY_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types';

const statusStyles: Record<WorkOrderStatus, string> = {
  pending: 'bg-ochre/10 text-ochre',
  fixing: 'bg-sky-100 text-sky-700',
  review: 'bg-violet-100 text-violet-700',
  closed: 'bg-moss-green/10 text-moss-green',
};

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {WORK_ORDER_STATUS_LABELS[status]}
    </span>
  );
}

const severityStyles: Record<SeverityType, string> = {
  severe: 'bg-red-50 text-red-600',
  normal: 'bg-amber-50 text-amber-700',
  minor: 'bg-moss-green/10 text-moss-green',
};

export function SeverityBadge({ severity }: { severity: SeverityType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityStyles[severity]}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function OverdueBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
      <AlertTriangle className="w-3 h-3" />
      已逾期{days > 0 ? ` ${days} 天` : ''}
    </span>
  );
}
