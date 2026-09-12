import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FptLogoIcon,
  CloseIcon,
  SignOutIcon,
} from './icons/DashboardIcons';
import { STUDENT_NAV_ITEMS } from '../../config/studentMenuConfig';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = React.useState(false);

  // Expanded if mouse is hovering (desktop) or mobile menu is explicitly open
  const isExpanded = isHovered || isOpenMobile;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container with Smooth Expand / Collapse Hover Interaction */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#111827] text-slate-300 shadow-2xl transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpenMobile
            ? 'translate-x-0 w-[260px]'
            : '-translate-x-full lg:translate-x-0'
          } ${isHovered
            ? 'w-[260px] shadow-2xl shadow-black/70 ring-1 ring-white/10'
            : 'lg:w-[76px]'
          }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 h-[73px] overflow-hidden">
          <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center shadow-inner border border-white/10 transition-transform duration-300 hover:scale-105">
              <FptLogoIcon size={28} />
            </div>
            <div
              className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded
                  ? 'opacity-100 max-w-[180px] translate-x-0'
                  : 'opacity-0 max-w-0 -translate-x-4 pointer-events-none'
                }`}
            >
              <div className="text-white font-bold text-base leading-tight tracking-tight font-outfit">
                FPT University
              </div>
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Hệ thống quản lý
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 custom-scrollbar overflow-x-hidden">
          {STUDENT_NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.id === 'dashboard' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/student'));

            return (
              <button
                key={item.id}
                type="button"
                title={!isExpanded ? item.label : undefined}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-left relative overflow-hidden group/item cursor-pointer ${isActive
                    ? 'bg-[#ea580c] text-white shadow-lg shadow-orange-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-200 group-hover/item:scale-110 ${isActive ? 'text-white' : 'text-slate-400'
                    }`}
                >
                  {item.icon}
                </span>

                <span
                  className={`truncate transition-all duration-300 whitespace-nowrap ${isExpanded
                      ? 'opacity-100 max-w-[180px] translate-x-0'
                      : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                    }`}
                >
                  {item.label}
                </span>

                {/* Red notification dot */}
                {item.hasBadge && (
                  <span
                    className={`rounded-full bg-red-500 ring-2 ring-[#111827] animate-pulse transition-all duration-200 ${isExpanded
                        ? 'w-2 h-2 ml-auto relative'
                        : 'w-2 h-2 absolute top-2 right-2'
                      }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-2.5 border-t border-white/10 space-y-2 overflow-hidden">
          {/* Đăng xuất hệ thống Button */}
          <button
            type="button"
            onClick={onLogout}
            title={!isExpanded ? 'Đăng xuất hệ thống' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs sm:text-sm font-semibold transition-all duration-200 group overflow-hidden"
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
              <SignOutIcon size={18} className="text-rose-400" />
            </span>
            <span
              className={`truncate transition-all duration-300 whitespace-nowrap ${isExpanded
                  ? 'opacity-100 max-w-[180px] translate-x-0'
                  : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                }`}
            >
              Đăng xuất hệ thống
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
