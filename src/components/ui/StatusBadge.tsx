import React from 'react';

type Status = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'IN PROGRESS' | 'COMPLETED' | 'AVAILABLE' | 'ON TRIP' | 'OFF DUTY' | 'ACTIVE' | 'INACTIVE';

const statusConfig: Record<Status, { bg: string; text: string; dot: string }> = {
  CONFIRMED: { bg: 'bg-confirmed', text: 'text-confirmed', dot: 'bg-green-500' },
  PENDING: { bg: 'bg-pending', text: 'text-pending', dot: 'bg-amber-500' },
  CANCELLED: { bg: 'bg-cancelled', text: 'text-cancelled', dot: 'bg-red-500' },
  'IN PROGRESS': { bg: 'bg-inprogress', text: 'text-inprogress', dot: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-confirmed', text: 'text-confirmed', dot: 'bg-green-600' },
  AVAILABLE: { bg: 'bg-confirmed', text: 'text-confirmed', dot: 'bg-green-500' },
  'ON TRIP': { bg: 'bg-inprogress', text: 'text-inprogress', dot: 'bg-blue-500' },
  'OFF DUTY': { bg: 'bg-[#f1f5f9]', text: 'text-[#64748b]', dot: 'bg-slate-400' },
  ACTIVE: { bg: 'bg-confirmed', text: 'text-confirmed', dot: 'bg-green-500' },
  INACTIVE: { bg: 'bg-cancelled', text: 'text-cancelled', dot: 'bg-red-500' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status] ?? { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-slate-400' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-600 tracking-wide ${cfg.bg} ${cfg.text}`}
      style={{ fontWeight: 600 }}
    >
      {status}
    </span>
  );
}