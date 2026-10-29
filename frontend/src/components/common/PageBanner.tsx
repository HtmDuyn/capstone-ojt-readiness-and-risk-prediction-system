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
  /** Thông tin sinh viên dùng cho lời chào và nội dung cá nhân hóa. */
  student?: StudentProfile;
  /** ID menu dùng để lấy nội dung banner mặc định. */
  menuId?: string;
  /** Tiêu đề tùy chỉnh, được ưu tiên hơn tiêu đề trong cấu hình menu. */
  title?: React.ReactNode;
  /** Mô tả tùy chỉnh, được ưu tiên hơn mô tả trong cấu hình menu. */
  description?: React.ReactNode;
  /** Nội dung breadcrumb hiển thị phía trên tiêu đề. */
  breadcrumb?: React.ReactNode;
  /** Badge hiển thị cạnh tiêu đề. */
  badge?: React.ReactNode;
  /** Nút hành động chính. */
  primaryAction?: BannerAction;
  /** Nút hành động phụ. */
  secondaryAction?: BannerAction;
  /** Khu vực mở rộng hiển thị bên phải banner. */
  extra?: React.ReactNode;
  /** Nội dung bổ sung bên trong banner. */
  children?: React.ReactNode;
  /** Class CSS bổ sung cho banner. */
  className?: string;

  // Props cũ được giữ lại để tương thích với các màn hình hiện tại.
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

  // Lấy cấu hình theo menuId hoặc tự xác định từ đường dẫn hiện tại.
  const preset = menuId
    ? getStudentMenuItemById(menuId)
    : getStudentMenuItemByPath(location.pathname);
  const presetBanner = preset?.banner;

  // Rút gọn tên hiển thị, ưu tiên hai từ cuối trong họ tên.
  const displayName = student?.fullName
    ? (() => {
        const nameParts = student.fullName.trim().split(/\s+/);
        return nameParts.length > 1 ? nameParts.slice(-2).join(' ') : nameParts[0];
      })()
    : 'bạn';

  // Xác định tiêu đề hiển thị.
  const renderedTitle = title ?? (
    typeof presetBanner?.title === 'function'
      ? presetBanner.title(displayName)
      : (presetBanner?.title ?? `Chào mừng bạn trở lại, ${displayName}!`)
  );

  // Xác định mô tả hiển thị.
  const renderedDescription = description !== undefined ? description : presetBanner?.description;

  // Xác định badge hiển thị.
  const renderedBadge = badge !== undefined ? badge : (
    presetBanner?.badge ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/15 backdrop-blur-xs">
        {presetBanner.badge}
      </span>
    ) : null
  );

  // Xác định hành động chính theo độ ưu tiên: props, tương thích cũ, cấu hình menu.
  let resolvedPrimary: BannerAction | null = null;
  if (primaryAction) {
    resolvedPrimary = primaryAction;
  } else if (onRegisterOjt) {
    resolvedPrimary = {
      label: 'Đăng ký OJT',
      onClick: onRegisterOjt,
    };
  } else if (presetBanner?.primaryActionLabel) {
    resolvedPrimary = {
      label: presetBanner.primaryActionLabel,
      onClick: () => {
        if (presetBanner.defaultAiPrompt) {
          openAIConsult(presetBanner.defaultAiPrompt);
        }
      },
    };
  }

  // Xác định hành động phụ.
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
      {/* Hiệu ứng phát sáng trang trí ở hai góc banner. */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-orange-500/25 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />

      {/* Khối nội dung chính. */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-3xl space-y-3">
          {/* Breadcrumb nếu được truyền vào. */}
          {breadcrumb && <div className="mb-2">{breadcrumb}</div>}

          {/* Tiêu đề và badge. */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight text-white flex items-center gap-2">
              {renderedTitle}
            </h1>
            {renderedBadge}
          </div>

          {/* Mô tả banner. */}
          {renderedDescription && (
            <div className="text-xs sm:text-sm text-purple-100 leading-relaxed font-normal">
              {renderedDescription}
            </div>
          )}

          {/* Các nút hành động. */}
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

        {/* Khu vực mở rộng bên phải. */}
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
