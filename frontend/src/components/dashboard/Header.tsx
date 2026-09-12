import React, { useState, useRef, useEffect } from 'react';
import {
  SearchIcon,
  NotificationBellIcon,
  GlobeIcon,
  MenuIcon,
} from './icons/DashboardIcons';
import type { StudentProfile } from '../../types/studentDashboardTypes';

interface HeaderProps {
  student: StudentProfile;
  onOpenMobileMenu: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  onOpenMobileMenu,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [lang, setLang] = useState<'VI' | 'EN'>('VI');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      {/* Left: Mobile menu toggle + Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open menu"
        >
          <MenuIcon size={22} />
        </button>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu, lộ trình, OJT..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/90 rounded-full placeholder-slate-400 text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Notification, Language, User profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Thông báo"
        >
          <NotificationBellIcon size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* Language selector */}
        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'VI' ? 'EN' : 'VI'))}
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Đổi ngôn ngữ"
        >
          <GlobeIcon size={18} />
          <span className="hidden sm:inline">{lang}</span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Info & Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1 sm:px-2 sm:py-1 rounded-full sm:rounded-xl hover:bg-slate-100 transition-all text-left"
          >
            <div className="hidden md:block text-right">
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {student.fullName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {student.studentCode} - {student.semester}
              </div>
            </div>

            <div className="relative">
              <img
                src={student.avatar}
                alt={student.fullName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-orange-500/30 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{student.fullName}</div>
                <div className="text-xs text-slate-500 truncate">{student.email}</div>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-orange-50 text-[10px] font-semibold text-orange-600 border border-orange-200">
                  {student.major}
                </div>
              </div>

              <div className="px-2 py-1">
                <div className="px-3 py-2 text-xs text-slate-600">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Mã số sinh viên:</span>
                    <span className="font-semibold text-slate-700">{student.studentCode}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Cơ sở:</span>
                    <span className="font-semibold text-slate-700">{student.campus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
