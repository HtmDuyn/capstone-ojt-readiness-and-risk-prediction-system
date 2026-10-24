import { useEffect, useState } from 'react';
import { importService } from '@/services/import.service';
import type { Page } from '@/types/education/api.types';
import type { ImportedStudent, ImportedStudentFilters, ImportedStudentProfile, StoredCourseResult, StudentImportBatch } from '@/types/education/import.types';

const emptyFilters = (): ImportedStudentFilters => ({ search: '', programId: '', cohortId: '', status: '', importBatchId: '' });
const message = (e: unknown) => e instanceof Error ? e.message : 'Không tải được dữ liệu đã lưu.';
export function useEducationImportedStudents(revision: number) {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<ImportedStudent> | null>(null);
  const [batches, setBatches] = useState<StudentImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchError, setBatchError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { setFilters(emptyFilters()); setPage(1); }, [revision]);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true); setError(''); setData(null);
    importService.listImportedStudents(filters, page, c.signal)
      .then(result => {
        if (c.signal.aborted) return;
        setData(result);
        const last = Math.max(1, Math.ceil(result.total / result.limit));
        if (page > last) setPage(last);
      })
      .catch(e => { if (!c.signal.aborted) setError(message(e)); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [filters, page, revision, refresh]);
  useEffect(() => {
    const c = new AbortController(); setBatchError('');
    importService.listStudentImportBatches(c.signal)
      .then(rows => { if (!c.signal.aborted) setBatches(rows); })
      .catch(e => { if (!c.signal.aborted) setBatchError(message(e)); });
    return () => c.abort();
  }, [revision, refresh]);
  return {
    data, batches, filters, page, setPage, loading, error, batchError,
    changeFilter: (name: keyof ImportedStudentFilters, value: string) => { setPage(1); setFilters(old => ({ ...old, [name]: value })); },
    clearFilters: () => { setFilters(emptyFilters()); setPage(1); },
    reload: () => setRefresh(v => v + 1),
  };
}

export function useImportedStudentDetail(id: number, revision: number) {
  const [profile, setProfile] = useState<ImportedStudentProfile | null>(null);
  const [results, setResults] = useState<Page<StoredCourseResult> | null>(null);
  const [page, setPage] = useState(1);
  const [profileLoading, setProfileLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultsError, setResultsError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const c = new AbortController(); setProfileLoading(true); setError(''); setProfile(null);
    importService.getImportedStudent(id, c.signal)
      .then(row => { if (!c.signal.aborted) setProfile(row); })
      .catch(e => { if (!c.signal.aborted) setError(message(e)); })
      .finally(() => { if (!c.signal.aborted) setProfileLoading(false); });
    return () => c.abort();
  }, [id, revision, refresh]);
  useEffect(() => {
    const c = new AbortController(); setResultsLoading(true); setResultsError(''); setResults(null);
    importService.getStoredCourseResults(id, page, c.signal)
      .then(rows => { if (!c.signal.aborted) setResults(rows); })
      .catch(e => { if (!c.signal.aborted) setResultsError(message(e)); })
      .finally(() => { if (!c.signal.aborted) setResultsLoading(false); });
    return () => c.abort();
  }, [id, page, revision, refresh]);
  return { profile, results, page, setPage, profileLoading, resultsLoading, error, resultsError, reload: () => setRefresh(v => v + 1) };
}
