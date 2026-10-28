import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Building2,
  FileCheck2,
  ClipboardCheck,
  ListChecks,
  Loader2,
  AlertCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { enterpriseService, type EnterpriseInternshipTask } from '@/services/enterpriseService';
import { EnterpriseProfileData } from '@/types/enterprise/enterpriseTypes';
import { Link } from 'react-router-dom';
import { useEnterprise } from '@/contexts/EnterpriseContext';

interface StudentTaskProgress {
  studentId: number;
  studentName: string;
  studentCode: string;
  completed: number;
  inProgress: number;
  todo: number;
  total: number;
}

const buildTaskProgress = (tasks: EnterpriseInternshipTask[]): StudentTaskProgress[] => {
  const progressByStudent = new Map<number, StudentTaskProgress>();

  for (const task of tasks) {
    const progress = progressByStudent.get(task.studentId) ?? {
      studentId: task.studentId,
      studentName: task.student?.fullName || 'Sinh viên',
      studentCode: task.student?.studentCode || '',
      completed: 0,
      inProgress: 0,
      todo: 0,
      total: 0,
    };
    const status = task.status.toUpperCase();
    progress.total += 1;
    if (status === 'DONE' || status === 'COMPLETED') {
      progress.completed += 1;
    } else if (status === 'IN_PROGRESS') {
      progress.inProgress += 1;
    } else {
      progress.todo += 1;
    }
    progressByStudent.set(task.studentId, progress);
  }

  return [...progressByStudent.values()].sort(
    (a, b) => b.total - a.total || a.studentName.localeCompare(b.studentName)
  );
};

export const EnterpriseDashboard: React.FC = () => {
  // Lấy profile và companyId từ EnterpriseContext (đã load sẵn — không gọi API lại)
  const { profile, companyId, loading, error: profileError } = useEnterprise();
  const [taskProgress, setTaskProgress] = useState<StudentTaskProgress[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState({
    studentId: '',
    severity: 'MEDIUM',
    title: '',
    description: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Chờ companyId sẵn có mới gọi API tasks
    if (!companyId) return;
    const loadTaskProgress = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        // Truyền companyId — bắt buộc để backend scope đúng doanh nghiệp
        const firstPage = await enterpriseService.listInternshipTasks(companyId, { page: 1, limit: 100 });
        if (!firstPage?.success || !firstPage.data) {
          throw new Error('Không thể tải dữ liệu tiến độ task');
        }

        const tasks = [...firstPage.data.items];
        const totalPages = Math.ceil(firstPage.data.total / firstPage.data.limit);
        for (let page = 2; page <= totalPages; page += 1) {
          const response = await enterpriseService.listInternshipTasks(companyId, { page, limit: 100 });
          if (!response?.success || !response.data) {
            throw new Error(`Không thể tải dữ liệu task ở trang ${page}`);
          }
          tasks.push(...response.data.items);
        }

        setTaskProgress(buildTaskProgress(tasks));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu tiến độ task';
        setTasksError(message);
        console.error('Failed to load enterprise task progress:', err);
      } finally {
        setTasksLoading(false);
      }
    };

    void loadTaskProgress();
  }, [companyId]);

  const handleSendIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Đã gửi báo cáo sự cố về Phòng QHDN Trường FPT thành công!');
    setShowIncidentModal(false);
    setIncidentReport({ studentId: '', severity: 'MEDIUM', title: '', description: '' });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const summary = profile?.summary;
  const companyName = profile?.name || 'Doanh nghiệp Đối tác';

  return (
    <div className="space-y-5 pb-12">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/15 sm:px-9 sm:py-10">
        <div className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 -z-10 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-100 backdrop-blur">
              <Building2 className="h-3.5 w-3.5 text-orange-300" />
              <span>CỔNG QUẢN LÝ THỰC TẬP DOANH NGHIỆP</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {companyName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-indigo-100/80">
              Tiếp nhận ứng viên, theo dõi tiến độ công việc và đồng hành cùng sinh viên trong kỳ thực tập OJT.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
              profile?.status === 'ACTIVE'
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : 'border-white/15 bg-white/10 text-indigo-100'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${profile?.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            {profile?.status === 'ACTIVE' ? 'Đối tác chính thức' : 'Doanh nghiệp đối tác'}
          </span>
        </div>
      </section>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: 'Hồ sơ chờ xét duyệt',
            value: summary?.pendingCandidates ?? 0,
            unit: 'ứng viên',
            detail: 'Ứng tuyển vào doanh nghiệp',
            icon: Users,
            color: 'blue',
            to: '/enterprise/candidates',
          },
          {
            label: 'Sinh viên đang thực tập',
            value: summary?.activeInterns ?? 0,
            unit: 'sinh viên',
            detail: 'Đang tham gia kỳ OJT',
            icon: UserCheck,
            color: 'emerald',
            to: '/enterprise/interns',
          },
          {
            label: 'Đánh giá OJT chờ xử lý',
            value: summary?.pendingEvaluations ?? 0,
            unit: 'phiếu',
            detail: 'Cần hoàn tất đánh giá',
            icon: FileCheck2,
            color: 'violet',
            to: '/enterprise/evaluation',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const colors = {
            blue: 'bg-blue-50 text-blue-600 ring-blue-100',
            emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
            violet: 'bg-violet-50 text-violet-600 ring-violet-100',
          }[stat.color];
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {loading ? '...' : stat.value}
                    <span className="ml-1.5 text-xs font-medium text-slate-400">{stat.unit}</span>
                  </p>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${colors}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">{stat.detail}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <ListChecks className="h-5 w-5 text-orange-500" />
              Tiến độ Task của sinh viên
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Tỷ lệ task đã hoàn thành trên tổng số task được giao.
            </p>
          </div>
          <Link
            to="/enterprise/interns"
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            Quản lý task
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 sm:p-6">
          {tasksLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
              <p className="text-xs font-medium text-slate-500">Đang tải tiến độ task...</p>
            </div>
          ) : tasksError ? (
            <div className="rounded-xl bg-rose-50 p-5 text-center">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-500" />
              <p className="text-sm font-medium text-rose-700">{tasksError}</p>
            </div>
          ) : taskProgress.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
              <ListChecks className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Chưa có task để thống kê.</p>
              <p className="mt-1 text-xs text-slate-400">
                Tiến độ sẽ hiển thị tại đây khi task được giao cho sinh viên.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500">
                <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />Tỷ lệ task đã hoàn thành</span>
              </div>

              <div className="flex">
                <div className="flex h-56 w-9 shrink-0 flex-col justify-between pb-8 pr-2 text-right text-[10px] text-slate-400">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                <div className="min-w-0 flex-1 overflow-x-auto">
                  <div
                    className="relative h-56"
                    style={{ minWidth: `${Math.max(100, taskProgress.length * 76)}px` }}
                  >
                    <div className="absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((tick) => (
                        <span key={tick} className="border-t border-dashed border-slate-200" />
                      ))}
                    </div>

                    <div className="absolute inset-0 flex gap-2">
                      {taskProgress.map((student) => {
                        const completion = Math.round((student.completed / student.total) * 100);
                        const barHeight = completion * (192 / 224);
                        return (
                          <div
                            key={student.studentId}
                            className="relative h-full min-w-0 flex-1"
                            role="img"
                            aria-label={`${student.studentName}: ${completion}% hoàn thành, ${student.completed} task xong, ${student.inProgress} đang làm, ${student.todo} chưa bắt đầu`}
                          >
                            <span
                              className="absolute z-10 w-full rounded bg-white/90 text-center text-[10px] font-bold text-slate-600"
                              style={{ top: `${Math.max(0, 192 - barHeight - 16)}px` }}
                            >
                              {completion}%
                            </span>
                            <div
                              className="absolute bottom-8 left-1/2 w-8 -translate-x-1/2 rounded-t-md bg-emerald-500 shadow-sm transition-all hover:w-10 hover:bg-emerald-600 sm:w-10 sm:hover:w-12"
                              style={{ height: `${barHeight}%` }}
                              title={`${student.studentName}: ${student.completed}/${student.total} hoàn thành, ${student.inProgress} đang làm, ${student.todo} chưa bắt đầu`}
                            />
                            <div className="absolute inset-x-0 bottom-0 h-8 overflow-hidden text-center">
                              <p className="truncate text-[10px] font-semibold text-slate-700">
                                {student.studentCode || student.studentName}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                {student.completed}/{student.total} task
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left Column (2 cols): Summary overview & Quick Navigation */}
        <div className="space-y-5 xl:col-span-2">
          {/* Card: Hồ sơ Sinh viên Chờ duyệt Tiếp nhận */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Sinh viên Chờ duyệt</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sinh viên đăng ký OJT nguyện vọng vào doanh nghiệp
                </p>
              </div>
              <Link
                to="/enterprise/candidates"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-5 sm:p-6">
              {summary && summary.pendingCandidates > 0 ? (
                <div className="flex flex-col gap-4 rounded-xl bg-orange-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                      <Users className="h-5 w-5" />
                    </span>
                    <p className="text-sm text-slate-700">
                      Có <strong>{summary.pendingCandidates}</strong> ứng viên mới cần duyệt hồ sơ.
                    </p>
                  </div>
                    <Link
                      to="/enterprise/candidates"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                    >
                      <span>Vào duyệt hồ sơ ngay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-xl bg-slate-50 px-4 py-7 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    Hiện chưa có hồ sơ ứng viên nào đang chờ duyệt tiếp nhận.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Hồ sơ mới đăng ký của sinh viên sẽ tự động hiển thị tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1 col): Thao tác nhanh & Thông tin doanh nghiệp */}
        <div className="space-y-5">
          {/* Action Hub Card */}
          <div className="space-y-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-lg sm:p-6">
            <h3 className="flex items-center gap-2 font-bold text-base text-amber-300">
              <TrendingUp className="h-5 w-5" />
              Thao tác nhanh
            </h3>
            <p className="text-xs leading-relaxed text-slate-300">
              Truy cập nhanh các công việc quản lý ứng viên và thực tập.
            </p>

            <div className="space-y-2 pt-1">
              <Link
                to="/enterprise/profile"
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/10 p-3 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-orange-300" />
                  <span>Hồ sơ doanh nghiệp ({profile?.code || '...'})</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/candidates"
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/10 p-3 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-300" />Duyệt hồ sơ ứng viên</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/interns"
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/10 p-3 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                <span className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-300" />Theo dõi sinh viên thực tập</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/evaluation"
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/10 p-3 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                <span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-violet-300" />Đánh giá kết quả OJT</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Quick Enterprise Info Card */}
          {profile && (
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-xs shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Thông tin liên hệ HR</span>
                <Link
                  to="/enterprise/profile"
                  className="text-orange-600 hover:underline font-semibold text-[11px]"
                >
                  Xem chi tiết
                </Link>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <p>
                  Đại diện: <strong>{profile.contactPersonName}</strong>
                </p>
                <p>
                  Email: <strong>{profile.contactEmail}</strong>
                </p>
                <p>
                  Ngành nghề: <strong>{profile.industry}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Báo cáo Sự cố Phát sinh về Phòng QHDN</span>
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã hoặc Tên sinh viên phát sinh sự cố
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SE170012 - Phạm Minh Tuấn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.studentId}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, studentId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ sự cố
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.severity}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, severity: e.target.value })
                  }
                >
                  <option value="LOW">Thấp (Nhắc nhở nội bộ)</option>
                  <option value="MEDIUM">Trung bình (Vắng 3 ngày không phép / Chậm tiến độ)</option>
                  <option value="HIGH">Nghiêm trọng (Vi phạm bảo mật / Tự ý bỏ thực tập)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề báo cáo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sinh viên nghỉ tự do 3 ngày liên tiếp không lý do"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.title}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết sự việc
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả hoàn cảnh, thái độ và đề xuất phương án xử lý từ phía Doanh nghiệp..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.description}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo sự cố</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseDashboard;
