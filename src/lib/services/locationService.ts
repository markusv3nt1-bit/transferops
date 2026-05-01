'use client';

import { createClient } from '@/lib/supabase/client';

export interface Location {
  id: string;
  name: string;
  locationType: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

function rowToLocation(row: any): Location {
  return {
    id: row.id,
    name: row.name,
    locationType: row.location_type ?? 'BOTH',
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const locationService = {
  async getAll(): Promise<Location[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Location fetch error:', error.message);
      return [];
    }
    return (data ?? []).map(rowToLocation);
  },

  async create(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('locations')
      .insert({
        name: location.name,
        location_type: location.locationType,
        notes: location.notes,
      })
      .select()
      .single();
    if (error) {
      console.error('Location create error:', error.message);
      return null;
    }
    return rowToLocation(data);
  },

  async update(location: Location): Promise<Location | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('locations')
      .update({
        name: location.name,
        location_type: location.locationType,
        notes: location.notes,
      })
      .eq('id', location.id)
      .select()
      .single();
    if (error) {
      console.error('Location update error:', error.message);
      return null;
    }
    return rowToLocation(data);
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Location delete error:', error.message);
      return false;
    }
    return true;
  },
};
