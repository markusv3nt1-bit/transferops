'use client';

import { createClient } from '@/lib/supabase/client';

export interface Agency {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  bookingsMonth: number;
  revenueMonth: number;
  commission: number;
  status: 'ACTIVE' | 'INACTIVE';
  since: string;
  country: string;
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

function rowToAgency(row: any): Agency {
  return {
    id: row.id,
    name: row.name ?? '',
    contact: row.contact ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    bookingsMonth: row.bookings_month ?? 0,
    revenueMonth: Number(row.revenue_month ?? 0),
    commission: Number(row.commission ?? 0),
    status: (row.agency_status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    since: row.since ?? '',
    country: row.country ?? '',
  };
}

function agencyToRow(a: Omit<Agency, 'id'>) {
  return {
    name: a.name,
    contact: a.contact,
    phone: a.phone,
    email: a.email,
    bookings_month: a.bookingsMonth,
    revenue_month: a.revenueMonth,
    commission: a.commission,
    agency_status: a.status,
    since: a.since,
    country: a.country,
  };
}

export const agencyService = {
  async getAll(): Promise<Agency[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Agency fetch error:', error.message);
        return [];
      }
      return (data ?? []).map(rowToAgency);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async create(agency: Omit<Agency, 'id'>): Promise<Agency | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('agencies')
        .insert(agencyToRow(agency))
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Agency create error:', error.message);
        return null;
      }
      return rowToAgency(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async update(id: string, agency: Omit<Agency, 'id'>): Promise<Agency | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('agencies')
        .update(agencyToRow(agency))
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Agency update error:', error.message);
        return null;
      }
      return rowToAgency(data);
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('agencies').delete().eq('id', id);
      if (error) {
        if (isSchemaError(error)) throw error;
        console.log('Agency delete error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.log('Schema error:', err.message);
      throw err;
    }
  },
};
