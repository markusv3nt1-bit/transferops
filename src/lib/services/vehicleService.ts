'use client';

import { createClient } from '@/lib/supabase/client';

export type VehicleStatus = 'AVAILABLE' | 'ON TRIP' | 'MAINTENANCE';
export type VehicleType = 'MINI VAN' | 'SUV' | 'SEDAN' | 'BUS' | 'MINI BUS' | 'LIMO';

export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  capacity: number;
  driver: string;
  status: VehicleStatus;
  tripsToday: number;
  year: number;
  color: string;
  lastService: string;
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

function rowToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    plate: row.plate ?? '',
    type: (row.vehicle_type ?? 'MINI VAN') as VehicleType,
    capacity: row.capacity ?? 8,
    driver: row.driver ?? '',
    status: (row.vehicle_status ?? 'AVAILABLE') as VehicleStatus,
    tripsToday: row.trips_today ?? 0,
    year: row.year ?? 2020,
    color: row.color ?? '',
    lastService: row.last_service ?? '',
  };
}

function vehicleToRow(v: Omit<Vehicle, 'id'>) {
  return {
    plate: v.plate,
    vehicle_type: v.type,
    capacity: v.capacity,
    driver: v.driver,
    vehicle_status: v.status,
    trips_today: v.tripsToday,
    year: v.year,
    color: v.color,
    last_service: v.lastService,
  };
}

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('plate', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Vehicle fetch error:', error.message);
        return [];
      }
      return (data ?? []).map(rowToVehicle);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleToRow(vehicle))
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Vehicle create error:', error.message);
        return null;
      }
      return rowToVehicle(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async update(id: string, vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleToRow(vehicle))
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Vehicle update error:', error.message);
        return null;
      }
      return rowToVehicle(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Vehicle delete error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },
};
