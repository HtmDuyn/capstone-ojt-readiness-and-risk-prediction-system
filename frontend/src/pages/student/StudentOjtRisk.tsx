import { StudentPage } from '@/components/student/PortalUI';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentRisk } from '@/hooks/student/useStudentRisk';

export default function StudentOjtRisk(){
  const {profile,revision}=useStudentPortal();
  const assessment=useStudentRisk();
  return <StudentPage title="Rủi ro và lộ trình OJT" description="Đánh giá mức độ sẵn sàng OJT dựa trên học kỳ đang học và tiến độ tích lũy hiện tại." needsSemester={false} showSemesterInBanner={false} compactTopSpacing>
    <OjtRiskPanel key={`${profile?.id??'pending'}:${revision}`} assessment={assessment} compactLayout />
  </StudentPage>;
}
