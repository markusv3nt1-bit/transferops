'use client';

import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, Edit2, Trash2, Users, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { vehicleService, type Vehicle, type VehicleStatus, type VehicleType } from '@/lib/services/vehicleService';

const typeColors: Record<VehicleType, string> = {
  'MINI VAN': 'bg-blue-50 text-blue-600',
  SUV: 'bg-purple-50 text-purple-600',
  SEDAN: 'bg-slate-100 text-slate-600',
  BUS: 'bg-amber-50 text-amber-600',
  'MINI BUS': 'bg-green-50 text-green-600',
  LIMO: 'bg-pink-50 text-pink-600',
};

const statusBadgeMap: Record<VehicleStatus, 'AVAILABLE' | 'ON TRIP' | 'CANCELLED'> = {
  AVAILABLE: 'AVAILABLE',
  'ON TRIP': 'ON TRIP',
  MAINTENANCE: 'CANCELLED',
};

const emptyForm = (): Omit<Vehicle, 'id'> => ({
  plate: '', type: 'MINI VAN', capacity: 8, driver: '', status: 'AVAILABLE',
  tripsToday: 0, year: new Date().getFullYear(), color: '', lastService: '',
});

interface VehicleModalProps {
  vehicle: Omit<Vehicle, 'id'> | null;
  onClose: () => void;
  onSave: (data: Omit<Vehicle, 'id'>) => void;
  isEdit: boolean;
}

function VehicleModal({ vehicle, onClose, onSave, isEdit }: VehicleModalProps) {
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(vehicle ?? emptyForm());

  const set = <K extends keyof Omit<Vehicle, 'id'>>(field: K, value: Omit<Vehicle, 'id'>[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl border border-border shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>
            {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Plate *</label>
              <input required value={form.plate} onChange={(e) => set('plate', e.target.value)}
                placeholder="e.g. KOS-1234"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value as VehicleType)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
                {(['MINI VAN', 'SUV', 'SEDAN', 'BUS', 'MINI BUS', 'LIMO'] as VehicleType[]).map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Capacity</label>
              <input type="number" min={1} max={60} value={form.capacity} onChange={(e) => set('capacity', Number(e.target.value))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Driver</label>
              <input value={form.driver} onChange={(e) => set('driver', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as VehicleStatus)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
                <option>AVAILABLE</option>
                <option>ON TRIP</option>
                <option>MAINTENANCE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Year</label>
              <input type="number" min={2000} max={2030} value={form.year} onChange={(e) => set('year', Number(e.target.value))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Color</label>
              <input value={form.color} onChange={(e) => set('color', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Last Service</label>
              <input value={form.lastService} onChange={(e) => set('lastService', e.target.value)}
                placeholder="e.g. 01 Apr 2026"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm font-600 text-foreground hover:bg-muted transition-colors" style={{ fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all" style={{ fontWeight: 600 }}>
              {isEdit ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    vehicleService.getAll().then((data) => {
      setVehicles(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchType = typeFilter === 'ALL' || v.type === typeFilter;
    const matchSearch =
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const types: (VehicleType | 'ALL')[] = ['ALL', 'MINI VAN', 'SUV', 'SEDAN', 'BUS', 'MINI BUS', 'LIMO'];
  const typeCounts: Record<string, number> = {
    ALL: vehicles.length,
    'MINI VAN': vehicles.filter((v) => v.type === 'MINI VAN').length,
    SUV: vehicles.filter((v) => v.type === 'SUV').length,
    SEDAN: vehicles.filter((v) => v.type === 'SEDAN').length,
    BUS: vehicles.filter((v) => v.type === 'BUS').length,
    'MINI BUS': vehicles.filter((v) => v.type === 'MINI BUS').length,
    LIMO: vehicles.filter((v) => v.type === 'LIMO').length,
  };

  const handleAdd = async (data: Omit<Vehicle, 'id'>) => {
    const result = await vehicleService.create(data);
    if (result) setVehicles((prev) => [result, ...prev]);
    setModalOpen(false);
  };

  const handleEdit = async (data: Omit<Vehicle, 'id'>) => {
    if (!editingVehicle) return;
    const result = await vehicleService.update(editingVehicle.id, data);
    if (result) setVehicles((prev) => prev.map((v) => v.id === editingVehicle.id ? result : v));
    setEditingVehicle(null);
  };

  const handleDelete = async (id: string) => {
    await vehicleService.delete(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader icon={<Car size={16} />} title="Vehicles">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150" style={{ fontWeight: 600 }}>
          <Plus size={14} />
          Add Vehicle
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Fleet', value: vehicles.length, sub: 'vehicles registered' },
            { label: 'On Trip', value: vehicles.filter((v) => v.status === 'ON TRIP').length, sub: 'currently active' },
            { label: 'Available', value: vehicles.filter((v) => v.status === 'AVAILABLE').length, sub: 'ready for dispatch' },
            { label: 'Maintenance', value: vehicles.filter((v) => v.status === 'MAINTENANCE').length, sub: 'out of service' },
          ].map((s) => (
            <div key={`vstat-${s.label}`} className="bg-card rounded-xl border border-border px-5 py-4 shadow-card">
              <p className="text-xs font-500 text-muted-foreground mb-1" style={{ fontWeight: 500 }}>{s.label}</p>
              <p className="text-2xl font-700 text-foreground font-tabular" style={{ fontWeight: 700 }}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {types.map((t) => (
              <button
                key={`vtab-${t}`}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-600 transition-all duration-150 ${
                  typeFilter === t ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontWeight: 600 }}
              >
                {t}
                <span className="ml-1.5 text-[10px] text-muted-foreground">{typeCounts[t]}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plate or driver…"
              className="pl-8 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Loading vehicles…</span>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b border-border">
                    {['PLATE', 'TYPE', 'CAPACITY', 'DRIVER', 'STATUS', 'TRIPS TODAY', 'YEAR', 'COLOR', 'LAST SERVICE', 'ACTIONS'].map(
                      (col) => (
                        <th key={`vth-${col}`} className="text-left px-4 py-3 text-[11px] font-600 text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 600 }}>
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <p className="text-sm font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>No vehicles found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((v) => (
                      <tr key={`vrow-${v.id}`} className="border-b border-border hover:bg-muted/40 transition-colors duration-100 group">
                        <td className="px-4 py-3 text-sm font-700 text-foreground font-tabular" style={{ fontWeight: 700 }}>{v.plate}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-600 ${typeColors[v.type]}`} style={{ fontWeight: 600 }}>
                            {v.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Users size={13} className="text-muted-foreground" />
                            {v.capacity}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{v.driver}</td>
                        <td className="px-4 py-3"><StatusBadge status={statusBadgeMap[v.status]} /></td>
                        <td className="px-4 py-3 text-sm font-600 font-tabular text-foreground" style={{ fontWeight: 600 }}>{v.tripsToday}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-tabular">{v.year}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{v.color}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{v.lastService}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button onClick={() => setEditingVehicle(v)}
                              className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors" title="Edit vehicle">
                              <Edit2 size={13} className="text-primary" />
                            </button>
                            <button onClick={() => handleDelete(v.id)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors" title="Remove vehicle">
                              <Trash2 size={13} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Showing {filtered.length} of {vehicles.length} vehicles</span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <VehicleModal vehicle={null} isEdit={false} onClose={() => setModalOpen(false)} onSave={handleAdd} />
      )}
      {editingVehicle && (
        <VehicleModal
          vehicle={{ plate: editingVehicle.plate, type: editingVehicle.type, capacity: editingVehicle.capacity, driver: editingVehicle.driver, status: editingVehicle.status, tripsToday: editingVehicle.tripsToday, year: editingVehicle.year, color: editingVehicle.color, lastService: editingVehicle.lastService }}
          isEdit={true}
          onClose={() => setEditingVehicle(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}