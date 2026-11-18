import { StudentPage } from '@/components/student/PortalUI';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentRisk } from '@/hooks/useStudentRisk';

export default function StudentOjtRisk(){
  const {profile,revision}=useStudentPortal();
  const assessment=useStudentRisk();
  return <StudentPage title="Rủi ro và lộ trình OJT" description="Xem mức rủi ro từ tiến độ học tập, sau đó xác định các môn cần ưu tiên và điều kiện tiên quyết." showSemesterInBanner={false} compactTopSpacing>
    <OjtRiskPanel key={`${profile?.id??'pending'}:${revision}`} assessment={assessment} showSemesterSelector compactLayout />
  </StudentPage>;
}
