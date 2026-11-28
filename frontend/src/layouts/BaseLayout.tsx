import React, { Suspense, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/shared/useAuth";
import { EducationSidebar } from "@/components/education/EducationSidebar";
import { Sidebar } from "@/components/common/Sidebar";
import { Header, type HeaderUserSummary } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import type { NavItem } from "@/types/common.types";

export interface BaseLayoutProps {
  navItems: NavItem[];
  homePath?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  userSummary?: HeaderUserSummary;
  children?: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  navItems,
  homePath = "/student/dashboard",
  brandTitle = "FPT University",
  brandSubtitle = "Hệ thống quản lý",
  userSummary,
  children,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isEducation = user?.role === 'education';
  const isEnterprise = user?.role === 'enterprise';
  const isQhdn = user?.role === 'qhdn';
  const isAdmin = user?.role === 'admin' || user?.roleCode === 'ADMIN';
  const hideHeaderTools = user?.role === 'enterprise' || user?.role === 'qhdn';
  const showNotifications = !isEnterprise && user?.roleCode !== 'ADMIN' && user?.role !== 'admin';
  const RoleSidebar = isEducation ? EducationSidebar : Sidebar;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const resolvedUserSummary: HeaderUserSummary = userSummary || {
    fullName: user?.name || (isEducation ? 'Phòng Đào tạo' : 'Người dùng'),
    email: user?.email || '',
    code: user?.role === 'student' ? undefined : user?.id,
    subtitle: user?.role?.toUpperCase(),
    avatar: user?.avatar || '',
  };

  return (
    <>
      <div className="min-h-screen bg-[#f7f9ff] text-slate-800 flex flex-col antialiased selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
        <div className="app-background" aria-hidden="true" />

        {/* Điều hướng Sidebar */}
        <RoleSidebar
          navItems={navItems}
          title={brandTitle}
          subtitle={brandSubtitle}
          homePath={homePath}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
        />

        {/* Khu vực nội dung chính */}
        <div className="relative z-10 lg:pl-[76px] lg:peer-hover:pl-[260px] flex flex-col min-h-screen flex-1 transition-all duration-300">
          {/* Header trên cùng */}
          <Header
            user={resolvedUserSummary}
            profilePath={user?.role === 'admin' ? '/admin/profile' : undefined}
            showNotifications={showNotifications}
            showLanguage={!isAdmin && !isEducation && !hideHeaderTools}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
            showSearch={
              !hideHeaderTools &&
              brandSubtitle !== "Phòng Đào tạo" &&
              brandSubtitle !== "Quản trị viên"
            }
          />

          {/* Container chính thống nhất qua Dashboard & Modules */}
          <main className={`relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1520px] mx-auto space-y-6 ${isEnterprise ? 'enterprise-workspace' : isQhdn ? 'qhdn-workspace' : ''}`}>
            {isEnterprise || isQhdn
              ? <div key={location.pathname} className={isQhdn ? 'qhdn-page-transition' : 'enterprise-page-transition'}>{children || <Suspense fallback={<p role="status" className="py-8 text-center text-sm text-slate-500">Đang tải trang…</p>}><Outlet /></Suspense>}</div>
              : children || <Suspense fallback={<p role="status" className="py-8 text-center text-sm text-slate-500">Đang tải trang…</p>}><Outlet /></Suspense>}

            {/* Footer của Dashboard */}
            <Footer />
          </main>
        </div>


      </div>
    </>
  );
};

export default BaseLayout;
