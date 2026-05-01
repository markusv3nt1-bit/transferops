'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Mail, Loader2, Sparkles, ClipboardPaste, Terminal,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, Save,
} from 'lucide-react';
import { useChat } from '../../lib/hooks/useChat';
import { locationService, Location } from '@/lib/services/locationService';
import { driverService, Driver } from '@/lib/services/driverService';
import { vehicleService, Vehicle } from '@/lib/services/vehicleService';
import { bookingService } from '@/lib/services/bookingService';
import type { Booking } from './BookingDetailPanel';
import toast from 'react-hot-toast';

// ─── Public types ────────────────────────────────────────────────────────────

export interface ExtractedBookingData {
  date?: string;
  time?: string;
  flight?: string;
  pax?: number;
  customer?: string;
  from?: string;
  to?: string;
  vehicle?: string;
  price?: number;
  agency?: string;
  phone?: string;
  notes?: string;
}

interface ImportFromEmailModalProps {
  onClose: () => void;
  /** Called after a booking is successfully saved to Supabase */
  onBookingCreated?: (booking: Booking) => void;
  /** Legacy prop — kept for backward compat but no longer used */
  onExtracted?: (data: ExtractedBookingData) => void;
  defaultDate: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type LogLevel = 'info' | 'success' | 'error' | 'warn' | 'data';
interface LogEntry { id: number; level: LogLevel; message: string; detail?: string; ts: string; }

const levelStyle: Record<LogLevel, { dot: string; text: string; label: string }> = {
  info:    { dot: 'bg-blue-400',   text: 'text-blue-300',   label: 'INFO' },
  success: { dot: 'bg-green-400',  text: 'text-green-300',  label: 'OK' },
  error:   { dot: 'bg-red-400',    text: 'text-red-300',    label: 'ERR' },
  warn:    { dot: 'bg-yellow-400', text: 'text-yellow-300', label: 'WARN' },
  data:    { dot: 'bg-purple-400', text: 'text-purple-300', label: 'DATA' },
};

let _logId = 0;

/** Simple fuzzy-match: returns the best location name or null */
function fuzzyMatch(query: string, locations: Location[]): string | null {
  if (!query || locations.length === 0) return null;
  const q = query.toLowerCase().trim();

  // 1. Exact match
  const exact = locations.find(l => l.name.toLowerCase() === q);
  if (exact) return exact.name;

  // 2. Contains match (query contains location name or vice-versa)
  const contains = locations.find(
    l => q.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(q)
  );
  if (contains) return contains.name;

  // 3. Word-overlap score
  const qWords = q.split(/\s+/).filter(w => w.length > 2);
  let best: Location | null = null;
  let bestScore = 0;
  for (const loc of locations) {
    const lWords = loc.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const overlap = qWords.filter(w => lWords.some(lw => lw.includes(w) || w.includes(lw))).length;
    const score = overlap / Math.max(qWords.length, lWords.length, 1);
    if (score > bestScore) { bestScore = score; best = loc; }
  }
  return bestScore >= 0.4 ? best!.name : null;
}

/** Parse various date strings into YYYY-MM-DD */
function parseDate(raw: string | undefined): string {
  if (!raw) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // DD Mon YYYY  e.g. "27 Oct 2025"
  const months: Record<string,string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  };
  const dMonY = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dMonY) {
    const m = months[dMonY[2].toLowerCase().slice(0,3)];
    if (m) return `${dMonY[3]}-${m}-${dMonY[1].padStart(2,'0')}`;
  }
  // Try native Date parse as last resort
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return '';
}

/** Format YYYY-MM-DD → DD/MM/YYYY for display */
function fmtDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const SYSTEM_PROMPT = `You are a booking data extractor for a transfer/taxi service on Kos island, Greece.
Extract booking information from the provided email text and return ONLY a valid JSON object with these fields:
- date: string (format "DD Mon YYYY", e.g. "27 Oct 2025")
- time: string (format "HH:MM" 24h, e.g. "12:25")
- flight: string (flight number, e.g. "BA2749")
- pax: number (passenger count)
- customer: string (lead passenger full name)
- from: string (pickup location name, as written in the email)
- to: string (dropoff/destination location name, as written in the email)
- vehicle: string (vehicle description as written, e.g. "Private Taxi 4PAX")
- price: number (numeric price only, no currency symbol)
- agency: string (agency name)
- phone: string (phone number with country code)
- notes: string (any special requests or notes)

Rules:
- Return ONLY the JSON object, no markdown, no explanation, no code fences
- If a field cannot be determined, omit it from the JSON
- For date, always include the year; if only day/month given, use the nearest upcoming date`;

// ─── Review row component ─────────────────────────────────────────────────────

type FieldStatus = 'ok' | 'warn' | 'missing';

interface ReviewRowProps {
  label: string;
  value: string | number | undefined;
  status: FieldStatus;
  statusNote?: string;
}

function ReviewRow({ label, value, status, statusNote }: ReviewRowProps) {
  const displayVal = value !== undefined && value !== '' && value !== 0
    ? String(value)
    : '—';

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-4 text-sm text-muted-foreground w-36" style={{ fontWeight: 600 }}>{label}</td>
      <td className="py-2.5 pr-4 text-sm text-foreground">{displayVal}</td>
      <td className="py-2.5 text-right">
        {status === 'ok' && <CheckCircle2 size={16} className="text-green-500 inline" />}
        {status === 'warn' && (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
            <AlertTriangle size={14} />
            {statusNote && <span className="text-muted-foreground">{statusNote}</span>}
          </span>
        )}
        {status === 'missing' && <XCircle size={16} className="text-red-500 inline" />}
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Step = 'paste' | 'review';

export default function ImportFromEmailModal({
  onClose,
  onBookingCreated,
  onExtracted,
  defaultDate,
}: ImportFromEmailModalProps) {
  const [step, setStep] = useState<Step>('paste');
  const [emailText, setEmailText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsOpen, setLogsOpen] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Supabase data
  const [locations, setLocations] = useState<Location[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Resolved booking fields
  const [extracted, setExtracted] = useState<ExtractedBookingData | null>(null);
  const [resolvedFrom, setResolvedFrom] = useState('');
  const [resolvedTo, setResolvedTo] = useState('');
  const [resolvedVehicle, setResolvedVehicle] = useState('');
  const [resolvedDriver, setResolvedDriver] = useState('');
  const [resolvedDate, setResolvedDate] = useState('');

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4.1', false);

  // Load Supabase data on mount
  useEffect(() => {
    locationService.getAll().then(setLocations).catch(() => setLocations([]));
    driverService.getAll().then(setDrivers).catch(() => setDrivers([]));
    vehicleService.getAll().then(setVehicles).catch(() => setVehicles([]));
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (level: LogLevel, message: string, detail?: string) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
    setLogs(prev => [...prev, { id: ++_logId, level, message, detail, ts }]);
  };

  useEffect(() => {
    if (error) {
      addLog('error', 'OpenAI request failed', error.message);
      toast.error('Failed to parse email. Please try again.');
      setIsParsing(false);
    }
  }, [error]);

  useEffect(() => {
    if (response && isParsing) {
      addLog('success', 'Response received', `${response.length} chars`);
      setIsParsing(false);
      try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed: ExtractedBookingData = JSON.parse(cleaned);
        addLog('success', `Parsed — ${Object.keys(parsed).length} field(s)`,
          Object.entries(parsed).map(([k,v]) => `${k}: ${v}`).join(' | '));

        // Resolve fields
        const date = parseDate(parsed.date) || defaultDate;
        addLog(date ? 'success' : 'warn', `Date → ${date || 'not found, using default'}`);

        const from = fuzzyMatch(parsed.from ?? '', locations);
        addLog(from ? 'success' : 'warn', `From fuzzy-match → ${from ?? 'no match'}`);

        const to = fuzzyMatch(parsed.to ?? '', locations);
        addLog(to ? 'success' : 'warn', `To fuzzy-match → ${to ?? 'no match'}`);

        // Vehicle: try to match "Private Taxi" first, then any match, else default
        const vehicleTypes = vehicles.map(v => v.type);
        let vehicle = '';
        if (parsed.vehicle) {
          const vq = parsed.vehicle.toLowerCase();
          // Try exact type match
          const exactV = vehicleTypes.find(t => t.toLowerCase() === vq);
          if (exactV) { vehicle = exactV; }
          else {
            // Try contains
            const containsV = vehicleTypes.find(t => vq.includes(t.toLowerCase()) || t.toLowerCase().includes(vq.split(' ')[0]));
            vehicle = containsV ?? '';
          }
        }
        if (!vehicle) {
          // Default to Private Taxi
          const privateTaxi = vehicleTypes.find(t => t.toLowerCase().includes('private taxi') || t.toLowerCase().includes('taxi'));
          vehicle = privateTaxi ?? (vehicleTypes[0] ?? 'Private Taxi');
          addLog('warn', `Vehicle defaulted to → ${vehicle}`);
        } else {
          addLog('success', `Vehicle matched → ${vehicle}`);
        }

        // Driver: always default to George Patakos
        const george = drivers.find(d => d.name.toLowerCase().includes('george') || d.name.toLowerCase().includes('patakos'));
        const driver = george?.name ?? (drivers[0]?.name ?? 'George Patakos');
        addLog('info', `Driver defaulted to → ${driver}`);

        setExtracted(parsed);
        setResolvedDate(date);
        setResolvedFrom(from ?? '');
        setResolvedTo(to ?? '');
        setResolvedVehicle(vehicle);
        setResolvedDriver(driver);
        setStep('review');

        // Legacy callback
        if (onExtracted) onExtracted(parsed);
      } catch (e: any) {
        addLog('error', 'JSON parse failed', e.message);
        toast.error('Could not parse the extracted data. Please check the email content and try again.');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, isParsing]);

  const handleParse = () => {
    if (!emailText.trim()) { toast.error('Please paste the email content first.'); return; }
    setLogs([]);
    setLogsOpen(true);
    setIsParsing(true);
    addLog('info', `Sending to OpenAI`, `~${emailText.trim().split(/\s+/).length} words`);
    sendMessage([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Extract booking data from this email:\n\n${emailText}` },
    ], { max_completion_tokens: 600 });
    addLog('info', 'Request dispatched — waiting…');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEmailText(text);
      addLog('info', 'Clipboard pasted', `${text.trim().split(/\s+/).length} words`);
    } catch {
      toast.error('Could not access clipboard. Please paste manually.');
    }
  };

  const handleConfirmSave = async () => {
    if (!extracted) return;
    if (!resolvedDate) { toast.error('Date is required.'); return; }
    if (!resolvedFrom) { toast.error('Pickup location could not be matched. Please use Add Booking manually.'); return; }
    if (!resolvedTo) { toast.error('Dropoff location could not be matched. Please use Add Booking manually.'); return; }

    setIsSaving(true);
    try {
      const id = `B-${Date.now()}`;
      const newBooking: Booking & { id: string } = {
        id,
        date: resolvedDate,
        time: extracted.time ?? '00:00',
        flight: extracted.flight ?? '',
        pax: extracted.pax ?? 1,
        customer: extracted.customer ?? '',
        from: resolvedFrom,
        to: resolvedTo,
        vehicle: resolvedVehicle,
        driver: resolvedDriver,
        driverPhone: '',
        status: 'PENDING',
        price: extracted.price ?? 0,
        agency: extracted.agency ?? '',
        phone: extracted.phone ?? '',
        notes: extracted.notes ?? '',
      };
      const result = await bookingService.create(newBooking);
      toast.success('Booking imported and saved!');
      if (onBookingCreated) onBookingCreated(result ?? newBooking);
      onClose();
    } catch (err: any) {
      toast.error('Failed to save booking: ' + (err.message ?? 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Status helpers ──────────────────────────────────────────────────────────

  const dateStatus: FieldStatus = resolvedDate ? 'ok' : 'missing';
  const fromStatus: FieldStatus = resolvedFrom ? 'ok' : 'missing';
  const toStatus: FieldStatus = resolvedTo ? 'ok' : 'missing';
  const vehicleStatus: FieldStatus = resolvedVehicle ? 'warn' : 'missing';
  const driverStatus: FieldStatus = 'warn'; // always defaulted

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-card rounded-2xl shadow-panel w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        style={{ animation: 'modalIn 150ms ease' }}
      >
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base text-foreground" style={{ fontWeight: 700 }}>
                {step === 'paste' ? 'Import from Email' : 'Review Extracted Booking'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 'paste' ? 'AI will extract booking details automatically' : 'Confirm before saving to the system'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* ── STEP 1: Paste ── */}
        {step === 'paste' && (
          <>
            <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-foreground" style={{ fontWeight: 600 }}>Paste Email Content</label>
                  <button type="button" onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                    <ClipboardPaste size={12} />
                    Paste from clipboard
                  </button>
                </div>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={8}
                  placeholder={`Paste the agency email here…\n\nExample:\nDear Transfer Team,\nPlease arrange a transfer for:\nLEAD PASSENGER: Ketan Shah\nMOBILE: +447773777196\nPICK UP DATE & TIME: 27-Oct-2025  12:25\nPICK UP LOCATION: Mitsis Blue Domes Resort\nTO: Kos Airport (KGS)\nTOTAL PASSENGERS: 4\nVEHICLE: Private Taxi (4PAX)\nDEPARTURE FLIGHT: BA2749 15:25`}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background text-foreground placeholder:text-muted-foreground/50"
                  disabled={isLoading || isParsing}
                />
              </div>

              <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  OpenAI will extract all booking fields. From/To will be fuzzy-matched against your locations list. Vehicle defaults to Private Taxi, Driver defaults to George Patakos.
                </p>
              </div>

              {/* Debug Log */}
              <div className="rounded-lg border border-border overflow-hidden">
                <button type="button" onClick={() => setLogsOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Debug Log</span>
                    {logs.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 leading-none" style={{ fontWeight: 700 }}>{logs.length}</span>
                    )}
                    {(isLoading || isParsing) && <Loader2 size={11} className="animate-spin text-primary" />}
                  </div>
                  {logsOpen ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                </button>
                {logsOpen && (
                  <div className="bg-gray-950 px-3 py-2.5 max-h-36 overflow-y-auto font-mono text-xs space-y-1">
                    {logs.length === 0
                      ? <p className="text-gray-500 italic">No activity yet — click "Extract Booking Data" to start.</p>
                      : logs.map(log => {
                          const s = levelStyle[log.level];
                          return (
                            <div key={log.id} className="flex items-start gap-2">
                              <span className="text-gray-600 shrink-0">{log.ts}</span>
                              <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              <span className={`shrink-0 ${s.text} uppercase`} style={{ fontWeight: 700, fontSize: '0.65rem' }}>{s.label}</span>
                              <span className="text-gray-200 break-all">{log.message}</span>
                              {log.detail && <span className="text-gray-500 break-all ml-1">— {log.detail}</span>}
                            </div>
                          );
                        })
                    }
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                style={{ fontWeight: 600 }}>
                Cancel
              </button>
              <button type="button" onClick={handleParse}
                disabled={isLoading || isParsing || !emailText.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 active:scale-95 disabled:opacity-60 transition-all duration-150 flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}>
                {isLoading || isParsing ? (
                  <><Loader2 size={14} className="animate-spin" />Extracting…</>
                ) : (
                  <><Sparkles size={14} />Extract Booking Data</>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Review ── */}
        {step === 'review' && extracted && (
          <>
            <div className="px-6 py-5 overflow-y-auto scrollbar-thin">
              {/* Warning if locations not matched */}
              {(!resolvedFrom || !resolvedTo) && (
                <div className="mb-4 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                    {!resolvedFrom && !resolvedTo
                      ? 'From and To locations could not be matched. Please save manually via Add Booking.'
                      : !resolvedFrom
                      ? `"${extracted.from}" could not be matched to a known location.`
                      : `"${extracted.to}" could not be matched to a known location.`}
                  </p>
                </div>
              )}

              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 700 }}>Field</th>
                    <th className="pb-2 text-left text-xs text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 700 }}>Value</th>
                    <th className="pb-2 text-right text-xs text-muted-foreground uppercase tracking-wide" style={{ fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <ReviewRow label="Date" value={fmtDate(resolvedDate)} status={dateStatus} />
                  <ReviewRow label="Time" value={extracted.time} status={extracted.time ? 'ok' : 'missing'} />
                  <ReviewRow label="Flight Number" value={extracted.flight} status={extracted.flight ? 'ok' : 'missing'} />
                  <ReviewRow label="PAX" value={extracted.pax} status={extracted.pax ? 'ok' : 'missing'} />
                  <ReviewRow label="Customer Name" value={extracted.customer} status={extracted.customer ? 'ok' : 'missing'} />
                  <ReviewRow label="From" value={resolvedFrom || extracted.from} status={fromStatus}
                    statusNote={!resolvedFrom ? 'no match' : undefined} />
                  <ReviewRow label="To" value={resolvedTo || extracted.to} status={toStatus}
                    statusNote={!resolvedTo ? 'no match' : undefined} />
                  <ReviewRow label="Vehicle Type" value={resolvedVehicle} status={vehicleStatus}
                    statusNote="defaulted" />
                  <ReviewRow label="Driver" value={resolvedDriver} status={driverStatus}
                    statusNote="defaulted" />
                  <ReviewRow label="Price" value={extracted.price ? `€${extracted.price}` : undefined} status={extracted.price ? 'ok' : 'missing'} />
                  <ReviewRow label="Agency" value={extracted.agency} status={extracted.agency ? 'ok' : 'missing'} />
                  <ReviewRow label="Status" value="PENDING" status="ok" />
                  <ReviewRow label="Phone" value={extracted.phone} status={extracted.phone ? 'ok' : 'missing'} />
                  <ReviewRow label="Notes" value={extracted.notes} status={extracted.notes ? 'ok' : 'missing'} />
                </tbody>
              </table>

              <p className="mt-4 text-xs text-muted-foreground">
                Fields marked <XCircle size={11} className="inline text-red-500 mx-0.5" /> are empty and can be filled via Edit Booking after saving.
                Fields marked <AlertTriangle size={11} className="inline text-yellow-500 mx-0.5" /> were defaulted automatically.
              </p>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setStep('paste')}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                style={{ fontWeight: 600 }}>
                <ArrowLeft size={14} />
                Back
              </button>
              <button type="button" onClick={handleConfirmSave}
                disabled={isSaving || !resolvedDate || !resolvedFrom || !resolvedTo}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 active:scale-95 disabled:opacity-60 transition-all duration-150 flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}>
                {isSaving ? (
                  <><Loader2 size={14} className="animate-spin" />Saving…</>
                ) : (
                  <><Save size={14} />Confirm & Save Booking</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
