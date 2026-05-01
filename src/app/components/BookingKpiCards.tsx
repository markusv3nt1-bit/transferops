import React from 'react';
import { CalendarDays, Users, Car, Euro } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ label, value, icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border px-5 py-4 flex items-center justify-between shadow-card">
      <div>
        <p className="text-xs font-500 text-muted-foreground mb-1" style={{ fontWeight: 500 }}>
          {label}
        </p>
        <p className="text-2xl font-700 text-foreground font-tabular" style={{ fontWeight: 700 }}>
          {value}
        </p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}

interface BookingKpiCardsProps {
  totalBookings: number;
  totalPax: number;
  vehicles: number;
  revenue: number;
}

export default function BookingKpiCards({
  totalBookings,
  totalPax,
  vehicles,
  revenue,
}: BookingKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 px-6 py-4">
      <KpiCard
        label="Total Bookings"
        value={String(totalBookings)}
        icon={<CalendarDays size={20} className="text-blue-500" />}
        iconBg="bg-blue-50"
      />
      <KpiCard
        label="PAX"
        value={String(totalPax)}
        icon={<Users size={20} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
      />
      <KpiCard
        label="Vehicles"
        value={String(vehicles)}
        icon={<Car size={20} className="text-purple-500" />}
        iconBg="bg-purple-50"
      />
      <KpiCard
        label="Revenue (Est.)"
        value={`€${revenue.toLocaleString()}`}
        icon={<Euro size={20} className="text-amber-500" />}
        iconBg="bg-amber-50"
      />
    </div>
  );
}