import React from 'react';

export const DashboardFooter: React.FC = () => {
  return (
    <footer className="mt-12 pt-6 pb-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <div>© 2024 FPT University. All rights reserved.</div>
      <div className="flex flex-wrap items-center gap-6">
        <a href="#terms" className="hover:text-slate-800 transition-colors">
          Điều khoản dịch vụ
        </a>
        <a href="#privacy" className="hover:text-slate-800 transition-colors">
          Chính sách bảo mật
        </a>
        <a href="#support" className="hover:text-slate-800 transition-colors">
          Hỗ trợ kỹ thuật
        </a>
      </div>
    </footer>
  );
};
