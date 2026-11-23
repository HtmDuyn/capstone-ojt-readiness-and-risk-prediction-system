import { useEffect, useRef, useState } from 'react';
import { academicService } from '@/services/educationService';
import { getAllItems } from '@/services/educationService';
import type { AcademicCalendar, AcademicPeriod, AcademicYear, SemesterDates } from '@/types/education/academic.types';

const errorText = (error: unknown) => {
  const response = (error as { response?: { data?: { message?: string; errorCode?: string } } })?.response?.data;
  if (response?.errorCode === 'ACADEMIC_DUPLICATE') return 'Mã năm học hoặc mã học kỳ đã tồn tại.';
  const message = response?.message || (error instanceof Error ? error.message : 'Không thực hiện được yêu cầu.');
  const known: Record<string, string> = {
    'Only a semester and its own Block 3 may overlap.': 'Lịch mới chồng lấn với học kỳ hoặc Block 3 đã có.',
    'Periods must be within their academic year, and Block 3 must be within its parent semester.': 'Lịch mới khiến Block 3 nằm ngoài học kỳ hoặc năm học.',
    'OJT dates must be within their academic year and any linked semester.': 'Lịch mới khiến kỳ OJT nằm ngoài học kỳ hoặc năm học.',
    'Each group must start in a semester on or after its enrollment year.': 'Lịch mới không phù hợp với năm nhập học của nhóm sinh viên.',
    'A placement must start in a semester on or after enrollment, and cannot be later than the current specialized semester.': 'Lịch mới không phù hợp với tiến độ học tập của sinh viên.',
    'Configure the cohort curriculum mapping before assigning a student to this calendar period.': 'Cần cấu hình lộ trình học kỳ của khóa trước khi gán sinh viên vào kỳ này.',
  };
  return known[message] ?? message;
};
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
    create: (yearCode: string, semesters: SemesterDates[]) => mutate(() => academicService.createAcademicYear({ yearCode, semesters }), `Đã tạo năm học ${yearCode} và đầy đủ 3 kỳ Spring → Summer → Fall.`),
    save: (rows: SemesterDates[]) => calendar
      ? mutate(() => academicService.updateCalendar(calendar.year.id, rows, calendar.revision), 'Đã cập nhật đồng thời cả 3 học kỳ.')
      : Promise.resolve(false),
  };
}
