import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Send,
  AlertCircle,
  Filter,
  Search,
  Building2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  FileText,
  CheckSquare,
  Square,
  X,
  Layers,
  ArrowRight,
  Check,
  CalendarCheck,
  AlertTriangle,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  getAcademicPeriods,
  listStudentsInSemester,
  listRegistrationWindows,
  createRegistrationWindow,
  updateRegistrationWindow,
  openRegistrationWindow,
  closeRegistrationWindow,
} from '@/services/qhdnService';
import type {
  AcademicPeriodItem,
  RegistrationWindowItem,
  HandoffStudentItem,
} from '@/types/qhdn/qhdnTypes';

export const QhdnRegistrationWindows: React.FC = () => {
  // -------------------------------------------------------------
  // STATE: Periods, Years, Semesters
  // -------------------------------------------------------------
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriodItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | 'ALL'>('ALL');
  const [selectedOjtSemesterId, setSelectedOjtSemesterId] = useState<number | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(true);

  // -------------------------------------------------------------
  // STATE: Students & Windows for Selected Semester
  // -------------------------------------------------------------
  const [students, setStudents] = useState<HandoffStudentItem[]>([]);
  const [windows, setWindows] = useState<RegistrationWindowItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Filters inside students tab
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Active view tab: 'students' | 'windows'
  const [activeTab, setActiveTab] = useState<'students' | 'windows'>('students');

  // Checkbox selection for bulk action
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // -------------------------------------------------------------
  // STATE: Modals & Feedback
  // -------------------------------------------------------------
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [submittingBulk, setSubmittingBulk] = useState<boolean>(false);

  // Bulk Modal Form fields
  const [windowName, setWindowName] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');
  const [reason, setReason] = useState<string>('Mở đợt đăng ký OJT cho danh sách sinh viên đủ điều kiện do Phòng Đào tạo bàn giao');
  const [autoOpen, setAutoOpen] = useState<boolean>(true);

  // Extend window modal
  const [extendingWindow, setExtendingWindow] = useState<RegistrationWindowItem | null>(null);
  const [extendEndsAt, setExtendEndsAt] = useState<string>('');
  const [extendReason, setExtendReason] = useState<string>('Gia hạn thời gian nộp hồ sơ OJT');
  const [submittingExtend, setSubmittingExtend] = useState<boolean>(false);

  // Student detail modal
  const [inspectStudent, setInspectStudent] = useState<HandoffStudentItem | null>(null);

  // Toast alert
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // -------------------------------------------------------------
  // 1. FETCH ACADEMIC PERIODS ON MOUNT
  // -------------------------------------------------------------
  const loadAcademicPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const res = await getAcademicPeriods({ limit: 100 });
      if (res && res.items) {
        setAcademicPeriods(res.items);

        // Find initial semester: Look for one with an active/planned ojtSemester
        const withOjt = res.items.filter((p) => p.ojtSemesterId || p.ojt?.id);
        if (withOjt.length > 0) {
          const firstOjt = withOjt[0];
          const semId = firstOjt.ojtSemesterId || firstOjt.ojt?.id || null;
          setSelectedYearId(firstOjt.academicYearId || 'ALL');
          setSelectedOjtSemesterId(semId);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách kỳ học:', err);
      showToast('error', 'Không thể tải danh sách năm học và kỳ học. Vui lòng thử lại.');
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    loadAcademicPeriods();
  }, []);

  // -------------------------------------------------------------
  // 2. EXTRACT YEARS & OJT SEMESTERS
  // -------------------------------------------------------------
  const academicYears = useMemo(() => {
    const map = new Map<number, { id: number; code: string; status?: string }>();
    academicPeriods.forEach((p) => {
      if (p.academicYearId && p.academicYear) {
        map.set(p.academicYearId, {
          id: p.academicYearId,
          code: p.academicYear.code,
          status: p.academicYear.status,
        });
      }
    });
    return Array.from(map.values());
  }, [academicPeriods]);

  // Semesters initialized by Academic that have OJT
  const availableOjtSemesters = useMemo(() => {
    const list: Array<{
      ojtSemesterId: number;
      name: string;
      code: string;
      academicYearId: number;
      academicYearCode?: string;
      status: string;
      startDate: string;
      endDate: string;
      regStartDate?: string | null;
      regEndDate?: string | null;
    }> = [];

    const seenIds = new Set<number>();

    academicPeriods.forEach((p) => {
      const ojtId = p.ojtSemesterId || p.ojt?.id;
      if (ojtId && !seenIds.has(ojtId)) {
        seenIds.add(ojtId);
        const name = p.ojt?.name || p.name || `Kỳ OJT #${ojtId}`;
        const code = p.ojt?.semesterCode || p.periodCode || `OJT-${ojtId}`;
        const status = p.ojt?.status || p.status || 'ACTIVE';
        const startDate = p.ojt?.startDate || p.startDate;
        const endDate = p.ojt?.endDate || p.endDate;
        const regStartDate = p.ojt?.regStartDate || null;
        const regEndDate = p.ojt?.regEndDate || null;

        list.push({
          ojtSemesterId: ojtId,
          name,
          code,
          academicYearId: p.academicYearId,
          academicYearCode: p.academicYear?.code,
          status,
          startDate,
          endDate,
          regStartDate,
          regEndDate,
        });
      }
    });

    // Filter by selected year if not 'ALL'
    if (selectedYearId !== 'ALL') {
      return list.filter((s) => s.academicYearId === selectedYearId);
    }
    return list;
  }, [academicPeriods, selectedYearId]);

  // Current selected semester object
  const currentSemester = useMemo(() => {
    return availableOjtSemesters.find((s) => s.ojtSemesterId === selectedOjtSemesterId) || null;
  }, [availableOjtSemesters, selectedOjtSemesterId]);

  // When selectedYearId changes, if current semester is not in the list, auto-select first
  useEffect(() => {
    if (availableOjtSemesters.length > 0) {
      const exists = availableOjtSemesters.some((s) => s.ojtSemesterId === selectedOjtSemesterId);
      if (!exists) {
        setSelectedOjtSemesterId(availableOjtSemesters[0].ojtSemesterId);
      }
    } else {
      setSelectedOjtSemesterId(null);
    }
  }, [selectedYearId, availableOjtSemesters]);

  // -------------------------------------------------------------
  // 3. FETCH STUDENTS & WINDOWS FOR SELECTED SEMESTER
  // -------------------------------------------------------------
  const loadSemesterData = async (semesterId: number) => {
    setLoadingData(true);
    try {
      const [stuRes, winRes] = await Promise.all([
        listStudentsInSemester(semesterId, { limit: 200 }),
        listRegistrationWindows({ ojtSemesterId: semesterId, limit: 100 }),
      ]);

      if (stuRes && stuRes.data) {
        setStudents(stuRes.data.items || []);
      } else {
        setStudents([]);
      }

      if (winRes && winRes.data) {
        setWindows(winRes.data.items || []);
      } else {
        setWindows([]);
      }

      // Reset selection
      setSelectedStudentIds([]);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu sinh viên/đợt đăng ký:', err);
      showToast('error', 'Không thể tải danh sách sinh viên hoặc đợt đăng ký.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedOjtSemesterId) {
      loadSemesterData(selectedOjtSemesterId);
    } else {
      setStudents([]);
      setWindows([]);
      setSelectedStudentIds([]);
    }
  }, [selectedOjtSemesterId]);

  // -------------------------------------------------------------
  // 4. FILTER STUDENTS
  // -------------------------------------------------------------
  const programsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      const prog = s.programName || s.program?.name;
      if (prog) set.add(prog);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        s.fullName?.toLowerCase().includes(search) ||
        s.studentCode?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search);

      // Program
      const prog = s.programName || s.program?.name;
      const matchProgram = filterProgram === 'ALL' || prog === filterProgram;

      // Status
      let matchStatus = true;
      if (filterStatus === 'NOT_REGISTERED') {
        matchStatus = !s.registration || s.registrationStatus === 'NOT_REGISTERED';
      } else if (filterStatus === 'REGISTERED') {
        matchStatus = !!s.registration && s.registrationStatus !== 'NOT_REGISTERED';
      } else if (filterStatus === 'APPROVED') {
        matchStatus = s.registrationStatus === 'APPROVED';
      } else if (filterStatus === 'COORDINATED') {
        matchStatus = !!s.coordinationId;
      }

      return matchSearch && matchProgram && matchStatus;
    });
  }, [students, searchTerm, filterProgram, filterStatus]);

  // -------------------------------------------------------------
  // 5. BULK SELECTION LOGIC
  // -------------------------------------------------------------
  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.includes(s.studentId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect filtered
      const filteredIds = new Set(filteredStudents.map((s) => s.studentId));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered
      const combined = new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.studentId)]);
      setSelectedStudentIds(Array.from(combined));
    }
  };

  const toggleSelectStudent = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // -------------------------------------------------------------
  // 6. OPEN BULK REGISTRATION MODAL
  // -------------------------------------------------------------
  const handleOpenBulkModal = () => {
    if (!selectedOjtSemesterId || !currentSemester) {
      showToast('error', 'Vui lòng chọn Học kỳ OJT trước khi mở đợt đăng ký.');
      return;
    }

    // Default dates
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalDatetime = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setWindowName(`Đợt mở đăng ký OJT - ${currentSemester.name}`);
    setStartsAt(toLocalDatetime(now));
    setEndsAt(toLocalDatetime(future));
    setReason('Mở đợt đăng ký OJT cho danh sách sinh viên đủ điều kiện do Phòng Đào tạo bàn giao');
    setAutoOpen(true);
    setShowBulkModal(true);
  };

  // Submit Bulk Registration Window
  const handleSubmitBulkRegistration = async () => {
    if (!selectedOjtSemesterId) return;

    // Scope student IDs: if user selected checkboxes, use those; otherwise use all eligible students in semester
    const targetStudentIds =
      selectedStudentIds.length > 0
        ? selectedStudentIds
        : students.map((s) => s.studentId);

    if (targetStudentIds.length === 0) {
      showToast('error', 'Không có sinh viên nào để áp dụng đợt đăng ký.');
      return;
    }

    if (!windowName.trim()) {
      showToast('error', 'Vui lòng nhập tên đợt đăng ký.');
      return;
    }

    if (!startsAt || !endsAt) {
      showToast('error', 'Vui lòng chọn thời gian bắt đầu và kết thúc.');
      return;
    }

    const startDateObj = new Date(startsAt);
    const endDateObj = new Date(endsAt);

    if (endDateObj <= startDateObj) {
      showToast('error', 'Thời hạn kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    setSubmittingBulk(true);
    try {
      // 1. Create Window (creates in DRAFT)
      const createRes = await createRegistrationWindow({
        ojtSemesterId: selectedOjtSemesterId,
        name: windowName.trim(),
        startsAt: startDateObj.toISOString(),
        endsAt: endDateObj.toISOString(),
        scope: {
          studentIds: targetStudentIds,
        },
        reason: reason.trim(),
      });

      if (!createRes.success || !createRes.data?.id) {
        throw new Error('Tạo đợt đăng ký thất bại.');
      }

      const newWindowId = createRes.data.id;

      // 2. If autoOpen is selected, activate status to OPEN
      if (autoOpen) {
        await openRegistrationWindow(
          newWindowId,
          reason.trim() || 'Mở cổng tiếp nhận đăng ký OJT cho sinh viên'
        );
      }

      showToast(
        'success',
        `Đã tạo và ${autoOpen ? 'mở' : 'lưu bản nháp'} đợt đăng ký OJT thành công cho ${targetStudentIds.length} sinh viên đủ điều kiện!`
      );

      setShowBulkModal(false);
      // Reload semester data
      await loadSemesterData(selectedOjtSemesterId);
    } catch (err: any) {
      console.error('Lỗi khi mở đợt đăng ký:', err);
      const errMsg =
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo đợt đăng ký OJT.';
      showToast('error', errMsg);
    } finally {
      setSubmittingBulk(false);
    }
  };

  // -------------------------------------------------------------
  // 7. WINDOW ACTIONS: OPEN, CLOSE, EXTEND
  // -------------------------------------------------------------
  const handleToggleWindowStatus = async (window: RegistrationWindowItem) => {
    if (!window.id) return;
    try {
      if (window.status === 'OPEN') {
        await closeRegistrationWindow(window.id, 'Đóng đợt đăng ký OJT theo chỉ đạo của QHDN');
        showToast('info', `Đã đóng đợt đăng ký "${window.name}".`);
      } else {
        await openRegistrationWindow(window.id, 'Mở lại đợt đăng ký OJT cho sinh viên');
        showToast('success', `Đã mở đợt đăng ký "${window.name}".`);
      }
      if (selectedOjtSemesterId) {
        await loadSemesterData(selectedOjtSemesterId);
      }
    } catch (err: any) {
      console.error('Lỗi khi đổi trạng thái đợt:', err);
      showToast('error', err?.response?.data?.message || 'Không thể thay đổi trạng thái đợt.');
    }
  };

  const handleOpenExtendModal = (win: RegistrationWindowItem) => {
    setExtendingWindow(win);
    const d = new Date(win.endsAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    setExtendEndsAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setExtendReason('Gia hạn thêm thời gian đăng ký cho sinh viên');
  };

  const handleSubmitExtend = async () => {
    if (!extendingWindow) return;
    if (!extendEndsAt) {
      showToast('error', 'Vui lòng chọn thời gian kết thúc mới.');
      return;
    }

    setSubmittingExtend(true);
    try {
      await updateRegistrationWindow(extendingWindow.id, {
        endsAt: new Date(extendEndsAt).toISOString(),
        reason: extendReason.trim(),
      });

      showToast('success', `Đã gia hạn thành công đợt "${extendingWindow.name}".`);
      setExtendingWindow(null);
      if (selectedOjtSemesterId) {
        await loadSemesterData(selectedOjtSemesterId);
      }
    } catch (err: any) {
      console.error('Lỗi gia hạn đợt:', err);
      showToast('error', err?.response?.data?.message || 'Không thể gia hạn đợt đăng ký.');
    } finally {
      setSubmittingExtend(false);
    }
  };

  // -------------------------------------------------------------
  // STATS COMPUTATION
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const totalEligible = students.length;
    const registeredCount = students.filter(
      (s) => s.registration && s.registrationStatus !== 'NOT_REGISTERED'
    ).length;
    const coordinatedCount = students.filter((s) => s.coordinationId).length;
    const openWindowsCount = windows.filter((w) => w.status === 'OPEN').length;
    const totalWindowsCount = windows.length;

    return {
      totalEligible,
      registeredCount,
      coordinatedCount,
      openWindowsCount,
      totalWindowsCount,
    };
  }, [students, windows]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Clock className="w-5 h-5 text-blue-600 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:bg-black/5 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Banner */}
      <PageBanner
        title="Tiếp nhận Bàn giao & Mở Đăng ký OJT"
        description="Chọn năm học và học kỳ do Phòng Đào tạo khởi tạo để xem danh sách sinh viên đủ điều kiện bàn giao, quản lý và kích hoạt mở đợt đăng ký OJT hàng loạt."
        badge="Phòng QHDN"
        primaryAction={{
          label: 'Mở đợt đăng ký hàng loạt',
          onClick: handleOpenBulkModal,
          icon: <Send className="w-4 h-4" />,
        }}
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="card-glass p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              SV đủ ĐK bàn giao
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{stats.totalEligible}</span>
              <span className="text-xs font-semibold text-emerald-600">Đã bàn giao</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="card-glass p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đã nộp hồ sơ OJT
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{stats.registeredCount}</span>
              <span className="text-xs text-slate-400">/ {stats.totalEligible} SV</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card-glass p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đã điều phối DN
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{stats.coordinatedCount}</span>
              <span className="text-xs text-slate-400">sinh viên</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="card-glass p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đợt đăng ký OJT
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{stats.openWindowsCount}</span>
              <span className="text-xs font-semibold text-purple-600">Đang mở (OPEN)</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR: Chọn Năm học & Kỳ OJT do Phòng Đào tạo khởi tạo */}
      <div className="card-glass p-5 rounded-2xl border border-slate-200/80 shadow-sm bg-gradient-to-r from-white via-white to-orange-50/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Building2 className="w-4 h-4 text-orange-600" />
              <span>Phòng Đào tạo khởi tạo:</span>
            </div>

            {/* Select Năm Học */}
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-xs font-semibold text-slate-500">
                Năm học:
              </label>
              <select
                id="year-select"
                value={selectedYearId}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedYearId(val);
                }}
                disabled={loadingPeriods}
                className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all text-slate-800"
              >
                <option value="ALL">Tất cả năm học</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    Năm học {y.code} {y.status ? `(${y.status})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Học Kỳ OJT */}
            <div className="flex items-center gap-2">
              <label htmlFor="semester-select" className="text-xs font-semibold text-slate-500">
                Kỳ OJT:
              </label>
              <select
                id="semester-select"
                value={selectedOjtSemesterId ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedOjtSemesterId(val);
                }}
                disabled={loadingPeriods || availableOjtSemesters.length === 0}
                className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-orange-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-900 font-medium"
              >
                {availableOjtSemesters.length === 0 ? (
                  <option value="">Không có kỳ OJT nào</option>
                ) : (
                  availableOjtSemesters.map((s) => (
                    <option key={s.ojtSemesterId} value={s.ojtSemesterId}>
                      {s.name} ({s.code}) - [{s.status}]
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Quick Actions & Semester Status */}
          <div className="flex items-center gap-3">
            {currentSemester && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100/60 border border-orange-200 text-xs font-medium text-orange-800">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>
                  {currentSemester.startDate} → {currentSemester.endDate}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="font-bold uppercase tracking-wider">{currentSemester.status}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (selectedOjtSemesterId) loadSemesterData(selectedOjtSemesterId);
              }}
              disabled={loadingData}
              title="Làm mới dữ liệu"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50/50 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3.5 flex items-center gap-2 transition-all relative ${
            activeTab === 'students'
              ? 'text-orange-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Danh sách sinh viên đủ điều kiện bàn giao</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'students'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {students.length}
          </span>
          {activeTab === 'students' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('windows')}
          className={`pb-3.5 flex items-center gap-2 transition-all relative ${
            activeTab === 'windows'
              ? 'text-orange-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Các đợt mở đăng ký OJT</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'windows'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {windows.length}
          </span>
          {activeTab === 'windows' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DANH SÁCH SINH VIÊN BÀN GIAO & MỞ ĐĂNG KÝ HÀNG LOẠT */}
      {/* ========================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Sub-filter & Search Bar */}
          <div className="card-glass p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo Tên, MSSV, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Program filter */}
              {programsList.length > 0 && (
                <div className="hidden sm:block">
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="ALL">Tất cả chương trình ({programsList.length})</option>
                    {programsList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Registration Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NOT_REGISTERED">Chưa đăng ký</option>
                <option value="REGISTERED">Đã nộp hồ sơ</option>
                <option value="APPROVED">Đã duyệt hồ sơ</option>
                <option value="COORDINATED">Đã điều phối</option>
              </select>
            </div>

            {/* Bulk Action Trigger */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenBulkModal}
                disabled={filteredStudents.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>
                  {selectedStudentIds.length > 0
                    ? `Mở đợt đăng ký (${selectedStudentIds.length} SV đã chọn)`
                    : `Mở đợt cho toàn bộ (${students.length} SV đủ ĐK)`}
                </span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Notice Bar */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-sm font-semibold shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-orange-600" />
                <span>
                  Đang chọn <strong>{selectedStudentIds.length}</strong> sinh viên để mở đợt đăng ký hàng loạt.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="text-xs font-bold text-orange-700 hover:underline hover:text-orange-900"
                >
                  Bỏ chọn tất cả
                </button>
                <button
                  onClick={handleOpenBulkModal}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Tiến hành mở đợt
                </button>
              </div>
            </div>
          )}

          {/* STUDENTS DATA TABLE */}
          <div className="card-glass rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">
                      <button
                        onClick={toggleSelectAll}
                        title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        className="text-slate-400 hover:text-orange-600 transition-colors"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Sinh viên</th>
                    <th className="py-3.5 px-4">Chương trình / Khóa</th>
                    <th className="py-3.5 px-4">Điều kiện OJT (PĐT)</th>
                    <th className="py-3.5 px-4">Bàn giao từ PĐT</th>
                    <th className="py-3.5 px-4">Đợt đăng ký</th>
                    <th className="py-3.5 px-4">Trạng thái OJT</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingData ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                        <span>Đang tải danh sách sinh viên bàn giao từ Phòng Đào tạo...</span>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-slate-600">
                          Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Vui lòng chọn kỳ OJT khác hoặc điều chỉnh từ khóa tìm kiếm.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.studentId);
                      const earnedCr = s.officialEligibility?.result?.earnedCredits;
                      const minCr = s.officialEligibility?.result?.minCredits || 70;
                      const unpassed = s.officialEligibility?.result?.unpassedCourseCount ?? 0;

                      return (
                        <tr
                          key={s.studentId}
                          className={`hover:bg-orange-50/30 transition-colors ${
                            isSelected ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => toggleSelectStudent(s.studentId)}
                              className="text-slate-400 hover:text-orange-600 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-orange-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                {s.fullName ? s.fullName.charAt(0) : 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer"
                                  onClick={() => setInspectStudent(s)}
                                >
                                  {s.fullName || 'Chưa cập nhật'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {s.studentCode}
                                  </span>
                                  <span>{s.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Program & Cohort */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 text-xs line-clamp-1" title={s.programName}>
                              {s.programName || s.program?.name || '—'}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {s.cohortName || s.cohort?.name || 'Khóa OJT'} • Lớp {s.groupCode || 'A'}
                            </p>
                          </td>

                          {/* Official Eligibility from Academic */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" />
                                <span>ĐỦ ĐIỀU KIỆN</span>
                              </span>
                              {earnedCr !== undefined && (
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Tín chỉ: <strong className="text-slate-800">{earnedCr}</strong>/{minCr}
                                  {unpassed > 0 && (
                                    <span className="text-amber-600 ml-1.5">({unpassed} môn nợ)</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Handoff Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">
                                <ShieldCheck className="w-3 h-3 text-purple-600" />
                                <span>ĐÃ BÀN GIAO</span>
                              </span>
                              {s.handoff?.createdByUser && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[140px]" title={s.handoff.reason}>
                                  Bởi {s.handoff.createdByUser.fullName}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Registration Window Assigned */}
                          <td className="py-3.5 px-4">
                            {s.window ? (
                              <div className="space-y-0.5">
                                <p className="font-bold text-xs text-slate-800 line-clamp-1" title={s.window.name}>
                                  {s.window.name}
                                </p>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    s.window.status === 'OPEN'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : s.window.status === 'DRAFT'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {s.window.status}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Chưa mở đợt</span>
                              </span>
                            )}
                          </td>

                          {/* OJT Status */}
                          <td className="py-3.5 px-4">
                            {s.ojtStatus === 'COMPLETED' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                Hoàn thành OJT
                              </span>
                            ) : s.coordinationId ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                Đã điều phối DN
                              </span>
                            ) : s.registrationStatus === 'APPROVED' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                Đã duyệt hồ sơ
                              </span>
                            ) : s.registrationStatus === 'SUBMITTED' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                Chờ duyệt hồ sơ
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                Chưa nộp hồ sơ
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setInspectStudent(s)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span>
                Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> sinh viên đủ điều kiện bàn giao
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Nguồn dữ liệu: Đồng bộ trực tiếp từ Phòng Đào tạo (ACADEMIC)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: QUẢN LÝ CÁC ĐỢT MỞ ĐĂNG KÝ OJT (REGISTRATION WINDOWS) */}
      {/* ========================================================= */}
      {activeTab === 'windows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Các đợt mở đăng ký OJT trong kỳ này
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý các đợt mở đăng ký, kích hoạt trạng thái OPEN cho sinh viên nộp hồ sơ hoặc gia hạn thời gian.
              </p>
            </div>
            <button
              onClick={handleOpenBulkModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Tạo & Mở đợt mới</span>
            </button>
          </div>

          {loadingData ? (
            <div className="card-glass p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
              <span>Đang tải các đợt đăng ký OJT...</span>
            </div>
          ) : windows.length === 0 ? (
            <div className="card-glass p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-extrabold text-slate-700 text-base">
                Chưa có đợt đăng ký OJT nào được mở cho kỳ này
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Hiện tại kỳ OJT này chưa có đợt mở đăng ký. Hãy nhấn nút bên dưới để tạo và mở đợt đăng ký hàng loạt cho sinh viên đủ điều kiện.
              </p>
              <button
                onClick={handleOpenBulkModal}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mở đợt đăng ký OJT hàng loạt ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {windows.map((w) => {
                const isOpen = w.status === 'OPEN';
                const isDraft = w.status === 'DRAFT';
                const isClosed = w.status === 'CLOSED';
                const studentScopeCount = w.scope?.studentIds?.length || 0;

                return (
                  <div
                    key={w.id}
                    className="card-glass p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Status & Title */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDraft
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOpen
                                  ? 'bg-emerald-500 animate-pulse'
                                  : isDraft
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{w.status}</span>
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900 mt-2">
                            {w.name}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-slate-400 font-semibold">
                          #{w.id}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                          <span>
                            Bắt đầu: <strong>{new Date(w.startsAt).toLocaleString('vi-VN')}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            Kết thúc: <strong>{new Date(w.endsAt).toLocaleString('vi-VN')}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            Phạm vi sinh viên: <strong>{studentScopeCount} sinh viên</strong>
                          </span>
                        </div>
                      </div>

                      {/* Creator & reason */}
                      {w.reason && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                          "{w.reason}"
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenExtendModal(w)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Gia hạn hạn chót
                      </button>

                      <div className="flex items-center gap-2">
                        {isDraft && (
                          <button
                            onClick={() => handleToggleWindowStatus(w)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Mở đợt ngay (OPEN)</span>
                          </button>
                        )}
                        {isOpen && (
                          <button
                            onClick={() => handleToggleWindowStatus(w)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Đóng đợt (CLOSE)</span>
                          </button>
                        )}
                        {isClosed && (
                          <button
                            onClick={() => handleToggleWindowStatus(w)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-black text-white text-xs font-bold shadow-sm transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Mở lại đợt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: MỞ ĐỢT ĐĂNG KÝ OJT HÀNG LOẠT (CREATE / OPEN)     */}
      {/* ========================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="card-glass w-full max-w-xl p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Mở đợt đăng ký OJT hàng loạt
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thiết lập đợt đăng ký cho sinh viên đủ điều kiện được bàn giao
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="mt-5 space-y-4 text-sm">
              {/* Semester info */}
              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-900">
                    Học kỳ OJT áp dụng (từ PĐT):
                  </p>
                  <p className="text-sm font-black text-orange-800 mt-0.5">
                    {currentSemester?.name} ({currentSemester?.code})
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-200 text-orange-900 text-xs font-bold uppercase">
                  {currentSemester?.status}
                </span>
              </div>

              {/* Window Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên đợt đăng ký <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={windowName}
                  onChange={(e) => setWindowName(e.target.value)}
                  placeholder="Ví dụ: Đợt mở đăng ký OJT Kỳ 1..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-semibold text-slate-900 text-sm"
                />
              </div>

              {/* Student Scope Scope Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Phạm vi sinh viên áp dụng:</span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-mono font-bold">
                    {selectedStudentIds.length > 0
                      ? `${selectedStudentIds.length} sinh viên đã chọn`
                      : `Toàn bộ ${students.length} sinh viên đủ điều kiện`}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Hệ thống tự động liên kết danh sách StudentID này vào đợt đăng ký. Chỉ những sinh viên thuộc phạm vi mới được phép nộp hồ sơ.
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thời gian bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thời gian kết thúc (Hạn chót) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do mở đợt đăng ký (Yêu cầu hệ thống) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do hoặc quyết định mở đợt..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-xs font-medium text-slate-800"
                />
              </div>

              {/* Auto Open Toggle */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-emerald-900">
                    Kích hoạt mở đợt ngay (Trạng thái OPEN)
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Sinh viên có thể đăng nhập và nộp đơn thực tập OJT ngay sau khi tạo
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoOpen}
                  onChange={(e) => setAutoOpen(e.target.checked)}
                  className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                disabled={submittingBulk}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitBulkRegistration}
                disabled={submittingBulk}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {submittingBulk ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo đợt...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác nhận mở đợt đăng ký</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: GIA HẠN THỜI HẠN ĐỢT ĐĂNG KÝ (EXTEND DEADLINE)   */}
      {/* ========================================================= */}
      {extendingWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="card-glass w-full max-w-md p-6 rounded-3xl border border-slate-200 shadow-2xl bg-white">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Gia hạn đợt đăng ký OJT
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {extendingWindow.name}
                </p>
              </div>
              <button
                onClick={() => setExtendingWindow(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Thời hạn kết thúc mới (Hạn chót mới) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={extendEndsAt}
                  onChange={(e) => setExtendEndsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do gia hạn thời gian <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="Nhập lý do gia hạn..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setExtendingWindow(null)}
                disabled={submittingExtend}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitExtend}
                disabled={submittingExtend}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm"
              >
                {submittingExtend ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Cập nhật hạn chót</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: XEM CHI TIẾT SINH VIÊN BÀN GIAO                  */}
      {/* ========================================================= */}
      {inspectStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="card-glass w-full max-w-lg p-6 rounded-3xl border border-slate-200 shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                  {inspectStudent.fullName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {inspectStudent.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {inspectStudent.studentCode} • {inspectStudent.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Box 1: Điều kiện xét duyệt từ PĐT */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kết quả đủ điều kiện OJT (Phòng Đào tạo xác nhận)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 mt-2">
                  <div>
                    <span className="text-slate-500">Trạng thái:</span>
                    <strong className="block text-emerald-700 font-bold">
                      {inspectStudent.officialEligibility?.status || 'ELIGIBLE'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tín chỉ tích lũy:</span>
                    <strong className="block text-slate-800">
                      {inspectStudent.officialEligibility?.result?.earnedCredits || '—'} /{' '}
                      {inspectStudent.officialEligibility?.result?.minCredits || 70}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Số môn nợ:</span>
                    <strong className="block text-slate-800">
                      {inspectStudent.officialEligibility?.result?.unpassedCourseCount ?? 0}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Ngày PĐT xác nhận:</span>
                    <strong className="block text-slate-800">
                      {inspectStudent.confirmedAt
                        ? new Date(inspectStudent.confirmedAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Box 2: Thông tin bàn giao */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                <h4 className="font-extrabold text-purple-900 flex items-center gap-1.5 mb-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Thông tin bàn giao sang QHDN</span>
                </h4>
                <p className="text-slate-700">
                  Lý do bàn giao:{' '}
                  <strong>{inspectStudent.handoff?.reason || 'Bàn giao danh sách sinh viên đủ điều kiện'}</strong>
                </p>
                {inspectStudent.handoff?.createdByUser && (
                  <p className="text-slate-500 mt-1">
                    Cán bộ bàn giao: <strong>{inspectStudent.handoff.createdByUser.fullName}</strong>
                  </p>
                )}
                {inspectStudent.handoff?.createdAt && (
                  <p className="text-slate-500 mt-0.5">
                    Thời gian:{' '}
                    <strong>{new Date(inspectStudent.handoff.createdAt).toLocaleString('vi-VN')}</strong>
                  </p>
                )}
              </div>

              {/* Box 3: Hồ sơ đăng ký OJT */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Hồ sơ & Đợt đăng ký OJT</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    Đợt đăng ký:{' '}
                    <strong>{inspectStudent.window?.name || 'Chưa được gán vào đợt nào'}</strong>
                  </p>
                  <p>
                    Tình trạng nộp đơn:{' '}
                    <strong>{inspectStudent.registrationStatus || 'NOT_REGISTERED'}</strong>
                  </p>
                  {inspectStudent.registration?.application && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600">
                      <p>
                        Email liên hệ:{' '}
                        <strong>{inspectStudent.registration.application.contactEmail || '—'}</strong>
                      </p>
                      <p>
                        SĐT liên hệ:{' '}
                        <strong>{inspectStudent.registration.application.contactPhone || '—'}</strong>
                      </p>
                      {inspectStudent.registration.application.note && (
                        <p className="italic mt-1">
                          Ghi chú: "{inspectStudent.registration.application.note}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QhdnRegistrationWindows;
