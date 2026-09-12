import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { AIConsultModal } from '../components/dashboard/AIConsultModal';
import { BotSparkleIcon } from '../components/dashboard/icons/DashboardIcons';
import { mockStudentProfile } from '../data/mockStudentData';

interface StudentLayoutContextType {
  openAIConsult: (query?: string) => void;
}

const StudentLayoutContext = createContext<StudentLayoutContextType>({
  openAIConsult: () => { },
});

export const useStudentAIConsult = () => useContext(StudentLayoutContext);

interface StudentLayoutProps {
  children: React.ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [initialAiQuery, setInitialAiQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenAIConsult = (query = '') => {
    setInitialAiQuery(query);
    setAiModalOpen(true);
  };

  return (
    <StudentLayoutContext.Provider value={{ openAIConsult: handleOpenAIConsult }}>
      <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#fff7ed] to-[#f5f3ff] text-slate-800 flex flex-col font-outfit antialiased selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
        {/* Ambient background loang màu Cam - Tím nhạt matching Login page & Dashboard */}
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

        {/* Sidebar Navigation */}
        <Sidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main Content Area (offset by sidebar compact width on desktop) */}
        <div className="lg:pl-[76px] flex flex-col min-h-screen flex-1 transition-all duration-300">
          {/* Top Header */}
          <Header
            student={mockStudentProfile}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />

          {/* Unified Main Container across Dashboard & All Sidebar Modules */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1520px] mx-auto space-y-6">
            {children}

            {/* Dashboard Footer */}
            <DashboardFooter />
          </main>
        </div>

        {/* Floating AI Consultation Button (Bottom Right) */}
        <div className="fixed bottom-6 right-6 z-40">
          <span className="absolute -inset-1 rounded-full bg-orange-500/30 blur-sm animate-pulse pointer-events-none" />
          <button
            type="button"
            onClick={() => handleOpenAIConsult()}
            className="relative group flex items-center gap-2.5 pl-3.5 pr-5 py-3 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/35 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/25 cursor-pointer"
            title="Tư vấn AI ngay"
          >
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs group-hover:rotate-12 transition-transform shadow-inner">
              <BotSparkleIcon size={18} className="text-white" />
            </span>
            <span className="tracking-tight font-outfit">Tư vấn AI ngay</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          </button>
        </div>

        {/* AI Consult Modal */}
        <AIConsultModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          student={mockStudentProfile}
          initialQuery={initialAiQuery}
        />
      </div>
    </StudentLayoutContext.Provider>
  );
};
