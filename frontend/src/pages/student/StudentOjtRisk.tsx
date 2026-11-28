import { StudentPage } from '@/components/student/PortalUI';
import { StudentBanner } from '@/components/student/StudentBanner';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentRisk } from '@/hooks/student/useStudentRisk';
import { Check } from 'lucide-react';

export default function StudentOjtRisk(){
  const {profile,revision}=useStudentPortal();
  const assessment=useStudentRisk();
  const level=assessment.data?.risk.level;
  const riskLabel=level==='LOW'?'Rủi ro thấp':level==='MEDIUM'?'Rủi ro trung bình':level==='HIGH'?'Rủi ro cao':level==='INSUFFICIENT_DATA'?'Chưa đủ dữ liệu':null;
  const riskBadge=riskLabel&&<><Check size={34} strokeWidth={3} aria-hidden="true"/><span className="sr-only">{riskLabel}</span></>;
  const riskTone=level==='LOW'?'border-emerald-100 bg-emerald-400/40 text-emerald-50 shadow-[0_0_30px_rgba(52,211,153,0.5)] ring-4 ring-emerald-200/70':level==='MEDIUM'?'border-amber-100 bg-amber-300/20 text-amber-50 shadow-lg ring-2 ring-amber-100/40':level==='HIGH'?'border-rose-100 bg-rose-300/20 text-rose-50 shadow-lg ring-2 ring-rose-100/40':'border-white/40 bg-white/15 text-white shadow-lg ring-2 ring-white/20';
  const header=<StudentBanner title="Rủi ro và lộ trình OJT" description="Đánh giá mức độ sẵn sàng OJT dựa trên học kỳ đang học và tiến độ tích lũy hiện tại." badge={riskBadge} contentClassName="max-w-none" badgeClassName={`ml-auto inline-flex h-16 w-40 shrink-0 items-center justify-center gap-3 rounded-full border-[0.5px] text-lg font-bold backdrop-blur-sm transition-shadow ${riskTone}`} />;
  return <StudentPage header={header} title="Rủi ro và lộ trình OJT" description="Đánh giá mức độ sẵn sàng OJT dựa trên học kỳ đang học và tiến độ tích lũy hiện tại." needsSemester={false} showSemesterInBanner={false} compactTopSpacing>
    <OjtRiskPanel key={`${profile?.id??'pending'}:${revision}`} assessment={assessment} compactLayout />
  </StudentPage>;
}
