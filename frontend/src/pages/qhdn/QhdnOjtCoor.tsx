import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Handshake,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  X,
  Calendar,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Building2,
  Check,
  UserCheck,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { StudentDetailModal } from '@/components/qhdn/coordination/StudentDetailModal';
import { StudentMatchModal } from '@/components/qhdn/coordination/StudentMatchModal';
import {
  listPositions,
  listCompanies,
  searchOjtSemesters,
  listStudentsInSemester,
  listCoordinations,
  coordinateStudent,
  reassignStudent,
  recordEnterpriseDecision,
  createAssignment,
  generateIdempotencyKey,
} from '@/services/qhdnService';

import type {
  EligibleStudent,
  EnterprisePartner,
  InternshipPosition,
  OjtSemesterItem,
  HandoffStudentItem,
  CoordinationItem,
} from '@/types/qhdn/qhdnTypes';

const PAGE_SIZE = 10;

export const QhdnOjtCoordination: React.FC = () => {
  const navigate = useNavigate();
  // Semester states
  const [ojtSemesters, setOjtSemesters] = useState<OjtSemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Position & Partner states
  const [positions, setPositions] = useState<InternshipPosition[]>([]);
  const [partners, setPartners] = useState<EnterprisePartner[]>([]);

  // Students state with full coordination metadata
  const [students, setStudents] = useState<
    (EligibleStudent & {
      cohort: string;
      semester: string;
      registrationId?: number;
      coordinationId?: number;
    })[]
  >([]);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter States
  const [activeStatusTab, setActiveStatusTab] = useState<
    'ALL' | 'Unassigned' | 'Pending Response' | 'Accepted' | 'Rejected'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States: Student Detail & Match/Assign
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [selectedStudentForMatch, setSelectedStudentForMatch] = useState<any | null>(null);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>('');
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Fetch OJT Semesters from API
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await searchOjtSemesters({ page: 1, limit: 50 });
        if (res?.items && res.items.length > 0) {
          setOjtSemesters(res.items);
          const active = res.items.find((s) => s.status === 'ACTIVE') || res.items[0];
          setSelectedSemesterId(active.id);
        }
      } catch (err) {
        console.warn('Không thể tải danh sách kỳ OJT:', err);
      }
    };
    fetchSemesters();
  }, []);

  // 2. Fetch Companies & Positions
  const fetchEnterpriseCatalog = async (semesterId: number) => {
    try {
      const [compRes, posRes] = await Promise.allSettled([
        listCompanies({ page: 1, limit: 100 }),
        listPositions({ page: 1, limit: 100, ojtSemesterId: semesterId }),
      ]);

      const compItems = compRes.status === 'fulfilled' ? compRes.value.data.items : [];
      const posItems = posRes.status === 'fulfilled' ? posRes.value.data.items : [];

      const mappedPositions: InternshipPosition[] = posItems.map((item) => ({
        id: String(item.id),
        enterpriseId: String(item.companyId),
        enterpriseName: item.company?.name || item.companyName || 'Doanh nghiệp',
        title: item.title,
        department: '',
        location: item.location || 'Chưa cập nhật',
        workType:
          item.workMode === 'REMOTE'
            ? 'Remote'
            : item.workMode === 'HYBRID'
              ? 'Hybrid'
              : 'Onsite',
        stipend: 'Chưa cập nhật',
        totalSlots: item.capacity,
        filledSlots: Math.max(0, item.capacity - item.remainingSlots),
        requiredSkills: [],
        description: item.description,
        requirements: item.requirements,
        status: item.status === 'OPEN' ? 'Open' : 'Closed',
      }));

      setPositions(mappedPositions);

      const mappedPartners: EnterprisePartner[] = compItems.map((comp) => {
        const compPositions = posItems.filter((p) => p.companyId === comp.id);
        const totalQuota = compPositions.reduce((sum, p) => sum + (p.capacity || 0), 0);
        const remaining = compPositions.reduce((sum, p) => sum + (p.remainingSlots || 0), 0);

        return {
          id: String(comp.id),
          name: comp.name,
          code: comp.code,
          industry: comp.industry || 'Công nghệ thông tin',
          tier: 'Tier-1 Gold',
          contactPerson: comp.contactPersonName || 'Chưa cập nhật',
          contactEmail: comp.contactEmail || '',
          contactPhone: comp.contactPhone || '',
          address: comp.address || 'Chưa cập nhật',
          mouStatus: 'Active',
          mouSignedDate: '',
          mouExpiryDate: '',
          totalQuota,
          acceptedCount: Math.max(0, totalQuota - remaining),
          availableQuota: remaining,
        };
      });

      setPartners(mappedPartners);
    } catch (err) {
      console.error('Lỗi khi tải danh mục vị trí & doanh nghiệp:', err);
    }
  };

  // 3. Fetch Students & Coordinations in Selected Semester
  const fetchStudentsAndCoordinations = async (semesterId: number) => {
    setIsLoading(true);
    try {
      const [studentsRes, coordinationsRes] = await Promise.allSettled([
        listStudentsInSemester(semesterId, { page: 1, limit: 100 }),
        listCoordinations({ page: 1, limit: 100, ojtSemesterId: semesterId }),
      ]);

      const handoffStudents: HandoffStudentItem[] =
        studentsRes.status === 'fulfilled' ? studentsRes.value.data.items || [] : [];
      const coordinations: CoordinationItem[] =
        coordinationsRes.status === 'fulfilled' ? coordinationsRes.value.data.items || [] : [];

      const coordinationMap = new Map<number, CoordinationItem>();
      coordinations.forEach((coor) => {
        if (coor.registrationId) {
          coordinationMap.set(coor.registrationId, coor);
        }
      });

      const currentSemObj = ojtSemesters.find((s) => s.id === semesterId);
      const semLabel = currentSemObj?.name || currentSemObj?.code || `Kỳ #${semesterId}`;

      const mapped = handoffStudents.map((std) => {
        const regId = std.registration?.id;
        const coor = regId ? coordinationMap.get(regId) : undefined;

        let coordinationStatus: 'Unassigned' | 'Pending Response' | 'Accepted' | 'Rejected' =
          'Unassigned';
        let assignedEntName = std.enterpriseName;
        let assignedPosTitle = std.positionTitle;
        let rejectReason: string | undefined = undefined;

        const effectiveDecision = coor?.decision || std.coordination?.decision;

        if (effectiveDecision === 'ACCEPTED') {
          coordinationStatus = 'Accepted';
          assignedEntName = coor?.company?.name || std.enterpriseName;
          assignedPosTitle = coor?.position?.title || std.positionTitle;
        } else if (effectiveDecision === 'REJECTED') {
          coordinationStatus = 'Rejected';
          assignedEntName = coor?.company?.name || std.enterpriseName;
          rejectReason = coor?.rejectReason || std.coordination?.rejectReason || 'Không phù hợp yêu cầu';
        } else if (effectiveDecision === 'PENDING' || coor || std.coordination) {
          coordinationStatus = 'Pending Response';
          assignedEntName = coor?.company?.name || std.enterpriseName;
          assignedPosTitle = coor?.position?.title || std.positionTitle;
        }

        return {
          id: String(std.studentId),
          studentCode: std.studentCode,
          fullName: std.fullName,
          major: std.major || 'Kỹ thuật Phần mềm',
          gpa: std.gpa || 3.0,
          completedCredits: 90,
          readinessScore: 85,
          ojtEligibilityStatus: 'Qualified' as const,
          englishLevel: std.englishLevel || 'B2',
          topSkills: ['React', 'Node.js', 'SQL'],
          assignedEnterpriseId: coor?.companyId ? String(coor.companyId) : undefined,
          assignedEnterpriseName: assignedEntName,
          assignedPositionId: coor?.positionId ? String(coor.positionId) : undefined,
          assignedPositionTitle: assignedPosTitle,
          coordinationStatus,
          rejectionReason: rejectReason,
          cohort: std.cohortName || 'K18',
          semester: semLabel,
          registrationId: regId,
          coordinationId: coor?.id || std.coordination?.id,
        };
      });

      setStudents(mapped);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sinh viên bàn giao:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSemesterId) {
      fetchEnterpriseCatalog(selectedSemesterId);
      fetchStudentsAndCoordinations(selectedSemesterId);
    }
  }, [selectedSemesterId, ojtSemesters]);

  // Counts for tabs
  const rejectedCount = students.filter((s) => s.coordinationStatus === 'Rejected').length;
  const unassignedCount = students.filter((s) => s.coordinationStatus === 'Unassigned').length;
  const pendingCount = students.filter((s) => s.coordinationStatus === 'Pending Response').length;
  const acceptedCount = students.filter((s) => s.coordinationStatus === 'Accepted').length;

  // Filter logic
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter((std) => {
      const matchesSearch =
        !query ||
        std.fullName.toLowerCase().includes(query) ||
        std.studentCode.toLowerCase().includes(query) ||
        std.major.toLowerCase().includes(query) ||
        (std.assignedEnterpriseName && std.assignedEnterpriseName.toLowerCase().includes(query));

      const matchesStatus =
        activeStatusTab === 'ALL' || std.coordinationStatus === activeStatusTab;

      const matchesCohort =
        selectedCohort === 'ALL' || std.cohort === selectedCohort;

      return matchesSearch && matchesStatus && matchesCohort;
    });
  }, [students, searchTerm, activeStatusTab, selectedCohort]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );
  const emptyRowsCount = PAGE_SIZE - paginatedStudents.length;

  // Handle Assigning / Reassigning a student to Enterprise
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMatch || !selectedEnterpriseId || !selectedPositionId) {
      setToast({ type: 'error', message: 'Vui lòng chọn đầy đủ Doanh nghiệp và Vị trí thực tập!' });
      return;
    }

    const regId = selectedStudentForMatch.registrationId;
    if (!regId) {
      setToast({
        type: 'error',
        message: 'Sinh viên này chưa hoàn tất hồ sơ đăng ký OJT từ cổng sinh viên.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const compId = Number(selectedEnterpriseId);
      const posId = Number(selectedPositionId);
      const idempotencyKey = generateIdempotencyKey('coor');

      if (selectedStudentForMatch.coordinationId && selectedStudentForMatch.coordinationStatus === 'Rejected') {
        await reassignStudent(selectedStudentForMatch.coordinationId, {
          companyId: compId,
          positionId: posId,
          notes: 'Điều phối lại sang vị trí mới',
          idempotencyKey,
        });
        setToast({
          type: 'success',
          message: `Đã điều phối lại sinh viên ${selectedStudentForMatch.fullName} sang doanh nghiệp mới!`,
        });
      } else {
        await coordinateStudent({
          registrationId: regId,
          companyId: compId,
          positionId: posId,
          notes: 'Phân bổ hồ sơ sinh viên',
          idempotencyKey,
        });
        setToast({
          type: 'success',
          message: `Đã gửi hồ sơ điều phối sinh viên ${selectedStudentForMatch.fullName} cho Doanh nghiệp!`,
        });
      }

      await fetchStudentsAndCoordinations(selectedSemesterId);
      await fetchEnterpriseCatalog(selectedSemesterId);

      setSelectedStudentForMatch(null);
      setSelectedEnterpriseId('');
      setSelectedPositionId('');
    } catch (err: any) {
      console.error('Lỗi khi điều phối sinh viên:', err);
      const msg = err.response?.data?.message || err.message || 'Thao tác điều phối thất bại!';
      setToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Decision Record (Hỗ trợ duyệt nhanh nếu DN phản hồi trực tiếp)
  const handleQuickDecision = async (std: any, decision: 'ACCEPTED' | 'REJECTED') => {
    if (!std.coordinationId) return;

    try {
      await recordEnterpriseDecision(std.coordinationId, {
        decision,
        reason: decision === 'REJECTED' ? 'Không đạt phỏng vấn chuyên môn' : undefined,
      });

      if (decision === 'ACCEPTED') {
        try {
          await createAssignment({
            coordinationId: std.coordinationId,
            idempotencyKey: generateIdempotencyKey('assign'),
          });
        } catch (assignErr) {
          console.warn('Tạo phân công sau khi duyệt:', assignErr);
        }
      }

      setToast({
        type: 'success',
        message: `Đã ghi nhận quyết định: ${decision === 'ACCEPTED' ? 'TIẾP NHẬN' : 'TỪ CHỐI'} cho ${std.fullName}`,
      });

      await fetchStudentsAndCoordinations(selectedSemesterId);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Không thể ghi nhận quyết định!' });
    }
  };

  const availablePositionsForSelectedEnterprise = positions.filter(
    (position) =>
      position.enterpriseId === selectedEnterpriseId && position.status === 'Open'
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Banner */}
      <PageBanner
        title="Điều phối & Phân bổ Sinh viên OJT"
        description="Tiếp nhận danh sách sinh viên đủ điều kiện từ Phòng Đào tạo, điều phối hồ sơ đến các doanh nghiệp đối tác và xử lý điều phối lại nếu bị từ chối."
        badge="Phòng QHDN"
        primaryAction={{
          label: 'Mở đăng ký OJT',
          onClick: () => navigate('/qhdn/registration-windows'),
          icon: <UserCheck size={16} />,
        }}
      />

      {/* CARD 1: CẢNH BÁO BỊ TỪ CHỐI */}
      {rejectedCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <p className="text-xs text-rose-800 font-medium">
              Hiện có <strong className="font-bold text-rose-950">{rejectedCount} sinh viên</strong> bị doanh nghiệp từ chối. Vui lòng ưu tiên điều phối lại sang doanh nghiệp khác còn chỉ tiêu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveStatusTab('Rejected');
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Xem DS bị từ chối ({rejectedCount})
          </button>
        </div>
      )}

      {/* CARD 2: BỘ LỌC & TRẠNG THÁI ĐIỀU PHỐI */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Row 1: Status Tabs */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('ALL');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'ALL'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({students.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Unassigned');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'Unassigned'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa điều phối ({unassignedCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Pending Response');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'Pending Response'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ DN duyệt ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Accepted');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'Accepted'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã tiếp nhận ({acceptedCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Rejected');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeStatusTab === 'Rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs font-bold'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <RefreshCw size={12} />
              Cần điều phối lại ({rejectedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="text-xs text-orange-600 flex items-center gap-1 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Đang tải dữ liệu...
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">
              Tổng số: <strong className="text-slate-800">{filteredStudents.length}</strong> SV
            </span>
          </div>
        </div>

        {/* Row 2: Search, Học kỳ, Khóa */}
        <div className="p-3 sm:p-4 bg-slate-50/60 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên SV, MSSV, ngành học, doanh nghiệp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Lọc Học kỳ */}
          <div className="relative min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Calendar size={15} />
            </div>
            <select
              value={selectedSemesterId}
              onChange={(e) => {
                setSelectedSemesterId(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Chọn học kỳ theo dõi"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              {ojtSemesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name || sem.code || `Kỳ #${sem.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Khóa */}
          <div className="relative min-w-[130px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <GraduationCap size={15} />
            </div>
            <select
              value={selectedCohort}
              onChange={(e) => {
                setSelectedCohort(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo khóa sinh viên"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">Tất cả khóa</option>
              <option value="K17">Khóa K17</option>
              <option value="K18">Khóa K18</option>
              <option value="K19">Khóa K19</option>
              <option value="K20">Khóa K20</option>
            </select>
          </div>

          {/* Nút làm mới */}
          <button
            type="button"
            onClick={() => fetchStudentsAndCoordinations(selectedSemesterId)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Đồng bộ lại dữ liệu từ Đào tạo"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* CARD 3: BẢNG DANH SÁCH SINH VIÊN ĐIỀU PHỐI */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Handshake size={18} className="text-orange-500" />
              Danh sách Sinh viên Điều phối OJT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu nhận từ Phòng Đào tạo • Điều phối và quản lý phản hồi tiếp nhận
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
            {filteredStudents.length} Sinh viên
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[1040px]">
            <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
              <tr className="h-11">
                <th className="px-4 py-3 w-14 text-center">STT</th>
                <th className="px-4 py-3 min-w-[200px]">Sinh viên OJT</th>
                <th className="px-4 py-3 w-44">Chuyên ngành</th>
                <th className="px-4 py-3 w-48">Kỹ năng chính</th>
                <th className="px-4 py-3 min-w-[240px]">Doanh nghiệp phân bổ</th>
                <th className="px-4 py-3 text-center w-40">Trạng thái</th>
                <th className="px-4 py-3 text-right w-44">Thao tác điều phối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-64 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <User size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Chưa có sinh viên trong danh sách</p>
                      <p className="text-xs text-slate-400">Không có bản ghi nào phù hợp bộ lọc hoặc học kỳ này chưa bàn giao.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std, index) => {
                  const rowNumber = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;

                  return (
                    <tr key={std.id} className="h-[58px] hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                        {rowNumber}
                      </td>

                      <td className="px-4 py-3 min-w-[200px]">
                        <p className="font-bold text-slate-900 text-sm">{std.fullName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          MSSV: <strong className="text-slate-700 font-semibold">{std.studentCode}</strong> • GPA: {std.gpa} • {std.cohort}
                        </p>
                      </td>

                      <td className="px-4 py-3 w-44">
                        <p className="text-slate-800 font-semibold">{std.major}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{std.englishLevel}</p>
                      </td>

                      <td className="px-4 py-3 w-48">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {std.topSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded-md border border-slate-200/60 font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 min-w-[240px]">
                        {std.assignedEnterpriseName ? (
                          <div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">
                              {std.assignedEnterpriseName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {std.assignedPositionTitle || 'Vị trí thực tập OJT'}
                            </p>
                            {std.rejectionReason && (
                              <p className="text-[11px] text-rose-600 italic mt-0.5">
                                Lý do: {std.rejectionReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Chưa phân bổ</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center w-40">
                        {std.coordinationStatus === 'Accepted' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold whitespace-nowrap min-w-[125px]">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            Đã tiếp nhận
                          </span>
                        )}
                        {std.coordinationStatus === 'Pending Response' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold whitespace-nowrap min-w-[125px]">
                            <Clock size={13} className="text-amber-600 shrink-0" />
                            Chờ DN duyệt
                          </span>
                        )}
                        {std.coordinationStatus === 'Rejected' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold whitespace-nowrap min-w-[125px]">
                            <XCircle size={13} className="text-rose-600 shrink-0" />
                            DN từ chối
                          </span>
                        )}
                        {std.coordinationStatus === 'Unassigned' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 text-xs font-medium whitespace-nowrap min-w-[125px]">
                            Chờ phân bổ
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right w-44">
                        <div className="inline-flex items-center justify-end gap-1.5 w-full">
                          {/* Nút Điều phối lại / Phân bổ */}
                          {(std.coordinationStatus === 'Rejected' || std.coordinationStatus === 'Unassigned') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForMatch(std);
                                setSelectedEnterpriseId(std.assignedEnterpriseId || '');
                                setSelectedPositionId(std.assignedPositionId || '');
                              }}
                              className="h-8 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                              title={std.coordinationStatus === 'Rejected' ? 'Điều phối lại' : 'Ghép cặp DN'}
                            >
                              <RefreshCw size={12} />
                              {std.coordinationStatus === 'Rejected' ? 'Điều phối lại' : 'Ghép cặp DN'}
                            </button>
                          )}

                          {/* Quick decision actions khi đang chờ duyệt */}
                          {std.coordinationStatus === 'Pending Response' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickDecision(std, 'ACCEPTED')}
                                className="h-8 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                                title="Ghi nhận DN Chấp thuận"
                              >
                                <Check size={12} />
                                Nhận
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickDecision(std, 'REJECTED')}
                                className="h-8 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                                title="Ghi nhận DN Từ chối"
                              >
                                <X size={12} />
                                Từ chối
                              </button>
                            </div>
                          )}

                          {/* Nút Chi tiết */}
                          <button
                            type="button"
                            onClick={() => setSelectedStudentDetail(std)}
                            className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/80 transition-all cursor-pointer active:scale-95 inline-flex items-center justify-center shadow-2xs shrink-0"
                            title="Xem thông tin chi tiết sinh viên"
                            aria-label={`Xem chi tiết sinh viên ${std.fullName}`}
                          >
                            <Eye size={15} className="text-orange-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FIXED PAGINATION FOOTER */}
        <div className="border-t border-slate-100 px-5 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            {filteredStudents.length === 0
              ? 'Không có dữ liệu hiển thị'
              : `Hiển thị ${(safeCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safeCurrentPage * PAGE_SIZE,
                  filteredStudents.length
                )} trong ${filteredStudents.length} sinh viên`}
          </p>

          <nav className="flex items-center gap-1" aria-label="Phân trang sinh viên">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Trang trước"
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                aria-current={safeCurrentPage === item ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                  safeCurrentPage === item
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              aria-label="Trang sau"
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>

      {/* MODAL 1: CHI TIẾT THÔNG TIN SINH VIÊN */}
      <StudentDetailModal
        student={selectedStudentDetail}
        isOpen={Boolean(selectedStudentDetail)}
        onClose={() => setSelectedStudentDetail(null)}
        onReassign={(std) => setSelectedStudentForMatch(std)}
      />

      {/* MODAL 2: ĐIỀU PHỐI / PHÂN BỔ DOANH NGHIỆP */}
      <StudentMatchModal
        student={selectedStudentForMatch}
        isOpen={Boolean(selectedStudentForMatch)}
        onClose={() => setSelectedStudentForMatch(null)}
        partners={partners}
        selectedEnterpriseId={selectedEnterpriseId}
        onSelectEnterprise={(id) => {
          setSelectedEnterpriseId(id);
          setSelectedPositionId('');
        }}
        selectedPositionId={selectedPositionId}
        onSelectPosition={setSelectedPositionId}
        availablePositions={availablePositionsForSelectedEnterprise}
        onSubmit={handleAssignStudent}
      />
    </div>
  );
};

export default QhdnOjtCoordination;
