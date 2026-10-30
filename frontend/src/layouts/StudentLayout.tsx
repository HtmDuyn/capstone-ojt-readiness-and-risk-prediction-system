import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StudentPortalProvider, useStudentPortal } from '@/contexts/StudentPortalContext';
import { Sidebar } from '@/components/common/Sidebar';
import { Footer } from '@/components/common/Footer';
import { StudentHeader } from '@/components/student/StudentHeader';
import { STUDENT_NAV_ITEMS } from '@/config/menus/studentMenu';

function StudentShell() {
  const { user, logout } = useAuth();
  const portal = useStudentPortal();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  if (portal.mustChangePassword && location.pathname !== '/student/profile') return <Navigate to="/student/profile" replace />;
  const profile = portal.profile;
  const handleLogout = () => { logout(); navigate('/login'); };
  return <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-[#fdfbf7] via-[#fff7ed] to-[#f5f3ff] text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
    <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
      <img src="/login_bg.jpg" alt="" className="h-full w-full scale-105 object-cover object-center opacity-15 blur-[3px]" />
      <div className="absolute left-[-5%] top-[-10%] h-[55vw] w-[55vw] rounded-full bg-orange-400/25 blur-[140px]" />
      <div className="absolute right-[-10%] top-[20%] h-[50vw] w-[50vw] rounded-full bg-purple-400/20 blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[15%] h-[50vw] w-[50vw] rounded-full bg-amber-400/20 blur-[140px]" />
      <div className="absolute bottom-[-5%] right-[-5%] h-[45vw] w-[45vw] rounded-full bg-pink-300/20 blur-[130px]" />
    </div>
    <Sidebar navItems={STUDENT_NAV_ITEMS} title="FPT University" subtitle="Cổng Sinh viên" homePath="/student/dashboard"
      isOpenMobile={menuOpen} onCloseMobile={() => setMenuOpen(false)} onLogout={handleLogout} />
    <div className="relative z-10 flex min-h-screen flex-1 flex-col transition-all duration-300 lg:pl-[76px] lg:peer-hover:pl-[260px]">
      <StudentHeader user={{
        fullName:profile?.fullName || user?.name || 'Sinh viên', email:profile?.email || user?.email || '',
        code:profile?.studentCode, subtitle:[profile?.studentCode,profile?.currentSemester != null ? `Kỳ ${profile.currentSemester}` : null].filter(Boolean).join(' - ') || 'Sinh viên',
        avatar:user?.avatar || '', department:profile?.program?.majorName,
      }} onOpenMobileMenu={() => setMenuOpen(true)} onLogout={handleLogout}
        onOpenNotifications={() => navigate('/student/notifications')} unreadCount={portal.unreadCount ?? undefined} />
      <main className="relative z-10 mx-auto w-full max-w-[1520px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
        <Footer />
      </main>
    </div>
  </div>;
}

export default function StudentLayout() {
  return <StudentPortalProvider><StudentShell /></StudentPortalProvider>;
}
