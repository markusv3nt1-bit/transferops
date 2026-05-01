'use client';

import { createClient } from '@/lib/supabase/client';
import type { Booking } from '@/app/components/BookingDetailPanel';

function isSchemaError(error: any): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42') return true;
    if (errorClass === '08') return true;
    if (errorClass === '23') return false;
  }
  if (error.message) {
    const patterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
      /type.*does not exist/i,
    ];
    return patterns.some((p) => p.test(error.message));
  }
  return false;
}

function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    date: row.booking_date,
    time: row.booking_time,
    flight: row.flight ?? '',
    pax: row.pax ?? 1,
    customer: row.customer ?? '',
    from: row.from_location ?? '',
    to: row.to_location ?? '',
    vehicle: row.vehicle ?? '',
    driver: row.driver ?? '',
    driverPhone: row.driver_phone ?? '',
    status: row.booking_status as Booking['status'],
    price: Number(row.price ?? 0),
    agency: row.agency ?? '',
    phone: row.phone ?? '',
    notes: row.notes ?? '',
  };
}

function bookingToRow(b: Omit<Booking, 'id'> & { id?: string }) {
  return {
    ...(b.id ? { id: b.id } : {}),
    booking_date: b.date,
    booking_time: b.time,
    flight: b.flight,
    pax: b.pax,
    customer: b.customer,
    from_location: b.from,
    to_location: b.to,
    vehicle: b.vehicle,
    driver: b.driver,
    driver_phone: b.driverPhone,
    booking_status: b.status,
    price: b.price,
    agency: b.agency,
    phone: b.phone,
    notes: b.notes,
  };
}

export const bookingService = {
  async getByDate(date: string): Promise<Booking[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .order('booking_time', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Booking fetch error:', error.message);
        return [];
      }
      return (data ?? []).map(rowToBooking);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async getAllDates(): Promise<string[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date');

      if (error) {
        if (isSchemaError(error)) throw error;
        return [];
      }
      const unique = [...new Set((data ?? []).map((r: any) => r.booking_date))];
      return unique;
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async create(booking: Omit<Booking, 'id'> & { id: string }): Promise<Booking | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingToRow(booking))
        .select()
        .single();

      if (error) {
        console.log('Booking create error:', error.message, error.code, error.details);
        throw new Error(error.message || 'Failed to save booking');
      }
      return rowToBooking(data);
    } catch (err: any) {
      console.log('Booking create exception:', err.message);
      throw err;
    }
  },

  async update(booking: Booking): Promise<Booking | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(bookingToRow(booking))
        .eq('id', booking.id)
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Booking update error:', error.message);
        return null;
      }
      return rowToBooking(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Booking delete error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },
};
