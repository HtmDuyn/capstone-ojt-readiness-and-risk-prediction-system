import React from 'react';
import { useLocation } from 'react-router-dom';
import type { StudentProfile } from '@/types/student/studentDashboardTypes';
import { getStudentMenuItemById, getStudentMenuItemByPath } from '@/config/menus/studentMenu';
import { useBaseLayout } from '../../layouts/BaseLayout';

export interface BannerAction {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export interface PageBannerProps {
  /** Student profile or user for personalized greeting and data */
  student?: StudentProfile;
  /** Explicit menu key corresponding to sidebar item */
  menuId?: string;
  /** Custom title (supports string or ReactNode). Overrides preset title */
  title?: React.ReactNode;
  /** Custom description. Overrides preset description */
  description?: React.ReactNode;
  /** Optional breadcrumb elements displayed above the title */
  breadcrumb?: React.ReactNode;
  /** Optional badge pill displayed next to the title */
  badge?: React.ReactNode;
  /** Primary action button */
  primaryAction?: BannerAction;
  /** Secondary action button */
  secondaryAction?: BannerAction;
  /** Extra slot placed on the right */
  extra?: React.ReactNode;
  /** Custom children elements inside banner */
  children?: React.ReactNode;
  /** Additional custom CSS class */
  className?: string;

  // Backward compatibility props
  onRegisterOjt?: () => void;
  onViewRoadmap?: () => void;
}

export const PageBanner: React.FC<PageBannerProps> = ({
  student,
  menuId,
  title,
  description,
  breadcrumb,
  badge,
  primaryAction,
  secondaryAction,
  extra,
  children,
  className = '',
  onRegisterOjt,
  onViewRoadmap,
}) => {
  const location = useLocation();
  const { openAIConsult } = useBaseLayout();

  // Determine preset config: from menuId, or automatically deduced from current pathname
  const preset = menuId
    ? getStudentMenuItemById(menuId)
    : getStudentMenuItemByPath(location.pathname) || getStudentMenuItemById('dashboard');

  // Extract student display name
  const displayName = student?.fullName
    ? (student.fullName.trim().split(' ').length > 1
        ? student.fullName.trim().split(' ').slice(-2).join(' ')
        : student.fullName.trim())
    : 'bạn';

  // Resolve Title
  const renderedTitle = title ?? (
    typeof preset?.banner?.title === 'function'
      ? preset.banner.title(displayName)
      : (preset?.banner?.title ?? `Chào mừng bạn trở lại, ${displayName}!`)
  );

  // Resolve Description
  const renderedDescription = description !== undefined ? description : preset?.banner?.description;

  // Resolve Badge
  const renderedBadge = badge !== undefined ? badge : (
    preset?.banner?.badge ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/15 backdrop-blur-xs">
        {preset.banner.badge}
      </span>
    ) : null
  );

  // Resolve Primary Action
  let resolvedPrimary: BannerAction | null = null;
  if (primaryAction) {
    resolvedPrimary = primaryAction;
  } else if (onRegisterOjt) {
    resolvedPrimary = {
      label: 'Đăng ký OJT',
      onClick: onRegisterOjt,
    };
  } else if (preset?.banner?.primaryActionLabel) {
    resolvedPrimary = {
      label: preset.banner.primaryActionLabel,
      onClick: () => {
        if (preset.banner?.defaultAiPrompt && openAIConsult) {
          openAIConsult(preset.banner.defaultAiPrompt);
        }
      },
    };
  }

  // Resolve Secondary Action
  let resolvedSecondary: BannerAction | null = null;
  if (secondaryAction) {
    resolvedSecondary = secondaryAction;
  } else if (onViewRoadmap) {
    resolvedSecondary = {
      label: 'Xem lộ trình',
      onClick: onViewRoadmap,
    };
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1c1917] via-[#2e1065] to-[#1c1917] p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 border border-white/15 backdrop-blur-md transition-all duration-300 ${className}`}
    >
      {/* Decorative background glow accents */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-orange-500/25 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-3xl space-y-3">
          {/* Breadcrumb if provided */}
          {breadcrumb && <div className="mb-2">{breadcrumb}</div>}

          {/* Title & Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight font-outfit text-white flex items-center gap-2">
              {renderedTitle}
            </h1>
            {renderedBadge}
          </div>

          {/* Description */}
          {renderedDescription && (
            <div className="text-xs sm:text-sm text-purple-100 leading-relaxed font-normal">
              {renderedDescription}
            </div>
          )}

          {/* Action Buttons */}
          {(resolvedPrimary || resolvedSecondary) && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {resolvedPrimary && (
                <button
                  type="button"
                  onClick={resolvedPrimary.onClick}
                  className={`btn-login px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 ${resolvedPrimary.className || ''}`}
                >
                  {resolvedPrimary.icon}
                  <span>{resolvedPrimary.label}</span>
                </button>
              )}

              {resolvedSecondary && (
                <button
                  type="button"
                  onClick={resolvedSecondary.onClick}
                  className={`px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold border border-white/15 backdrop-blur-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 ${resolvedSecondary.className || ''}`}
                >
                  {resolvedSecondary.icon}
                  <span>{resolvedSecondary.label}</span>
                </button>
              )}
            </div>
          )}

          {children}
        </div>

        {/* Right side extra slot */}
        {extra && (
          <div className="flex-shrink-0 flex items-center self-start lg:self-center">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

export const WelcomeBanner = PageBanner;
export default PageBanner;
