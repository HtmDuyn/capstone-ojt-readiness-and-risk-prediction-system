import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { FileImportModal } from '@/components/qhdn/import/FileImportModal';
import {
  commitImport,
  getAcademicPeriods,
  generateIdempotencyKey,
  previewImport,
  listQhdnOjtSemesters,
} from '@/services/qhdnService';
import type {
  EnterprisePartner,
  ExtractedEnterprise,
  ImportEnterpriseRow,
  ImportPreviewRequest,
  ImportPreviewResponse,
  ImportPreviewRowResult,
  ImportPositionRow,
  AcademicPeriodItem,
  OjtSemesterItem,
  SelectedFileItem,
} from '@/types/qhdn/qhdnTypes';
import * as XLSX from 'xlsx';

interface ParsedEnterpriseRow extends ImportEnterpriseRow {
  fileName: string;
  fileSize: string;
  industry: string;
  phone: string;
  quota: number;
}

interface QhdnEnterpriseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (partners: EnterprisePartner[], count: number) => void;
}

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

const mapPreviewToEnterprises = (
  response: ImportPreviewResponse,
  semester: string,
  parsedRows: ParsedEnterpriseRow[]
): ExtractedEnterprise[] => {
  if (!response.rows?.length) {
    return parsedRows.map((row, index) => ({
      ...toExtractedEnterprise(row, semester, index),
      status: 'valid',
      statusText: 'Đã trích xuất từ file',
    }));
  }

  return response.rows.map((row, index) => {
    const matched = parsedRows.find((item) => item.code === row.code) || parsedRows[index];
    const status = mapActionToStatus(row.action);
    const item = toExtractedEnterprise(matched, semester, index);
    return {
      ...item,
      id: `api-row-${row.rowNumber}-${row.code}-${index}`,
      code: matched?.code || row.code,
      name: matched?.name || row.code,
      shortName: (matched?.name || row.code).slice(0, 20),
      email: matched?.email || '',
      status,
      statusText:
        status === 'valid'
          ? row.action === 'CREATED'
            ? 'Sẽ tạo mới'
            : 'Sẽ cập nhật'
          : status === 'need_review'
            ? 'Bỏ qua / Cần kiểm tra'
            : row.error || 'Lỗi',
      description: row.error || '',
    };
  });
};

const toExtractedEnterprise = (
  row: ParsedEnterpriseRow | undefined,
  semester: string,
  index: number
): ExtractedEnterprise => {
  const name = row?.name || 'Doanh nghiệp chưa có tên';
  const code = row?.code || `DN-${String(index + 1).padStart(3, '0')}`;
  return {
    id: `excel-row-${code}-${index}`,
    fileName: row?.fileName || '',
    fileSize: row?.fileSize || '',
    code,
    name,
    shortName: name.length > 20 ? `${name.slice(0, 18)}...` : name,
    email: row?.email || '',
    contactPerson: row?.fullName || '',
    contactRole: 'HR / Tuyển dụng OJT',
    phone: row?.phone || '',
    industry: row?.industry || '',
    website: '',
    address: row?.address || '',
    description: '',
    positionsCount: row?.positions?.length || 0,
    quota: row?.quota || 0,
    status: 'valid',
    statusText: 'Đã trích xuất từ file',
    createAccount: true,
    logoBg: LOGO_COLORS[index % LOGO_COLORS.length],
    logoText: code.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'DN',
    semester,
  };
};

const readExcelFile = (file: File): Promise<ParsedEnterpriseRow[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!(buffer instanceof ArrayBuffer)) {
          reject(new Error(`Không đọc được nội dung file ${file.name}.`));
          return;
        }
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
        const rows = worksheet
          ? (XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, unknown>[])
          : [];
        if (rows.length === 0) {
          resolve([]);
          return;
        }

        const normalize = (value: string) => value.toLowerCase().replace(/[\s_-]/g, '');
        const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        resolve(
          rows.map((row, index) => {
            const getValue = (aliases: string[]) => {
              const key = Object.keys(row).find((header) =>
                aliases.some((alias) => normalize(header).includes(normalize(alias)))
              );
              return key ? String(row[key]).trim() : '';
            };
            const name =
              getValue(['tendoanhnghiep', 'tencongty', 'tendn', 'companyname', 'name']) ||
              `${file.name.replace(/\.(xlsx|xls)$/i, '')} - Đơn vị ${index + 1}`;
            const initials = name
              .split(/\s+/)
              .map((word) => word[0] || '')
              .join('')
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '');
            const code =
              getValue(['madoanhnghiep', 'madn', 'companycode', 'enterprisecode', 'code']) ||
              `DN-${initials || 'PARTNER'}-${String(index + 1).padStart(3, '0')}`;
            const quota = Number.parseInt(getValue(['chitieu', 'quota', 'soluong', 'capacity']), 10) || 5;
            const position: ImportPositionRow = {
              code: `${code}-POS-01`,
              title: getValue(['vitri', 'position', 'title']) || 'Thực tập sinh OJT',
              capacity: quota,
              description: 'Tham gia các dự án thực tập OJT tại doanh nghiệp',
              requirements: 'Sinh viên đủ điều kiện OJT theo quy định của nhà trường',
            };
            return {
              fileName: file.name,
              fileSize,
              code,
              name,
              email:
                getValue(['email', 'mail', 'emailhr']) ||
                `hr@${code.toLowerCase().replace(/[^a-z0-9]/g, '')}.vn`,
              fullName: getValue(['nguoiphutrach', 'nguoilienhe', 'contactperson', 'fullname']) ||
                'Người phụ trách OJT',
              address: getValue(['diachi', 'address', 'location']),
              industry: getValue(['nganhnghe', 'industry', 'linhvuc']),
              phone: getValue(['sodienthoai', 'dienthoai', 'phone', 'sdt']),
              quota,
              positions: [position],
            };
          })
        );
      } catch (error) {
        reject(error instanceof Error ? error : new Error(`Không thể phân tích file ${file.name}.`));
      }
    };
    reader.onerror = () => reject(new Error(`Không thể đọc file ${file.name}.`));
    reader.readAsArrayBuffer(file);
  });

export const QhdnEnterpriseImportModal: React.FC<QhdnEnterpriseImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriodItem[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{ id: number; code: string }>>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [semesters, setSemesters] = useState<OjtSemesterItem[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [enterprises, setEnterprises] = useState<ExtractedEnterprise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewMeta, setPreviewMeta] = useState<ImportPreviewResponse | null>(null);
  const [lastPayload, setLastPayload] = useState<ImportPreviewRequest | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const loadPeriods = async () => {
      setIsLoadingPeriods(true);
      setApiError(null);
      try {
        const periodResponse = await getAcademicPeriods({ page: 1, limit: 100 });
        const semesterResponse = await listQhdnOjtSemesters(periodResponse.items);
        if (!active) return;
        const periods = periodResponse.items || [];
        const periodBySemester = new Map<number, AcademicPeriodItem>();
        periods.forEach((period) => {
          const semesterIds = [period.ojtSemesterId, period.ojt?.id].filter(
            (id): id is number => Boolean(id)
          );
          semesterIds.forEach((semesterId) => periodBySemester.set(semesterId, period));
        });
        const actualSemesters = semesterResponse.items.map((semester) => {
          const academicPeriod =
            periodBySemester.get(semester.id) ||
            periods.find((period) => period.id === semester.academicPeriodId);
          return {
            ...semester,
            academicYearId: semester.academicYearId ?? academicPeriod?.academicYearId,
            academicYearName: semester.academicYearName || academicPeriod?.academicYear?.code,
            name: semester.name || academicPeriod?.ojt?.name || academicPeriod?.name,
          };
        });
        const yearMap = new Map<number, string>();
        periods.forEach((period) => {
          if (period.academicYearId && period.academicYear?.code) {
            yearMap.set(period.academicYearId, period.academicYear.code);
          }
        });
        actualSemesters.forEach((semester) => {
          if (semester.academicYearId && semester.academicYearName) {
            yearMap.set(semester.academicYearId, semester.academicYearName);
          }
        });
        const years = Array.from(yearMap, ([id, code]) => ({ id, code }));
        setAcademicPeriods(periods);
        setSemesters(actualSemesters);
        setAcademicYears(years);
        const firstYearId = years[0]?.id ?? actualSemesters[0]?.academicYearId ?? null;
        setSelectedAcademicYearId(firstYearId);
        const firstSemester = actualSemesters.find(
          (semester) => !firstYearId || semester.academicYearId === firstYearId
        );
        setSelectedSemesterId(firstSemester?.id ?? null);
        setSelectedSemester(
          firstSemester?.name || firstSemester?.semesterCode || firstSemester?.code || ''
        );
        if (!firstSemester) {
          setApiError('API không trả về kỳ OJT thực tế để import.');
        }
      } catch (error: unknown) {
        if (!active) return;
        console.error('Không thể tải năm học và kỳ OJT từ API:', error);
        setApiError(error instanceof Error ? error.message : 'Không thể tải dữ liệu năm học và kỳ OJT.');
      } finally {
        if (active) setIsLoadingPeriods(false);
      }
    };
    void loadPeriods();
    return () => {
      active = false;
    };
  }, [isOpen]);

  const clearPreview = () => {
    setEnterprises([]);
    setSelectedIds([]);
    setPreviewMeta(null);
    setLastPayload(null);
    setApiError(null);
  };

  const clearImport = () => {
    setSelectedFiles([]);
    setRawFiles([]);
    setEnterprises([]);
    setSelectedIds([]);
    setPreviewMeta(null);
    setLastPayload(null);
    setApiError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    try {
      localStorage.removeItem('ojt_extraction_session');
    } catch (error) {
      console.warn('Không thể xóa phiên import cũ:', error);
    }
  };

  const addFiles = (files: File[]) => {
    const accepted = files.filter((file) => /\.(xlsx|xls)$/i.test(file.name));
    if (accepted.length === 0) {
      setApiError('Vui lòng chọn file Excel định dạng .xlsx hoặc .xls.');
      return;
    }
    setApiError(null);
    setRawFiles((current) => [...current, ...accepted]);
    setSelectedFiles((current) => [
      ...current,
      ...accepted.map((file) => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      })),
    ]);
  };

  const handlePreview = async () => {
    if (rawFiles.length === 0) return;
    setIsPreviewing(true);
    setApiError(null);
    setEnterprises([]);
    setPreviewMeta(null);
    try {
      const parsedRows = (await Promise.all(rawFiles.map(readExcelFile))).flat();
      if (parsedRows.length === 0) {
        throw new Error('Không tìm thấy dòng dữ liệu doanh nghiệp trong file Excel.');
      }
      if (!selectedSemesterId) {
        throw new Error('Vui lòng chọn năm học và kỳ OJT hợp lệ từ danh sách.');
      }
      const payload: ImportPreviewRequest = {
        kind: 'ENTERPRISE',
        idempotencyKey: generateIdempotencyKey(),
        semesterId: selectedSemesterId,
        rows: parsedRows.map(({ code, email, fullName, name, address, positions }) => ({
          code,
          email,
          fullName,
          name,
          address: address || '',
          positions,
        })),
      };
      const result = await previewImport(payload);
      const mapped = mapPreviewToEnterprises(result, selectedSemester, parsedRows);
      setPreviewMeta(result);
      setEnterprises(mapped);
      setSelectedIds(mapped.filter((item) => item.status === 'valid').map((item) => item.id));
      setLastPayload(payload);
    } catch (error: unknown) {
      console.error('Không thể tạo preview import doanh nghiệp:', error);
      setApiError(error instanceof Error ? error.message : 'Không thể xem trước file. Vui lòng thử lại.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!lastPayload || !previewMeta?.canCommit) return;
    const selected = enterprises.filter((item) => selectedIds.includes(item.id) && item.status !== 'error');
    const selectedCodes = new Set(selected.map((item) => item.code.toUpperCase()));
    const payload: ImportPreviewRequest = {
      ...lastPayload,
      rows: lastPayload.rows.filter((row) => selectedCodes.has(row.code.toUpperCase())),
    };
    if (payload.rows.length === 0) {
      setApiError('Hãy chọn ít nhất một doanh nghiệp hợp lệ để import.');
      return;
    }

    setIsCommitting(true);
    setApiError(null);
    try {
      const result = await commitImport(payload);
      const partners: EnterprisePartner[] = selected.map((item, index) => ({
        id: `ent-imported-${Date.now()}-${index}`,
        name: item.name,
        code: item.code,
        industry: item.industry || 'Công nghệ thông tin',
        tier: 'Tier-3 Standard',
        contactPerson: item.contactPerson || 'Người phụ trách',
        contactEmail: item.email || 'contact@company.com',
        contactPhone: item.phone || '0900 000 000',
        address: item.address || 'Chưa cập nhật địa chỉ',
        mouStatus: 'Active',
        mouSignedDate: new Date().toISOString().split('T')[0],
        mouExpiryDate: '2028-12-31',
        totalQuota: item.quota || 5,
        acceptedCount: 0,
        availableQuota: item.quota || 5,
        semesters: [item.semester || selectedSemester],
      }));
      try {
        const stored = localStorage.getItem('ojt_imported_enterprises');
        const existing: EnterprisePartner[] = stored ? JSON.parse(stored) : [];
        const byCode = new Map(existing.map((partner) => [partner.code.toUpperCase(), partner]));
        partners.forEach((partner) => byCode.set(partner.code.toUpperCase(), partner));
        localStorage.setItem('ojt_imported_enterprises', JSON.stringify(Array.from(byCode.values())));
      } catch (storageError) {
        console.error('Import API thành công nhưng không thể cập nhật cache doanh nghiệp:', storageError);
      }
      onImported(partners, result.created + result.updated);
      onClose();
    } catch (error: unknown) {
      console.error('Không thể xác nhận import doanh nghiệp:', error);
      setApiError(error instanceof Error ? error.message : 'Không thể import doanh nghiệp. Vui lòng thử lại.');
    } finally {
      setIsCommitting(false);
    }
  };

  const selectableEnterprises = enterprises.filter((item) => item.status !== 'error');
  const allSelectableSelected = selectableEnterprises.length > 0 &&
    selectableEnterprises.every((item) => selectedIds.includes(item.id));
  const previewSummary = previewMeta ? (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
      <span>Tổng: {previewMeta.total}</span>
      <span className="text-emerald-700">Tạo mới: {previewMeta.created}</span>
      <span className="text-blue-700">Cập nhật: {previewMeta.updated}</span>
      {previewMeta.errors.length > 0 && (
        <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">
          {previewMeta.errors.length} lỗi
        </span>
      )}
    </div>
  ) : null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) addFiles(Array.from(event.target.files));
          event.target.value = '';
        }}
      />
      <FileImportModal
        isOpen={isOpen}
        onClose={() => {
          clearImport();
          onClose();
        }}
        selectedSemesterId={selectedSemesterId}
        onSemesterChange={(semesterId) => {
          const semester = semesters.find((item) => item.id === semesterId);
          if (!semester) return;
          setSelectedSemesterId(semesterId);
          setSelectedSemester(semester.name || semester.semesterCode || semester.code || `Kỳ #${semesterId}`);
          clearPreview();
        }}
        academicYearId={selectedAcademicYearId}
        onAcademicYearChange={(yearId) => {
          setSelectedAcademicYearId(yearId);
          const nextSemester = semesters.find((item) => item.academicYearId === yearId);
          setSelectedSemesterId(nextSemester?.id ?? null);
          setSelectedSemester(
            nextSemester?.name || nextSemester?.semesterCode || nextSemester?.code || ''
          );
          clearPreview();
        }}
        academicYears={academicYears}
        academicPeriods={academicPeriods}
        semesters={semesters}
        isLoadingPeriods={isLoadingPeriods}
        selectedFiles={selectedFiles}
        onRemoveFile={(fileName) => {
          setSelectedFiles((items) => items.filter((item) => item.name !== fileName));
          setRawFiles((items) => items.filter((item) => item.name !== fileName));
          clearPreview();
        }}
        onClearAllFiles={clearImport}
        onStartExtraction={handlePreview}
        isExtracting={isPreviewing}
        fileInputRef={fileInputRef}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(Array.from(event.dataTransfer.files));
        }}
        previewSummary={previewSummary}
        apiError={apiError}
        isCommitting={isCommitting}
        selectedCount={selectedIds.filter((id) => selectableEnterprises.some((item) => item.id === id)).length}
        canConfirm={Boolean(previewMeta?.canCommit)}
        onConfirmImport={handleConfirmImport}
        onChooseDifferentFile={clearImport}
        previewContent={
          previewMeta ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả doanh nghiệp hợp lệ"
                        checked={allSelectableSelected}
                        onChange={() => setSelectedIds(
                          allSelectableSelected ? [] : selectableEnterprises.map((item) => item.id)
                        )}
                      />
                    </th>
                    <th className="px-3 py-3">Mã doanh nghiệp</th>
                    <th className="px-3 py-3">Tên doanh nghiệp</th>
                    <th className="px-3 py-3">Email liên hệ</th>
                    <th className="px-3 py-3 text-center">Học kỳ</th>
                    <th className="px-3 py-3 text-center">Vị trí / Quota</th>
                    <th className="px-3 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enterprises.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          disabled={item.status === 'error'}
                          aria-label={`Chọn doanh nghiệp ${item.name}`}
                          onChange={() => setSelectedIds((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id]
                          )}
                        />
                      </td>
                      <td className="px-3 py-3 font-semibold">{item.code}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-3 py-3">{item.email || '—'}</td>
                      <td className="px-3 py-3 text-center">{item.semester}</td>
                      <td className="px-3 py-3 text-center">{item.positionsCount} / {item.quota}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${
                          item.status === 'valid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'error'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.status === 'valid' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {item.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {enterprises.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">Preview không có doanh nghiệp.</p>
              )}
            </div>
          ) : null
        }
      />
    </>
  );
};

export default QhdnEnterpriseImportModal;
