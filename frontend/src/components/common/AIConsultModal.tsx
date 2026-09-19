import React, { useState } from 'react';
import {
  BotSparkleIcon,
  CloseIcon,
  LightningIcon,
} from './icons/AppIcons';
import type { StudentProfile } from '@/types/student/studentDashboardTypes';

interface AIConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  initialQuery?: string;
}

export const AIConsultModal: React.FC<AIConsultModalProps> = ({
  isOpen,
  onClose,
  student,
  initialQuery = '',
}) => {
  const [messages, setMessages] = useState<
    { sender: 'ai' | 'user'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: `Xin chào ${student.fullName}! Tôi là AI Trợ lý Cố vấn OJT của FPT University. Dựa trên dữ liệu học tập kỳ 7 của bạn (GPA 3.42, 112/150 tín chỉ), bạn đã đủ điều kiện nộp hồ sơ OJT. Tôi có thể giúp gì cho bạn hôm nay?`,
      time: 'Vừa xong',
    },
  ]);
  const [inputVal, setInputVal] = useState(initialQuery);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: 'Bây giờ',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Tạo câu trả lời AI dựa trên từ khóa trong câu hỏi
    setTimeout(() => {
      let reply =
        'Hệ thống AI đang phân tích dữ liệu thị trường và yêu cầu doanh nghiệp OJT... Bạn có cơ hội đậu cao vào các doanh nghiệp phần mềm như FPT Software, TMA Solutions, KMS Technology!';
      if (query.toLowerCase().includes('react')) {
        reply =
          'Khóa học React Native & Web Development sẽ giúp bạn bổ sung 2 dự án thực tế vào CV, nâng tỷ lệ trúng tuyển OJT từ 65% lên 90%!';
      } else if (query.toLowerCase().includes('rủi ro') || query.toLowerCase().includes('risk')) {
        reply =
          'Điểm rủi ro hiện tại của bạn là 72/100 (mức trung bình). Nguyên nhân chính là bạn còn thiếu chứng chỉ chuyên môn ngoài và một số môn chuyên ngành cuối kỳ 7. Duy trì GPA trên 3.2 để an toàn!';
      } else if (query.toLowerCase().includes('lộ trình') || query.toLowerCase().includes('deadline')) {
        reply =
          'Lộ trình tối ưu: Hoàn tất cập nhật CV trước ngày 25/04, tham gia Mock Interview vào 28/04 để làm quen với quy trình phỏng vấn thực tế!';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: 'Vừa xong',
        },
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 flex flex-col max-h-[85vh] overflow-hidden text-slate-800">
        {/* Phần tiêu đề hộp thoại */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <BotSparkleIcon size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-outfit leading-tight">
                AI Cố vấn Lộ trình OJT
              </h3>
              <p className="text-xs text-orange-100">
                Phân tích dữ liệu học tập thông minh & Cá nhân hóa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-colors cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Các gợi ý nhanh */}
        <div className="p-3 bg-orange-50/50 border-b border-orange-100/60 flex items-center gap-2 overflow-x-auto text-xs custom-scrollbar">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
            <LightningIcon size={12} className="text-amber-500" /> Gợi ý:
          </span>
          <button
            type="button"
            onClick={() => handleSend('Tại sao điểm rủi ro của tôi là 72?')}
            className="px-2.5 py-1 rounded-full bg-white border border-orange-200/80 text-slate-700 hover:border-orange-500 hover:text-orange-600 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
          >
            Giải thích điểm rủi ro 72
          </button>
          <button
            type="button"
            onClick={() => handleSend('Tư vấn kỹ năng còn thiếu')}
            className="px-2.5 py-1 rounded-full bg-white border border-orange-200/80 text-slate-700 hover:border-orange-500 hover:text-orange-600 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
          >
            Kỹ năng cần bổ sung
          </button>
        </div>

        {/* Danh sách hội thoại */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${m.sender === 'user'
                  ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white rounded-br-none shadow-md shadow-orange-500/20 font-medium'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs'
                  }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Ô nhập tin nhắn */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi AI bất kỳ thắc mắc nào về OJT, tín chỉ, CV..."
            className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-100 rounded-full border border-slate-200 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          <button
            type="submit"
            className="btn-login px-5 py-2 rounded-full text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 transition-transform active:scale-95 cursor-pointer"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};
