import { useEffect, useRef, useState } from 'react';
import { academicService } from '@/services/educationService';
import { getAllItems } from '@/services/educationService';
import type { AcademicCalendar, AcademicPeriod, AcademicYear, SemesterDates } from '@/types/education/academic.types';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { useEducationCacheRefresh } from './useEducationCacheRefresh';

const errorText = (error: unknown) => friendlyErrorMessage(error, 'Không thực hiện được yêu cầu. Vui lòng thử lại.');
export function useEducationAcademicCalendar() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [calendarError, setCalendarError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEducationCacheRefresh(['/academic-years:','/academic-periods:'],()=>setRefresh(value=>value+1));
  const locked = useRef(false);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true); setCatalogError('');
    Promise.all([getAllItems<AcademicYear>('/academic-years', {}, c.signal), getAllItems<AcademicPeriod>('/academic-periods', {}, c.signal)])
      .then(([y, p]) => {
        if (c.signal.aborted) return;
        y.sort((a, b) => b.yearCode.localeCompare(a.yearCode));
        setYears(y); setPeriods(p);
        setSelectedId(id => y.some(year => String(year.id) === id) ? id : String(y[0]?.id ?? ''));
      }).catch(e => { if (!c.signal.aborted) setCatalogError(errorText(e)); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [refresh]);
  useEffect(() => {
    const c = new AbortController();
    setCalendar(null); setCalendarError(''); setCalendarLoading(Boolean(selectedId));
    if (selectedId) academicService.getCalendar(Number(selectedId), c.signal)
      .then(data => { if (!c.signal.aborted) setCalendar(data); })
      .catch(e => { if (!c.signal.aborted) setCalendarError(errorText(e)); })
      .finally(() => { if (!c.signal.aborted) setCalendarLoading(false); });
    return () => c.abort();
  }, [selectedId, refresh]);
  async function mutate(work: () => Promise<AcademicCalendar>, success: string) {
    if (locked.current) return false;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const data = await work();
      setCalendar(data); setSelectedId(String(data.year.id));
      setNotice(success); setRefresh(v => v + 1);
      return true;
    } catch (e) { setError(errorText(e)); return false; }
    finally { locked.current = false; setBusy(false); }
  }
  return {
    years, periods, selectedId, setSelectedId, calendar, loading, calendarLoading, busy,
    error, catalogError, calendarError, notice,
    reload: () => { setError(''); setNotice(''); setRefresh(v => v + 1); },
    create: (yearCode: string, blocks: SemesterDates[], block10: SemesterDates[]) => mutate(() => academicService.createAcademicYear({ yearCode, blocks, block10 }), `Đã tạo năm học ${yearCode} và lịch Block 10 và Block 3 cho cả ba học kỳ.`),
    save: (rows: SemesterDates[], blocks: SemesterDates[], block10: SemesterDates[]) => calendar
      ? mutate(() => academicService.updateCalendar(calendar.year.id, rows, calendar.revision, blocks, block10), 'Đã cập nhật lịch học kỳ, Block 10 và Block 3.')
      : Promise.resolve(false),
  };
}
