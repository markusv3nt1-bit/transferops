'use client';

import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Booking } from './BookingDetailPanel';

interface BookingsTableProps {
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (booking: Booking) => void;
}

export default function BookingsTable({
  bookings,
  selectedId,
  onSelect,
}: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-base font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>
          No bookings for this date
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          No transfers are scheduled. Use &quot;Add Booking&quot; to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-border">
            {['TIME', 'FLIGHT', 'PAX', 'CUSTOMER / NAME', 'FROM', 'TO', 'VEHICLE', 'DRIVER', 'STATUS', 'PRICE'].map(
              (col) => (
                <th
                  key={`th-${col}`}
                  className="text-left px-4 py-3 text-[11px] font-600 text-muted-foreground uppercase tracking-wide select-none"
                  style={{ fontWeight: 600 }}
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const isSelected = booking.id === selectedId;
            return (
              <tr
                key={`booking-${booking.id}`}
                onClick={() => onSelect(booking)}
                className={`
                  border-b border-border cursor-pointer transition-colors duration-100
                  ${isSelected ? 'bg-accent/60 border-l-2 border-l-primary' : 'hover:bg-muted/50'}
                `}
              >
                <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular whitespace-nowrap" style={{ fontWeight: 600 }}>
                  {booking.time}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-tabular whitespace-nowrap">
                  {booking.flight}
                </td>
                <td className="px-4 py-3 text-sm text-foreground font-tabular">
                  {booking.pax}
                </td>
                <td className="px-4 py-3 text-sm max-w-[160px]">
                  {booking.status === 'CONFIRMED' ? (
                    <span className="text-primary font-600 cursor-pointer hover:underline" style={{ fontWeight: 600 }}>
                      {booking.customer}
                    </span>
                  ) : (
                    <span className="text-foreground">{booking.customer}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {booking.from}
                </td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {booking.to}
                </td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {booking.vehicle}
                </td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {booking.driver}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular whitespace-nowrap" style={{ fontWeight: 600 }}>
                  €{booking.price}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}