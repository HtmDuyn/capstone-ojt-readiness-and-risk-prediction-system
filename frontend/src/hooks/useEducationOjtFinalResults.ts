import { educationOjtWorkflowService } from '@/services/educationService';
import type { OjtFinalResult as Result } from '@/types/education/ojtWorkflow.types';
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import type { Page } from '@/types/education/api.types';
import React from "react";

export function useEducationOjtFinalResults() {
  const [data, setData] = React.useState<Page<Result> | null>(null),
    [selected, setSelected] = React.useState<Result | null>(null);
  const [semesterId, setSemesterId] = React.useState('');
  const { semesters, error: semesterError } = useEducationSemesters();
  const [allTotal, setAllTotal] = React.useState<number | null>(null);
  const [totalError, setTotalError] = React.useState('');
  const [search, setSearch] = React.useState(""),
    [status, setStatus] = React.useState(""),
    [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    setAllTotal(null);
    setTotalError('');
    educationOjtWorkflowService.getFinalResults({ page: 1, limit: 1 }, controller.signal)
      .then(result => { if (!controller.signal.aborted) setAllTotal(result.total); })
      .catch(() => { if (!controller.signal.aborted) setTotalError('Không tải được tổng số kết quả OJT. Vui lòng thử lại sau.'); });
    return () => controller.abort();
  }, []);

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
  }, [page, search, status, semesterId]);
  return { data, allTotal, totalError, selected, setSelected, semesterId, setSemesterId, search, setSearch, status, setStatus, page, setPage, loading, error, setError, semesters, semesterError };
}
