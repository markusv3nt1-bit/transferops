'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-panel text-xs">
        <p className="font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={`tt-${p.name}`} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export interface WeeklyStatusDataPoint {
  week: string;
  confirmed: number;
  pending: number;
  cancelled: number;
}

interface BookingsByStatusChartProps {
  range?: string;
  data?: WeeklyStatusDataPoint[];
  loading?: boolean;
}

export default function BookingsByStatusChart({ data = [], loading = false }: BookingsByStatusChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
        No booking data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="confirmed" name="Confirmed" fill="#16a34a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="pending" name="Pending" fill="#d97706" radius={[3, 3, 0, 0]} />
        <Bar dataKey="cancelled" name="Cancelled" fill="#dc2626" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}