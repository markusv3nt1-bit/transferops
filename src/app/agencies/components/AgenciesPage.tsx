'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, Phone, Mail, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { agencyService, type Agency } from '@/lib/services/agencyService';

const emptyForm = (): Omit<Agency, 'id'> => ({
  name: '', contact: '', phone: '', email: '', bookingsMonth: 0,
  revenueMonth: 0, commission: 0, status: 'ACTIVE', since: '', country: '',
});

interface AgencyModalProps {
  agency: Omit<Agency, 'id'> | null;
  onClose: () => void;
  onSave: (data: Omit<Agency, 'id'>) => void;
  isEdit: boolean;
}

function AgencyModal({ agency, onClose, onSave, isEdit }: AgencyModalProps) {
  const [form, setForm] = useState<Omit<Agency, 'id'>>(agency ?? emptyForm());

  const set = <K extends keyof Omit<Agency, 'id'>>(field: K, value: Omit<Agency, 'id'>[K]) =>
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
            {isEdit ? 'Edit Agency' : 'Add Agency'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Agency Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Contact Person</label>
              <input value={form.contact} onChange={(e) => set('contact', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Country</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Commission (%)</label>
              <input type="number" min={0} max={100} value={form.commission} onChange={(e) => set('commission', Number(e.target.value))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Since</label>
              <input value={form.since} onChange={(e) => set('since', e.target.value)}
                placeholder="e.g. Jan 2024"
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
              {isEdit ? 'Save Changes' : 'Add Agency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  useEffect(() => {
    agencyService.getAll().then((data) => {
      setAgencies(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = agencies.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.contact.toLowerCase().includes(search.toLowerCase()) ||
      a.country.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRevenue = agencies.reduce((s, a) => s + a.revenueMonth, 0);
  const totalBookings = agencies.reduce((s, a) => s + a.bookingsMonth, 0);

  const handleAdd = async (data: Omit<Agency, 'id'>) => {
    const result = await agencyService.create(data);
    if (result) setAgencies((prev) => [result, ...prev]);
    setModalOpen(false);
  };

  const handleEdit = async (data: Omit<Agency, 'id'>) => {
    if (!editingAgency) return;
    const result = await agencyService.update(editingAgency.id, data);
    if (result) setAgencies((prev) => prev.map((a) => a.id === editingAgency.id ? result : a));
    setEditingAgency(null);
  };

  const handleDelete = async (id: string) => {
    await agencyService.delete(id);
    setAgencies((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader icon={<Building2 size={16} />} title="Agencies">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150" style={{ fontWeight: 600 }}>
          <Plus size={14} />
          Add Agency
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Agencies', value: String(agencies.length), sub: `${agencies.filter((a) => a.status === 'ACTIVE').length} active` },
            { label: 'Bookings This Month', value: String(totalBookings), sub: 'across all agencies' },
            { label: 'Revenue This Month', value: `€${totalRevenue.toLocaleString()}`, sub: 'before commission' },
            { label: 'Avg. Commission', value: `${(agencies.filter(a=>a.commission>0).reduce((s,a)=>s+a.commission,0)/Math.max(1,agencies.filter(a=>a.commission>0).length)).toFixed(1)}%`, sub: 'excluding direct' },
          ].map((s) => (
            <div key={`astat-${s.label}`} className="bg-card rounded-xl border border-border px-5 py-4 shadow-card">
              <p className="text-xs font-500 text-muted-foreground mb-1" style={{ fontWeight: 500 }}>{s.label}</p>
              <p className="text-2xl font-700 text-foreground font-tabular" style={{ fontWeight: 700 }}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
              <button
                key={`atab-${f}`}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-600 transition-all duration-150 ${
                  statusFilter === f ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontWeight: 600 }}
              >
                {f === 'ALL' ? 'All' : f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agencies…"
              className="pl-8 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Loading agencies…</span>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    {['AGENCY', 'CONTACT', 'PHONE / EMAIL', 'BOOKINGS / MO', 'REVENUE / MO', 'COMMISSION', 'COUNTRY', 'SINCE', 'STATUS', 'ACTIONS'].map(
                      (col) => (
                        <th key={`ath-${col}`} className="text-left px-4 py-3 text-[11px] font-600 text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 600 }}>
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
                        <p className="text-sm font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>No agencies found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={`arow-${a.id}`} className="border-b border-border hover:bg-muted/40 transition-colors duration-100 group">
                        <td className="px-4 py-3">
                          <p className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>{a.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{a.contact}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-xs text-foreground">
                              <Phone size={11} className="text-muted-foreground" />
                              {a.phone}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail size={11} className="text-muted-foreground" />
                              {a.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular" style={{ fontWeight: 600 }}>{a.bookingsMonth}</td>
                        <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular" style={{ fontWeight: 600 }}>€{a.revenueMonth.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-600 font-tabular ${a.commission === 0 ? 'text-muted-foreground' : 'text-foreground'}`} style={{ fontWeight: 600 }}>
                            {a.commission === 0 ? '—' : `${a.commission}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{a.country}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{a.since}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button onClick={() => setEditingAgency(a)}
                              className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center transition-colors" title="Edit agency">
                              <Edit2 size={13} className="text-primary" />
                            </button>
                            <button onClick={() => handleDelete(a.id)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors" title="Remove agency">
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
            <span className="text-xs text-muted-foreground">Showing {filtered.length} of {agencies.length} agencies</span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AgencyModal agency={null} isEdit={false} onClose={() => setModalOpen(false)} onSave={handleAdd} />
      )}
      {editingAgency && (
        <AgencyModal
          agency={{ name: editingAgency.name, contact: editingAgency.contact, phone: editingAgency.phone, email: editingAgency.email, bookingsMonth: editingAgency.bookingsMonth, revenueMonth: editingAgency.revenueMonth, commission: editingAgency.commission, status: editingAgency.status, since: editingAgency.since, country: editingAgency.country }}
          isEdit={true}
          onClose={() => setEditingAgency(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}