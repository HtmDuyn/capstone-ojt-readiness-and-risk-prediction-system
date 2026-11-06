import { StudentPage } from '@/components/student/PortalUI';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { useStudentPortal } from '@/contexts/StudentPortalContext';

export default function StudentOjtRisk(){
  const {profile,revision}=useStudentPortal();
  return <StudentPage title="Rủi ro và lộ trình OJT" description="Xem mức rủi ro từ tiến độ học tập, sau đó xác định các môn cần ưu tiên và điều kiện tiên quyết.">
    <OjtRiskPanel key={`${profile?.id??'pending'}:${revision}`} />
  </StudentPage>;
}
