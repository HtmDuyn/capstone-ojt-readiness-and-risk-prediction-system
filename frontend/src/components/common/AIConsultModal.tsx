import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BotSparkleIcon, CloseIcon } from './icons/AppIcons';

interface AIConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AIConsultModal = ({ isOpen, onClose }: AIConsultModalProps) => {
  const { user } = useAuth();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
      <section role="dialog" aria-modal="true" aria-labelledby="ai-consult-title" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 id="ai-consult-title" className="flex items-center gap-2 text-lg font-bold text-slate-800"><BotSparkleIcon size={22} />Tư vấn OJT</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 hover:bg-slate-100"><CloseIcon size={20} /></button>
        </div>
        <p className="mt-4 text-sm text-slate-600">Hộp thoại này chưa kết nối API tư vấn. Chưa có kết quả phân tích để hiển thị.</p>
        {user?.role === 'student' && <Link to="/student/roadmap-consulting" onClick={onClose} className="mt-5 inline-block font-semibold text-orange-600">Xem tư vấn từ dữ liệu học tập của bạn</Link>}
      </section>
    </div>
  );
};
