'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart2, TrendingUp, TrendingDown, Star, Euro, CalendarDays, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/lib/supabase/client';
import type { RevenueDataPoint } from './RevenueChart';
import type { WeeklyStatusDataPoint } from './BookingsByStatusChart';

const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false });
const BookingsByStatusChart = dynamic(() => import('./BookingsByStatusChart'), { ssr: false });

const RANGE_OPTIONS = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'This month'];

interface DriverPerformanceRow {
  id: string;
  name: string;
  trips: number;
  revenue: number;
  rating: number;
  agency: string;
}

interface KpiData {
  revenue: number;
  bookings: number;
  pax: number;
  cancellationRate: number;
  revDelta: number;
  bookDelta: number;
  paxDelta: number;
  canDelta: number;
}

function getRangeDates(range: string): { from: string; to: string } {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];
  let fromDate: string;

  if (range === 'Last 7 days') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    fromDate = d.toISOString().split('T')[0];
  } else if (range === 'Last 14 days') {
    const d = new Date(now);
    d.setDate(d.getDate() - 13);
    fromDate = d.toISOString().split('T')[0];
  } else if (range === 'Last 30 days') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    fromDate = d.toISOString().split('T')[0];
  } else {
    // This month
    fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  return { from: fromDate, to: toDate };
}

function getPrevRangeDates(range: string): { from: string; to: string } {
  const now = new Date();
  let days: number;

  if (range === 'Last 7 days') {
    days = 7;
  } else if (range === 'Last 14 days') {
    days = 14;
  } else if (range === 'Last 30 days') {
    days = 30;
  } else {
    // This month → previous month same length
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfPrevMonth = new Date(firstOfMonth);
    lastOfPrevMonth.setDate(lastOfPrevMonth.getDate() - 1);
    const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
    return {
      from: firstOfPrevMonth.toISOString().split('T')[0],
      to: lastOfPrevMonth.toISOString().split('T')[0],
    };
  }

  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() - days);
  let fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days + 1);

  return {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0],
  };
}

function calcDeltaPct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

function formatDelta(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export default function ReportsPage() {
  const [range, setRange] = useState('Last 14 days');
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformanceRow[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [statusData, setStatusData] = useState<WeeklyStatusDataPoint[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Fetch KPI data from Supabase
  useEffect(() => {
    async function fetchKpi() {
      setLoadingKpi(true);
      try {
        const supabase = createClient();
        const { from, to } = getRangeDates(range);
        const { from: prevFrom, to: prevTo } = getPrevRangeDates(range);

        // Fetch current period bookings
        const { data: current, error: curErr } = await supabase
          .from('bookings')
          .select('price, pax, booking_status')
          .gte('booking_date', from)
          .lte('booking_date', to);

        if (curErr) {
          console.log('KPI current fetch error:', curErr.message);
          setKpiData(null);
          setLoadingKpi(false);
          return;
        }

        // Fetch previous period bookings
        const { data: previous, error: prevErr } = await supabase
          .from('bookings')
          .select('price, pax, booking_status')
          .gte('booking_date', prevFrom)
          .lte('booking_date', prevTo);

        if (prevErr) {
          console.log('KPI previous fetch error:', prevErr.message);
        }

        const curRows = current ?? [];
        const prevRows = previous ?? [];

        const calcMetrics = (rows: any[]) => {
          const total = rows.length;
          const cancelled = rows.filter((r) => r.booking_status === 'CANCELLED').length;
          const active = rows.filter((r) => r.booking_status !== 'CANCELLED');
          const revenue = active.reduce((sum: number, r: any) => sum + Number(r.price ?? 0), 0);
          const pax = rows.reduce((sum: number, r: any) => sum + Number(r.pax ?? 0), 0);
          const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
          return { revenue, bookings: total, pax, cancellationRate };
        };

        const cur = calcMetrics(curRows);
        const prev = calcMetrics(prevRows);

        setKpiData({
          revenue: cur.revenue,
          bookings: cur.bookings,
          pax: cur.pax,
          cancellationRate: cur.cancellationRate,
          revDelta: calcDeltaPct(cur.revenue, prev.revenue),
          bookDelta: calcDeltaPct(cur.bookings, prev.bookings),
          paxDelta: calcDeltaPct(cur.pax, prev.pax),
          canDelta: cur.cancellationRate - prev.cancellationRate,
        });
      } catch (err: any) {
        console.log('KPI fetch error:', err.message);
        setKpiData(null);
      } finally {
        setLoadingKpi(false);
      }
    }

    fetchKpi();
  }, [range]);

  // Fetch Daily Revenue chart data
  useEffect(() => {
    async function fetchRevenueData() {
      setLoadingRevenue(true);
      try {
        const supabase = createClient();
        const { from, to } = getRangeDates(range);

        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('booking_date, price, booking_status')
          .gte('booking_date', from)
          .lte('booking_date', to)
          .neq('booking_status', 'CANCELLED')
          .order('booking_date', { ascending: true });

        if (error) {
          console.log('Revenue chart fetch error:', error.message);
          setRevenueData([]);
          return;
        }

        // Build a map of date → { revenue, bookings }
        const dayMap: Record<string, { revenue: number; bookings: number }> = {};

        // Enumerate all dates in range
        const start = new Date(from);
        const end = new Date(to);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0];
          dayMap[key] = { revenue: 0, bookings: 0 };
        }

        (bookings ?? []).forEach((b: any) => {
          const key = b.booking_date;
          if (dayMap[key]) {
            dayMap[key].revenue += Number(b.price ?? 0);
            dayMap[key].bookings += 1;
          }
        });

        const points: RevenueDataPoint[] = Object.entries(dayMap).map(([dateStr, vals]) => {
          const d = new Date(dateStr);
          const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          return { date: label, revenue: vals.revenue, bookings: vals.bookings };
        });

        setRevenueData(points);
      } catch (err: any) {
        console.log('Revenue chart error:', err.message);
        setRevenueData([]);
      } finally {
        setLoadingRevenue(false);
      }
    }
    fetchRevenueData();
  }, [range]);

  // Fetch Bookings by Status (weekly) chart data
  useEffect(() => {
    async function fetchStatusData() {
      setLoadingStatus(true);
      try {
        const supabase = createClient();
        const { from, to } = getRangeDates(range);

        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('booking_date, booking_status')
          .gte('booking_date', from)
          .lte('booking_date', to)
          .order('booking_date', { ascending: true });

        if (error) {
          console.log('Status chart fetch error:', error.message);
          setStatusData([]);
          return;
        }

        // Group by ISO week number
        const weekMap: Record<string, { confirmed: number; pending: number; cancelled: number }> = {};

        (bookings ?? []).forEach((b: any) => {
          const d = new Date(b.booking_date);
          // ISO week: get Monday of the week
          const day = d.getDay() === 0 ? 7 : d.getDay();
          const monday = new Date(d);
          monday.setDate(d.getDate() - day + 1);
          const weekKey = monday.toISOString().split('T')[0];

          if (!weekMap[weekKey]) {
            weekMap[weekKey] = { confirmed: 0, pending: 0, cancelled: 0 };
          }

          const status = (b.booking_status ?? '').toUpperCase();
          if (status === 'CONFIRMED') weekMap[weekKey].confirmed += 1;
          else if (status === 'PENDING') weekMap[weekKey].pending += 1;
          else if (status === 'CANCELLED') weekMap[weekKey].cancelled += 1;
        });

        const points: WeeklyStatusDataPoint[] = Object.entries(weekMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mondayStr, vals]) => {
            const d = new Date(mondayStr);
            // Calculate ISO week number
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            return { week: `Week ${weekNum}`, ...vals };
          });

        setStatusData(points);
      } catch (err: any) {
        console.log('Status chart error:', err.message);
        setStatusData([]);
      } finally {
        setLoadingStatus(false);
      }
    }
    fetchStatusData();
  }, [range]);

  useEffect(() => {
    async function fetchDriverPerformance() {
      setLoadingDrivers(true);
      try {
        const supabase = createClient();
        const { from, to } = getRangeDates(range);

        // Fetch all drivers
        const { data: drivers, error: driversError } = await supabase
          .from('drivers')
          .select('id, name, rating, agency');

        if (driversError) {
          console.log('Driver fetch error:', driversError.message);
          setDriverPerformance([]);
          setLoadingDrivers(false);
          return;
        }

        // Fetch bookings in the date range (exclude cancelled)
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('driver, price, booking_date, booking_status')
          .gte('booking_date', from)
          .lte('booking_date', to)
          .neq('booking_status', 'CANCELLED');

        if (bookingsError) {
          console.log('Bookings fetch error:', bookingsError.message);
          setDriverPerformance([]);
          setLoadingDrivers(false);
          return;
        }

        // Aggregate trips and revenue per driver name
        const aggregated: Record<string, { trips: number; revenue: number }> = {};
        (bookings ?? []).forEach((b: any) => {
          const driverName = (b.driver ?? '').trim();
          if (!driverName) return;
          if (!aggregated[driverName]) {
            aggregated[driverName] = { trips: 0, revenue: 0 };
          }
          aggregated[driverName].trips += 1;
          aggregated[driverName].revenue += Number(b.price ?? 0);
        });

        // Build performance rows from drivers list
        const rows: DriverPerformanceRow[] = (drivers ?? [])
          .map((d: any) => ({
            id: d.id,
            name: d.name ?? '',
            trips: aggregated[d.name]?.trips ?? 0,
            revenue: aggregated[d.name]?.revenue ?? 0,
            rating: Number(d.rating ?? 5.0),
            agency: d.agency ?? '',
          }))
          .filter((d) => d.trips > 0)
          .sort((a, b) => b.trips - a.trips);

        setDriverPerformance(rows);
      } catch (err: any) {
        console.log('Driver performance error:', err.message);
        setDriverPerformance([]);
      } finally {
        setLoadingDrivers(false);
      }
    }

    fetchDriverPerformance();
  }, [range]);

  const kpiCards = kpiData
    ? [
        {
          label: 'Revenue',
          value: `€${kpiData.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          delta: formatDelta(kpiData.revDelta),
          up: kpiData.revDelta >= 0,
          icon: <Euro size={18} className="text-primary" />,
          bg: 'bg-accent',
        },
        {
          label: 'Total Bookings',
          value: String(kpiData.bookings),
          delta: formatDelta(kpiData.bookDelta),
          up: kpiData.bookDelta >= 0,
          icon: <CalendarDays size={18} className="text-emerald-500" />,
          bg: 'bg-emerald-50',
        },
        {
          label: 'Total PAX',
          value: String(kpiData.pax),
          delta: formatDelta(kpiData.paxDelta),
          up: kpiData.paxDelta >= 0,
          icon: <Users size={18} className="text-purple-500" />,
          bg: 'bg-purple-50',
        },
        {
          label: 'Cancellation Rate',
          value: `${kpiData.cancellationRate.toFixed(1)}%`,
          delta: kpiData.canDelta === 0 ? '0.0%' : `${kpiData.canDelta >= 0 ? '+' : ''}${kpiData.canDelta.toFixed(1)}%`,
          up: kpiData.canDelta <= 0,
          icon: <BarChart2 size={18} className="text-red-500" />,
          bg: 'bg-red-50',
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader icon={<BarChart2 size={16} />} title="Reports">
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS?.map((r) => (
            <button
              key={`range-${r}`}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-all duration-150 border ${
                range === r
                  ? 'bg-primary text-white border-primary' :'border-border text-muted-foreground hover:bg-muted'
              }`}
              style={{ fontWeight: 600 }}
            >
              {r}
            </button>
          ))}
        </div>
      </PageHeader>
      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          {loadingKpi ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`kpi-skel-${i}`} className="bg-card rounded-xl border border-border px-5 py-4 shadow-card animate-pulse">
                <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                <div className="h-7 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))
          ) : kpiCards.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`kpi-empty-${i}`} className="bg-card rounded-xl border border-border px-5 py-4 shadow-card">
                <p className="text-xs text-muted-foreground">No data</p>
              </div>
            ))
          ) : (
            kpiCards.map((k) => (
              <div key={`rk-${k.label}`} className="bg-card rounded-xl border border-border px-5 py-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-500 text-muted-foreground" style={{ fontWeight: 500 }}>{k.label}</p>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.bg}`}>{k.icon}</div>
                </div>
                <p className="text-2xl font-700 text-foreground font-tabular" style={{ fontWeight: 700 }}>{k.value}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs font-500 ${k.up ? 'text-confirmed' : 'text-cancelled'}`} style={{ fontWeight: 500 }}>
                  {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {k.delta} vs last period
                </div>
              </div>
            ))
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>Daily Revenue</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{range} — EUR</p>
              </div>
              <span className="text-xs font-500 text-muted-foreground bg-muted px-2 py-1 rounded-md" style={{ fontWeight: 500 }}>
                Updated just now
              </span>
            </div>
            <RevenueChart range={range} data={revenueData} loading={loadingRevenue} />
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>Bookings by Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Weekly breakdown — confirmed vs pending vs cancelled</p>
              </div>
            </div>
            <BookingsByStatusChart range={range} data={statusData} loading={loadingStatus} />
          </div>
        </div>

        {/* Driver Performance */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>Driver Performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ranked by trips completed — {range}</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            {loadingDrivers ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading driver data…</span>
              </div>
            ) : driverPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No driver trips recorded for this period</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['RANK', 'DRIVER', 'TRIPS', 'REVENUE', 'RATING', 'AGENCY']?.map((col) => (
                      <th key={`rpth-${col}`} className="text-left px-4 py-3 text-[11px] font-600 text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 600 }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.map((d, i) => (
                    <tr key={`dprow-${d.id}`} className="border-b border-border hover:bg-muted/40 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-700 ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-50 text-orange-500' : 'bg-muted text-muted-foreground'}`} style={{ fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>{d.name}</td>
                      <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular" style={{ fontWeight: 600 }}>{d.trips}</td>
                      <td className="px-4 py-3 text-sm font-600 text-foreground font-tabular" style={{ fontWeight: 600 }}>€{d.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-sm font-600 font-tabular" style={{ fontWeight: 600 }}>{d.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.agency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}