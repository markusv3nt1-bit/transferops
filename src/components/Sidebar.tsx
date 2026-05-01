'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CalendarDays,
  Users,
  Car,
  Building2,
  BarChart2,
  Settings,
  ChevronDown,
  Circle,
  User,
  LogOut,
  Bell,
  Shield,
  MapPin,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';


const navItems = [
  { label: 'Bookings', icon: CalendarDays, href: '/' },
  { label: 'Drivers', icon: Users, href: '/drivers' },
  { label: 'Vehicles', icon: Car, href: '/vehicles' },
  { label: 'Agencies', icon: Building2, href: '/agencies' },
  { label: 'Locations', icon: MapPin, href: '/locations' },
  { label: 'Reports', icon: BarChart2, href: '/reports' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside
      className={`
        flex flex-col h-screen sticky top-0 z-40
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-[152px]'}
        shrink-0
      `}
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-2 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}
      >
        <Image
          src="/assets/images/logo-1_2_-1777568542611.png"
          alt="Transfer Ops Dashboard Logo"
          width={collapsed ? 36 : 140}
          height={36}
          className="object-contain cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        />
      </div>
      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems?.map((item) => {
          const isActive =
            item?.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item?.href);
          const Icon = item?.icon;
          return (
            <Link
              key={`nav-${item?.label?.toLowerCase()}`}
              href={item?.href}
              title={collapsed ? item?.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-150 group relative
                ${
                  isActive
                    ? 'bg-primary text-white' :'text-white/50 hover:bg-white/10 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && (
                <span className="text-sm font-medium">{item?.label}</span>
              )}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                  {item?.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {/* User */}
      <div
        ref={accountRef}
        className={`px-2 py-4 border-t border-white/10 relative ${collapsed ? 'flex justify-center' : ''}`}
      >
        {/* Dropdown Menu */}
        {accountMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 ${collapsed ? 'left-full ml-2 w-48' : 'left-2 right-2'}`}
          >
            <div className="px-3 py-3 border-b border-white/10">
              <p className="text-white text-xs font-semibold">Admin Account</p>
              <p className="text-white/40 text-[10px] mt-0.5">admin@transferops.com</p>
            </div>
            <div className="py-1">
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 text-xs"
                onClick={() => { setAccountMenuOpen(false); router.push('/settings?tab=company'); }}
              >
                <User size={14} />
                <span>My Profile</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 text-xs"
                onClick={() => { setAccountMenuOpen(false); router.push('/settings?tab=notifications'); }}
              >
                <Bell size={14} />
                <span>Notifications</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 text-xs"
                onClick={() => { setAccountMenuOpen(false); router.push('/settings?tab=users'); }}
              >
                <Shield size={14} />
                <span>Security</span>
              </button>
            </div>
            <div className="border-t border-white/10 py-1">
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150 text-xs"
                onClick={async () => {
                  setAccountMenuOpen(false);
                  try {
                    await signOut();
                  } catch {}
                  router.replace('/login');
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        <div
          onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-150 ${collapsed ? 'justify-center' : ''} ${accountMenuOpen ? 'bg-white/10' : ''}`}
          title={collapsed ? 'Account' : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">AA</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-white text-xs font-semibold truncate">
                  Admin
                </span>
                <div className="flex items-center gap-1">
                  <Circle
                    size={6}
                    className="fill-green-400 text-green-400"
                  />
                  <span className="text-white/40 text-[10px]">online</span>
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-white/30 transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}