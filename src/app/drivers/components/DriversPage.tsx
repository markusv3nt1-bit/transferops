'use client';

import React, { useState, useEffect } from 'react';
import { Users, Phone, Star, Edit2, Trash2, Plus, Search, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { driverService, type Driver, type DriverStatus } from '@/lib/services/driverService';

const TABS: { label: string; value: DriverStatus | 'ALL' }[] = [
  { label: 'All Drivers', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'On Trip', value: 'ON TRIP' },
  { label: 'Off Duty', value: 'OFF DUTY' },
];

const emptyForm = (): Omit<Driver, 'id'> => ({
  name: '', phone: '', vehicle: '', plate: '', status: 'AVAILABLE',
  tripsToday: 0, rating: 5.0, license: '', agency: '', joinDate: '',
});

interface DriverModalProps {
  driver: Omit<Driver, 'id'> | null;
  onClose: () => void;
  onSave: (data: Omit<Driver, 'id'>) => void;
  isEdit: boolean;
}

function DriverModal({ driver, onClose, onSave, isEdit }: DriverModalProps) {
  const [form, setForm] = useState<Omit<Driver, 'id'>>(driver ?? emptyForm());

  const set = (field: keyof Omit<Driver, 'id'>, value: string | number) =>
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
            {isEdit ? 'Edit Driver' : 'Add Driver'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Full Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Phone *</label>
              <input required value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Vehicle Type <span className="text-muted-foreground font-400">(optional)</span></label>
              <select value={form.vehicle} onChange={(e) => set('vehicle', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
                <option value="">— No vehicle assigned —</option>
                {['MINI VAN', 'SUV', 'SEDAN', 'BUS'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Plate <span className="text-muted-foreground font-400">(optional)</span></label>
              <input value={form.plate} onChange={(e) => set('plate', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as DriverStatus)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
                <option>AVAILABLE</option>
                <option>ON TRIP</option>
                <option>OFF DUTY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Agency</label>
              <input value={form.agency} onChange={(e) => set('agency', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>License No.</label>
              <input value={form.license} onChange={(e) => set('license', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Join Date</label>
              <input value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)}
                placeholder="e.g. 01 Jan 2024"
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
              {isEdit ? 'Save Changes' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DriverStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  useEffect(() => {
    driverService.getAll().then((data) => {
      setDrivers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = drivers.filter((d) => {
    const matchTab = tab === 'ALL' || d.status === tab;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.plate.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search);
    return matchTab && matchSearch;
  });

  const counts = {
    ALL: drivers.length,
    AVAILABLE: drivers.filter((d) => d.status === 'AVAILABLE').length,
    'ON TRIP': drivers.filter((d) => d.status === 'ON TRIP').length,
    'OFF DUTY': drivers.filter((d) => d.status === 'OFF DUTY').length,
  };

  const handleAdd = async (data: Omit<Driver, 'id'>) => {
    const result = await driverService.create(data);
    if (result) setDrivers((prev) => [result, ...prev]);
    setModalOpen(false);
  };

  const handleEdit = async (data: Omit<Driver, 'id'>) => {
    if (!editingDriver) return;
    const result = await driverService.update(editingDriver.id, data);
    if (result) setDrivers((prev) => prev.map((d) => d.id === editingDriver.id ? result : d));
    setEditingDriver(null);
  };

  const handleDelete = async (id: string) => {
    await driverService.delete(id);
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader icon={<Users size={16} />} title="Drivers">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150" style={{ fontWeight: 600 }}>
          <Plus size={14} />
          Add Driver
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Drivers', value: drivers.length, color: 'text-primary', bg: 'bg-accent' },
            { label: 'Available', value: counts['AVAILABLE'], color: 'text-confirmed', bg: 'bg-confirmed' },
            { label: 'On Trip', value: counts['ON TRIP'], color: 'text-inprogress', bg: 'bg-inprogress' },
            { label: 'Off Duty', value: counts['OFF DUTY'], color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map((s) => (
            <div key={`dstat-${s.label}`} className="bg-card rounded-xl border border-border px-5 py-4 shadow-card">
              <p className="text-xs font-500 text-muted-foreground mb-1" style={{ fontWeight: 500 }}>{s.label}</p>
              <p className={`text-2xl font-700 font-tabular ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={`dtab-${t.value}`}
                onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-600 transition-all duration-150 ${
                  tab === t.value ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontWeight: 600 }}
              >
                {t.label}
                <span className={`ml-1.5 text-[10px] ${tab === t.value ? 'text-primary' : 'text-muted-foreground'}`}>
                  {counts[t.value]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drivers…"
              className="pl-8 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Loading drivers…</span>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border">
                    {['DRIVER', 'PHONE', 'VEHICLE', 'PLATE', 'STATUS', 'TRIPS TODAY', 'RATING', 'AGENCY', 'ACTIONS'].map(
                      (col) => (
                        <th key={`dth-${col}`} className="text-left px-4 py-3 text-[11px] font-600 text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 600 }}>
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <p className="text-sm font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>No drivers found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((driver) => (
                      <tr key={`drow-${driver.id}`} className="border-b border-border hover:bg-muted/40 transition-colors duration-100 group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                              <span className="text-primary text-xs font-bold">
                                {driver.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>{driver.name}</p>
                              <p className="text-[11px] text-muted-foreground">{driver.license}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Phone size={12} className="text-muted-foreground" />
                            {driver.phone}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{driver.vehicle || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-sm font-500 text-foreground font-tabular" style={{ fontWeight: 500 }}>{driver.plate || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3"><StatusBadge status={driver.status} /></td>
                        <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular" style={{ fontWeight: 600 }}>{driver.tripsToday}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span className="text-sm font-600 font-tabular" style={{ fontWeight: 600 }}>{driver.rating}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{driver.agency}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button onClick={() => setEditingDriver(driver)}
                              className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors" title="Edit driver">
                              <Edit2 size={13} className="text-primary" />
                            </button>
                            <button onClick={() => handleDelete(driver.id)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors" title="Remove driver">
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
            <span className="text-xs text-muted-foreground">Showing {filtered.length} of {drivers.length} drivers</span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <DriverModal driver={null} isEdit={false} onClose={() => setModalOpen(false)} onSave={handleAdd} />
      )}
      {editingDriver && (
        <DriverModal
          driver={{ name: editingDriver.name, phone: editingDriver.phone, vehicle: editingDriver.vehicle, plate: editingDriver.plate, status: editingDriver.status, tripsToday: editingDriver.tripsToday, rating: editingDriver.rating, license: editingDriver.license, agency: editingDriver.agency, joinDate: editingDriver.joinDate }}
          isEdit={true}
          onClose={() => setEditingDriver(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}