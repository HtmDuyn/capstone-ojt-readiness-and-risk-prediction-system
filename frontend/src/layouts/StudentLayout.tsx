import { Suspense, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/shared/useAuth';
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
  return <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f7f9ff] text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
    <div className="app-background" aria-hidden="true" />
    <Sidebar navItems={STUDENT_NAV_ITEMS} title="FPT University" subtitle="Cổng Sinh viên" homePath="/student/dashboard"
      isOpenMobile={menuOpen} onCloseMobile={() => setMenuOpen(false)} onLogout={handleLogout} />
    <div className="relative z-10 flex min-h-screen flex-1 flex-col transition-all duration-300 lg:pl-[76px] lg:peer-hover:pl-[260px]">
      <StudentHeader user={{
        fullName:profile?.fullName || user?.name || 'Sinh viên', email:profile?.email || user?.email || '',
        code:profile?.studentCode, subtitle:[profile?.studentCode,profile?.currentSemester != null ? `Kỳ ${profile.currentSemester}` : null].filter(Boolean).join(' - ') || 'Sinh viên',
        avatar:user?.avatar || '', department:profile?.program?.majorName,
      }} onOpenMobileMenu={() => setMenuOpen(true)} onLogout={handleLogout}
        showSearch={false} />
      <main className="relative z-10 mx-auto w-full max-w-[1520px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<p role="status" className="py-8 text-center text-sm text-slate-500">Đang tải trang…</p>}>
          <Outlet />
        </Suspense>
        <Footer />
      </main>
    </div>

  </div>;
}

export default function StudentLayout() {
  return <StudentPortalProvider><StudentShell /></StudentPortalProvider>;
}
