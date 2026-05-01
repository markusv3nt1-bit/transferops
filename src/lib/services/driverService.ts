'use client';

import { createClient } from '@/lib/supabase/client';

export type DriverStatus = 'AVAILABLE' | 'ON TRIP' | 'OFF DUTY';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  status: DriverStatus;
  tripsToday: number;
  rating: number;
  license: string;
  agency: string;
  joinDate: string;
}

function isSchemaError(error: any): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const cls = error.code.substring(0, 2);
    if (cls === '42' || cls === '08') return true;
    if (cls === '23') return false;
  }
  if (error.message) {
    return /relation.*does not exist|column.*does not exist|syntax error|type.*does not exist/i.test(error.message);
  }
  return false;
}

function rowToDriver(row: any): Driver {
  return {
    id: row.id,
    name: row.name ?? '',
    phone: row.phone ?? '',
    vehicle: row.vehicle_type ?? '',
    plate: row.plate ?? '',
    status: (row.driver_status ?? 'AVAILABLE') as DriverStatus,
    tripsToday: row.trips_today ?? 0,
    rating: Number(row.rating ?? 5.0),
    license: row.license ?? '',
    agency: row.agency ?? '',
    joinDate: row.join_date ?? '',
  };
}

function driverToRow(d: Omit<Driver, 'id'>) {
  return {
    name: d.name,
    phone: d.phone,
    vehicle_type: d.vehicle || null,
    plate: d.plate || null,
    driver_status: d.status,
    trips_today: d.tripsToday,
    rating: d.rating,
    license: d.license,
    agency: d.agency,
    join_date: d.joinDate,
  };
}

export const driverService = {
  async getAll(): Promise<Driver[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Driver fetch error:', error.message);
        return [];
      }
      return (data ?? []).map(rowToDriver);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async create(driver: Omit<Driver, 'id'>): Promise<Driver | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driverToRow(driver))
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Driver create error:', error.message);
        return null;
      }
      return rowToDriver(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async update(id: string, driver: Omit<Driver, 'id'>): Promise<Driver | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update(driverToRow(driver))
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Driver update error:', error.message);
        return null;
      }
      return rowToDriver(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Driver delete error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },
};
