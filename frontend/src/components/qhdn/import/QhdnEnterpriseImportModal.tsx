import { useState } from "react";
import {
  commitEnterpriseImport,
  generateIdempotencyKey,
  previewEnterpriseImport,
} from "@/services/qhdnService";
import { action, control, errorMessage, Field, Notice, Table } from "../QhdnUi";
import type { ImportPreviewResponse } from "@/types/qhdn/qhdnTypes";

export function QhdnEnterpriseImportModal({
  isOpen,
  onClose,
  onImported,
  initialWindowId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  initialWindowId?: number;
}) {
  const [windowId, setWindowId] = useState(
    initialWindowId ? String(initialWindowId) : "",
  );
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [key, setKey] = useState(() => generateIdempotencyKey("import"));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const reset = () => {
    setPreview(null);
    setKey(generateIdempotencyKey("import"));
    setError("");
  };
  const send = async (commit: boolean) => {
    if (
      !file ||
      !Number.isSafeInteger(Number(windowId)) ||
      Number(windowId) < 1
    ) {
      setError("Chọn file và nhập mã đợt tuyển dụng hợp lệ.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("File tối đa 8 MB.");
      return;
    }
    if (commit && !preview?.canCommit) return;
    setBusy(true);
    setError("");
    try {
      // windowId là mã đợt tuyển dụng, không phải mã kỳ OJT.
      const body = new FormData();
      body.set("kind", "ENTERPRISE");
      body.set("windowId", windowId);
      body.set("idempotencyKey", key);
      body.set("file", file);
      if (commit) {
        await commitEnterpriseImport(body);
        onImported();
        onClose();
      } else setPreview(await previewEnterpriseImport(body));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="mx-auto my-8 max-w-3xl space-y-4 rounded-2xl bg-white p-6"
      >
        <h2 id="import-title" className="text-lg font-bold">
          Import doanh nghiệp theo đợt tuyển dụng
        </h2>
        <p className="text-sm text-slate-600">
          Dùng mã đợt tuyển dụng đang mở. Xem trước dữ liệu trước khi xác nhận
          tạo tài khoản và vị trí tuyển dụng.
        </p>
        <Field label="Mã đợt tuyển dụng">
          <input
            className={control}
            type="number"
            min="1"
            step="1"
            required
            value={windowId}
            disabled={busy}
            onChange={(e) => {
              setWindowId(e.target.value);
              reset();
            }}
          />
        </Field>
        <Field label="File XLSX hoặc CSV (tối đa 8 MB)">
          <input
            className={control}
            type="file"
            accept=".xlsx,.csv"
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              reset();
            }}
          />
        </Field>
        <p className="text-xs text-slate-500">
          Mỗi vị trí tuyển dụng là một dòng trong file. Hệ thống sẽ kiểm tra các
          trường bắt buộc trước khi import; không tự điền email hoặc chỉ tiêu
          khi thiếu dữ liệu.
        </p>
        {error && <Notice>{error}</Notice>}
        {preview && (
          <>
            <Notice>
              Tổng {preview.total} · Tạo mới {preview.created} · Cập nhật{" "}
              {preview.updated}.{" "}
              {preview.canCommit
                ? "Có thể xác nhận import."
                : "Cần sửa dữ liệu trước khi import."}
            </Notice>
            {preview.errors?.map((e, i) => (
              <Notice key={i}>
                {typeof e === "string" ? e : JSON.stringify(e)}
              </Notice>
            ))}
            <Table headers={["Dòng", "Mã", "Kết quả", "Lỗi"]}>
              {preview.rows?.map((r, i) => (
                <tr key={i}>
                  <td>{r.rowNumber}</td>
                  <td>{r.code}</td>
                  <td>{r.action}</td>
                  <td>{r.error || "—"}</td>
                </tr>
              ))}
            </Table>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <button className={control} disabled={busy} onClick={onClose}>
            Đóng
          </button>
          <button
            className={action}
            disabled={busy || !file}
            onClick={() => send(false)}
          >
            {busy ? "Đang xử lý…" : "Kiểm tra dữ liệu"}
          </button>
          <button
            className={action}
            disabled={busy || !preview?.canCommit}
            onClick={() => send(true)}
          >
            Xác nhận import
          </button>
        </div>
      </section>
    </div>
  );
}
export default QhdnEnterpriseImportModal;
