'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, MapPin, X, Check } from 'lucide-react';
import { locationService, Location } from '@/lib/services/locationService';

interface LocationFormData {
  name: string;
  locationType: string;
  notes: string;
}

const LOCATION_TYPES = ['BOTH', 'PICKUP', 'DROPOFF'];

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({ name: '', locationType: 'BOTH', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    setLoading(true);
    setError(null);
    try {
      const data = await locationService.getAll();
      setLocations(data);
    } catch {
      setError('Failed to load locations.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingLocation(null);
    setFormData({ name: '', locationType: 'BOTH', notes: '' });
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(loc: Location) {
    setEditingLocation(loc);
    setFormData({ name: loc.name, locationType: loc.locationType, notes: loc.notes });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingLocation(null);
    setFormError(null);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setFormError('Location name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingLocation) {
        const updated = await locationService.update({ ...editingLocation, ...formData, name: formData.name.trim().toUpperCase() });
        if (updated) {
          setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }
      } else {
        const created = await locationService.create({ ...formData, name: formData.name.trim().toUpperCase() });
        if (created) {
          setLocations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
      closeModal();
    } catch {
      setFormError('Failed to save location. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const ok = await locationService.delete(id);
      if (ok) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      PICKUP: 'bg-blue-100 text-blue-700',
      DROPOFF: 'bg-green-100 text-green-700',
      BOTH: 'bg-purple-100 text-purple-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-700 text-foreground" style={{ fontWeight: 700 }}>Locations</h1>
            <p className="text-xs text-muted-foreground">{locations.length} location{locations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150"
          style={{ fontWeight: 600 }}
        >
          <Plus size={15} />
          Add Location
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchLocations} className="mt-3 text-primary text-sm underline">Retry</button>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <MapPin size={40} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No locations yet. Add your first pickup/dropoff spot.</p>
            <button onClick={openAdd} className="mt-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 transition-colors" style={{ fontWeight: 600 }}>
              Add Location
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={13} className="text-primary shrink-0" />
                    <span className="text-sm font-600 text-foreground truncate" style={{ fontWeight: 600 }}>{loc.name}</span>
                  </div>
                  <span className={`inline-block text-[10px] font-600 px-2 py-0.5 rounded-full ${typeBadge(loc.locationType)}`} style={{ fontWeight: 600 }}>
                    {loc.locationType}
                  </span>
                  {loc.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{loc.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(loc)}
                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    disabled={deletingId === loc.id}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === loc.id ? (
                      <Loader2 size={13} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={13} className="text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-panel w-full max-w-md mx-4" style={{ animation: 'modalIn 150ms ease' }}>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }`}</style>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground" style={{ fontWeight: 700 }}>
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
              <button onClick={closeModal} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X size={15} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div>
                <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Location Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. KGS AIRPORT"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Type</label>
                <select
                  value={formData.locationType}
                  onChange={(e) => setFormData((p) => ({ ...p, locationType: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                >
                  {LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-600 text-foreground mb-1" style={{ fontWeight: 600 }}>Notes (optional)</label>
                <input
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Terminal 2, Gate B"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-600 text-foreground hover:bg-muted transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-600 hover:bg-primary/90 active:scale-95 disabled:opacity-70 transition-all duration-150 flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Check size={14} />{editingLocation ? 'Save Changes' : 'Add Location'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
