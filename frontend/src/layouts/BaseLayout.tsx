import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isEducation = user?.role === 'education';
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
      <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff7ed] to-[#f5f3ff] text-slate-800 flex flex-col antialiased selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
        {/* Nền xung quanh phù hợp với giao diện (theme) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <img
            src="/login_bg.jpg"
            alt="Ambient Wallpaper"
            className="w-full h-full object-cover object-center opacity-15 scale-105 filter blur-[3px]"
          />
          <div className="absolute top-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full bg-orange-400/25 blur-[140px]" />
          <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-400/20 blur-[150px]" />
          <div className="absolute bottom-[-10%] left-[15%] w-[50vw] h-[50vw] rounded-full bg-amber-400/20 blur-[140px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-pink-300/20 blur-[130px]" />
        </div>

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
            showNotifications={!isEducation}
            showLanguage={!isEducation}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
            showSearch={
              brandSubtitle !== "Phòng Đào tạo" &&
              brandSubtitle !== "Quản trị viên"
            }
          />

          {/* Container chính thống nhất qua Dashboard & Modules */}
          <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1520px] mx-auto space-y-6">
            {children || <Outlet />}

            {/* Footer của Dashboard */}
            <Footer />
          </main>
        </div>


      </div>
    </>
  );
};

export default BaseLayout;
