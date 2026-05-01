'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Calendar, Mail, Plus, Filter, Download } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import BookingKpiCards from './BookingKpiCards';
import BookingsTable from './BookingsTable';
import BookingDetailPanel, { Booking } from './BookingDetailPanel';
import AddBookingModal from './AddBookingModal';
import ImportFromEmailModal from './ImportFromEmailModal';
import EditBookingModal from './EditBookingModal';

import { bookingService } from '@/lib/services/bookingService';
import { createClient } from '@/lib/supabase/client';

const ITEMS_PER_PAGE = 10;

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseDate(str: string): Date {
  // Handle ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Handle legacy format: DD Mon YYYY (e.g. "01 May 2026")
  const parts = str.split(' ');
  const day = parseInt(parts[0], 10);
  const month = MONTH_NAMES.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function CalendarPicker({
  selectedDate,
  onSelect,
  onClose,
  bookingDates,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
  bookingDates: Set<string>;
}) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
          <ChevronLeft size={14} className="text-muted-foreground" />
        </button>
        <span className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
          <ChevronRight size={14} className="text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-600 text-muted-foreground py-1" style={{ fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isSelected = isSameDay(cellDate, selectedDate);
          const hasBookings = bookingDates.has(formatDate(cellDate));
          const isToday = isSameDay(cellDate, new Date());
          return (
            <button
              key={`day-${day}`}
              onClick={() => { onSelect(cellDate); onClose(); }}
              className={`relative w-8 h-8 mx-auto rounded-lg text-xs font-500 transition-colors duration-100 flex items-center justify-center ${
                isSelected ? 'bg-primary text-white font-600' : isToday ? 'border border-primary text-primary hover:bg-primary/10' : 'text-foreground hover:bg-muted'
              }`}
              style={{ fontWeight: isSelected ? 600 : 500 }}
            >
              {day}
              {hasBookings && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Export helpers ──────────────────────────────────────────────────────────

function exportCSV(bookings: Booking[], date: string) {
  const headers = ['Time', 'Flight', 'PAX', 'Customer', 'From', 'To', 'Vehicle', 'Driver', 'Status', 'Price (€)'];
  const rows = bookings.map((b) => [
    b.time,
    b.flight,
    b.pax,
    b.customer,
    b.from,
    b.to,
    b.vehicle,
    b.driver,
    b.status,
    b.price,
  ]);

  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings-${date.replace(/ /g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(bookings: Booking[], date: string) {
  const rows = bookings
    .map(
      (b) => `
      <tr>
        <td>${b.time}</td>
        <td>${b.flight}</td>
        <td>${b.pax}</td>
        <td>${b.customer}</td>
        <td>${b.from}</td>
        <td>${b.to}</td>
        <td>${b.driver}</td>
        <td><span class="status status-${b.status.toLowerCase()}">${b.status}</span></td>
        <td>€${b.price}</td>
      </tr>`
    )
    .join('');

  const totalPax = bookings.reduce((s, b) => s + b.pax, 0);
  const totalRevenue = bookings.reduce((s, b) => s + b.price, 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bookings – ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
    h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #e5e7eb; }
    td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .status { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
    .status-confirmed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .summary { margin-top: 16px; display: flex; gap: 24px; font-size: 11px; color: #555; }
    .summary strong { color: #111; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Daily Bookings – ${date}</h1>
  <p class="meta">Generated on ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Time</th><th>Flight</th><th>PAX</th><th>Customer</th>
        <th>From</th><th>To</th><th>Driver</th><th>Status</th><th>Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <span>Total bookings: <strong>${bookings.length}</strong></span>
    <span>Total PAX: <strong>${totalPax}</strong></span>
    <span>Total revenue: <strong>€${totalRevenue}</strong></span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// ── ExportMenu component ────────────────────────────────────────────────────

function ExportMenu({ bookings, date }: { bookings: Booking[]; date: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-500 text-foreground hover:bg-muted transition-colors duration-150"
        style={{ fontWeight: 500 }}
        title="Export bookings"
      >
        <Download size={14} className="text-muted-foreground" />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl py-1 w-40">
          <button
            onClick={() => { exportCSV(bookings, date); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            📄 Export as CSV
          </button>
          <button
            onClick={() => { exportPDF(bookings, date); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            🖨️ Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingDates, setBookingDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Load bookings for selected date
  useEffect(() => {
    const date = formatDate(selectedDate);
    setLoading(true);
    bookingService.getByDate(date).then((data) => {
      setBookings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedDate]);

  // Load all booking dates for calendar dots
  useEffect(() => {
    bookingService.getAllDates().then((dates) => {
      setBookingDates(new Set(dates));
    }).catch(() => {});
  }, []);

  // Real-time subscription for live booking updates
  useEffect(() => {
    const supabase = createClient();
    const currentDate = formatDate(selectedDate);

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT') {
            const booking: Booking = {
              id: newRow.id,
              date: newRow.booking_date,
              time: newRow.booking_time,
              flight: newRow.flight ?? '',
              pax: newRow.pax ?? 1,
              customer: newRow.customer ?? '',
              from: newRow.from_location ?? '',
              to: newRow.to_location ?? '',
              vehicle: newRow.vehicle ?? '',
              driver: newRow.driver ?? '',
              driverPhone: newRow.driver_phone ?? '',
              status: newRow.booking_status as Booking['status'],
              price: Number(newRow.price ?? 0),
              agency: newRow.agency ?? '',
              phone: newRow.phone ?? '',
              notes: newRow.notes ?? '',
            };
            // Add to calendar dots
            setBookingDates((prev) => new Set([...prev, booking.date]));
            // Add to list only if it matches the currently viewed date
            if (booking.date === currentDate) {
              setBookings((prev) => {
                // Avoid duplicates (e.g. optimistic update already added it)
                if (prev.some((b) => b.id === booking.id)) return prev;
                return [...prev, booking].sort((a, b) => a.time.localeCompare(b.time));
              });
            }
          }

          if (eventType === 'UPDATE') {
            const updated: Booking = {
              id: newRow.id,
              date: newRow.booking_date,
              time: newRow.booking_time,
              flight: newRow.flight ?? '',
              pax: newRow.pax ?? 1,
              customer: newRow.customer ?? '',
              from: newRow.from_location ?? '',
              to: newRow.to_location ?? '',
              vehicle: newRow.vehicle ?? '',
              driver: newRow.driver ?? '',
              driverPhone: newRow.driver_phone ?? '',
              status: newRow.booking_status as Booking['status'],
              price: Number(newRow.price ?? 0),
              agency: newRow.agency ?? '',
              phone: newRow.phone ?? '',
              notes: newRow.notes ?? '',
            };
            setBookings((prev) =>
              prev
                .map((b) => (b.id === updated.id ? updated : b))
                .sort((a, b) => a.time.localeCompare(b.time))
            );
            setSelectedBooking((prev) => (prev?.id === updated.id ? updated : prev));
          }

          if (eventType === 'DELETE') {
            const deletedId = oldRow?.id;
            if (deletedId) {
              setBookings((prev) => prev.filter((b) => b.id !== deletedId));
              setSelectedBooking((prev) => (prev?.id === deletedId ? null : prev));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendar]);

  const currentDate = formatDate(selectedDate);
  const totalBookings = bookings.length;
  const totalPax = bookings.reduce((s, b) => s + b.pax, 0);
  const vehicleSet = new Set(bookings.map((b) => b.vehicle));
  const totalRevenue = bookings.reduce((s, b) => s + b.price, 0);

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginated = bookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePrevDate = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    setSelectedBooking(null);
    setPage(1);
  };

  const handleNextDate = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    setSelectedBooking(null);
    setPage(1);
  };

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d);
    setSelectedBooking(null);
    setPage(1);
  };

  const handleCancel = async (id: string) => {
    await bookingService.delete(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setSelectedBooking(null);
  };

  const handleBookingAdded = (newBooking: Booking) => {
    if (newBooking.date === currentDate) {
      setBookings((prev) => [...prev, newBooking].sort((a, b) => a.time.localeCompare(b.time)));
    }
    setBookingDates((prev) => new Set([...prev, newBooking.date]));
  };

  const handleBookingUpdated = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    setSelectedBooking(updated);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader icon={<CalendarDays size={16} />} title="Bookings" />

        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevDate} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors duration-150">
              <ChevronLeft size={15} className="text-muted-foreground" />
            </button>
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar((v) => !v)}
                className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg bg-background min-w-[140px] justify-between transition-colors duration-150 ${
                  showCalendar ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>{formatDateDisplay(selectedDate)}</span>
                <Calendar size={14} className={showCalendar ? 'text-primary' : 'text-muted-foreground'} />
              </button>
              {showCalendar && (
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                  onClose={() => setShowCalendar(false)}
                  bookingDates={bookingDates}
                />
              )}
            </div>
            <button onClick={handleNextDate} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors duration-150">
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-500 text-foreground hover:bg-muted transition-colors duration-150" style={{ fontWeight: 500 }}>
              <Mail size={14} className="text-muted-foreground" />
              Import from Email
            </button>
            <ExportMenu bookings={bookings} date={currentDate} />
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150"
              style={{ fontWeight: 600 }}
            >
              <Plus size={14} />
              Add Booking
            </button>
            <button className="w-9 h-9 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors duration-150">
              <Filter size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <BookingKpiCards
          totalBookings={totalBookings}
          totalPax={totalPax}
          vehicles={vehicleSet.size}
          revenue={totalRevenue}
        />

        <div className="flex-1 px-6 pb-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-muted-foreground">Loading bookings…</span>
              </div>
            ) : (
              <BookingsTable
                bookings={paginated}
                selectedId={selectedBooking?.id ?? null}
                onSelect={setSelectedBooking}
              />
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(page * ITEMS_PER_PAGE, bookings.length)} of{' '}
                  {bookings.length} bookings
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={`page-${p}`} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded border text-xs font-600 transition-colors ${p === page ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                      style={{ fontWeight: 600 }}>{p}</button>
                  ))}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
            {totalPages <= 1 && bookings.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Showing 1 to {bookings.length} of {bookings.length} bookings</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={(b) => { setEditingBooking(b); setShowEditModal(true); }}
          onCancel={handleCancel}
        />
      )}

      {showImportModal && (
        <ImportFromEmailModal
          onClose={() => setShowImportModal(false)}
          defaultDate={currentDate}
          onBookingCreated={(booking) => {
            handleBookingAdded(booking);
            setShowImportModal(false);
          }}
        />
      )}

      {showAddModal && (
        <AddBookingModal
          onClose={() => { setShowAddModal(false); }}
          defaultDate={currentDate}
          onBookingCreated={handleBookingAdded}
        />
      )}

      {showEditModal && editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => { setShowEditModal(false); setEditingBooking(null); }}
          onSave={async (updated) => {
            const result = await bookingService.update(updated);
            if (result) handleBookingUpdated(result);
            else handleBookingUpdated(updated);
          }}
        />
      )}
    </div>
  );
}