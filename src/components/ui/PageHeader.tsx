'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Calendar, Car, Users } from 'lucide-react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    icon: <Calendar size={14} className="text-primary" />,
    title: 'New booking received',
    desc: 'Booking #BK-2041 from KGS Travel — 3 pax to Kos Airport',
    time: '5 min ago',
    read: false,
  },
  {
    id: 'notif-2',
    icon: <Car size={14} className="text-amber-500" />,
    title: 'Vehicle maintenance due',
    desc: 'KOS-5522 is scheduled for service — mark as available after',
    time: '1 hr ago',
    read: false,
  },
  {
    id: 'notif-3',
    icon: <Users size={14} className="text-green-500" />,
    title: 'Driver assigned',
    desc: 'John Dimitriou assigned to booking #BK-2039',
    time: '2 hrs ago',
    read: true,
  },
];

export default function PageHeader({ icon, title, children }: PageHeaderProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-primary">
          {icon}
        </div>
        <h1 className="text-xl font-700 text-foreground" style={{ fontWeight: 700 }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors duration-150"
          >
            <Bell size={16} className="text-muted-foreground" />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[9px] font-bold pointer-events-none">
              {unreadCount}
            </span>
          )}

          {open && (
            <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${!n.read ? 'bg-accent/30' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-600 text-foreground" style={{ fontWeight: 600 }}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {n.desc}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors mt-0.5"
                      >
                        <X size={11} className="text-muted-foreground" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">AA</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Admin</span>
        </div>
      </div>
    </div>
  );
}