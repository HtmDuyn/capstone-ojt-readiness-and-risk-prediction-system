import type {
  StudentProfile,
  SemesterProgress,
  RoadmapStep,
  AIRiskScoreData,
  AIRecommendation,
  DeadlineItem,
  RecentActivity,
} from '../../types/student/studentDashboardTypes';

export const mockStudentProfile: StudentProfile = {
  id: 'stu-se150000',
  studentCode: 'SE150000',
  fullName: 'Nguyễn Văn A',
  email: 'anvse150000@fpt.edu.vn',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
  semester: 'Kỳ 7',
  major: 'Kỹ thuật phần mềm (Software Engineering)',
  campus: 'Đại học FPT Cần Thơ',
  gpa: 3.42,
  gpaChange: 0.05,
  earnedCredits: 112,
  totalCredits: 150,
  missingCredits: 38,
  estimatedSemestersRemaining: 2,
  ojtStatus: 'qualified',
  ojtVerifiedBy: 'PĐT',
};

export const mockSemesterProgress: SemesterProgress[] = [
  { id: 'sem-1', semesterName: 'Kỳ 1', credits: 16, gpa: 3.20 },
  { id: 'sem-2', semesterName: 'Kỳ 2', credits: 24, gpa: 3.32 },
  { id: 'sem-3', semesterName: 'Kỳ 3', credits: 28, gpa: 3.41 },
  { id: 'sem-4', semesterName: 'Kỳ 4', credits: 32, gpa: 3.38 },
  { id: 'sem-5', semesterName: 'Kỳ 5', credits: 36, gpa: 3.40 },
  { id: 'sem-6', semesterName: 'Kỳ 6', credits: 42, gpa: 3.42, isCurrent: true },
  { id: 'sem-7', semesterName: 'Kỳ 7 (Dự báo)', credits: 12, gpa: 3.45, isForecast: true },
];

export const mockRoadmapSteps: RoadmapStep[] = [
  {
    id: 1,
    title: 'Đã tích lũy đủ chỉ',
    status: 'completed',
    description: 'Đã tích lũy 112/100 tín chỉ cơ sở bắt buộc',
    iconType: 'check',
  },
  {
    id: 2,
    title: 'Tiếng Anh Level 6',
    status: 'completed',
    description: 'Chứng chỉ IELTS 6.5 / hoàn thành Level 6',
    iconType: 'check',
  },
  {
    id: 3,
    title: 'Đăng ký OJT',
    status: 'current',
    description: 'Đang mở cổng tiếp nhận hồ sơ doanh nghiệp',
    iconType: 'register',
  },
  {
    id: 4,
    title: 'Thực tập OJT',
    status: 'upcoming',
    description: 'Dự kiến bắt đầu học kỳ tới tại doanh nghiệp',
    iconType: 'briefcase',
  },
  {
    id: 5,
    title: 'Xét tốt nghiệp',
    status: 'upcoming',
    description: 'Bảo vệ đồ án Capstone và hoàn tất văn bằng',
    iconType: 'graduation',
  },
];

export const mockAIRiskScore: AIRiskScoreData = {
  score: 72,
  maxScore: 100,
  level: 'medium',
  levelLabel: 'Nguy cơ Trung bình',
  description:
    '“Điểm số được tính toán dựa trên tiến độ học tập và tỉ lệ vắng mặt hiện tại. Bạn cần cải thiện GPA kỳ này để đảm bảo vị trí thực tập tốt nhất.”',
  factors: [
    { label: 'Tiến độ tín chỉ', value: '75%', impact: 'positive' },
    { label: 'Tỉ lệ điểm chuyên cần', value: '92%', impact: 'positive' },
    { label: 'Kỹ năng chuyên môn', value: 'Chưa đủ chứng chỉ', impact: 'negative' },
  ],
};

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-1',
    category: 'skill',
    title: 'Cần bổ sung kỹ năng',
    description:
      'Hoàn thành khóa học React Native trên Coursera để tăng 40% cơ hội tuyển dụng tại FPT Software.',
    actionText: 'Xem khóa học',
  },
  {
    id: 'rec-2',
    category: 'roadmap',
    title: 'Tối ưu lộ trình OJT',
    description:
      'Bạn có thể bắt đầu OJT sớm hơn 1 tháng nếu đăng ký học vượt môn SWE302 vào kỳ hè.',
    actionText: 'Tư vấn chi tiết',
  },
];

export const mockDeadlines: DeadlineItem[] = [
  {
    id: 'dl-1',
    month: 'TH4',
    day: '25',
    badgeColor: 'orange',
    title: 'Hạn chót cập nhật CV OJT',
    subtext: 'Hệ thống sẽ đóng sau 3 ngày',
  },
  {
    id: 'dl-2',
    month: 'TH4',
    day: '28',
    badgeColor: 'blue',
    title: 'Phỏng vấn giả lập (Mockup)',
    subtext: 'Tòa nhà Alpha, Tầng 2',
  },
  {
    id: 'dl-3',
    month: 'TH5',
    day: '02',
    badgeColor: 'slate',
    title: 'Hoàn thành học phí kỳ 8',
    subtext: 'Nộp qua ứng dụng MyFPT',
  },
];

export const mockRecentActivities: RecentActivity[] = [
  {
    id: 'act-1',
    dotColor: 'green',
    title: 'PĐT đã phê duyệt Điều kiện OJT của bạn.',
    timeAgo: '2 giờ trước',
  },
  {
    id: 'act-2',
    dotColor: 'blue',
    title: 'Đăng ký tham gia Webinar: Kỹ năng phỏng vấn IT.',
    timeAgo: 'Hôm qua',
  },
  {
    id: 'act-3',
    dotColor: 'orange',
    title: 'AI Dự báo cập nhật điểm rủi ro mới (72/100).',
    timeAgo: '3 ngày trước',
  },
];
