'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Bell,
  Users,
  Plug,
  CreditCard,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Edit2,
  UserX,
  UserCheck,
  X,
  Plus,
  RefreshCw,
  ShieldCheck,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import ImportFromEmailModal from '@/app/components/ImportFromEmailModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'company' | 'notifications' | 'users' | 'integrations' | 'billing';

interface CompanyData {
  id: string | null;
  company_name: string;
  tax_id: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  timezone: string;
  default_vehicle: string;
}

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: string;
  last_login: string | null;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'company', label: 'Company Profile', icon: <Building2 size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'users', label: 'Users & Access', icon: <Users size={15} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={15} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
];

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  dispatcher: 'bg-amber-100 text-amber-700',
  viewer: 'bg-gray-100 text-gray-600',
};

// ─── Company Profile Section ──────────────────────────────────────────────────

function CompanySection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CompanyData>({
    id: null,
    company_name: '',
    tax_id: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    currency: 'EUR',
    timezone: 'Europe/Athens',
    default_vehicle: 'MINI VAN',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          setError('Could not load company profile: ' + fetchError.message);
        } else if (data) {
          setForm({
            id: data.id,
            company_name: data.company_name ?? '',
            tax_id: data.tax_id ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
            currency: data.currency ?? 'EUR',
            timezone: data.timezone ?? 'Europe/Athens',
            default_vehicle: data.default_vehicle ?? 'MINI VAN',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof CompanyData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const payload = {
        company_name: form.company_name,
        tax_id: form.tax_id,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        country: form.country,
        currency: form.currency,
        timezone: form.timezone,
        default_vehicle: form.default_vehicle,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error: updateError } = await supabase
          .from('company_settings')
          .update(payload)
          .eq('id', form.id);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('company_settings')
          .insert(payload)
          .select('id')
          .single();
        if (insertError) throw insertError;
        if (inserted) setForm((prev) => ({ ...prev, id: inserted.id }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const inputCls =
    'w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring';
  const labelCls = 'block text-xs font-semibold text-foreground mb-1';

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {/* Business Info */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Business Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Company Name *</label>
            <input
              required
              value={form.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className={inputCls}
              placeholder="TransferOps Kos"
            />
          </div>
          <div>
            <label className={labelCls}>Tax ID / VAT Number</label>
            <input
              value={form.tax_id}
              onChange={(e) => handleChange('tax_id', e.target.value)}
              className={inputCls}
              placeholder="GR-123456789"
            />
          </div>
          <div>
            <label className={labelCls}>Operations Phone *</label>
            <input
              required
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={inputCls}
              placeholder="+30 22420 28000"
            />
          </div>
          <div>
            <label className={labelCls}>Operations Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputCls}
              placeholder="ops@transferops.gr"
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Address</label>
            <input
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={inputCls}
              placeholder="Harbour Road 12"
            />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={inputCls}
              placeholder="Kos"
            />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className={inputCls}
              placeholder="Greece"
            />
          </div>
        </div>
      </div>

      {/* Operational Defaults */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Operational Defaults</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Default Currency</label>
            <select
              value={form.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className={inputCls}
            >
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className={inputCls}
            >
              <option value="Europe/Athens">Europe/Athens (UTC+3)</option>
              <option value="Europe/London">Europe/London (UTC+1)</option>
              <option value="Europe/Berlin">Europe/Berlin (UTC+2)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Default Vehicle Type</label>
            <select
              value={form.default_vehicle}
              onChange={(e) => handleChange('default_vehicle', e.target.value)}
              className={inputCls}
            >
              <option>MINI VAN</option>
              <option>SUV</option>
              <option>SEDAN</option>
              <option>BUS</option>
              <option>MINI BUS</option>
              <option>LIMO</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check size={14} />
            Saved successfully
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

interface UserModalProps {
  user: AppUser | null; // null = new user
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
  const supabase = createClient();
  const isEdit = user !== null;

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'dispatcher');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        // Edit: update user_profiles directly
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ full_name: fullName, role: role, email: email })
          .eq('id', user.id);
        if (updateError) throw updateError;
      } else {
        // Create: sign up new user — trigger will create user_profiles row
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
          },
        });
        if (signUpError) throw signUpError;

        // Also upsert profile in case trigger hasn't fired yet
        if (signUpData?.user) {
          await supabase.from('user_profiles').upsert(
            { id: signUpData.user.id, email, full_name: fullName, role, status: 'ACTIVE' },
            { onConflict: 'id' }
          );
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">
            {isEdit ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Full Name *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Email *</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="user@company.com"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Password * <span className="text-muted-foreground font-normal">(min 6 characters)</span>
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="owner">Owner — Full access</option>
              <option value="manager">Manager — Manage bookings, drivers, vehicles</option>
              <option value="dispatcher">Dispatcher — Create and manage bookings</option>
              <option value="viewer">Viewer — Read-only access</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 disabled:opacity-60 transition-all"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Users & Access Section ───────────────────────────────────────────────────

function UsersSection() {
  const supabase = createClient();
  const { userProfile, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalUser, setModalUser] = useState<AppUser | null | undefined>(undefined); // undefined = closed, null = new
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // If profile hasn't loaded yet or role is owner/manager, allow management
  // (settings page is already auth-protected; null profile = treat as can manage)
  const canManage =
    !userProfile ||
    userProfile.role === 'owner' ||
    userProfile.role === 'manager';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, status, last_login')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setUsers(
        (data ?? []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name || u.email,
          email: u.email,
          role: (u.role as UserRole) || 'dispatcher',
          status: u.status || 'ACTIVE',
          last_login: u.last_login,
        }))
      );
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (u: AppUser) => {
    setTogglingId(u.id);
    setError('');
    try {
      const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', u.id);
      if (updateError) throw updateError;
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update user status.');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (ts: string | null) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Role legend */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={14} className="text-primary" />
          <h4 className="text-xs font-bold text-foreground">Role Permissions</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {[
            { role: 'owner', desc: 'Full access — manage users, billing, all settings' },
            { role: 'manager', desc: 'Manage bookings, drivers, vehicles, and reports' },
            { role: 'dispatcher', desc: 'Create and manage bookings and assignments' },
            { role: 'viewer', desc: 'Read-only access to bookings and reports' },
          ].map((item) => (
            <div key={item.role} className="flex items-start gap-2">
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 capitalize ${ROLE_COLORS[item.role]}`}
              >
                {item.role}
              </span>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Team Members</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {users.length} user{users.length !== 1 ? 's' : ''} with access to TransferOps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} className="text-muted-foreground" />
            </button>
            {canManage && (
              <button
                onClick={() => setModalUser(null)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus size={13} />
                Add User
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={13} className="shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Users size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['USER', 'ROLE', 'LAST LOGIN', 'STATUS', 'ACTIONS'].map((col) => (
                    <th
                      key={col}
                      className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isMe = userProfile?.id === u.id;
                  const initials = u.full_name
                    .split(' ')
                    .map((n) => n[0] ?? '')
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <span className="text-primary text-xs font-bold">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {u.full_name}
                              {isMe && (
                                <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-md capitalize ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {formatDate(u.last_login)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-md ${
                            u.status === 'ACTIVE' ?'bg-green-100 text-green-700' :'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {authLoading ? (
                          <Loader2 size={13} className="animate-spin text-muted-foreground" />
                        ) : canManage ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModalUser(u)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-primary text-xs font-semibold transition-colors"
                            >
                              <Edit2 size={11} />
                              Edit
                            </button>
                            {!isMe && (
                              <button
                                onClick={() => toggleStatus(u)}
                                disabled={togglingId === u.id}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                  u.status === 'ACTIVE' ?'hover:bg-red-50 text-red-500' :'hover:bg-green-50 text-green-600'
                                }`}
                              >
                                {togglingId === u.id ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : u.status === 'ACTIVE' ? (
                                  <UserX size={11} />
                                ) : (
                                  <UserCheck size={11} />
                                )}
                                {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalUser !== undefined && (
        <UserModal
          user={modalUser}
          onClose={() => setModalUser(undefined)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}

// ─── Notifications (static UI) ────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    newBookingEmail: true,
    newBookingSms: false,
    pendingReminder: true,
    driverAssigned: true,
    cancellationAlert: true,
    dailySummary: true,
    weeklySummary: false,
    lowFleetAlert: true,
  });

  type PrefKey = keyof typeof prefs;

  const rows: { key: PrefKey; label: string; desc: string }[] = [
    { key: 'newBookingEmail', label: 'New Booking — Email', desc: 'Receive an email when a new booking is created' },
    { key: 'newBookingSms', label: 'New Booking — SMS', desc: 'Receive an SMS when a new booking is created' },
    { key: 'pendingReminder', label: 'Pending Booking Reminder', desc: 'Alert when a booking is still PENDING 2 hours before pickup' },
    { key: 'driverAssigned', label: 'Driver Assigned Confirmation', desc: 'Notify when a driver is assigned to a booking' },
    { key: 'cancellationAlert', label: 'Cancellation Alert', desc: 'Immediate alert when a booking is cancelled' },
    { key: 'dailySummary', label: 'Daily Operations Summary', desc: 'End-of-day summary email with all completed transfers' },
    { key: 'weeklySummary', label: 'Weekly Revenue Report', desc: 'Weekly email with revenue and booking statistics' },
    { key: 'lowFleetAlert', label: 'Low Fleet Availability Alert', desc: 'Alert when fewer than 2 vehicles are available' },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Notification Preferences</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure which events trigger notifications for your team
          </p>
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{row.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, [row.key]: !p[row.key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  prefs[row.key] ? 'bg-primary' : 'bg-muted'
                }`}
                role="switch"
                aria-checked={prefs[row.key]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    prefs[row.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder sections ─────────────────────────────────────────────────────

function PlaceholderSection({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <div className="bg-card rounded-xl border border-border p-10 shadow-sm text-center">
        <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

// ─── Integrations Section ─────────────────────────────────────────────────────

function IntegrationsSection() {
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Integrations</h2>
        <p className="text-xs text-muted-foreground">Connect and manage external services used by your operations.</p>
      </div>

      {/* Email Import Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail size={17} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Import from Email</p>
            <p className="text-xs text-muted-foreground">Use AI to extract booking details from agency emails</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
            Active
          </span>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Paste any agency booking email and OpenAI will automatically extract the date, time, flight number,
            passenger names, pickup/dropoff locations, vehicle type, price, and more — ready to save as a new booking.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
              <Sparkles size={11} className="text-primary" /> Powered by OpenAI GPT-4.1
            </span>
            <span className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
              <Zap size={11} className="text-amber-500" /> Instant extraction
            </span>
            <span className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
              <ShieldCheck size={11} className="text-green-600" /> Review before saving
            </span>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Mail size={13} />
            Open Email Import
          </button>
        </div>
      </div>

      {/* Placeholder cards for future integrations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Payment Gateway', desc: 'Stripe, PayPal or Viva Wallet', icon: <CreditCard size={16} className="text-muted-foreground" /> },
          { label: 'SMS Notifications', desc: 'Twilio or Vonage for driver/client SMS', icon: <Bell size={16} className="text-muted-foreground" /> },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl border border-dashed border-border p-4 flex items-start gap-3 opacity-60">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Coming soon
              </span>
            </div>
          </div>
        ))}
      </div>

      {showEmailModal && (
        <ImportFromEmailModal
          onClose={() => setShowEmailModal(false)}
          onExtracted={() => setShowEmailModal(false)}
          defaultDate={new Date().toISOString().split('T')[0]}
        />
      )}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company');

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Manage your company profile, team, and preferences" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-border bg-card overflow-y-auto">
          <nav className="p-3 space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-accent text-primary font-semibold' :'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'company' && <CompanySection />}
          {activeTab === 'notifications' && <NotificationsSection />}
          {activeTab === 'users' && <UsersSection />}
          {activeTab === 'integrations' && <IntegrationsSection />}
          {activeTab === 'billing' && (
            <PlaceholderSection
              title="Billing & Subscription"
              desc="Manage your subscription plan, invoices, and payment methods."
            />
          )}
        </main>
      </div>
    </div>
  );
}