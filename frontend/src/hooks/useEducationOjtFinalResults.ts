import { educationOjtWorkflowService } from '@/services/educationOjtWorkflow.service';
import type { OjtFinalResult as Result } from '@/types/education/ojtWorkflow.types';
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import type { Page } from '@/types/education/api.types';
import React from "react";

export function useEducationOjtFinalResults() {
  const [data, setData] = React.useState<Page<Result> | null>(null),
    [selected, setSelected] = React.useState<Result | null>(null);
  const [semesterId, setSemesterId] = React.useState('');
  const { semesters, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [search, setSearch] = React.useState(""),
    [status, setStatus] = React.useState(""),
    [page, setPage] = React.useState(1),
    [refresh, setRefresh] = React.useState(0);
  const [loading, setLoading] = React.useState(false),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(""),
    [notice, setNotice] = React.useState(""),
    [reason, setReason] = React.useState("");
  const keys = React.useRef(new Map<number, { reason: string; key: string }>());

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    educationOjtWorkflowService.getFinalResults(
      { page, limit: 20, search, status, ojtSemesterId: semesterId },
      controller.signal,
    )
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  
  return () => controller.abort();
  }, [page, search, status, semesterId, refresh]);
  async function confirm() {
    if (!selected || busy || !reason.trim()) return;
    const id = selected.id,
      trimmed = reason.trim();
    let attempt = keys.current.get(id);
    if (!attempt || attempt.reason !== trimmed) {
      attempt = { reason: trimmed, key: crypto.randomUUID() };
      keys.current.set(id, attempt);
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await educationOjtWorkflowService.confirmResult(id, trimmed, attempt.key);
      setSelected(null);
      setReason("");
      setPage(1);
      setRefresh((v) => v + 1);
      setNotice("Đã xác nhận và ghi nhận kết quả OJT trên hệ thống.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xác nhận kết quả.");
    } finally {
      setBusy(false);
    }
  }
  return { data, selected, setSelected, semesterId, setSemesterId, search, setSearch, status, setStatus, page, setPage, setRefresh, loading, busy, error, setError, notice, reason, setReason, semesters, semesterError, reloadSemesters, confirm };
}
