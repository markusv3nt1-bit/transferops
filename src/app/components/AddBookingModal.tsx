'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ExtractedBookingData } from './ImportFromEmailModal';
import { bookingService } from '@/lib/services/bookingService';
import { driverService, Driver } from '@/lib/services/driverService';
import { agencyService, Agency } from '@/lib/services/agencyService';
import { vehicleService, Vehicle } from '@/lib/services/vehicleService';
import { locationService, Location } from '@/lib/services/locationService';
import type { Booking } from './BookingDetailPanel';

interface AddBookingModalProps {
  onClose: () => void;
  defaultDate: string;
  prefillData?: ExtractedBookingData;
  onBookingCreated?: (booking: Booking) => void;
}

interface BookingFormData {
  date: string;
  time: string;
  flight: string;
  pax: number;
  customer: string;
  from: string;
  to: string;
  vehicle: string;
  driver: string;
  price: number;
  agency: string;
  phone: string;
  notes: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'IN PROGRESS';
}

export default function AddBookingModal({ onClose, defaultDate, prefillData, onBookingCreated }: AddBookingModalProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Controlled state for date and time
  const [selectedDate, setSelectedDate] = useState<string>(prefillData?.date ?? defaultDate ?? '');

  // Parse prefill time if available (e.g. "14:30" → hour=2, minute=30, ampm=PM)
  const parsePrefill = () => {
    if (prefillData?.time) {
      const [hStr, mStr] = prefillData.time.split(':');
      const h24 = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const a: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return { h: h12, m, a };
    }
    return { h: 12, m: 0, a: 'AM' as 'AM' | 'PM' };
  };
  const prefillParsed = parsePrefill();
  const [hour, setHour] = useState<number>(prefillParsed.h);
  const [minute, setMinute] = useState<number>(prefillParsed.m);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(prefillParsed.a);

  const buildTime = (h: number, m: number, a: 'AM' | 'PM') => {
    const h24 = a === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const [selectedTime, setSelectedTime] = useState<string>(
    prefillData?.time ?? buildTime(prefillParsed.h, prefillParsed.m, prefillParsed.a)
  );

  useEffect(() => {
    driverService.getAll()
      .then((data) => setDrivers(data))
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
    agencyService.getAll()
      .then((data) => setAgencies(data))
      .catch(() => setAgencies([]))
      .finally(() => setLoadingAgencies(false));
    vehicleService.getAll()
      .then((data) => setVehicles(data))
      .catch(() => setVehicles([]))
      .finally(() => setLoadingVehicles(false));
    locationService.getAll()
      .then((data) => setLocations(data))
      .catch(() => setLocations([]))
      .finally(() => setLoadingLocations(false));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<BookingFormData>({
    defaultValues: {
      date: prefillData?.date ?? defaultDate,
      time: prefillData?.time ?? '',
      flight: prefillData?.flight ?? '',
      pax: prefillData?.pax ?? undefined,
      customer: prefillData?.customer ?? '',
      from: prefillData?.from ?? '',
      to: prefillData?.to ?? '',
      vehicle: (prefillData?.vehicle as BookingFormData['vehicle']) ?? 'MINI VAN',
      price: prefillData?.price ?? undefined,
      agency: prefillData?.agency ?? 'KGS',
      phone: prefillData?.phone ?? '',
      notes: prefillData?.notes ?? '',
      driver: '',
      status: 'PENDING',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    // Validate controlled fields
    if (!selectedDate) {
      setFormError('date', { message: 'Date is required' });
      return;
    }
    if (!selectedTime) {
      setFormError('time', { message: 'Time is required' });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const id = `B-${Date.now()}`;
      const newBooking: Booking & { id: string } = {
        id,
        date: selectedDate,
        time: selectedTime,
        flight: data.flight,
        pax: Number(data.pax),
        customer: data.customer,
        from: data.from,
        to: data.to,
        vehicle: data.vehicle,
        driver: data.driver,
        driverPhone: '',
        status: data.status,
        price: Number(data.price),
        agency: data.agency,
        phone: data.phone,
        notes: data.notes,
      };
      const result = await bookingService.create(newBooking);
      setSaved(true);
      if (result && onBookingCreated) onBookingCreated(result);
      else if (onBookingCreated) onBookingCreated(newBooking);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError('Failed to save booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (h: number, m: number, a: 'AM' | 'PM') => {
    setHour(h);
    setMinute(m);
    setAmpm(a);
    setSelectedTime(buildTime(h, m, a));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-panel w-full max-w-xl mx-4 flex flex-col max-h-[90vh]" style={{ animation: 'modalIn 150ms ease' }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }`}</style>

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-700 text-foreground" style={{ fontWeight: 700 }}>Add New Booking</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            {/* DATE — calendar picker */}
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              {!selectedDate && <p className="text-red-500 text-xs mt-1 hidden" id="date-err">Date is required</p>}
            </div>

            {/* TIME — hour / minute / AM-PM pickers */}
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Time</label>
              <div className="flex gap-1">
                {/* Hour */}
                <select
                  value={hour}
                  onChange={(e) => handleTimeChange(Number(e.target.value), minute, ampm)}
                  className="flex-1 border border-input rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="flex items-center text-muted-foreground font-bold text-sm">:</span>
                {/* Minute */}
                <select
                  value={minute}
                  onChange={(e) => handleTimeChange(hour, Number(e.target.value), ampm)}
                  className="flex-1 border border-input rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
                {/* AM/PM */}
                <select
                  value={ampm}
                  onChange={(e) => handleTimeChange(hour, minute, e.target.value as 'AM' | 'PM')}
                  className="border border-input rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Flight Number <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input {...register('flight')} placeholder="EW9636"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.flight && <p className="text-red-500 text-xs mt-1">{errors.flight.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>PAX</label>
              <input type="number" {...register('pax', { required: 'PAX count required', min: 1 })} placeholder="1"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.pax && <p className="text-red-500 text-xs mt-1">{errors.pax.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Customer / Name</label>
            <input {...register('customer', { required: 'Customer name is required' })} placeholder="SELVI/ANGGRAENI"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.customer && <p className="text-red-500 text-xs mt-1">{errors.customer.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>From</label>
              <select
                {...register('from', { required: 'Pickup location required' })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                disabled={loadingLocations}
              >
                <option value="">{loadingLocations ? 'Loading locations…' : 'Select pickup'}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
              {errors.from && <p className="text-red-500 text-xs mt-1">{errors.from.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>To</label>
              <select
                {...register('to', { required: 'Dropoff location required' })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                disabled={loadingLocations}
              >
                <option value="">{loadingLocations ? 'Loading locations…' : 'Select dropoff'}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
              {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Vehicle Type</label>
              <select {...register('vehicle')} className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" disabled={loadingVehicles}>
                <option value="">{loadingVehicles ? 'Loading vehicles…' : 'Select a vehicle'}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.type}>{v.plate} — {v.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Driver</label>
              <select {...register('driver')} className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" disabled={loadingDrivers}>
                <option value="">{loadingDrivers ? 'Loading drivers…' : 'Select a driver'}</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Price (€)</label>
              <input type="number" {...register('price', { required: 'Price required', min: 0 })} placeholder="50"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Agency</label>
              <select {...register('agency')} className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" disabled={loadingAgencies}>
                <option value="">{loadingAgencies ? 'Loading agencies…' : 'Select an agency'}</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Status</label>
              <select {...register('status')} className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Customer Phone</label>
              <input {...register('phone')} placeholder="+30 691 000 0000"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Any special requirements…"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2 pb-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-border rounded-lg text-sm font-600 text-foreground hover:bg-muted transition-colors"
              style={{ fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || saved}
              className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 disabled:opacity-70 transition-all duration-150 flex items-center gap-2"
              style={{ fontWeight: 600, minWidth: 140 }}>
              {saving ? (<><Loader2 size={14} className="animate-spin" />Saving…</>) : saved ? '✓ Saved' : 'Add Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}