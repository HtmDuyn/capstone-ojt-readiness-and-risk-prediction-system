import { Link, useLocation } from 'react-router-dom';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getAssignment } from '@/services/studentService';
import {
  AssignmentCard,
  Card,
  ResourceState,
  StudentPage,
} from '@/components/student/PortalUI';
import { StudentCvCard } from '@/components/student/StudentCvCard';
import { RoadmapAdvice } from './StudentAIRisk';

export const StudentFeaturePage = () => {
  const location = useLocation();
  const { profile, semesterId, revision, loading } = useStudentPortal();
  const roadmap = location.pathname.includes('roadmap');
  const key =
    !loading && !roadmap && profile && semesterId
      ? profile.id + ':' + semesterId + ':' + revision
      : null;
  const assignment = useStudentResource(key, (signal) =>
    getAssignment(semesterId!, signal),
  );
  return (
    <StudentPage
      needsSemester={roadmap}
      title={roadmap ? 'Tư vấn lộ trình OJT' : 'Hồ sơ thực tập'}
      description={
        roadmap
          ? 'Nhận tư vấn AI dựa trên hồ sơ học tập và đợt OJT của bạn.'
          : 'Quản lý CV và xem thông tin phân công thực tập.'
      }
    >
      {roadmap ? (
        <RoadmapAdvice key={semesterId} />
      ) : (
        <>
          <StudentCvCard />
          <ResourceState
            loading={assignment.loading}
            error={assignment.error}
            retry={assignment.reload}
          />
          {!assignment.loading && !assignment.error && (
            <AssignmentCard assignment={assignment.data} />
          )}
          <Card title="Hồ sơ đăng ký và ứng tuyển">
            <Link
              className="text-orange-600 underline"
              to="/student/ojt-registration"
            >
              Xem hồ sơ, doanh nghiệp và lịch sử ứng tuyển
            </Link>
          </Card>
        </>
      )}
    </StudentPage>
  );
};
export default StudentFeaturePage;
