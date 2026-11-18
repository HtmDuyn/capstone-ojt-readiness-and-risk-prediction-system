import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../src/contexts/AuthContext';
import { StudentPortalProvider } from '../../src/contexts/StudentPortalContext';
import { useStudentResource } from '../../src/hooks/useStudentResource';
import { studentSnapshots } from '../../src/services/studentSnapshots';
import { API, studentPost } from '../../src/services/studentService';
import StudentDashboard from '../../src/pages/student/StudentDashboard';
import StudentProfile from '../../src/pages/student/StudentProfile';
import StudentOjtRegistration from '../../src/pages/student/StudentOjtRegistration';

const root = createRoot(document.getElementById('root')!);
const checks: string[] = [];
const requests: any[] = [];
const errors: string[] = [];
window.addEventListener('error', event => errors.push(event.message));
const assert = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(condition: () => boolean, message: string) {
  const start = performance.now();
  while (!condition()) {
    if (performance.now() - start > 4_000) throw Error(message);
    await tick();
  }
}
const deferred = <T,>() => {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const auth = (token = 'student-a') => ({
  token, user: { id: '7', email: 'student@test.test', fullName: 'Student A', role: 'student' },
  isLoading: false, login() {}, logout() {},
});
let current: ReturnType<typeof useStudentResource<number>>;
function Probe({ resourceKey, load }: { resourceKey: string; load: (signal: AbortSignal, publish: (n: number) => void) => Promise<number> }) {
  current = useStudentResource(resourceKey, load, { snapshot: true });
  return <output>{current.data ?? 'empty'}:{current.pending ? 'pending' : 'done'}:{current.error}</output>;
}
function renderProbe(key: string, load: (signal: AbortSignal, publish: (n: number) => void) => Promise<number>, token = 'student-a') {
  localStorage.setItem('ojt_auth_token', token);
  flushSync(() => root.render(<AuthContext.Provider value={auth(token) as any}><Probe key={key + token} resourceKey={key} load={load}/></AuthContext.Provider>));
}
const body = () => document.body.textContent ?? '';
async function run() {
  // These checks exercise the real React hook/effects, not a simulated hook runner.
  studentSnapshots.write(studentSnapshots.scope('student-a'), 'overview', 1);
  const update = deferred<number>();
  let calls = 0;
  renderProbe('overview', () => { calls++; return update.promise; });
  assert(current.data === 1, 'Recent data must render synchronously on navigation');
  await until(() => calls === 1, 'Snapshot must still trigger a fresh server request');
  update.resolve(2);
  await until(() => current.data === 2 && !current.pending, 'Fresh data must replace the snapshot');
  checks.push('cached first paint always revalidates');

  const rest = deferred<number>();
  renderProbe('courses', async (_signal, publish) => { publish(10); return rest.promise; });
  await until(() => current.data === 10 && current.refreshing, 'First page must render before the remaining pages');
  rest.resolve(20);
  await until(() => current.data === 20 && !current.pending, 'Remaining pages must replace partial data');
  checks.push('progressive first page');

  const failure = deferred<number>();
  renderProbe('overview', () => failure.promise);
  assert(current.data === 2, 'Remount should display the most recent verified data');
  await tick();
  failure.reject(Error('Temporary failure'));
  await until(() => !!current.error, 'Revalidation errors must remain visible');
  assert(current.data === 2, 'A failed refresh must preserve the displayed snapshot');
  checks.push('refresh error preserves data');

  const other = deferred<number>();
  renderProbe('overview', () => other.promise, 'student-b');
  assert(current.data === null, 'Account change must hide previous data before effects');
  other.resolve(30);
  await until(() => current.data === 30, 'New account must load its own data');
  checks.push('session isolation on first paint');

  API.defaults.adapter = async config => ({ data: { success: true, data: {} }, status: 200, statusText: 'OK', headers: {}, config });
  await studentPost('/job-applications', {});
  renderProbe('different', async () => 0, 'student-b');
  renderProbe('overview', async () => 40, 'student-b');
  assert(current.data === null, 'Successful writes must invalidate earlier snapshots');
  await until(() => current.data === 40, 'Reads after writes must remain usable');
  checks.push('successful writes invalidate UI snapshots');

  // Exercise the real screens with a slow academic computation and later API pages.
  const profile = {
    id: 2, userId: 7, fullName: 'Student A', studentCode: 'SE0002', email: 'student@test.test',
    phone: null, cv: null, program: null, ojtSemesterId: 1, ojtRegistrations: { items: [], total: 0 },
  };
  const progress = deferred<any>(), secondCourses = deferred<any>(), opportunities = deferred<any>();
  const page = (items: any[], total = items.length) => ({ items, total, page: 1, limit: 100 });
  const course = (id: number) => ({ id, courseId: id, courseCode: `COURSE${id}`, courseName: `Course ${id}`, semesterTaken: id, attemptNumber: 1, score: 8, status: 'PASSED' });
  API.defaults.adapter = async config => {
    requests.push(config);
    const url = new URL(config.url!, 'https://student.test');
    let data: any;
    if (url.pathname === '/auth/me') return { data: { success: true, user: { id: 7, studentId: 2, email: profile.email, roleCode: 'STUDENT' } }, status: 200, statusText: 'OK', headers: {}, config };
    if (url.pathname === '/students/2') {
      if (url.searchParams.get('include') === 'academicProgress') data = await progress.promise;
      else if (url.searchParams.get('include') === 'courseResults') data = url.searchParams.get('resultsPage') === '2'
        ? await secondCourses.promise : { courseResults: page([course(1)], 2) };
      else data = profile;
    } else if (url.pathname === '/ojt-registration-windows') data = page([{ id: 1, ojtSemesterId: 1, name: 'OJT test', status: 'OPEN' }]);
    else if (url.pathname === '/students/me/notifications' || url.pathname === '/notifications') data = { ...page([]), unreadCount: 0 };
    else if (url.pathname === '/job-applications') data = page([{ id: 1, position: { title: 'Intern' }, company: { name: 'Company' }, status: 'SUBMITTED' }], 40);
    else if (url.pathname === '/students/me/opportunities') data = await opportunities.promise;
    else if (url.pathname === '/students/me/dashboard' || url.pathname === '/students/me/ojt-risk-assessment') {
      // Keep these requests pending until cancellation to prove that they do not block other UI.
      await new Promise((_resolve, reject) => config.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
    } else throw Error(`Unexpected request: ${config.url}`);
    return { data: { success: true, data }, status: 200, statusText: 'OK', headers: {}, config };
  };
  localStorage.setItem('ojt_auth_token', 'student-a');
  const screenAuth = auth();
  const renderScreen = (screen: React.ReactNode) => flushSync(() => root.render(
    <AuthContext.Provider value={screenAuth as any}><MemoryRouter><StudentPortalProvider>{screen}</StudentPortalProvider></MemoryRouter></AuthContext.Provider>,
  ));
  renderScreen(<StudentDashboard/>);
  await until(() => body().includes('Tổng quan OJT'), 'Dashboard must render before its slow aggregate or risk request');
  assert(!requests.some(r => r.url.includes('include=academicProgress')), 'Dashboard bootstrap must not compute academic progress');
  assert(requests.some(r => r.url.includes('/dashboard?')), 'Dashboard aggregate still loads independently');
  assert(requests.some(r => r.url.includes('/dashboard?') && r.url.includes('view=summary')), 'The visible overview must use the summary projection');
  assert(requests.filter(r => r.url.startsWith('/students/me/notifications')).length === 1, 'Bootstrap and dashboard must not duplicate notification requests');
  assert(requests.filter(r => r.url.startsWith('/ojt-registration-windows')).every(r => r.url.includes('view=catalog')), 'Dropdown should load only the scoped catalog, not application validation');
  checks.push('dashboard renders before aggregate/AI response');

  renderScreen(<StudentProfile/>);
  await until(() => body().includes('COURSE1'), 'Transcript first page must render before academic progress or page two');
  assert(!body().includes('COURSE2'), 'Second course page must actually remain pending');
  secondCourses.resolve({ courseResults: page([course(2)], 2) });
  await until(() => body().includes('COURSE2'), 'Transcript must retain courses from later pages');
  progress.resolve({ academicProgress: { gpa: 3.2, gpaScale: 4, credits: { earned: 60, total: 120, remaining: 60 }, requirements: [], issues: [] } });
  await until(() => body().includes('3.2 / 4'), 'Academic metrics must update independently');
  checks.push('academic profile and transcript load independently');

  renderScreen(<StudentOjtRegistration/>);
  await until(() => body().includes('Doanh nghiệp liên kết'), 'Recruitment UI must render independently');
  assert(!requests.some(r => r.url.startsWith('/job-applications')), 'Application history must wait for its tab');
  const records = document.getElementById('records-tab')!;
  records.click();
  await until(() => body().includes('Company'), 'Opening records must request its first page');
  const history = requests.filter(r => r.url.startsWith('/job-applications'));
  assert(history.length === 1 && history[0].url.includes('limit=20'), 'History must load one server page rather than every page');
  checks.push('application history is lazy and server-paginated');
  flushSync(() => root.unmount());
  return checks;
}
run().then(checks => { (window as any).__studentUiDone = { checks }; })
  .catch(error => { (window as any).__studentUiDone = { error: error.stack ?? String(error), checks, body: body(), requests: requests.map(r => r.url), errors }; });
