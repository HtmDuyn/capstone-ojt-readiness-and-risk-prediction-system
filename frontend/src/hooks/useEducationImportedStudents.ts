import { useEffect, useRef, useState } from 'react';
import { importService } from '@/services/import.service';
import type { Page } from '@/types/education/api.types';
import type { ImportedStudent, ImportedStudentFilters, ImportedStudentProfile, StoredCourseResult } from '@/types/education/import.types';

const emptyFilters = (): ImportedStudentFilters => ({ search: '', programId: '', cohortId: '', status: '', importBatchId: '' });
const message = (e: unknown) => e instanceof Error ? e.message : 'Không tải được dữ liệu đã lưu.';
export function useEducationImportedStudents(revision: number, sortActive = false) {
  const [filters, setFilters] = useState<ImportedStudentFilters>(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('status') ?? '';
    return { search: query.get('search') ?? '', programId: query.get('programId') ?? '', cohortId: query.get('cohortId') ?? '', status: ['ACTIVE', 'SUSPENDED', 'DROPPED_OUT'].includes(status) ? status : '', importBatchId: '' };
  });
  const [page, setPage] = useState(() => {
    const value = Number(new URLSearchParams(window.location.search).get('page'));
    return Number.isSafeInteger(value) && value > 0 ? value : 1;
  });
  const previousRevision = useRef(revision);
  const [data, setData] = useState<Page<ImportedStudent> | null>(null);
  const [allData, setAllData] = useState<{ key: string; page: Page<ImportedStudent> } | null>(null);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState<{ key: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const allKey = JSON.stringify([filters, revision, refresh]);
  useEffect(() => { if (previousRevision.current !== revision) { previousRevision.current = revision; setFilters(emptyFilters()); setPage(1); } }, [revision]);
  useEffect(() => {
    if (sortActive) return;
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
  }, [filters, page, revision, refresh, sortActive]);
  useEffect(() => {
    if (!sortActive) return;
    const c = new AbortController();
    setAllLoading(true); setAllError(null);
    (async () => {
      const first = await importService.listImportedStudents(filters, 1, c.signal);
      const items = [...first.items];
      const pages = Math.ceil(first.total / first.limit);
      if (pages > 1000) throw new Error('Danh sách quá lớn để sắp xếp. Hãy thu hẹp bộ lọc.');
      for (let next = 2; next <= pages; next++) {
        const result = await importService.listImportedStudents(filters, next, c.signal);
        items.push(...result.items);
      }
      if (items.length !== first.total || new Set(items.map(item => item.id)).size !== items.length)
        throw new Error('Danh sách đã thay đổi trong lúc tải. Hãy thử lại để sắp xếp chính xác.');
      if (!c.signal.aborted) {
        setAllData({ key: allKey, page: { ...first, items } });
        setPage(current => Math.min(current, Math.max(1, pages)));
      }
    })().catch(e => { if (!c.signal.aborted) setAllError({ key: allKey, message: message(e) }); })
      .finally(() => { if (!c.signal.aborted) setAllLoading(false); });
    return () => c.abort();
  }, [filters, revision, refresh, sortActive, allKey]);
  const sortedData = allData?.key === allKey ? allData.page : null;
  const sortedError = allError?.key === allKey ? allError.message : '';
  return {
    data: sortActive ? sortedData : data, filters, page, setPage,
    loading: sortActive ? allLoading || (!sortedData && !sortedError) : loading,
    error: sortActive ? sortedError : error,
    changeFilter: (name: keyof ImportedStudentFilters, value: string) => { setPage(1); setFilters(old => ({ ...old, [name]: value })); },
    clearFilters: () => { setFilters(emptyFilters()); setPage(1); },
    reload: () => setRefresh(v => v + 1),
  };
}

export function useImportedStudentDetail(id: number, revision: number) {
  const [profile, setProfile] = useState<ImportedStudentProfile | null>(null);
  const [results, setResults] = useState<Page<StoredCourseResult> | null>(null);
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
    (async () => {
      const first = await importService.getStoredCourseResults(id, 1, c.signal);
      const items = [...first.items];
      if (!Number.isSafeInteger(first.total) || first.total < 0 || !Number.isSafeInteger(first.limit) || first.limit < 1)
        throw new Error('Backend trả thông tin phân trang bảng điểm không hợp lệ.');
      for (let next = 2; items.length < first.total; next++) {
        const page = await importService.getStoredCourseResults(id, next, c.signal);
        if (page.total !== first.total || !page.items.length)
          throw new Error('Bảng điểm đã thay đổi trong lúc tải. Hãy mở lại hồ sơ để xem đầy đủ.');
        items.push(...page.items);
      }
      if (items.length !== first.total || new Set(items.map(item => item.id)).size !== items.length)
        throw new Error('Không tải được đầy đủ bảng điểm. Hãy mở lại hồ sơ.');
      return { ...first, items };
    })()
      .then(rows => { if (!c.signal.aborted) setResults(rows); })
      .catch(e => { if (!c.signal.aborted) setResultsError(message(e)); })
      .finally(() => { if (!c.signal.aborted) setResultsLoading(false); });
    return () => c.abort();
  }, [id, revision, refresh]);
  return { profile, results, profileLoading, resultsLoading, error, resultsError, reload: () => setRefresh(v => v + 1) };
}
