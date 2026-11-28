import { StudentPage } from '@/components/student/PortalUI';
import { StudentBanner } from '@/components/student/StudentBanner';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentRisk } from '@/hooks/student/useStudentRisk';
import { AlertTriangle, Check } from 'lucide-react';

export default function StudentOjtRisk(){
  const {profile,revision}=useStudentPortal();
  const assessment=useStudentRisk();
  const level=assessment.data?.risk.level;
  const riskLabel=level==='LOW'?'Rủi ro thấp':level==='MEDIUM'?'Rủi ro trung bình':level==='HIGH'?'Rủi ro cao':level==='INSUFFICIENT_DATA'?'Chưa đủ dữ liệu':null;
  const riskBadge=riskLabel&&<>{level==='LOW'?<Check size={38} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 drop-shadow-[0_1px_2px_rgba(16,185,129,0.25)]" aria-hidden="true"/>:<AlertTriangle size={27} strokeWidth={2.1} aria-hidden="true"/>}<span className="sr-only">{riskLabel}</span></>;
  const riskTone=level==='LOW'?'border-emerald-200/70 bg-emerald-400/15 text-emerald-700 shadow-[0_4px_14px_rgba(16,185,129,0.08)]':level==='MEDIUM'?'border-amber-200/70 bg-amber-400/15 text-amber-700 shadow-sm shadow-amber-950/5':level==='HIGH'?'border-rose-200/70 bg-rose-400/15 text-rose-700 shadow-sm shadow-rose-950/5':'border-slate-200/70 bg-slate-400/15 text-slate-700 shadow-sm shadow-slate-950/5';
  const header=<StudentBanner title="Rủi ro và lộ trình OJT" description="Đánh giá mức độ sẵn sàng OJT dựa trên học kỳ đang học và tiến độ tích lũy hiện tại." badge={riskBadge} contentClassName="max-w-none" badgeClassName={`ml-auto inline-flex h-16 w-40 shrink-0 items-center justify-center gap-3 rounded-full border-[0.5px] text-lg font-bold backdrop-blur-sm transition-shadow ${riskTone}`} />;
  return <StudentPage header={header} title="Rủi ro và lộ trình OJT" description="Đánh giá mức độ sẵn sàng OJT dựa trên học kỳ đang học và tiến độ tích lũy hiện tại." needsSemester={false} showSemesterInBanner={false} compactTopSpacing>
    <OjtRiskPanel key={`${profile?.id??'pending'}:${revision}`} assessment={assessment} compactLayout />
  </StudentPage>;
}
