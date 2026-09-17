import React from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  X,
  Layers3,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  prerequisite: string;
}

interface Curriculum {
  code: string;
  name: string;
  totalSubjects: number;
  totalCredits: number;
  subjects: CurriculumSubject[];
}

/* =========================================================
   KHUNG BIT_IS_K18D_19A
========================================================= */

const K18D_19A_SUBJECTS: CurriculumSubject[] = [
  // KỲ 0
  {
    id: 'K18D-OTP101',
    code: 'OTP101',
    name: 'Orientation and General Training Program / Định hướng và Rèn luyện tập trung',
    semester: 0,
    credits: 0,
    prerequisite: 'None',
  },
  {
    id: 'K18D-PEN',
    code: 'PEN',
    name: 'Preparation English / Tiếng Anh chuẩn bị',
    semester: 0,
    credits: 0,
    prerequisite: '',
  },
  {
    id: 'K18D-PHE1',
    code: 'PHE_COM*1',
    name: 'Physical Education 1 / Giáo dục thể chất 1',
    semester: 0,
    credits: 2,
    prerequisite: '',
  },
  {
    id: 'K18D-TMI',
    code: 'TMI_ELE',
    name: 'Traditional musical instrument / Nhạc cụ truyền thống',
    semester: 0,
    credits: 3,
    prerequisite: '',
  },

  // KỲ 1
  {
    id: 'K18D-CEA201',
    code: 'CEA201',
    name: 'Computer Organization and Architecture / Tổ chức và Kiến trúc máy tính',
    semester: 1,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-CSI106',
    code: 'CSI106',
    name: 'Introduction to Computer Science / Nhập môn khoa học máy tính',
    semester: 1,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-MAE101',
    code: 'MAE101',
    name: 'Mathematics for Engineering / Toán cho ngành kỹ thuật',
    semester: 1,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18D-PHE2',
    code: 'PHE_COM*2',
    name: 'Physical Education 2 / Giáo dục thể chất 2',
    semester: 1,
    credits: 2,
    prerequisite: '',
  },
  {
    id: 'K18D-PRF192',
    code: 'PRF192',
    name: 'Programming Fundamentals / Cơ sở lập trình',
    semester: 1,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18D-SSL101c',
    code: 'SSL101c',
    name: 'Academic Skills for University Success / Kỹ năng học tập đại học',
    semester: 1,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 2
  {
    id: 'K18D-MAD101',
    code: 'MAD101',
    name: 'Discrete Mathematics / Toán rời rạc',
    semester: 2,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18D-NWC204',
    code: 'NWC204',
    name: 'Computer Networking / Mạng máy tính',
    semester: 2,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-OSG202',
    code: 'OSG202',
    name: 'Operating Systems / Hệ điều hành',
    semester: 2,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-PHE3',
    code: 'PHE_COM*3',
    name: 'Physical Education 3 / Giáo dục thể chất 3',
    semester: 2,
    credits: 2,
    prerequisite: '',
  },
  {
    id: 'K18D-PRO192',
    code: 'PRO192',
    name: 'Object-Oriented Programming / Lập trình hướng đối tượng',
    semester: 2,
    credits: 3,
    prerequisite: 'Pass PRF192',
  },
  {
    id: 'K18D-SSG104',
    code: 'SSG104',
    name: 'Communication and In-Group Working Skills / Kỹ năng giao tiếp và cộng tác',
    semester: 2,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 3
  {
    id: 'K18D-CSD201',
    code: 'CSD201',
    name: 'Data Structures and Algorithms / Cấu trúc dữ liệu và giải thuật',
    semester: 3,
    credits: 3,
    prerequisite: 'PRO192',
  },
  {
    id: 'K18D-DBI202',
    code: 'DBI202',
    name: 'Introduction to Databases / Các hệ cơ sở dữ liệu',
    semester: 3,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-ITA203c',
    code: 'ITA203c',
    name: 'Information System Overview / Nhập môn hệ thống thông tin',
    semester: 3,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18D-JPD113',
    code: 'JPD113',
    name: 'Elementary Japanese 1 - A1.1 / Tiếng Nhật sơ cấp 1-A1.1',
    semester: 3,
    credits: 3,
    prerequisite: 'Không',
  },
  {
    id: 'K18D-LAB211',
    code: 'LAB211',
    name: 'OOP with Java Lab / Thực hành OOP với Java',
    semester: 3,
    credits: 3,
    prerequisite: 'PRO192',
  },

  // KỲ 4
  {
    id: 'K18D-JPD123',
    code: 'JPD123',
    name: 'Elementary Japanese 1 - A1.2 / Tiếng Nhật sơ cấp 1-A1.2',
    semester: 4,
    credits: 3,
    prerequisite: 'JPD113',
  },
  {
    id: 'K18D-MAS291',
    code: 'MAS291',
    name: 'Statistics & Probability / Xác suất thống kê',
    semester: 4,
    credits: 3,
    prerequisite: 'MAE101 or MAC101',
  },
  {
    id: 'K18D-PRC392c',
    code: 'PRC392c',
    name: 'Cloud Computing / Điện toán đám mây',
    semester: 4,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-PRJ302',
    code: 'PRJ302',
    name: 'Java Web Application Development / Phát triển ứng dụng Java web',
    semester: 4,
    credits: 3,
    prerequisite: 'DBI202, PRO192',
  },
  {
    id: 'K18D-SWE201c',
    code: 'SWE201c',
    name: 'Introduction to Software Engineering / Nhập môn kĩ thuật phần mềm',
    semester: 4,
    credits: 3,
    prerequisite:
      'PRO192 (not applied to the BIT_AI; BIT_IC; BIT_AS; BIT_DX and BA programs)',
  },

  // KỲ 5
  {
    id: 'K18D-ISCOM1',
    code: 'IS_COM*1',
    name: 'Subject 1 of Combo* / Học phần 1 của combo*',
    semester: 5,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-ISM302',
    code: 'ISM302',
    name: 'Enterprise Resource Planning (ERP) / Lập kế hoạch nguồn lực doanh nghiệp',
    semester: 5,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-ISP392',
    code: 'ISP392',
    name: 'Information System Programming Project / Dự án lập trình HTTT',
    semester: 5,
    credits: 3,
    prerequisite: 'PRJ302, SWE201c, Pass LAB211',
  },
  {
    id: 'K18D-ITA301',
    code: 'ITA301',
    name: 'Information System Design & Analysis / Phân tích thiết kế HTTT',
    semester: 5,
    credits: 3,
    prerequisite: 'ITA203c, DBI202',
  },
  {
    id: 'K18D-ITE302c',
    code: 'ITE302c',
    name: 'Ethics in IT / Đạo đức trong CNTT',
    semester: 5,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 6
  {
    id: 'K18D-ENW493c',
    code: 'ENW493c',
    name: 'Research Methods & Academic Writing Skills / Phương pháp nghiên cứu & Kỹ năng viết học thuật',
    semester: 6,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-OJT202',
    code: 'OJT202',
    name: 'On-The-Job Training / Đào tạo trong môi trường thực tế',
    semester: 6,
    credits: 10,
    prerequisite:
      'Students attained 90% of the total credits prior to the OJT term (excluding Physical Education and OTP Programs). Students choosing JS combo (Japanese Bridge Engineer) have to pass JPD133.',
  },

  // KỲ 7
  {
    id: 'K18D-EXE101',
    code: 'EXE101',
    name: 'Experiential Entrepreneurship 1 / Trải nghiệm khởi nghiệp 1',
    semester: 7,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18D-ISCOM2',
    code: 'IS_COM*2',
    name: 'Subject 2 of Combo* / Học phần 2 của combo*',
    semester: 7,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-ISCOM3',
    code: 'IS_COM*3',
    name: 'Subject 3 of Combo* / Học phần 3 của combo*',
    semester: 7,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-ISC301',
    code: 'ISC301',
    name: 'e-Commerce / Thương mại điện tử',
    semester: 7,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-ITB302c',
    code: 'ITB302c',
    name: 'Business Intelligence (BI) / Kinh doanh thông minh',
    semester: 7,
    credits: 3,
    prerequisite: 'DBI202',
  },

  // KỲ 8
  {
    id: 'K18D-DTA301',
    code: 'DTA301',
    name: 'Data Analysis / Phân tích dữ liệu',
    semester: 8,
    credits: 3,
    prerequisite: 'PRO192, CSD201, DBI202, MAS291',
  },
  {
    id: 'K18D-EXE201',
    code: 'EXE201',
    name: 'Experiential Entrepreneurship 2 / Trải nghiệm khởi nghiệp 2',
    semester: 8,
    credits: 3,
    prerequisite: 'EXE101',
  },
  {
    id: 'K18D-ISCOM4',
    code: 'IS_COM*4',
    name: 'Subject 4 of Combo* / Học phần 4 của combo*',
    semester: 8,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18D-MLN111',
    code: 'MLN111',
    name: 'Philosophy of Marxism – Leninism / Triết học Mác - Lê-nin',
    semester: 8,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18D-MLN122',
    code: 'MLN122',
    name: 'Political Economics of Marxism – Leninism / Kinh tế chính trị Mác - Lê-nin',
    semester: 8,
    credits: 2,
    prerequisite: 'None',
  },
  {
    id: 'K18D-PMG201c',
    code: 'PMG201c',
    name: 'Project Management',
    semester: 8,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 9
  {
    id: 'K18D-HCM202',
    code: 'HCM202',
    name: 'Ho Chi Minh Ideology / Tư tưởng Hồ Chí Minh',
    semester: 9,
    credits: 2,
    prerequisite: 'MLN111, MLN122',
  },
  {
    id: 'K18D-GRA',
    code: 'IS_GRA_ELE',
    name: 'Graduation Elective - Information System / Học phần lựa chọn Đồ án tốt nghiệp chuyên ngành Hệ thống thông tin',
    semester: 9,
    credits: 10,
    prerequisite: '',
  },
  {
    id: 'K18D-MLN131',
    code: 'MLN131',
    name: 'Scientific Socialism / Chủ nghĩa xã hội khoa học',
    semester: 9,
    credits: 2,
    prerequisite: 'MLN111, MLN122',
  },
  {
    id: 'K18D-VNR202',
    code: 'VNR202',
    name: 'History of Communist Party of Vietnam / Lịch sử Đảng Cộng sản Việt Nam',
    semester: 9,
    credits: 2,
    prerequisite: 'MLN111, MLN122',
  },
];

/* =========================================================
   KHUNG BIT_IS_K18C
   Dữ liệu riêng theo ảnh K18C user cung cấp
========================================================= */

const K18C_SUBJECTS: CurriculumSubject[] = [
  // KỲ 0
  {
    id: 'K18C-OTP101',
    code: 'OTP101',
    name: 'Orientation and General Training Program / Định hướng và Rèn luyện tập trung',
    semester: 0,
    credits: 0,
    prerequisite: 'None',
  },
  {
    id: 'K18C-PEN',
    code: 'PEN',
    name: 'Preparation English / Tiếng Anh chuẩn bị',
    semester: 0,
    credits: 0,
    prerequisite: '',
  },
  {
    id: 'K18C-PHE1',
    code: 'PHE_COM*1',
    name: 'Physical Education 1 / Giáo dục thể chất 1',
    semester: 0,
    credits: 2,
    prerequisite: '',
  },
  {
    id: 'K18C-TMI',
    code: 'TMI_ELE',
    name: 'Traditional musical instrument / Nhạc cụ truyền thống',
    semester: 0,
    credits: 3,
    prerequisite: '',
  },

  // KỲ 1
  {
    id: 'K18C-CEA201',
    code: 'CEA201',
    name: 'Computer Organization and Architecture / Tổ chức và Kiến trúc máy tính',
    semester: 1,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-CSI104',
    code: 'CSI104',
    name: 'Introduction to Computer / Nhập môn khoa học máy tính',
    semester: 1,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-MAE101',
    code: 'MAE101',
    name: 'Mathematics for Engineering / Toán cho ngành kỹ thuật',
    semester: 1,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18C-PHE2',
    code: 'PHE_COM*2',
    name: 'Physical Education 2 / Giáo dục thể chất 2',
    semester: 1,
    credits: 2,
    prerequisite: '',
  },
  {
    id: 'K18C-PRF192',
    code: 'PRF192',
    name: 'Programming Fundamentals / Cơ sở lập trình',
    semester: 1,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18C-SSL101c',
    code: 'SSL101c',
    name: 'Academic Skills for University Success / Kỹ năng học tập đại học',
    semester: 1,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 2
  {
    id: 'K18C-MAD101',
    code: 'MAD101',
    name: 'Discrete Mathematics / Toán rời rạc',
    semester: 2,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18C-NWC204',
    code: 'NWC204',
    name: 'Computer Networking / Mạng máy tính',
    semester: 2,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-OSG202',
    code: 'OSG202',
    name: 'Operating Systems / Hệ điều hành',
    semester: 2,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-PHE3',
    code: 'PHE_COM*3',
    name: 'Physical Education 3 / Giáo dục thể chất 3',
    semester: 2,
    credits: 2,
    prerequisite: '',
  },
  {
    id: 'K18C-PRO192',
    code: 'PRO192',
    name: 'Object-Oriented Programming / Lập trình hướng đối tượng',
    semester: 2,
    credits: 3,
    prerequisite: 'Pass PRF192',
  },
  {
    id: 'K18C-SSG104',
    code: 'SSG104',
    name: 'Communication and In-Group Working Skills / Kỹ năng giao tiếp và cộng tác',
    semester: 2,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 3
  {
    id: 'K18C-CSD201',
    code: 'CSD201',
    name: 'Data Structures and Algorithms / Cấu trúc dữ liệu và giải thuật',
    semester: 3,
    credits: 3,
    prerequisite: 'PRO192',
  },
  {
    id: 'K18C-DBI202',
    code: 'DBI202',
    name: 'Introduction to Databases / Các hệ cơ sở dữ liệu',
    semester: 3,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-ITA203c',
    code: 'ITA203c',
    name: 'Information System Overview / Nhập môn hệ thống thông tin',
    semester: 3,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18C-JPD113',
    code: 'JPD113',
    name: 'Elementary Japanese 1 - A1.1 / Tiếng Nhật sơ cấp 1-A1.1',
    semester: 3,
    credits: 3,
    prerequisite: 'Không',
  },
  {
    id: 'K18C-LAB211',
    code: 'LAB211',
    name: 'OOP with Java Lab / Thực hành OOP với Java',
    semester: 3,
    credits: 3,
    prerequisite: 'PRO192',
  },

  // KỲ 4
  {
    id: 'K18C-JPD123',
    code: 'JPD123',
    name: 'Elementary Japanese 1-A1.2 / Tiếng Nhật sơ cấp 1-A1.2',
    semester: 4,
    credits: 3,
    prerequisite: 'JPD113',
  },
  {
    id: 'K18C-MAS291',
    code: 'MAS291',
    name: 'Statistics & Probability / Xác suất thống kê',
    semester: 4,
    credits: 3,
    prerequisite: 'MAE101 or MAC101',
  },
  {
    id: 'K18C-PRC392c',
    code: 'PRC392c',
    name: 'Cloud Computing / Điện toán đám mây',
    semester: 4,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-PRJ302',
    code: 'PRJ302',
    name: 'Java Web Application Development / Phát triển ứng dụng Java web',
    semester: 4,
    credits: 3,
    prerequisite: 'DBI202, PRO192',
  },
  {
    id: 'K18C-SWE201c',
    code: 'SWE201c',
    name: 'Introduction to Software Engineering / Nhập môn kĩ thuật phần mềm',
    semester: 4,
    credits: 3,
    prerequisite:
      'PRO192 (not applied to the BIT_AI; BIT_IC; BIT_AS; BIT_DX and BA programs)',
  },

  // KỲ 5
  {
    id: 'K18C-DTA301',
    code: 'DTA301',
    name: 'Data Analysis / Phân tích dữ liệu',
    semester: 5,
    credits: 3,
    prerequisite: 'PRO192, CSD201, DBI202, MAS291',
  },
  {
    id: 'K18C-ISM302',
    code: 'ISM302',
    name: 'Enterprise Resource Planning (ERP) / Lập kế hoạch nguồn lực doanh nghiệp',
    semester: 5,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-ISP392',
    code: 'ISP392',
    name: 'Information System Programming Project / Dự án lập trình HTTT',
    semester: 5,
    credits: 3,
    prerequisite: 'PRJ302, SWE201c, Pass LAB211',
  },
  {
    id: 'K18C-ITA301',
    code: 'ITA301',
    name: 'Information System Design & Analysis / Phân tích thiết kế HTTT',
    semester: 5,
    credits: 3,
    prerequisite: 'ITA203c, DBI202',
  },
  {
    id: 'K18C-ITE302c',
    code: 'ITE302c',
    name: 'Ethics in IT / Đạo đức trong CNTT',
    semester: 5,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 6
  {
    id: 'K18C-ENW493c',
    code: 'ENW493c',
    name: 'Research Methods & Academic Writing Skills / Phương pháp nghiên cứu & Kỹ năng viết học thuật',
    semester: 6,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-OJT202',
    code: 'OJT202',
    name: 'On-The-Job Training / Đào tạo trong môi trường thực tế',
    semester: 6,
    credits: 10,
    prerequisite:
      'Students attained 90% of the total credits prior to the OJT term (excluding Physical Education and OTP Programs). Students choosing JS combo (Japanese Bridge Engineer) have to pass JPD133.',
  },

  // KỲ 7
  {
    id: 'K18C-EXE101',
    code: 'EXE101',
    name: 'Experiential Entrepreneurship 1 / Trải nghiệm khởi nghiệp 1',
    semester: 7,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18C-ISCOM1',
    code: 'IS_COM*1',
    name: 'Subject 1 of Combo* / Học phần 1 của combo*',
    semester: 7,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-ISCOM2',
    code: 'IS_COM*2',
    name: 'Subject 2 of Combo* / Học phần 2 của combo*',
    semester: 7,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-ISC301',
    code: 'ISC301',
    name: 'e-Commerce / Thương mại điện tử',
    semester: 7,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-ITB302c',
    code: 'ITB302c',
    name: 'Business Intelligence (BI) / Kinh doanh thông minh',
    semester: 7,
    credits: 3,
    prerequisite: 'DBI202',
  },

  // KỲ 8
  {
    id: 'K18C-EXE201',
    code: 'EXE201',
    name: 'Experiential Entrepreneurship 2 / Trải nghiệm khởi nghiệp 2',
    semester: 8,
    credits: 3,
    prerequisite: 'EXE101',
  },
  {
    id: 'K18C-ISCOM3',
    code: 'IS_COM*3',
    name: 'Subject 3 of Combo* / Học phần 3 của combo*',
    semester: 8,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-ISCOM4',
    code: 'IS_COM*4',
    name: 'Subject 4 of Combo* / Học phần 4 của combo*',
    semester: 8,
    credits: 3,
    prerequisite: '',
  },
  {
    id: 'K18C-MLN111',
    code: 'MLN111',
    name: 'Philosophy of Marxism – Leninism / Triết học Mác - Lê-nin',
    semester: 8,
    credits: 3,
    prerequisite: 'None',
  },
  {
    id: 'K18C-MLN122',
    code: 'MLN122',
    name: 'Political Economics of Marxism – Leninism / Kinh tế chính trị Mác - Lê-nin',
    semester: 8,
    credits: 2,
    prerequisite: 'None',
  },
  {
    id: 'K18C-PMG201c',
    code: 'PMG201c',
    name: 'Project Management',
    semester: 8,
    credits: 3,
    prerequisite: 'None',
  },

  // KỲ 9
  {
    id: 'K18C-HCM202',
    code: 'HCM202',
    name: 'Ho Chi Minh Ideology / Tư tưởng Hồ Chí Minh',
    semester: 9,
    credits: 2,
    prerequisite: 'MLN111, MLN122',
  },
  {
    id: 'K18C-GRA',
    code: 'IS_GRA_ELE',
    name: 'Graduation Elective - Information System / Học phần lựa chọn Đồ án tốt nghiệp chuyên ngành Hệ thống thông tin',
    semester: 9,
    credits: 10,
    prerequisite: '',
  },
  {
    id: 'K18C-MLN131',
    code: 'MLN131',
    name: 'Scientific Socialism / Chủ nghĩa xã hội khoa học',
    semester: 9,
    credits: 2,
    prerequisite: 'MLN111, MLN122',
  },
  {
    id: 'K18C-VNR202',
    code: 'VNR202',
    name: 'History of Communist Party of Vietnam / Lịch sử Đảng Cộng sản Việt Nam',
    semester: 9,
    credits: 2,
    prerequisite: 'MLN111, MLN122',
  },
];

const INITIAL_CURRICULUMS: Curriculum[] = [
  {
    code: 'BIT_IS_K18D_19A',
    name: 'Hệ thống thông tin - K18D/19A',
    totalSubjects: 48,
    totalCredits: 145,
    subjects: K18D_19A_SUBJECTS,
  },
  {
    code: 'BIT_IS_K18C',
    name: 'Hệ thống thông tin - K18C',
    totalSubjects: 48,
    totalCredits: 145,
    subjects: K18C_SUBJECTS,
  },
];

const EMPTY_FORM = {
  code: '',
  name: '',
  semester: 1,
  credits: 3,
  prerequisite: '',
};

const EducationCurriculumPlan: React.FC = () => {
  const [curriculums, setCurriculums] =
    React.useState<Curriculum[]>(INITIAL_CURRICULUMS);

  const [selectedCurriculumCode, setSelectedCurriculumCode] =
    React.useState('BIT_IS_K18D_19A');

  const [selectedSemester, setSelectedSemester] =
    React.useState<number | 'all'>('all');

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [editingSubject, setEditingSubject] =
    React.useState<CurriculumSubject | null>(null);

  const [formData, setFormData] = React.useState(EMPTY_FORM);

  const selectedCurriculum =
    curriculums.find(
      (curriculum) =>
        curriculum.code === selectedCurriculumCode,
    ) ?? curriculums[0];

  const filteredSubjects = selectedCurriculum.subjects.filter(
    (subject) => {
      const semesterMatch =
        selectedSemester === 'all' ||
        subject.semester === selectedSemester;

      const keyword = searchTerm.toLowerCase().trim();

      const searchMatch =
        !keyword ||
        subject.code.toLowerCase().includes(keyword) ||
        subject.name.toLowerCase().includes(keyword) ||
        subject.prerequisite.toLowerCase().includes(keyword);

      return semesterMatch && searchMatch;
    },
  );

  const handleCurriculumChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedCurriculumCode(event.target.value);

    // Reset filter khi đổi khung
    setSelectedSemester('all');
    setSearchTerm('');
  };

  const updateSelectedCurriculumSubjects = (
    updater: (subjects: CurriculumSubject[]) => CurriculumSubject[],
  ) => {
    setCurriculums((prev) =>
      prev.map((curriculum) =>
        curriculum.code === selectedCurriculumCode
          ? {
              ...curriculum,
              subjects: updater(curriculum.subjects),
            }
          : curriculum,
      ),
    );
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (subject: CurriculumSubject) => {
    setEditingSubject(subject);

    setFormData({
      code: subject.code,
      name: subject.name,
      semester: subject.semester,
      credits: subject.credits,
      prerequisite: subject.prerequisite,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Vui lòng nhập mã môn và tên môn học.');
      return;
    }

    if (editingSubject) {
      updateSelectedCurriculumSubjects((subjects) =>
        subjects.map((subject) =>
          subject.id === editingSubject.id
            ? {
                ...subject,
                code: formData.code.trim(),
                name: formData.name.trim(),
                semester: formData.semester,
                credits: formData.credits,
                prerequisite: formData.prerequisite.trim(),
              }
            : subject,
        ),
      );
    } else {
      const newSubject: CurriculumSubject = {
        id: `${selectedCurriculumCode}-${formData.code.trim()}-${Date.now()}`,
        code: formData.code.trim(),
        name: formData.name.trim(),
        semester: formData.semester,
        credits: formData.credits,
        prerequisite: formData.prerequisite.trim(),
      };

      updateSelectedCurriculumSubjects((subjects) => [
        ...subjects,
        newSubject,
      ]);
    }

    closeModal();
  };

  const handleDelete = (subject: CurriculumSubject) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa môn "${subject.code}" khỏi khung ${selectedCurriculumCode}?`,
    );

    if (!confirmed) return;

    updateSelectedCurriculumSubjects((subjects) =>
      subjects.filter((item) => item.id !== subject.id),
    );
  };

  const handleDownloadTemplate = () => {
    const content =
      'MaKhungChuongTrinh,MaMon,TenMonHoc,SoTinChi,KyChuongTrinh,MonTienQuyet\n' +
      `${selectedCurriculumCode},PRF192,Programming Fundamentals,3,1,None`;

    const blob = new Blob([content], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'curriculum-template.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleImportFile = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    alert(
      `UI mock: đã chọn file "${file.name}" để import cho khung ${selectedCurriculumCode}.`,
    );

    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Quản lý Chương trình Đào tạo"
        description="Quản lý các khung chương trình đào tạo phục vụ theo dõi tiến độ học tập và điều kiện OJT."
        badge="Quản lý dữ liệu"
      />

      {/* ==================== CHỌN KHUNG ==================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Khung chương trình
            </label>

            <select
              value={selectedCurriculumCode}
              onChange={handleCurriculumChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              {curriculums.map((curriculum) => (
                <option
                  key={curriculum.code}
                  value={curriculum.code}
                >
                  {curriculum.code}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Chọn khung chương trình cần xem hoặc quản lý.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Layers3 size={21} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Khung đang chọn
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-800">
                  {selectedCurriculum.code}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedCurriculum.name}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    {selectedCurriculum.totalSubjects} môn học
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    {selectedCurriculum.totalCredits} tín chỉ
                  </span>

                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                    Kỳ 0 - Kỳ 9
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TOOLBAR ==================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-800">
              Danh sách môn học
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý các môn thuộc khung{' '}
              <span className="font-semibold">
                {selectedCurriculum.code}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={17} />
              Tải file mẫu
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100">
              <Upload size={17} />
              Import dữ liệu

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <Plus size={17} />
              Thêm môn học
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <div className="relative min-w-[260px] flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Tìm mã môn, tên môn, môn tiên quyết..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <select
            value={selectedSemester}
            onChange={(event) =>
              setSelectedSemester(
                event.target.value === 'all'
                  ? 'all'
                  : Number(event.target.value),
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
          >
            <option value="all">Tất cả kỳ chương trình</option>

            {Array.from({ length: 10 }, (_, semester) => (
              <option key={semester} value={semester}>
                Kỳ {semester}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ==================== TABLE ==================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-800">
              {selectedCurriculum.code}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Hiển thị {filteredSubjects.length} môn học
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <BookOpen size={17} />
            {selectedCurriculum.totalSubjects} môn •{' '}
            {selectedCurriculum.totalCredits} tín chỉ
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Mã môn
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Tên môn học
                </th>

                <th className="px-5 py-3 text-center font-semibold text-slate-600">
                  Kỳ
                </th>

                <th className="px-5 py-3 text-center font-semibold text-slate-600">
                  Tín chỉ
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Môn tiên quyết / Điều kiện
                </th>

                <th className="px-5 py-3 text-right font-semibold text-slate-600">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-orange-600">
                        {subject.code}
                      </span>
                    </td>

                    <td className="max-w-md px-5 py-4 font-medium text-slate-700">
                      {subject.name}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Kỳ {subject.semester}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center font-medium text-slate-700">
                      {subject.credits}
                    </td>

                    <td className="max-w-lg px-5 py-4 text-slate-600">
                      {subject.prerequisite || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(subject)}
                          title="Chỉnh sửa"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-500"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(subject)}
                          title="Xóa"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Không tìm thấy môn học phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingSubject
                    ? 'Chỉnh sửa môn học'
                    : 'Thêm môn học'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Khung {selectedCurriculum.code}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 px-6 py-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Mã môn
                  </label>

                  <input
                    value={formData.code}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: PRF192"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Kỳ chương trình
                  </label>

                  <select
                    value={formData.semester}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        semester: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  >
                    {Array.from(
                      { length: 10 },
                      (_, semester) => (
                        <option
                          key={semester}
                          value={semester}
                        >
                          Kỳ {semester}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tên môn học
                  </label>

                  <input
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nhập tên môn học"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Số tín chỉ
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formData.credits}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        credits: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Môn tiên quyết / Điều kiện
                  </label>

                  <input
                    value={formData.prerequisite}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        prerequisite: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: PRO192"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  {editingSubject
                    ? 'Lưu thay đổi'
                    : 'Thêm môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationCurriculumPlan;