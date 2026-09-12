import React, { useState, useRef, useEffect } from 'react';
import {
  SearchIcon,
  NotificationBellIcon,
  GlobeIcon,
  MenuIcon,
} from '../dashboard/icons/DashboardIcons';

export interface TrainingDepartmentProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  avatar: string;
  department: string;
  position: string;
}

interface TrainingDepartmentHeaderProps {
  staff: TrainingDepartmentProfile;
  onOpenMobileMenu: () => void;
  onLogout?: () => void;
}

export const TrainingDepartmentHeader: React.FC<TrainingDepartmentHeaderProps> = ({
  staff,
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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-xs text-slate-800">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 hover:bg-orange-50 lg:hidden focus:outline-none"
          aria-label="Open menu"
        >
          <MenuIcon size={22} />
        </button>

        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sinh viên, hồ sơ OJT, báo cáo..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white/80 border border-orange-200/80 rounded-full placeholder-slate-400 text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 shadow-2xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-orange-50 transition-colors cursor-pointer"
          title="Thông báo"
        >
          <NotificationBellIcon size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'VI' ? 'EN' : 'VI'))}
          className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-orange-50 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
          title="Đổi ngôn ngữ"
        >
          <GlobeIcon size={18} />
          <span className="hidden sm:inline">{lang}</span>
        </button>

        <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1 sm:px-2 sm:py-1 rounded-full sm:rounded-xl hover:bg-white/60 transition-all text-left cursor-pointer"
          >
            <div className="hidden md:block text-right">
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {staff.fullName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {staff.employeeCode} • {staff.position}
              </div>
            </div>

            <div className="relative">
              <img
                src={staff.avatar}
                alt={staff.fullName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-orange-500/40 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{staff.fullName}</div>
                <div className="text-xs text-slate-500 truncate">{staff.email}</div>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-orange-50 text-[10px] font-semibold text-orange-600 border border-orange-200">
                  {staff.department}
                </div>
              </div>

              <div className="px-2 py-1">
                <div className="px-3 py-2 text-xs text-slate-600">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Mã nhân sự:</span>
                    <span className="font-semibold text-slate-700">{staff.employeeCode}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Vị trí:</span>
                    <span className="font-semibold text-slate-700">{staff.position}</span>
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
