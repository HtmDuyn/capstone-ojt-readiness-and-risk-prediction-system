import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { StudentPage } from '@/components/student/PortalUI';
import { RoadmapAdvice } from './StudentAIRisk';

export const StudentFeaturePage = () => {
  const { semesterId } = useStudentPortal();
  return (
    <StudentPage
      title="Tư vấn lộ trình OJT"
      description="Nhận tư vấn AI dựa trên hồ sơ học tập và đợt OJT của bạn."
    >
      <RoadmapAdvice key={semesterId} />
    </StudentPage>
  );
};
export default StudentFeaturePage;
