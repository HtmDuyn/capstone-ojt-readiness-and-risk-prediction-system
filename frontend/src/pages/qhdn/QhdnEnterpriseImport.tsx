import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  Search,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { ExtractionKpiCards } from '@/components/qhdn/import/ExtractionKpiCards';
import { FileImportModal } from '@/components/qhdn/import/FileImportModal';
import { EnterpriseDetailModal } from '@/components/qhdn/import/EnterpriseDetailModal';
import { ImportSuccessModal } from '@/components/qhdn/import/ImportSuccessModal';
import { previewImport, commitImport, generateIdempotencyKey, searchOjtSemesters } from '@/service/qhdnService';
import * as XLSX from 'xlsx';
import type {
  ExtractedEnterprise,
  SelectedFileItem,
  EnterprisePartner,
  ImportPreviewResponse,
  ImportPreviewRowResult,
  ImportPreviewRequest,
  ImportCommitResponse,
  ImportEnterpriseRow,
  ImportPositionRow,
  OjtSemesterItem,
} from '@/types/qhdn/qhdnTypes';

// ─── Semester ID map (học kỳ tên → ID backend) ─────────────────────────────
const SEMESTER_ID_MAP: Record<string, number> = {
  'Fall 2026': 1,
  'Summer 2026': 2,
  'Spring 2026': 3,
  'Fall 2025': 4,
  'Summer 2025': 5,
};

// ─── Map API row result → ExtractedEnterprise status ────────────────────────
const mapActionToStatus = (
  action: ImportPreviewRowResult['action']
): ExtractedEnterprise['status'] => {
  switch (action) {
    case 'CREATED':
    case 'UPDATED':
      return 'valid';
    case 'SKIPPED':
      return 'need_review';
    case 'ERROR':
      return 'error';
    default:
      return 'need_review';
  }
};

export interface ParsedEnterpriseRow extends ImportEnterpriseRow {
  fileName: string;
  fileSize: string;
  industry: string;
  phone: string;
  quota: number;
}

// ─── Map API preview rows + Parsed Excel Rows → ExtractedEnterprise[] ──────
const mapPreviewToEnterprises = (
  previewResponse: ImportPreviewResponse,
  semester: string,
  parsedRows: ParsedEnterpriseRow[]
): ExtractedEnterprise[] => {
  const LOGO_COLORS = [
    'bg-emerald-600',
    'bg-blue-600',
    'bg-orange-500',
    'bg-purple-600',
    'bg-cyan-600',
    'bg-red-500',
    'bg-indigo-600',
    'bg-rose-600',
  ];

  // Nếu API trả về rows, map từng row kết hợp với dữ liệu đã đọc từ file Excel
  if (previewResponse.rows && previewResponse.rows.length > 0) {
    return previewResponse.rows.map((row, idx) => {
      const status = mapActionToStatus(row.action);
      const matched = parsedRows.find((p) => p.code === row.code) || parsedRows[idx];

      const name = matched?.name || row.code;
      const code = matched?.code || row.code;

      return {
        id: `api-row-${row.rowNumber}-${code}-${idx}`,
        fileName: matched?.fileName || `import-${code}.xlsx`,
        fileSize: matched?.fileSize || '—',
        name,
        shortName: name.length > 20 ? `${name.slice(0, 18)}...` : name,
        email: matched?.email || '',
        contactPerson: matched?.fullName || 'Người phụ trách',
        contactRole: 'HR / Tuyển dụng OJT',
        phone: matched?.phone || '',
        industry: matched?.industry || 'Công nghệ thông tin',
        website: '',
        address: matched?.address || 'Hà Nội / TP. Hồ Chí Minh',
        description: row.error ?? '',
        positionsCount: matched?.positions?.length || 1,
        quota: matched?.quota || (matched?.positions?.[0]?.capacity || 5),
        status,
        statusText:
          status === 'valid'
            ? row.action === 'CREATED'
              ? 'Sẽ tạo mới'
              : 'Sẽ cập nhật'
            : status === 'need_review'
              ? 'Bỏ qua / Cần kiểm tra'
              : row.error ?? 'Lỗi',
        createAccount: status !== 'error',
        logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
        logoText: code.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'DN',
        semester,
      };
    });
  }

  // Fallback: nếu API preview không trả rows, dùng trực tiếp danh sách parsed từ Excel
  return parsedRows.map((parsed, idx) => ({
    id: `excel-row-${parsed.code}-${idx}`,
    fileName: parsed.fileName,
    fileSize: parsed.fileSize,
    name: parsed.name,
    shortName: parsed.name.length > 20 ? `${parsed.name.slice(0, 18)}...` : parsed.name,
    email: parsed.email,
    contactPerson: parsed.fullName,
    contactRole: 'HR / Tuyển dụng OJT',
    phone: parsed.phone,
    industry: parsed.industry,
    website: '',
    address: parsed.address || '',
    description: '',
    positionsCount: parsed.positions?.length || 1,
    quota: parsed.quota,
    status: 'valid',
    statusText: 'Đã trích xuất từ file',
    createAccount: true,
    logoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
    logoText: parsed.code.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'DN',
    semester,
  }));
};

export const QhdnEnterpriseImport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<ExtractedEnterprise | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Hidden native file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khôi phục phiên trích xuất trước đó từ localStorage nếu người dùng reload / F5 trang
  const [sessionLoaded] = useState(() => {
    try {
      const saved = localStorage.getItem('ojt_extraction_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Lỗi đọc ojt_extraction_session từ localStorage:', e);
    }
    return null;
  });

  // Selected files list inside import modal (Excel files)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>(
    () => sessionLoaded?.selectedFiles || []
  );
  // Lưu trực tiếp các File object thực tế từ trình duyệt để đọc nội dung
  const [rawFiles, setRawFiles] = useState<File[]>([]);

  const [isExtracting, setIsExtracting] = useState(false);

  // Table data state — khởi tạo từ phiên đã lưu (nếu có)
  const [enterprises, setEnterprises] = useState<ExtractedEnterprise[]>(
    () => sessionLoaded?.enterprises || []
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => sessionLoaded?.selectedIds || (sessionLoaded?.enterprises ? sessionLoaded.enterprises.filter((e: ExtractedEnterprise) => e.status !== 'error').map((e: ExtractedEnterprise) => e.id) : [])
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'need_review' | 'error'>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>(
    () => sessionLoaded?.selectedSemester || 'Fall 2026'
  );
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // API state
  const [apiError, setApiError] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{
    total: number;
    created: number;
    updated: number;
    errors: string[];
    canCommit: boolean;
  } | null>(() => {
    if (sessionLoaded?.previewMeta) return sessionLoaded.previewMeta;
    if (sessionLoaded?.enterprises && sessionLoaded.enterprises.length > 0) {
      return {
        total: sessionLoaded.enterprises.length,
        created: sessionLoaded.enterprises.length,
        updated: 0,
        errors: [],
        canCommit: true,
      };
    }
    return null;
  });

  // Lưu payload để reuse khi commit (cùng idempotencyKey)
  const [lastPayload, setLastPayload] = useState<ImportPreviewRequest | null>(
    () => sessionLoaded?.lastPayload || null
  );

  // Commit state
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(null);

  // Tự động lưu phiên trích xuất vào localStorage để khi F5 / reload không bị mất dữ liệu
  useEffect(() => {
    if (enterprises.length > 0) {
      try {
        localStorage.setItem(
          'ojt_extraction_session',
          JSON.stringify({
            enterprises,
            selectedIds,
            previewMeta,
            lastPayload,
            selectedFiles,
            selectedSemester,
          })
        );
      } catch (err) {
        console.warn('Lỗi lưu phiên trích xuất vào localStorage:', err);
      }
    }
  }, [enterprises, selectedIds, previewMeta, lastPayload, selectedFiles, selectedSemester]);

  // Auto-open modal if URL has ?openModal=true
  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setIsImportModalOpen(true);
    }
  }, [searchParams]);

  // Load danh sách kỳ OJT từ API POST /api/json/ojt-semesters/search
  const [ojtSemesters, setOjtSemesters] = useState<OjtSemesterItem[]>([]);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await searchOjtSemesters({
          page: 1,
          limit: 100,
        });
        if (res && res.items) {
          setOjtSemesters(res.items);
          // Nếu có kỳ OJT từ phòng đào tạo và chưa chọn kỳ cụ thể, ưu tiên kỳ đầu tiên
          if (res.items.length > 0 && selectedSemester === 'Fall 2026') {
            const firstSem = res.items[0];
            setSelectedSemester(firstSem.name || firstSem.semesterCode || 'Fall 2026');
          }
        }
      } catch (err) {
        console.warn('Không thể tải danh sách kỳ OJT từ API:', err);
      }
    };
    fetchSemesters();
  }, []);

  // Thêm file vào state (lưu cả File object và metadata)
  const addFiles = (files: File[]) => {
    const validFiles = files.filter((f) => /\.(xlsx|xls)$/i.test(f.name));
    if (validFiles.length === 0) return;

    setRawFiles((prev) => [...validFiles, ...prev]);
    const chosen: SelectedFileItem[] = validFiles.map((f) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setSelectedFiles((prev) => [...chosen, ...prev]);
  };

  // Handle native file selection from computer
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setRawFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  // ─── Hàm phân tích nội dung file Excel bằng thư viện XLSX ──────────────────
  const parseExcelFile = async (file: File): Promise<ParsedEnterpriseRow[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            resolve([]);
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawData || rawData.length === 0) {
            resolve([]);
            return;
          }

          const baseFileName = file.name.replace(/\.(xlsx|xls)$/i, '');
          const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

          const rows: ParsedEnterpriseRow[] = rawData.map((row, idx) => {
            // Hàm tìm giá trị cột linh hoạt
            const getVal = (aliases: string[]): string => {
              const key = Object.keys(row).find((k) =>
                aliases.some((alias) =>
                  k.toLowerCase().replace(/[\s_\-]/g, '').includes(alias.toLowerCase().replace(/[\s_\-]/g, ''))
                )
              );
              return key ? String(row[key]).trim() : '';
            };

            const name =
              getVal(['tendoanhnghiep', 'tencongty', 'tendn', 'companyname', 'name', 'doanhnghiep']) ||
              `${baseFileName} - Đơn vị ${idx + 1}`;

            const cleanCodeBase = name
              .split(' ')
              .map((w) => w.charAt(0))
              .join('')
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '');

            const code =
              getVal(['madoanhnghiep', 'madn', 'code', 'companycode', 'enterprisecode']) ||
              `DN-${cleanCodeBase || 'PARTNER'}-${String(idx + 1).padStart(3, '0')}`;

            const email =
              getVal(['email', 'mail', 'emailhr', 'emaillienhe']) ||
              `hr@${code.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.vn`;

            const fullName =
              getVal(['nguoiphutrach', 'nguoilienhe', 'contactperson', 'fullname', 'hr', 'hovaten']) ||
              'Người phụ trách OJT';

            const address =
              getVal(['diachi', 'address', 'truso', 'location', 'khuvuc']) ||
              'Hà Nội / TP. Hồ Chí Minh';

            const industry =
              getVal(['nganhnghe', 'industry', 'linhvuc', 'nganh']) ||
              'Công nghệ thông tin';

            const phone =
              getVal(['sodienthoai', 'dienthoai', 'phone', 'sdt', 'tel']) ||
              '0900 000 000';

            const quotaRaw = getVal(['chitieu', 'quota', 'soluong', 'slots', 'capacity']);
            const quota = parseInt(quotaRaw, 10) || 5;

            const posTitle =
              getVal(['vitri', 'position', 'title', 'chucdanh', 'job']) ||
              'Thực tập sinh OJT';

            const positions: ImportEnterpriseRow['positions'] = [
              {
                code: `${code}-POS-01`,
                title: posTitle,
                capacity: quota,
                description: 'Tham gia các dự án thực tập OJT tại doanh nghiệp',
                requirements: 'Sinh viên đủ điều kiện OJT theo quy định của nhà trường',
              },
            ];

            return {
              fileName: file.name,
              fileSize,
              code,
              name,
              email,
              fullName,
              address,
              industry,
              phone,
              quota,
              positions,
            };
          });

          resolve(rows);
        } catch (err) {
          console.error('Lỗi khi đọc file Excel:', file.name, err);
          resolve([]);
        }
      };

      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(file);
    });
  };

  // ─── Gọi API POST /api/imports/preview ─────────────────────────────────────
  const handleStartExtraction = async () => {
    if (selectedFiles.length === 0) return;

    setIsExtracting(true);
    setApiError(null);

    const matchedSemester = ojtSemesters.find(
      (s) =>
        s.name === selectedSemester ||
        s.code === selectedSemester ||
        s.semesterCode === selectedSemester
    );
    const semesterId = matchedSemester?.id ?? (SEMESTER_ID_MAP[selectedSemester] ?? 1);

    // 1. Phân tích nội dung thực tế từ tất cả các file Excel đã chọn
    let allParsedRows: ParsedEnterpriseRow[] = [];
    for (const file of rawFiles) {
      const rows = await parseExcelFile(file);
      allParsedRows.push(...rows);
    }

    // Fallback: nếu file không parse được dòng nào (hoặc rỗng), tạo ít nhất mỗi file 1 dòng
    if (allParsedRows.length === 0) {
      allParsedRows = selectedFiles.map((f, idx) => {
        const baseName = f.name.replace(/\.(xlsx|xls)$/i, '');
        return {
          fileName: f.name,
          fileSize: f.size,
          code: `DN-${String(idx + 1).padStart(3, '0')}`,
          email: `contact@doanhnghiep-${idx + 1}.vn`,
          fullName: 'Người phụ trách OJT',
          name: baseName,
          address: 'Hà Nội / TP. Hồ Chí Minh',
          industry: 'Công nghệ thông tin',
          phone: '0900 000 000',
          quota: 10,
          positions: [
            {
              code: `DEV-${String(idx + 1).padStart(3, '0')}`,
              title: 'Thực tập sinh OJT',
              capacity: 10,
              description: 'Mô tả công việc thực tập OJT',
              requirements: 'Sinh viên đáp ứng điều kiện OJT',
            },
          ],
        };
      });
    }

    // 2. Build request payload chuẩn gửi lên API POST /api/imports/preview
    const payload: ImportPreviewRequest = {
      kind: 'ENTERPRISE',
      idempotencyKey: generateIdempotencyKey(),
      semesterId,
      rows: allParsedRows.map((r) => ({
        code: r.code,
        email: r.email,
        fullName: r.fullName,
        name: r.name,
        address: r.address || '',
        positions: r.positions || [],
      })),
    };

    try {
      const result = await previewImport(payload);

      setPreviewMeta({
        total: result.total,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        canCommit: result.canCommit,
      });

      const mapped = mapPreviewToEnterprises(result, selectedSemester, allParsedRows);
      setEnterprises(mapped);
      setSelectedIds(mapped.filter((e) => e.status !== 'error').map((e) => e.id));
      setLastPayload(payload);
      setCommitResult(null);
      setIsImportModalOpen(false);
    } catch (err: unknown) {
      console.warn('Lỗi API previewImport, hiển thị dữ liệu trích xuất từ file Excel:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Lỗi kết nối API. Đã hiển thị dữ liệu trích xuất từ file Excel.';
      setApiError(message);

      // Ngay cả khi API backend gặp lỗi mạng/chưa sẵn sàng, vẫn hiển thị toàn bộ danh sách đã đọc từ Excel lên bảng!
      const fallbackResult: ImportPreviewResponse = {
        success: true,
        total: allParsedRows.length,
        created: allParsedRows.length,
        updated: 0,
        errors: [message],
        canCommit: true,
        preview: true,
        rows: allParsedRows.map((r, i) => ({
          rowNumber: i + 1,
          code: r.code,
          action: 'CREATED',
        })),
      };

      setPreviewMeta({
        total: fallbackResult.total,
        created: fallbackResult.created,
        updated: fallbackResult.updated,
        errors: fallbackResult.errors,
        canCommit: fallbackResult.canCommit,
      });

      const mapped = mapPreviewToEnterprises(fallbackResult, selectedSemester, allParsedRows);
      setEnterprises(mapped);
      setSelectedIds(mapped.map((e) => e.id));
      setLastPayload(payload);
      setCommitResult(null);
      setIsImportModalOpen(false);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReloadResults = () => {
    setIsExtracting(true);
    setTimeout(() => setIsExtracting(false), 500);
  };

  // Table Selection Handlers
  const handleToggleSelectAll = () => {
    const validIds = filteredEnterprises.filter((e) => e.status !== 'error').map((e) => e.id);
    if (selectedIds.length === validIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(validIds);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenDetail = (ent: ExtractedEnterprise) => {
    setEditingEnterprise(ent);
    setIsDetailModalOpen(true);
  };

  const handleSaveEnterpriseDetail = (updated: ExtractedEnterprise) => {
    setEnterprises((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setIsDetailModalOpen(false);
    setEditingEnterprise(null);
  };

  const handleRemoveInvalid = () => {
    setEnterprises((prev) => prev.filter((e) => e.status !== 'error'));
  };

  const handleResetBatch = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả kết quả trích xuất?')) {
      setEnterprises([]);
      setSelectedIds([]);
      setPreviewMeta(null);
      setApiError(null);
      setLastPayload(null);
      setCommitResult(null);
      try {
        localStorage.removeItem('ojt_extraction_session');
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // ─── Gọi API POST /api/imports/commit ──────────────────────────────────────
  const handleConfirmCommit = async () => {
    const selectedEnterprises = enterprises.filter((e) => selectedIds.includes(e.id));
    if (selectedEnterprises.length === 0) {
      setApiError('Vui lòng chọn ít nhất một doanh nghiệp để xác nhận import.');
      return;
    }

    // Nếu reload trang mà lastPayload bị trống, tự động dựng payload từ danh sách enterprises
    let payloadToCommit = lastPayload;
    if (!payloadToCommit) {
      const matchedSemester = ojtSemesters.find(
        (s) => s.name === selectedSemester || s.code === selectedSemester
      );
      const semesterId = matchedSemester?.id ?? (SEMESTER_ID_MAP[selectedSemester] ?? 1);

      payloadToCommit = {
        kind: 'ENTERPRISE',
        idempotencyKey: generateIdempotencyKey(),
        semesterId,
        rows: selectedEnterprises.map((r, idx) => ({
          code: r.shortName || `DN-${String(idx + 1).padStart(3, '0')}`,
          email: r.email,
          fullName: r.contactPerson || 'Người phụ trách',
          name: r.name,
          address: r.address || '',
          positions: [
            {
              code: `POS-${String(idx + 1).padStart(3, '0')}`,
              title: 'Thực tập sinh OJT',
              capacity: r.quota || 5,
              description: 'Mô tả công việc thực tập OJT',
              requirements: 'Sinh viên đạt chuẩn OJT',
            },
          ],
        })),
      };
    }

    setIsCommitting(true);
    setApiError(null);

    try {
      // 1. Gọi API commit POST /api/imports/commit
      const result = await commitImport(payloadToCommit);
      setCommitResult(result);

      // 2. Chuyển đổi danh sách doanh nghiệp đã commit thành EnterprisePartner
      const committedPartners: EnterprisePartner[] = selectedEnterprises.map((e, idx) => ({
        id: `ent-imported-${Date.now()}-${idx}`,
        name: e.name,
        code: e.shortName || `DN-${String(idx + 1).padStart(3, '0')}`,
        industry: e.industry || 'Công nghệ thông tin',
        tier: 'Tier-3 Standard',
        contactPerson: e.contactPerson || 'Người phụ trách',
        contactEmail: e.email || 'contact@company.com',
        contactPhone: e.phone || '0900 000 000',
        address: e.address || 'Hà Nội / TP. Hồ Chí Minh',
        mouStatus: 'Active',
        mouSignedDate: new Date().toISOString().split('T')[0],
        mouExpiryDate: '2028-12-31',
        totalQuota: e.quota || 10,
        acceptedCount: 0,
        availableQuota: e.quota || 10,
        semesters: e.semester ? [e.semester] : [selectedSemester || 'Fall 2026'],
      }));

      // 3. Lưu vào localStorage để trang Quản lý Doanh nghiệp đọc được và lưu giữ lâu dài
      try {
        const existingRaw = localStorage.getItem('ojt_imported_enterprises');
        const existingList: EnterprisePartner[] = existingRaw ? JSON.parse(existingRaw) : [];
        const existingCodes = new Set(existingList.map((p) => p.code));
        const newUnique = committedPartners.filter((p) => !existingCodes.has(p.code));
        const merged = [...newUnique, ...existingList];
        localStorage.setItem('ojt_imported_enterprises', JSON.stringify(merged));
        // Xóa session trích xuất tạm vì đã commit thành công vào danh sách chính thức
        localStorage.removeItem('ojt_extraction_session');
      } catch (storageErr) {
        console.warn('Lỗi lưu doanh nghiệp vào localStorage:', storageErr);
      }

      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Lỗi khi commit import. Vui lòng thử lại.';
      setApiError(message);
    } finally {
      setIsCommitting(false);
    }
  };

  // Filtered Enterprises in Table
  const filteredEnterprises = enterprises.filter((ent) => {
    const matchesSearch =
      !searchTerm ||
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'valid' && ent.status === 'valid') ||
      (statusFilter === 'need_review' &&
        (ent.status === 'need_review' || ent.status === 'missing_jd')) ||
      (statusFilter === 'error' && ent.status === 'error');

    const matchesSemester =
      semesterFilter === 'ALL' || (ent.semester || 'Fall 2026') === semesterFilter;

    return matchesSearch && matchesStatus && matchesSemester;
  });

  const validCount = enterprises.filter((e) => e.status === 'valid').length;
  const reviewCount = enterprises.filter(
    (e) => e.status === 'need_review' || e.status === 'missing_jd'
  ).length;
  const errorCount = enterprises.filter((e) => e.status === 'error').length;
  const totalQuota = enterprises.reduce((sum, item) => sum + (item.quota || 0), 0);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ─── HIDDEN NATIVE FILE INPUT ─────────────────────────────────────────── */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ─── BANNER ─────────────────────────────────────────────────────────── */}
      <PageBanner
        badge="Phòng QHDN"
        breadcrumb={
          <div className="flex items-center gap-2 text-xs text-purple-200/90 font-medium">
            <span
              className="hover:text-white cursor-pointer transition-colors"
              onClick={() => navigate('/qhdn/enterprises')}
            >
              Doanh nghiệp liên kết
            </span>
            <ChevronRight size={13} className="text-purple-300/80" />
            <span className="text-white font-semibold">Import doanh nghiệp</span>
          </div>
        }
        title="Kết quả trích xuất thông tin doanh nghiệp"
        description="Hệ thống đã trích xuất thông tin từ file danh sách tiếp nhận OJT (Excel). Vui lòng kiểm tra và chỉnh sửa các thông tin trước khi xác nhận import."
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <FileSpreadsheet size={15} />
              Import file Excel mới
            </button>

            <button
              type="button"
              onClick={handleReloadResults}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw size={14} className={isExtracting ? 'animate-spin' : ''} />
              Tải lại kết quả
            </button>

            <button
              type="button"
              onClick={handleResetBatch}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-400/30 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 size={14} />
              Xóa tất cả
            </button>
          </div>
        }
      />

      {/* ─── API ERROR BANNER ──────────────────────────────────────────────── */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Lỗi khi gọi API preview</p>
            <p className="text-xs mt-0.5 text-rose-600">{apiError}</p>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="ml-auto text-rose-400 hover:text-rose-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── API PREVIEW META BANNER ──────────────────────────────────────── */}
      {previewMeta && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-800">Kết quả preview API:</span>
          <span className="text-slate-700">
            Tổng: <strong>{previewMeta.total}</strong> | Tạo mới:{' '}
            <strong className="text-emerald-700">{previewMeta.created}</strong> | Cập nhật:{' '}
            <strong className="text-blue-700">{previewMeta.updated}</strong>
          </span>
          {previewMeta.canCommit && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200">
              Sẵn sàng commit
            </span>
          )}
          {previewMeta.errors.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200">
              {previewMeta.errors.length} lỗi
            </span>
          )}
        </div>
      )}

      {/* ─── 5 THẺ STAT KPI CARDS ─────────────────────────────────────────── */}
      <ExtractionKpiCards
        totalFiles={enterprises.length}
        validCount={validCount}
        reviewCount={reviewCount}
        errorCount={errorCount}
        totalQuota={totalQuota}
      />

      {/* ─── BẢNG KẾT QUẢ TRÍCH XUẤT ─────────────────────────────────────── */}
      <div className="card-glass border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        {/* Filter toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({enterprises.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('valid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'valid'
                  ? 'bg-white text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đủ dữ liệu ({validCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('need_review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'need_review'
                  ? 'bg-white text-amber-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cần kiểm tra ({reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'error'
                  ? 'bg-white text-rose-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lỗi ({errorCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs hover:border-purple-300 transition-all">
              <Calendar size={14} className="text-purple-600 shrink-0" />
              <span className="text-slate-500 font-medium">Học kỳ:</span>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-purple-950 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả kỳ</option>
                <option value="Fall 2026">Fall 2026</option>
                <option value="Summer 2026">Summer 2026</option>
                <option value="Spring 2026">Spring 2026</option>
                <option value="Fall 2025">Fall 2025</option>
              </select>
            </div>

            <div className="relative min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên doanh nghiệp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Bảng kết quả */}
        {enterprises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Upload size={40} className="text-slate-300" />
            <p className="text-sm font-semibold">Chưa có dữ liệu import</p>
            <p className="text-xs text-slate-400">
              Nhấn <strong>"Import file Excel mới"</strong> để tải file và gọi API preview
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[1020px]">
              <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
                <tr className="h-11">
                  <th className="px-4 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length ===
                          filteredEnterprises.filter((e) => e.status !== 'error').length
                      }
                      onChange={handleToggleSelectAll}
                      aria-label="Chọn tất cả doanh nghiệp hợp lệ"
                      className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 w-10 text-center">#</th>
                  <th className="px-4 py-3 w-52">Mã doanh nghiệp</th>
                  <th className="px-4 py-3">Tên doanh nghiệp</th>
                  <th className="px-4 py-3 w-40">Email liên hệ</th>
                  <th className="px-3 py-3 w-32 text-center">Học kỳ</th>
                  <th className="px-4 py-3 w-20 text-center">Số vị trí</th>
                  <th className="px-4 py-3 w-20 text-center">Quota</th>
                  <th className="px-4 py-3 w-36 text-center">Trạng thái</th>
                  <th className="px-4 py-3 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEnterprises.map((ent, idx) => {
                  const isSelected = selectedIds.includes(ent.id);

                  return (
                    <tr
                      key={ent.id}
                      className={`h-[58px] transition-colors ${
                        isSelected ? 'bg-orange-50/20' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={ent.status === 'error'}
                          onChange={() => handleToggleSelectItem(ent.id)}
                          aria-label={`Chọn doanh nghiệp ${ent.name}`}
                          className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* STT */}
                      <td className="px-3 py-3 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Mã & logo */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md ${ent.logoBg} text-white font-black text-[9px] flex items-center justify-center shrink-0`}
                          >
                            {ent.logoText}
                          </div>
                          <span
                            className="font-semibold text-slate-800 text-xs truncate max-w-[150px]"
                            title={ent.fileName}
                          >
                            {ent.fileName}
                          </span>
                        </div>
                      </td>

                      {/* Enterprise Name */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 text-xs">{ent.name}</p>
                        {ent.description && (
                          <p className="text-[10px] text-rose-500 mt-0.5 truncate max-w-[180px]">
                            {ent.description}
                          </p>
                        )}
                      </td>

                      {/* HR Email */}
                      <td className="px-4 py-3">
                        <span className="text-slate-600 text-xs">
                          {ent.email || <span className="text-slate-300 italic">—</span>}
                        </span>
                      </td>

                      {/* Học kỳ tiếp nhận */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200/80 text-[11px] whitespace-nowrap">
                          <Calendar size={11} className="text-purple-600 shrink-0" />
                          {ent.semester || 'Fall 2026'}
                        </span>
                      </td>

                      {/* Positions count */}
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {ent.positionsCount}
                      </td>

                      {/* Quota */}
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {ent.quota}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3 text-center">
                        {ent.status === 'valid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold whitespace-nowrap">
                            <CheckCircle2 size={12} />
                            {ent.statusText}
                          </span>
                        )}
                        {ent.status === 'missing_jd' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold whitespace-nowrap">
                            <AlertTriangle size={12} />
                            Thiếu vị trí/JD
                          </span>
                        )}
                        {ent.status === 'need_review' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold whitespace-nowrap">
                            <AlertTriangle size={12} />
                            {ent.statusText}
                          </span>
                        )}
                        {ent.status === 'error' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-bold whitespace-nowrap">
                            <XCircle size={12} />
                            {ent.statusText}
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(ent)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold text-xs border border-blue-200/60 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 whitespace-nowrap"
                        >
                          <Eye size={13} className="text-blue-500" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom sticky action bar */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-700">
            Đã chọn{' '}
            <strong className="text-orange-600 font-bold">{selectedIds.length}</strong>{' '}
            doanh nghiệp hợp lệ
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRemoveInvalid}
              disabled={errorCount === 0}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200/80 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Loại khỏi danh sách ({errorCount})
            </button>
            <button
              type="button"
              onClick={() => {
                if (enterprises.length === 0) {
                  alert('Chưa có danh sách doanh nghiệp để lưu nháp.');
                  return;
                }
                try {
                  localStorage.setItem(
                    'ojt_extraction_session',
                    JSON.stringify({
                      enterprises,
                      selectedIds,
                      previewMeta,
                      lastPayload,
                      selectedFiles,
                      selectedSemester,
                    })
                  );
                  alert('Đã lưu dữ liệu nháp phiên trích xuất! Bạn có thể tải lại trang bất kỳ lúc nào mà không bị mất.');
                } catch (e) {
                  console.warn('Lỗi lưu nháp:', e);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
            >
              Lưu nháp
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || isCommitting || !previewMeta?.canCommit}
              onClick={handleConfirmCommit}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCommitting ? (
                <>
                  <RotateCcw size={14} className="animate-spin" />
                  Đang commit...
                </>
              ) : (
                <>
                  Xác nhận import {selectedIds.length} doanh nghiệp
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: IMPORT FILE EXCEL ───────────────────────────────────── */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedSemester={selectedSemester}
        onSemesterChange={setSelectedSemester}
        semesters={ojtSemesters}
        selectedFiles={selectedFiles}
        onRemoveFile={handleRemoveFile}
        onClearAllFiles={() => {
          setSelectedFiles([]);
          setRawFiles([]);
        }}
        onStartExtraction={handleStartExtraction}
        isExtracting={isExtracting}
        fileInputRef={fileInputRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* ─── MODAL 2: XEM & CHỈNH SỬA CHI TIẾT DOANH NGHIỆP ─────────────── */}
      <EnterpriseDetailModal
        enterprise={editingEnterprise}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setEditingEnterprise(null);
        }}
        onSave={handleSaveEnterpriseDetail}
      />

      {/* ─── MODAL 3: XÁC NHẬN IMPORT THÀNH CÔNG ────────────────────────── */}
      <ImportSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          navigate('/qhdn/enterprises');
        }}
        onNavigateToList={() => {
          setIsSuccessModalOpen(false);
          navigate('/qhdn/enterprises', {
            state: {
              justImportedCount: commitResult?.created || selectedIds.length,
            },
          });
        }}
        batchId={commitResult?.batchId}
        replayed={commitResult?.replayed}
        created={commitResult?.created}
        updated={commitResult?.updated}
      />
    </div>
  );
};

export default QhdnEnterpriseImport;
