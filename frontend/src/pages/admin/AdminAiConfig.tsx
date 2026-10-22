import { Brain, GraduationCap, Clock } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

export default function AdminAiConfig() {
  return <div className="space-y-6">
    <PageBanner title="Tích hợp AI tư vấn" description="Theo dõi khả năng kết nối mô hình AI ngoài cho chức năng tư vấn." badge="Chưa tích hợp" />
    <section className="grid gap-4 md:grid-cols-3">{[{icon:Brain,title:'Mô hình AI ngoài',value:'Chưa có kết nối'},{icon:Clock,title:'Cấu hình mô hình',value:'Chưa có API'},{icon:GraduationCap,title:'Xét điều kiện OJT',value:'Theo quy tắc học vụ'}].map(({icon:Icon,title,value}) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="text-orange-500" size={24} /><p className="mt-4 text-sm text-slate-500">{title}</p><p className="mt-2 text-lg font-bold">{value}</p></div>)}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Cấu hình AI</h2><p className="mt-3 text-sm leading-6 text-slate-600">Chức năng cấu hình mô hình AI ngoài chưa được backend cung cấp. Các API dự đoán rủi ro và lựa chọn mô hình cũ đã được loại bỏ. Khi có API mới, màn hình này sẽ kết nối để đọc và lưu cấu hình.</p><div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Điều kiện OJT được xét bằng quy tắc học vụ: tích lũy từ 70 tín chỉ và không quá 2 môn rớt. Việc xét và bàn giao danh sách được thực hiện ở chức năng học vụ.</div><button disabled className="mt-5 rounded-xl bg-slate-200 px-5 py-2.5 font-semibold text-slate-500">Chưa hỗ trợ lưu cấu hình AI</button></section>
  </div>;
}
