import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  Info,
  UploadCloud,
  X,
} from "lucide-react";
import {
  commitEnterpriseImport,
  generateIdempotencyKey,
  previewEnterpriseImport,
} from "@/services/qhdnService";
import { errorMessage, Field, Notice, Pager } from "../QhdnUi";
import {
  WorkflowModal,
  workflowInput,
  workflowPrimary,
  workflowSecondary,
} from "../StudentWorkflowUi";
import {
  buildEnterpriseImportPreviewRows,
  enterpriseImportPeriods,
  importErrorText,
  selectEnterpriseImportPayload,
} from "@/utils/qhdnEnterprise";
import type {
  ImportCommitResponse,
  AcademicPeriodItem,
  EnterpriseImportPayload,
  ImportPreviewResponse,
} from "@/types/qhdn/qhdnTypes";
import type { RecruitmentWindow } from "@/types/qhdn/workflowTypes";

const rowLabels = {
  CREATED: "Tạo mới",
  UPDATED: "Cập nhật",
  SKIPPED: "Bỏ qua",
  ERROR: "Có lỗi",
};
export function QhdnEnterpriseImportModal({
  isOpen,
  onClose,
  onImported,
  periods,
  periodsLoading = false,
  initialAcademicPeriodId,
  initialWindow,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  periods: AcademicPeriodItem[];
  periodsLoading?: boolean;
  initialAcademicPeriodId?: number;
  initialWindow?: RecruitmentWindow | null;
}) {
  const [academicPeriodId, setAcademicPeriodId] = useState(
    String(initialWindow?.academicPeriodId ?? initialAcademicPeriodId ?? ""),
  );
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [key, setKey] = useState(() => generateIdempotencyKey("import"));
  const [payload, setPayload] = useState<EnterpriseImportPayload | null>(null);
  const [sourcePayload, setSourcePayload] = useState<EnterpriseImportPayload | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => new Set());
  const [selectionPreview, setSelectionPreview] = useState<ImportPreviewResponse | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<ImportCommitResponse | null>(null),
    [confirmed, setConfirmed] = useState(false);
  const [page, setPage] = useState(1),
    [onlyErrors, setOnlyErrors] = useState(false),
    [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // The current QHDN API returns windows from POST/PATCH, without a list endpoint.
  const periodOptions = enterpriseImportPeriods(periods, initialWindow ? [initialWindow] : []);
  const selectedPeriod = periodOptions.find((period) => String(period.id) === academicPeriodId);
  const windowId = selectedPeriod?.window?.id;
  const validWindow = !periodsLoading && !!windowId;
  const periodName = selectedPeriod?.name || "Chưa chọn kỳ OJT";
  const reset = () => {
    setPreview(null);
    setPayload(null);
    setSourcePayload(null);
    setSelectedCodes(new Set());
    setSelectionPreview(null);
    setKey(generateIdempotencyKey("import"));
    setError("");
    setConfirmed(false);
    setPage(1);
    setOnlyErrors(false);
  };
  const chooseFile = (next: File | null) => {
    reset();
    setFile(null);
    if (!next) return;
    if (!/\.(xlsx|csv)$/i.test(next.name)) {
      setError("Chỉ hỗ trợ file .xlsx hoặc .csv.");
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError("File vượt quá 8 MB. Vui lòng giảm dung lượng và chọn lại.");
      return;
    }
    if (!next.size) {
      setError("File đang trống. Chọn file có dữ liệu doanh nghiệp.");
      return;
    }
    setFile(next);
  };
  const send = async (commit: boolean) => {
    if (!file || !validWindow) {
      setError("Chọn file và học kỳ OJT có đợt tuyển dụng đang mở.");
      return;
    }
    if (busy) return;
    if (commit && (
      !selectionPreview?.canCommit || !confirmed || !payload ||
      !selectedCodes.size || selectionPreview.total !== selectedCodes.size
    )) return;
    setBusy(true);
    setError("");
    try {
      if (commit) {
        // Dùng đúng bản JSON đã xem trước, kể cả khi thử lại sau lỗi mạng.
        setResult(await commitEnterpriseImport(payload!));
        onImported();
      } else {
        const { parseEnterpriseImportSheet } = await import("@/utils/qhdnEnterpriseImport");
        const body: EnterpriseImportPayload = {
          kind: "ENTERPRISE",
          windowId: windowId!,
          idempotencyKey: key,
          rows: parseEnterpriseImportSheet(await file.arrayBuffer()),
        };
        setPreview(await previewEnterpriseImport(body));
        setSourcePayload(body);
        setPayload(null);
        setSelectedCodes(new Set());
        setSelectionPreview(null);
        setConfirmed(false);
        setPage(1);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const changeSelection = (next: Set<string>) => {
    if (busy) return;
    setSelectedCodes(next);
    setPayload(null);
    setSelectionPreview(null);
    setConfirmed(false);
    setError("");
  };
  const checkSelection = async () => {
    if (busy || !validWindow || !sourcePayload || !selectedCodes.size) return;
    setBusy(true);
    setError("");
    setConfirmed(false);
    setSelectionPreview(null);
    try {
      // Keep the same candidate/key on a network retry; any selection change clears it.
      const body = payload ?? selectEnterpriseImportPayload(
        sourcePayload, selectedCodes, generateIdempotencyKey("import"),
      );
      setPayload(body);
      setSelectionPreview(await previewEnterpriseImport(body));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (!isOpen) return null;
  const step = result ? 3 : preview ? 2 : 1;
  const fileRows = buildEnterpriseImportPreviewRows(
    preview?.rows ?? [],
    sourcePayload?.rows ?? [],
  );
  const selectableCodes = new Set(fileRows
    .filter((row) => row.enterprise && !row.error && ["CREATED", "UPDATED"].includes(row.action))
    .map((row) => row.enterprise!.code));
  const allSelected = selectableCodes.size > 0 &&
    [...selectableCodes].every((code) => selectedCodes.has(code));
  const selectedResults = new Map(selectionPreview?.rows.map(
    (row) => [row.code?.trim().toUpperCase() ?? "", row],
  ));
  const displayRows = fileRows.map((row) => {
    const checked = selectedResults.get(row.code?.trim().toUpperCase());
    return checked ? { ...row, ...checked, rowNumber: row.rowNumber } : row;
  });
  const rows = displayRows.filter(
    (r) => !onlyErrors || r.action === "ERROR" || r.error,
  );
  const selectedEnterprises = sourcePayload?.rows.filter(
    (row) => selectedCodes.has(row.code),
  ) ?? [];
  const selectedCount = selectedEnterprises.length;
  const selectionReady = !!selectionPreview?.canCommit && selectionPreview.total === selectedCount && selectedCount > 0;
  const selectedCreated = selectionPreview?.created ?? displayRows.filter(
    (row) => row.enterprise && selectedCodes.has(row.enterprise.code) && row.action === "CREATED",
  ).length;
  const selectedUpdated = selectionPreview?.updated ?? displayRows.filter(
    (row) => row.enterprise && selectedCodes.has(row.enterprise.code) && row.action === "UPDATED",
  ).length;
  const positionCount = selectedEnterprises.reduce(
    (total, enterprise) => total + enterprise.positions.length,
    0,
  );
  const capacityTotal = selectedEnterprises.reduce(
    (total, enterprise) => total + enterprise.positions.reduce(
      (capacity, position) => capacity + position.capacity,
      0,
    ),
    0,
  );
  const activePreview = selectionPreview ?? preview;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 8)));
  return (
    <WorkflowModal
      wide
      title="Import doanh nghiệp & vị trí tuyển dụng"
      subtitle="Chọn kỳ OJT và kiểm tra dữ liệu trước khi lưu vào hệ thống."
      busy={busy}
      onClose={onClose}
    >
      <div className="mb-6 grid grid-cols-3 gap-2">
        {["Chọn dữ liệu", "Kiểm tra & xác nhận", "Hoàn tất"].map((label, i) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-semibold sm:flex-row sm:text-left ${step === i + 1 ? "bg-orange-50 text-orange-700" : step > i + 1 ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step === i + 1 ? "bg-orange-600 text-white" : "bg-white"}`}
            >
              {step > i + 1 ? <Check size={14} /> : i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>
      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}
      {result ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Import thành công
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Đã xử lý {result.total} doanh nghiệp trong kỳ {periodName}. Danh
              sách doanh nghiệp đã được tải lại.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="break-all font-semibold">{file?.name}</p>
            <p className="mt-2">
              Tạo mới {result.created} · Cập nhật {result.updated}
            </p>
          </div>
          <button className={workflowPrimary} onClick={onClose}>
            Hoàn tất & về danh sách
          </button>
        </div>
      ) : !preview ? (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <Field label="Học kỳ OJT *">
                <select
                  aria-label="Học kỳ OJT để import"
                  className={workflowInput}
                  required
                  value={academicPeriodId}
                  disabled={busy || periodsLoading || !periodOptions.length}
                  onChange={(e) => {
                    setAcademicPeriodId(e.target.value);
                    reset();
                  }}
                >
                  <option value="">
                    {periodsLoading ? "Đang tải học kỳ…" : "Chọn học kỳ OJT"}
                  </option>
                  {periodOptions.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.code}){period.window ? "" : " — cần chọn đợt tuyển dụng"}
                    </option>
                  ))}
                </select>
              </Field>
              {!periodsLoading && !periodOptions.length && (
                <Notice>Chưa có học kỳ liên kết OJT. Cần cấu hình học kỳ trước khi import.</Notice>
              )}
              {!periodsLoading && !validWindow && (
                <Notice>Import cần đợt tuyển dụng đang mở, đúng kỳ và còn hạn tiếp nhận. Chưa có thông tin đợt để kiểm tra file.</Notice>
              )}
              <div className="flex gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
                <Info size={17} className="mt-0.5 shrink-0" />
                <p>
                  Chọn <strong>học kỳ OJT</strong> cần nhập. Đợt tuyển dụng phải
                  thuộc kỳ đã chọn và còn trong thời gian tiếp nhận.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Trước khi tải file
                </h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
                  <li>• Mỗi vị trí tuyển dụng là một dòng dữ liệu.</li>
                  <li>
                    • Kiểm tra mã doanh nghiệp, email, thông tin vị trí và chỉ
                    tiêu.
                  </li>
                  <li>
                    • Giữ nguyên tiêu đề cột trong file dùng cho hệ thống.
                  </li>
                  <li>
                    • Hệ thống kiểm tra dữ liệu trước khi cho phép xác nhận.
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <input
                ref={fileInput}
                aria-label="File import doanh nghiệp"
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                disabled={busy}
                onChange={(e) => chooseFile(e.target.files?.[0] || null)}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (!busy) {
                    if (e.dataTransfer.files.length !== 1)
                      setError("Vui lòng chọn một file cho mỗi lần import.");
                    else chooseFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-slate-50/60"}`}
              >
                <span className="mb-4 rounded-2xl bg-white p-3 text-orange-600 shadow-sm">
                  <UploadCloud size={30} />
                </span>
                <h3 className="font-bold text-slate-800">
                  Kéo thả file vào đây
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  Hỗ trợ XLSX, CSV · Tối đa 8 MB
                </p>
                <button
                  className={workflowSecondary + " mt-4"}
                  disabled={busy}
                  onClick={() => {
                    if (fileInput.current) fileInput.current.value = "";
                    fileInput.current?.click();
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Chọn file từ máy
                </button>
              </div>
              {file && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <FileSpreadsheet
                    className="shrink-0 text-emerald-600"
                    size={22}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold text-slate-800"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {Math.max(1, Math.ceil(file.size / 1024))} KB · Sẵn sàng
                      kiểm tra
                    </p>
                  </div>
                  <button
                    aria-label="Bỏ file đã chọn"
                    className="p-1 text-slate-500"
                    disabled={busy}
                    onClick={() => chooseFile(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              className={workflowSecondary}
              disabled={busy}
              onClick={onClose}
            >
              Để sau
            </button>
            <button
              className={workflowPrimary}
              disabled={busy || !file || !validWindow}
              onClick={() => send(false)}
            >
              <FileCheck2 size={16} />
              {busy ? "Đang kiểm tra…" : "Kiểm tra dữ liệu"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <FileSpreadsheet size={24} className="shrink-0 text-orange-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {file?.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {periodName} · {sourcePayload?.rows.length ?? preview.total} doanh nghiệp trong file
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Đã chọn", selectedCount],
              ["Dự kiến tạo mới", selectedCreated],
              ["Dự kiến cập nhật", selectedUpdated],
              ["Vị trí đã chọn", positionCount],
              ["Chỉ tiêu đã chọn", capacityTotal],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 p-3"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <div
            role="status"
            className={`rounded-xl border p-3 text-sm ${selectionReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : selectionPreview ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
          >
            {!selectedCount
              ? "Chọn ít nhất một doanh nghiệp bên dưới để import."
              : selectionReady
                ? `Đã kiểm tra hợp lệ ${selectedCount} doanh nghiệp được chọn. Xác nhận bên dưới để import.`
                : selectionPreview
                  ? "Danh sách được chọn chưa hợp lệ. Kiểm tra lỗi hoặc thay đổi lựa chọn rồi kiểm tra lại."
                  : `Đã chọn ${selectedCount} doanh nghiệp. Bấm “Kiểm tra lựa chọn” trước khi xác nhận import.`}
          </div>
          {!!activePreview?.errors?.length && (
            <div className="max-h-32 space-y-2 overflow-y-auto rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-700">
              {activePreview.errors.map((e, i) => (
                <p key={i}>{importErrorText(e)}</p>
              ))}
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-orange-50/50 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-orange-600"
                  ref={(input) => {
                    if (input) input.indeterminate = selectedCount > 0 && !allSelected;
                  }}
                  checked={allSelected}
                  disabled={busy || !selectableCodes.size}
                  onChange={(e) => changeSelection(e.target.checked ? new Set(selectableCodes) : new Set())}
                />
                Chọn tất cả ({selectableCodes.size})
              </label>
              <p className="text-xs text-slate-600" aria-live="polite">
                Đã chọn {selectedCount}/{sourcePayload?.rows.length ?? 0} doanh nghiệp · Áp dụng trên mọi trang
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Chi tiết doanh nghiệp
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Tên, liên hệ và chỉ tiêu theo file đã kiểm tra. Chỉ tiêu mỗi
                  doanh nghiệp là tổng các vị trí. Chọn doanh nghiệp sẽ nhập
                  toàn bộ vị trí của doanh nghiệp đó; doanh nghiệp có lỗi không
                  được chọn.
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyErrors}
                  onChange={(e) => {
                    setOnlyErrors(e.target.checked);
                    setPage(1);
                  }}
                />
                Chỉ xem dòng lỗi
              </label>
            </div>
            <div
              className="max-h-96 overflow-auto"
              tabIndex={0}
              role="region"
              aria-label="Chi tiết doanh nghiệp và chỉ tiêu trong file import"
            >
              <table className="w-full min-w-[920px] text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3" scope="col">Chọn</th>
                    {[
                      "STT", "Doanh nghiệp", "Người liên hệ / Email",
                      "Chỉ tiêu nhận", "Kết quả", "Thông báo",
                    ].map((h) => (
                      <th className="p-3" scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows
                    .slice((currentPage - 1) * 8, currentPage * 8)
                    .map((r) => (
                      <tr
                        key={`${r.code}:${r.rowNumber}`}
                        className={"align-top " + (
                          r.error || r.action === "ERROR" ? "bg-rose-50/60"
                            : r.enterprise && selectedCodes.has(r.enterprise.code) ? "bg-orange-50/50" : ""
                        )}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-orange-600"
                            aria-label={`Chọn doanh nghiệp ${r.enterprise?.name || r.code || r.rowNumber}`}
                            checked={!!r.enterprise && selectedCodes.has(r.enterprise.code)}
                            disabled={busy || !r.enterprise || !selectableCodes.has(r.enterprise.code)}
                            onChange={(e) => {
                              if (!r.enterprise) return;
                              const next = new Set(selectedCodes);
                              if (e.target.checked) next.add(r.enterprise.code);
                              else next.delete(r.enterprise.code);
                              changeSelection(next);
                            }}
                          />
                        </td>
                        <td className="p-3">{r.rowNumber}</td>
                        <td className="min-w-[220px] max-w-[300px] break-words p-3">
                          <p className="font-semibold text-slate-900">
                            {r.enterprise?.name || "—"}
                          </p>
                          <p className="mt-1 text-slate-500">{r.code || "—"}</p>
                        </td>
                        <td className="min-w-[220px] max-w-[280px] break-words p-3">
                          <p className="font-medium text-slate-800">
                            {r.enterprise?.fullName || "—"}
                          </p>
                          <p className="mt-1 break-all text-slate-500">
                            {r.enterprise?.email || "—"}
                          </p>
                        </td>
                        <td className="min-w-[180px] max-w-[280px] p-3">
                          <p className="font-semibold text-slate-900">
                            {r.totalCapacity === undefined ? "—" : `${r.totalCapacity} SV`}
                          </p>
                          {r.enterprise && (
                            <details className="mt-1 text-slate-600">
                              <summary className="cursor-pointer text-orange-700">
                                Xem {r.enterprise.positions.length} vị trí
                              </summary>
                              <ul className="mt-2 space-y-2">
                                {r.enterprise.positions.map((position) => (
                                  <li key={position.code} className="break-words">
                                    <span className="font-medium">{position.title}</span>
                                    <span className="text-slate-500"> · {position.capacity} SV</span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {rowLabels[r.action] || r.action}
                        </td>
                        <td className="p-3 text-slate-500">
                          {r.error ? importErrorText(r.error) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <p className="p-5 text-center text-xs text-slate-500">
                {onlyErrors
                  ? "Không có dòng lỗi trong kết quả trả về."
                  : "Hệ thống không trả về chi tiết từng dòng."}
              </p>
            )}
            <div className="border-t p-3">
              <Pager
                page={currentPage}
                total={rows.length}
                limit={8}
                busy={busy}
                onChange={setPage}
              />
            </div>
          </div>
          {selectionReady && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-orange-50 p-3 text-sm text-slate-700">
              <input
                className="mt-1 accent-orange-600"
                type="checkbox"
                checked={confirmed}
                disabled={busy}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                Tôi đồng ý import {selectedCount} doanh nghiệp đã chọn với {positionCount} vị trí,
                tổng chỉ tiêu {capacityTotal} sinh viên vào kỳ {periodName}.
              </span>
            </label>
          )}
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
            <button
              className={workflowSecondary}
              disabled={busy}
              onClick={reset}
            >
              <ArrowLeft size={16} />
              Chọn lại dữ liệu
            </button>
            {selectionReady ? (
              <button
                className={workflowPrimary}
                disabled={busy || !confirmed}
                onClick={() => send(true)}
              >
                <Check size={16} />
                {busy ? "Đang import…" : `Xác nhận import ${selectedCount} doanh nghiệp`}
              </button>
            ) : (
              <button
                className={workflowPrimary}
                disabled={busy || !selectedCount}
                onClick={checkSelection}
              >
                <FileCheck2 size={16} />
                {busy ? "Đang kiểm tra…" : "Kiểm tra lựa chọn"}
              </button>
            )}
          </div>
        </div>
      )}
    </WorkflowModal>
  );
}
export default QhdnEnterpriseImportModal;
