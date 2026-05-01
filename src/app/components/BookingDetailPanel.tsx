'use client';

import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Plane,
  Users,
  User,
  MapPin,
  Navigation,
  Car,
  UserCheck,
  Euro,
  Building2,
  Phone,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

export interface Booking {
  id: string;
  time: string;
  flight: string;
  pax: number;
  customer: string;
  from: string;
  to: string;
  vehicle: string;
  driver: string;
  driverPhone: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'IN PROGRESS';
  price: number;
  agency: string;
  phone: string;
  notes: string;
  date: string;
}

interface BookingDetailPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-500 text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 500 }}>
          {label}
        </span>
        <span className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>
          {value || '—'}
        </span>
      </div>
    </div>
  );
}

export default function BookingDetailPanel({
  booking,
  onClose,
  onEdit,
  onCancel,
}: BookingDetailPanelProps) {
  if (!booking) return null;

  return (
    <div className="w-72 shrink-0 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-base font-700 text-foreground" style={{ fontWeight: 700 }}>
          Booking Details
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors duration-150"
        >
          <X size={15} className="text-muted-foreground" />
        </button>
      </div>

      {/* Status + ID */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <StatusBadge status={booking.status} />
        <span className="text-xs font-600 text-muted-foreground" style={{ fontWeight: 600 }}>
          ID: #{booking.id}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-2">
        <DetailRow icon={<Calendar size={15} />} label="Date" value={booking.date} />
        <DetailRow icon={<Clock size={15} />} label="Time" value={booking.time} />
        <DetailRow icon={<Plane size={15} />} label="Flight" value={booking.flight} />
        <DetailRow icon={<Users size={15} />} label="PAX" value={String(booking.pax)} />
        <DetailRow icon={<User size={15} />} label="Customer / Name" value={booking.customer} />
        <DetailRow icon={<MapPin size={15} />} label="From" value={booking.from} />
        <DetailRow icon={<Navigation size={15} />} label="To" value={booking.to} />
        <DetailRow icon={<Car size={15} />} label="Vehicle" value={booking.vehicle} />
        <div className="flex items-start gap-3 py-3 border-b border-border">
          <div className="mt-0.5 text-muted-foreground shrink-0">
            <UserCheck size={15} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-500 text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 500 }}>
              Driver
            </span>
            <span className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>
              {booking.driver}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Phone size={11} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{booking.driverPhone}</span>
            </div>
          </div>
        </div>
        <DetailRow icon={<Euro size={15} />} label="Price" value={`€${booking.price}`} />
        <DetailRow icon={<Building2 size={15} />} label="Agency" value={booking.agency} />
        <DetailRow icon={<Phone size={15} />} label="Phone" value={booking.phone} />
        <DetailRow icon={<FileText size={15} />} label="Notes" value={booking.notes || '—'} />
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border flex gap-2">
        <button
          onClick={() => onEdit(booking)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150 whitespace-nowrap"
          style={{ fontWeight: 600 }}
        >
          <Edit2 size={14} />
          Edit Booking
        </button>
        <button
          onClick={() => onCancel(booking.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-600 hover:bg-red-50 active:scale-95 transition-all duration-150 whitespace-nowrap"
          style={{ fontWeight: 600 }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}