import React from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Building2,
  GraduationCap,
  Mail,
  BriefcaseBusiness,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

type ApplicationStatus =
  | "Chờ duyệt"
  | "Đã duyệt"
  | "Yêu cầu bổ sung"
  | "Từ chối";

type EligibilityStatus =
  | "Đã đủ điều kiện"
  | "Dự kiến đủ điều kiện"
  | "Chưa đủ điều kiện";

interface EligibilityInfo {
  currentCredits: number;
  studyingCredits: number;
  otherStudyingCredits: number;
  projectedCredits: number;
  requiredCredits: number;
  jpd133Required: boolean;
  jpd133Passed: boolean | null;
  status: EligibilityStatus;
}

interface OjtApplication {
  id: string;
  studentCode: string;
  fullName: string;
  major: string;
  cohort: string;
  studentClass: string;
  curriculumCode: string;
  email: string;
  gpa: number;

  company: string;
  position: string;

  skills: string[];
  englishLevel: string;
  certificates: string[];
  cvFileName: string;

  submittedAt: string;
  status: ApplicationStatus;

  eligibility: EligibilityInfo;

  reviewReason?: string;
}

const INITIAL_APPLICATIONS: OjtApplication[] = [
  {
    id: "app-1",
    studentCode: "SE182521",
    fullName: "Lê Minh Nhật",
    major: "Information Systems",
    cohort: "K18",
    studentClass: "K18D-19A",
    curriculumCode: "BIT_IS_EIS_18D",
    email: "SE182521@fpt.edu.vn",
    gpa: 7.126,

    company: "FPT IS",
    position: "Business Analyst Intern",

    skills: ["Business Analysis", "SQL", "Figma", "Communication"],
    englishLevel: "B2",
    certificates: ["Academic Skills Certificate"],
    cvFileName: "SE182521_CV.pdf",

    submittedAt: "12/09/2026",
    status: "Chờ duyệt",

    eligibility: {
      currentCredits: 60,
      studyingCredits: 12,
      otherStudyingCredits: 3,
      projectedCredits: 75,
      requiredCredits: 70,
      jpd133Required: false,
      jpd133Passed: null,
      status: "Dự kiến đủ điều kiện",
    },
  },

  {
    id: "app-2",
    studentCode: "SE181666",
    fullName: "Nguyễn Khánh Ly",
    major: "Information Systems",
    cohort: "K18",
    studentClass: "K18D-19A",
    curriculumCode: "BIT_IS_EIS_18D",
    email: "SE181666@fpt.edu.vn",
    gpa: 7.45,

    company: "KMS Technology",
    position: "Software Engineer Intern",

    skills: ["Java", "SQL", "Git"],
    englishLevel: "B2",
    certificates: [],
    cvFileName: "SE181666_CV.pdf",

    submittedAt: "11/09/2026",
    status: "Chờ duyệt",

    eligibility: {
      currentCredits: 72,
      studyingCredits: 6,
      otherStudyingCredits: 0,
      projectedCredits: 78,
      requiredCredits: 70,
      jpd133Required: false,
      jpd133Passed: null,
      status: "Đã đủ điều kiện",
    },
  },

  {
    id: "app-3",
    studentCode: "SE182687",
    fullName: "Trần Vĩnh Phước",
    major: "Information Systems",
    cohort: "K18",
    studentClass: "K18D-19B",
    curriculumCode: "BIT_IS_EIS_18D",
    email: "SE182687@fpt.edu.vn",
    gpa: 6.82,

    company: "NashTech",
    position: "Data Analyst Intern",

    skills: ["SQL", "Power BI", "Excel"],
    englishLevel: "B1",
    certificates: ["Microsoft Power BI Fundamentals"],
    cvFileName: "SE182687_CV.pdf",

    submittedAt: "10/09/2026",
    status: "Yêu cầu bổ sung",

    eligibility: {
      currentCredits: 63,
      studyingCredits: 9,
      otherStudyingCredits: 0,
      projectedCredits: 72,
      requiredCredits: 70,
      jpd133Required: false,
      jpd133Passed: null,
      status: "Dự kiến đủ điều kiện",
    },

    reviewReason:
      "Vui lòng bổ sung thông tin chứng chỉ trong hồ sơ đăng ký OJT.",
  },

  {
    id: "app-4",
    studentCode: "SE182618",
    fullName: "Nguyễn Minh Hải",
    major: "Information Systems",
    cohort: "K18",
    studentClass: "K18D-19A",
    curriculumCode: "BIT_IS_EIS_18D",
    email: "SE182618@fpt.edu.vn",
    gpa: 8.01,

    company: "FPT Software",
    position: "Business Intelligence Intern",

    skills: ["SQL", "Power BI", "Python"],
    englishLevel: "IELTS 6.5",
    certificates: ["IELTS 6.5"],
    cvFileName: "SE182618_CV.pdf",

    submittedAt: "09/09/2026",
    status: "Đã duyệt",

    eligibility: {
      currentCredits: 76,
      studyingCredits: 3,
      otherStudyingCredits: 0,
      projectedCredits: 79,
      requiredCredits: 70,
      jpd133Required: false,
      jpd133Passed: null,
      status: "Đã đủ điều kiện",
    },
  },

  {
    id: "app-5",
    studentCode: "SE180599",
    fullName: "Phạm Minh Tuấn",
    major: "Information Systems",
    cohort: "K18",
    studentClass: "K18D-19B",
    curriculumCode: "BIT_IS_EIS_18D",
    email: "SE180599@fpt.edu.vn",
    gpa: 6.21,

    company: "FPT IS",
    position: "Application Support Intern",

    skills: ["SQL", "Communication"],
    englishLevel: "B1",
    certificates: [],
    cvFileName: "SE180599_CV.pdf",

    submittedAt: "08/09/2026",
    status: "Từ chối",

    eligibility: {
      currentCredits: 52,
      studyingCredits: 9,
      otherStudyingCredits: 0,
      projectedCredits: 61,
      requiredCredits: 70,
      jpd133Required: false,
      jpd133Passed: null,
      status: "Chưa đủ điều kiện",
    },

    reviewReason:
      "Số tín chỉ dự kiến sau kỳ hiện tại chưa đạt yêu cầu của đợt OJT.",
  },
];

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  "Chờ duyệt": "border-amber-200 bg-amber-50 text-amber-700",
  "Đã duyệt": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Yêu cầu bổ sung": "border-blue-200 bg-blue-50 text-blue-700",
  "Từ chối": "border-red-200 bg-red-50 text-red-700",
};

const ELIGIBILITY_STYLE: Record<EligibilityStatus, string> = {
  "Đã đủ điều kiện": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Dự kiến đủ điều kiện": "border-amber-200 bg-amber-50 text-amber-700",
  "Chưa đủ điều kiện": "border-red-200 bg-red-50 text-red-700",
};

type ReviewAction = "supplement" | "reject";
type RegistrationPeriodStatus = "Chưa mở" | "Đang mở đăng ký" | "Đã đóng";

interface RegistrationPeriod {
  id: string;
  name: string;
  term: string;
  startDate: string;
  endDate: string;
  status: RegistrationPeriodStatus;
}
const MESSAGE_TEMPLATES = {
  supplement: [
    {
      label: "Thiếu CV",
      value:
        "Hồ sơ đăng ký OJT của bạn cần bổ sung CV. Vui lòng cập nhật hồ sơ trước thời hạn quy định.",
    },
    {
      label: "Thiếu thông tin chứng chỉ",
      value:
        "Hồ sơ đăng ký OJT của bạn cần bổ sung thông tin chứng chỉ. Vui lòng cập nhật hồ sơ trước thời hạn quy định.",
    },
    {
      label: "Thông tin hồ sơ chưa đầy đủ",
      value:
        "Hồ sơ đăng ký OJT của bạn chưa đầy đủ. Vui lòng kiểm tra và bổ sung các thông tin còn thiếu.",
    },
  ],
  reject: [
    {
      label: "Chưa đáp ứng điều kiện OJT",
      value:
        "Hồ sơ đăng ký OJT chưa được duyệt do sinh viên chưa đáp ứng điều kiện OJT của đợt hiện tại.",
    },
    {
      label: "Hồ sơ không hợp lệ",
      value:
        "Hồ sơ đăng ký OJT chưa được duyệt do thông tin hồ sơ chưa đáp ứng yêu cầu.",
    },
  ],
};

const EducationOjtApplicationReview: React.FC = () => {
  const [applications, setApplications] =
    React.useState<OjtApplication[]>(INITIAL_APPLICATIONS);
  const [registrationPeriod, setRegistrationPeriod] =
    React.useState<RegistrationPeriod>({
      id: "ojt-fall-2026",
      name: "Đợt đăng ký OJT - Fall 2026",
      term: "Fall 2026",
      startDate: "2026-09-01",
      endDate: "2026-09-25",
      status: "Đang mở đăng ký",
    });

  const [showPeriodModal, setShowPeriodModal] = React.useState(false);

  const [periodForm, setPeriodForm] = React.useState<RegistrationPeriod>({
    id: "",
    name: "",
    term: "Fall 2026",
    startDate: "",
    endDate: "",
    status: "Chưa mở",
  });
  const [selectedApplication, setSelectedApplication] =
    React.useState<OjtApplication | null>(null);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [search, setSearch] = React.useState("");
  const [cohortFilter, setCohortFilter] = React.useState("all");
  const [classFilter, setClassFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [eligibilityFilter, setEligibilityFilter] = React.useState("all");

  const [reviewAction, setReviewAction] = React.useState<ReviewAction | null>(
    null,
  );

  const [messageTemplate, setMessageTemplate] = React.useState("");

  const [reviewMessage, setReviewMessage] = React.useState("");

  const cohorts = Array.from(new Set(applications.map((item) => item.cohort)));

  const classes = Array.from(
    new Set(applications.map((item) => item.studentClass)),
  );

  const filteredApplications = applications.filter((application) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      application.studentCode.toLowerCase().includes(keyword) ||
      application.fullName.toLowerCase().includes(keyword);

    const matchesCohort =
      cohortFilter === "all" || application.cohort === cohortFilter;

    const matchesClass =
      classFilter === "all" || application.studentClass === classFilter;

    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;

    const matchesEligibility =
      eligibilityFilter === "all" ||
      application.eligibility.status === eligibilityFilter;

    return (
      matchesSearch &&
      matchesCohort &&
      matchesClass &&
      matchesStatus &&
      matchesEligibility
    );
  });

  const pendingVisibleApplications = filteredApplications.filter(
    (application) => application.status === "Chờ duyệt",
  );

  const allPendingSelected =
    pendingVisibleApplications.length > 0 &&
    pendingVisibleApplications.every((application) =>
      selectedIds.includes(application.id),
    );

  const updateApplication = (id: string, changes: Partial<OjtApplication>) => {
    setApplications((prev) =>
      prev.map((application) =>
        application.id === id ? { ...application, ...changes } : application,
      ),
    );

    setSelectedApplication((prev) =>
      prev?.id === id ? { ...prev, ...changes } : prev,
    );
  };

  const handleApprove = (application: OjtApplication) => {
    const confirmed = window.confirm(
      `Xác nhận duyệt hồ sơ OJT của ${application.studentCode} - ${application.fullName}?`,
    );

    if (!confirmed) return;

    updateApplication(application.id, {
      status: "Đã duyệt",
      reviewReason: undefined,
    });
  };

  const handleBulkApprove = () => {
    const eligibleIds = selectedIds.filter((id) => {
      const application = applications.find((item) => item.id === id);
      return application?.status === "Chờ duyệt";
    });

    if (eligibleIds.length === 0) {
      alert("Chưa chọn hồ sơ đang chờ duyệt.");
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận duyệt ${eligibleIds.length} hồ sơ đã chọn?`,
    );

    if (!confirmed) return;

    setApplications((prev) =>
      prev.map((application) =>
        eligibleIds.includes(application.id)
          ? {
              ...application,
              status: "Đã duyệt",
              reviewReason: undefined,
            }
          : application,
      ),
    );

    setSelectedIds([]);
  };

  const openReviewModal = (
    action: ReviewAction,
    application: OjtApplication,
  ) => {
    setSelectedApplication(application);
    setReviewAction(action);
    setMessageTemplate("");
    setReviewMessage("");
  };

  const closeReviewModal = () => {
    setReviewAction(null);
    setMessageTemplate("");
    setReviewMessage("");
  };

  const handleTemplateChange = (value: string) => {
    setMessageTemplate(value);

    if (!reviewAction) return;

    const templates = MESSAGE_TEMPLATES[reviewAction];
    const selected = templates.find((template) => template.label === value);

    setReviewMessage(selected?.value ?? "");
  };

  const submitReviewAction = () => {
    if (!selectedApplication || !reviewAction) return;

    if (!reviewMessage.trim()) {
      alert("Vui lòng nhập nội dung thông báo.");
      return;
    }

    updateApplication(selectedApplication.id, {
      status: reviewAction === "supplement" ? "Yêu cầu bổ sung" : "Từ chối",
      reviewReason: reviewMessage.trim(),
    });

    closeReviewModal();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleAllPending = () => {
    const ids = pendingVisibleApplications.map((application) => application.id);

    if (allPendingSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const resetFilters = () => {
    setSearch("");
    setCohortFilter("all");
    setClassFilter("all");
    setStatusFilter("all");
    setEligibilityFilter("all");
  };
  const formatDate = (date: string) => {
    if (!date) return "—";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  };

  const openEditPeriodModal = () => {
    setPeriodForm(registrationPeriod);
    setShowPeriodModal(true);
  };

  const closePeriodModal = () => {
    setShowPeriodModal(false);
  };

  const handleSavePeriod = () => {
    if (
      !periodForm.name.trim() ||
      !periodForm.startDate ||
      !periodForm.endDate
    ) {
      alert("Vui lòng nhập đầy đủ thông tin đợt đăng ký.");
      return;
    }

    if (periodForm.endDate < periodForm.startDate) {
      alert("Hạn đăng ký phải sau ngày mở đăng ký.");
      return;
    }

    setRegistrationPeriod({
      ...periodForm,
      name: periodForm.name.trim(),
    });

    setShowPeriodModal(false);
  };

  const handleCloseRegistration = () => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn đóng "${registrationPeriod.name}"? Sinh viên sẽ không thể tiếp tục gửi hồ sơ trong đợt này.`,
    );

    if (!confirmed) return;

    setRegistrationPeriod((prev) => ({
      ...prev,
      status: "Đã đóng",
    }));
  };

  const handleReopenRegistration = () => {
    const confirmed = window.confirm(`Mở lại "${registrationPeriod.name}"?`);

    if (!confirmed) return;

    setRegistrationPeriod((prev) => ({
      ...prev,
      status: "Đang mở đăng ký",
    }));
  };
  if (selectedApplication) {
    const application = selectedApplication;

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedApplication(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách hồ sơ
        </button>

        <PageBanner
          title="Chi tiết Hồ sơ Đăng ký OJT"
          description="Kiểm tra thông tin đăng ký, hồ sơ ứng tuyển và tình trạng điều kiện OJT của sinh viên."
          badge="Quản lý sinh viên"
        />

        {/* STUDENT INFO */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <GraduationCap size={27} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {application.fullName}
                </h2>

                <p className="mt-1 font-semibold text-orange-600">
                  {application.studentCode}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {application.cohort}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {application.studentClass}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {application.curriculumCode}
                  </span>
                </div>
              </div>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${
                STATUS_STYLE[application.status]
              }`}
            >
              {application.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Ngành</p>
              <p className="mt-1 font-medium text-slate-700">
                {application.major}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="mt-1 flex items-center gap-2 font-medium text-slate-700">
                <Mail size={15} />
                {application.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">GPA</p>
              <p className="mt-1 font-semibold text-slate-700">
                {application.gpa.toFixed(3)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Ngày gửi hồ sơ</p>
              <p className="mt-1 font-medium text-slate-700">
                {application.submittedAt}
              </p>
            </div>
          </div>
        </section>

        {/* COMPANY + PROFILE */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-orange-500" />
              <h3 className="font-semibold text-slate-800">
                Nguyện vọng thực tập
              </h3>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-slate-400">Doanh nghiệp</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {application.company}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Vị trí ứng tuyển</p>
                <p className="mt-1 flex items-center gap-2 font-medium text-slate-700">
                  <BriefcaseBusiness size={16} />
                  {application.position}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-orange-500" />
              <h3 className="font-semibold text-slate-800">Hồ sơ ứng tuyển</h3>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-slate-400">Kỹ năng</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {application.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">Trình độ tiếng Anh</p>
                <p className="mt-1 font-medium text-slate-700">
                  {application.englishLevel}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Chứng chỉ</p>

                <p className="mt-1 text-sm text-slate-700">
                  {application.certificates.length > 0
                    ? application.certificates.join(", ")
                    : "Không có"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Paperclip size={18} className="shrink-0 text-slate-400" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {application.cvFileName}
                      </p>
                      <p className="text-xs text-slate-400">CV ứng tuyển</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      alert("Mock frontend: chưa có file CV thật để mở.")
                    }
                    className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Xem CV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ELIGIBILITY */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="font-semibold text-slate-800">
                Kiểm tra điều kiện OJT
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Kết quả kiểm tra tại thời điểm xét hồ sơ.
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${
                ELIGIBILITY_STYLE[application.eligibility.status]
              }`}
            >
              {application.eligibility.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Tín chỉ tích lũy</p>
              <p className="mt-2 text-xl font-bold text-slate-800">
                {application.eligibility.currentCredits} TC
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Đang học</p>
              <p className="mt-2 text-xl font-bold text-slate-800">
                {application.eligibility.studyingCredits} TC
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Tín chỉ khác đang học</p>
              <p className="mt-2 text-xl font-bold text-slate-800">
                {application.eligibility.otherStudyingCredits} TC
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-xs text-orange-500">Dự kiến hoàn thành</p>
              <p className="mt-2 text-xl font-bold text-orange-700">
                {application.eligibility.projectedCredits} TC
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Tín chỉ yêu cầu</p>
              <p className="mt-2 text-xl font-bold text-slate-800">
                {application.eligibility.requiredCredits} TC
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              {application.eligibility.projectedCredits >=
              application.eligibility.requiredCredits ? (
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />
              ) : (
                <XCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
              )}

              <div>
                <p className="font-semibold text-slate-700">
                  Điều kiện tín chỉ
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {application.eligibility.projectedCredits >=
                  application.eligibility.requiredCredits
                    ? "Đạt mức tín chỉ yêu cầu nếu hoàn thành các môn đang học."
                    : "Số tín chỉ dự kiến hiện chưa đạt mức yêu cầu."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-700">Điều kiện JPD133</p>

            <p className="mt-1 text-sm text-slate-500">
              {!application.eligibility.jpd133Required
                ? "Không áp dụng đối với sinh viên này."
                : application.eligibility.jpd133Passed
                  ? "Đã đạt JPD133."
                  : "Chưa đạt JPD133."}
            </p>
          </div>
        </section>

        {application.reviewReason && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="font-semibold text-blue-800">Nội dung xử lý hồ sơ</p>
            <p className="mt-2 text-sm leading-6 text-blue-700">
              {application.reviewReason}
            </p>
          </section>
        )}

        {/* ACTIONS */}
        {application.status !== "Đã duyệt" &&
          application.status !== "Từ chối" && (
            <section className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => openReviewModal("reject", application)}
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Từ chối
              </button>

              <button
                type="button"
                onClick={() => openReviewModal("supplement", application)}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Yêu cầu bổ sung
              </button>

              <button
                type="button"
                onClick={() => handleApprove(application)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <CheckCircle2 size={17} />
                Duyệt hồ sơ
              </button>
            </section>
          )}

        {application.status === "Đã duyệt" && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex gap-3">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="font-semibold text-emerald-800">
                  Hồ sơ đã được Phòng Đào tạo duyệt
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Hồ sơ sẵn sàng cho bước xử lý tiếp theo với Phòng Quan hệ
                  Doanh nghiệp.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* REVIEW MODAL */}
        {reviewAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {reviewAction === "supplement"
                      ? "Yêu cầu bổ sung hồ sơ"
                      : "Từ chối hồ sơ"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {application.studentCode} - {application.fullName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Mẫu thông báo
                  </label>

                  <select
                    value={messageTemplate}
                    onChange={(event) =>
                      handleTemplateChange(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  >
                    <option value="">Chọn mẫu thông báo</option>

                    {MESSAGE_TEMPLATES[reviewAction].map((template) => (
                      <option key={template.label} value={template.label}>
                        {template.label}
                      </option>
                    ))}

                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Nội dung gửi sinh viên
                  </label>

                  <textarea
                    rows={6}
                    value={reviewMessage}
                    onChange={(event) => setReviewMessage(event.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={submitReviewAction}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <Send size={16} />
                  Gửi thông báo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Duyệt Hồ sơ Đăng ký OJT"
        description="Theo dõi và xử lý hồ sơ đăng ký OJT của sinh viên."
        badge="Quản lý sinh viên"
      />

      {/* REGISTRATION PERIOD */}
      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Clock3 size={20} className="text-orange-600" />

              <h2 className="text-lg font-bold text-slate-800">
                {registrationPeriod.name}
              </h2>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  registrationPeriod.status === "Đang mở đăng ký"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : registrationPeriod.status === "Chưa mở"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {registrationPeriod.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium">Kỳ OJT:</span>{" "}
                {registrationPeriod.term}
              </p>

              <p>
                <span className="font-medium">Thời gian đăng ký:</span>{" "}
                {formatDate(registrationPeriod.startDate)}
                {" - "}
                {formatDate(registrationPeriod.endDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openEditPeriodModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
            >
              Chỉnh sửa
            </button>

            {registrationPeriod.status === "Đang mở đăng ký" && (
              <button
                type="button"
                onClick={handleCloseRegistration}
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Đóng đăng ký
              </button>
            )}

            {registrationPeriod.status === "Đã đóng" && (
              <button
                type="button"
                onClick={handleReopenRegistration}
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Mở lại đăng ký
              </button>
            )}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[
          ["Tổng hồ sơ", applications.length],
          [
            "Chờ duyệt",
            applications.filter((item) => item.status === "Chờ duyệt").length,
          ],
          [
            "Đã duyệt",
            applications.filter((item) => item.status === "Đã duyệt").length,
          ],
          [
            "Yêu cầu bổ sung",
            applications.filter((item) => item.status === "Yêu cầu bổ sung")
              .length,
          ],
          [
            "Từ chối",
            applications.filter((item) => item.status === "Từ chối").length,
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </section>

      {/* FILTER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo MSSV hoặc họ tên..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-400"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={cohortFilter}
            onChange={(event) => setCohortFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="all">Tất cả khóa</option>
            {cohorts.map((cohort) => (
              <option key={cohort}>{cohort}</option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((studentClass) => (
              <option key={studentClass}>{studentClass}</option>
            ))}
          </select>

          <select
            value={eligibilityFilter}
            onChange={(event) => setEligibilityFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="all">Tất cả điều kiện</option>
            <option value="Đã đủ điều kiện">Đã đủ điều kiện</option>
            <option value="Dự kiến đủ điều kiện">Dự kiến đủ điều kiện</option>
            <option value="Chưa đủ điều kiện">Chưa đủ điều kiện</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="all">Tất cả trạng thái hồ sơ</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Yêu cầu bổ sung">Yêu cầu bổ sung</option>
            <option value="Từ chối">Từ chối</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-semibold text-slate-500 hover:text-orange-500"
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* BULK ACTION */}
      {selectedIds.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
          <p className="text-sm font-semibold text-orange-700">
            Đã chọn {selectedIds.length} hồ sơ
          </p>

          <button
            type="button"
            onClick={handleBulkApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <CheckCircle2 size={17} />
            Duyệt hồ sơ đã chọn
          </button>
        </section>
      )}

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Danh sách hồ sơ</h2>

          <p className="mt-1 text-sm text-slate-500">
            Chọn hồ sơ để xem thông tin chi tiết và xử lý.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAllPending}
                  />
                </th>
                <th className="px-5 py-3">MSSV</th>
                <th className="px-5 py-3">Họ tên</th>
                <th className="px-5 py-3">Khóa / Lớp</th>
                <th className="px-5 py-3">GPA</th>
                <th className="px-5 py-3">Công ty / Vị trí</th>
                <th className="px-5 py-3">Điều kiện OJT</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Ngày gửi</th>
                <th className="px-5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      disabled={application.status !== "Chờ duyệt"}
                      checked={selectedIds.includes(application.id)}
                      onChange={() => toggleSelected(application.id)}
                    />
                  </td>

                  <td className="px-5 py-4 font-semibold text-orange-600">
                    {application.studentCode}
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {application.fullName}
                  </td>

                  <td className="px-5 py-4">
                    <p>{application.cohort}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {application.studentClass}
                    </p>
                  </td>

                  <td className="px-5 py-4 font-semibold">
                    {application.gpa.toFixed(3)}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">
                      {application.company}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {application.position}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        ELIGIBILITY_STYLE[application.eligibility.status]
                      }`}
                    >
                      {application.eligibility.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLE[application.status]
                      }`}
                    >
                      {application.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {application.submittedAt}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(application)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-orange-600 hover:bg-orange-50"
                    >
                      <Eye size={16} />
                      Xem
                    </button>
                  </td>
                </tr>
              ))}

              {filteredApplications.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Không tìm thấy hồ sơ phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {/* REGISTRATION PERIOD MODAL */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Chỉnh sửa đợt đăng ký OJT
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Thiết lập kỳ và thời gian nhận hồ sơ đăng ký OJT.
                </p>
              </div>

              <button
                type="button"
                onClick={closePeriodModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Tên đợt đăng ký
                </label>

                <input
                  type="text"
                  value={periodForm.name}
                  onChange={(event) =>
                    setPeriodForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Kỳ OJT
                </label>

                <select
                  value={periodForm.term}
                  onChange={(event) =>
                    setPeriodForm((prev) => ({
                      ...prev,
                      term: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value="Spring 2026">Spring 2026</option>
                  <option value="Summer 2026">Summer 2026</option>
                  <option value="Fall 2026">Fall 2026</option>
                  <option value="Spring 2027">Spring 2027</option>
                  <option value="Summer 2027">Summer 2027</option>
                  <option value="Fall 2027">Fall 2027</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Ngày mở đăng ký
                  </label>

                  <input
                    type="date"
                    value={periodForm.startDate}
                    onChange={(event) =>
                      setPeriodForm((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Hạn đăng ký
                  </label>

                  <input
                    type="date"
                    value={periodForm.endDate}
                    min={periodForm.startDate}
                    onChange={(event) =>
                      setPeriodForm((prev) => ({
                        ...prev,
                        endDate: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm leading-6 text-blue-700">
                  Sau này khi có backend, trạng thái mở/đóng có thể được cập
                  nhật tự động theo ngày bắt đầu và hạn đăng ký. Hiện tại đây là
                  dữ liệu mock frontend.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={closePeriodModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSavePeriod}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationOjtApplicationReview;
