import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CandidateDetailModal } from '../../src/components/enterprise/CandidateDetailModal';
import { API } from '../../src/services/apiService';
import type { EnterpriseCandidateItem } from '../../src/services/enterpriseService';
import '../../src/index.css';

const root = createRoot(document.getElementById('root')!);
const checks: string[] = [], requests: string[] = [], revoked: string[] = [];
const assert = (value: unknown, message: string) => { if (!value) throw Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
async function until(check: () => boolean, message: string) {
  for (let i = 0; i < 160; i++) { if (check()) return; await tick(); }
  throw Error(message);
}
const revoke = URL.revokeObjectURL.bind(URL);
URL.revokeObjectURL = url => { revoked.push(url); revoke(url); };
const candidate: EnterpriseCandidateItem = {
  id: 19, studentId: 3, ojtSemesterId: 7, positionId: 2, registrationId: 4,
  decision: 'PENDING', isLatestCoordination: true, canRespond: true, introducedAt: '2026-11-18T03:00:00Z',
  student: { id: 3, studentCode: 'SE250020', fullName: 'Đinh Hà Trang', email: 'student20@student.edu.vn', phone: '0901000000', status: 'ACTIVE', className: 'SE2501', programName: 'Khung minh họa SE - 39 môn cụ thể / 114 tín chỉ (không phải CTĐT chính thức)' },
  position: { id: 2, code: 'DEMO-TV-WEB-01', title: 'Thực tập phát triển Web', description: 'React, Node.js và PostgreSQL.', requirements: 'HTML, CSS, JavaScript', ojtSemesterId: 7 },
  application: { contactEmail: 'contact@example.test', contactPhone: '0912000000', note: 'Có thể thực tập từ tháng 12.' },
  jobApplication: { id: 8, appliedAt: '2026-11-17T03:00:00Z', coverLetter: ('Em có kinh nghiệm phát triển ứng dụng với React và Node.js.\n').repeat(45), certificates: [{ name: 'IELTS', url: 'https://example.test/certificate' }, { name: 'Invalid link', url: 'javascript:alert(1)' }], skills: [{ name: 'React' }, { name: 'Node.js' }], cv: { id: 11, fileName: 'CV_Đinh_Hà_Trang.pdf', size: 2048, mimeType: 'application/pdf' } },
  skills: [{ name: 'SQL', level: 3 }],
};
let failCv = false, closed = false, decision = '';
localStorage.setItem('ojt_auth_token', 'enterprise-fixture');
API.defaults.adapter = async config => {
  assert(config.headers.get('Authorization') === 'Bearer enterprise-fixture', 'CV must use authenticated API');
  requests.push(config.url!);
  if (failCv) throw { response: { data: new Blob([JSON.stringify({ message: 'Không tìm thấy CV đã gửi.' })], { type: 'application/json' }) } };
  return { status: 200, statusText: 'OK', headers: {}, config, data: new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }) };
};
function render(value = candidate, busy = false) {
  flushSync(() => root.render(<CandidateDetailModal key={value.id} candidate={value} busy={busy} decisionLabel="Chờ duyệt" onClose={() => { closed = true; flushSync(() => root.render(null)); }} onDecision={value => { decision = value; }} />));
}
const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label)!;
async function run() {
  document.getElementById('opener')!.focus();
  window.scrollTo(0, 200);
  render(); await tick();
  const dialog = document.querySelector<HTMLElement>('[role=dialog]')!;
  const overlay = dialog.parentElement!;
  const rect = overlay.getBoundingClientRect();
  assert(overlay.parentElement === document.body && rect.left === 0 && rect.top === 0 && rect.width === innerWidth && rect.height === innerHeight, 'Overlay must cover viewport outside transformed layout');
  assert(document.body.style.overflow === 'hidden', 'Background scroll must be locked');
  assert(dialog.scrollWidth <= dialog.clientWidth, 'Dialog must not overflow horizontally');
  assert(dialog.getBoundingClientRect().top >= 0 && dialog.getBoundingClientRect().bottom <= innerHeight, 'Dialog must fit viewport');
  const footer = dialog.querySelector('footer')!.getBoundingClientRect();
  assert(footer.bottom <= innerHeight && footer.top > 0, 'Decision actions must stay visible');
  const content = dialog.querySelector<HTMLElement>('[data-candidate-content]')!;
  assert(content.scrollHeight > content.clientHeight && content.clientHeight > 0, 'Long student details must scroll independently');
  checks.push('Full viewport overlay, locked background, bounded scrolling and visible actions');
  const body = dialog.textContent!;
  for (const value of ['contact@example.test', '0912000000', 'student20@student.edu.vn', 'React', 'Node.js', 'SQL', 'Mức 3/5', 'IELTS', '17/11/2026']) assert(body.includes(value), 'Missing application field: ' + value);
  assert(!body.includes('Ghi chú đăng ký') && !body.includes('Có thể thực tập từ tháng 12.'), 'Registration note must not be displayed');
  assert(!dialog.querySelector('a[href^="javascript:"]'), 'Certificate URLs must reject executable schemes');
  assert(requests.length === 0, 'CV bytes should load on demand');
  checks.push('Submitted contacts, date, cover letter, skills and safe certificate links');
  button('Xem CV').click();
  await until(() => !!dialog.querySelector('iframe'), 'CV preview did not load');
  const previewUrl = dialog.querySelector('iframe')!.src;
  assert(requests[0] === '/enterprise/candidates/19/cv' && previewUrl.startsWith('blob:'), 'Preview must request submitted CV for this candidate');
  button('Ẩn CV').click(); await tick();
  assert(revoked.includes(previewUrl), 'Hiding the preview must revoke its object URL');
  checks.push('Authenticated CV preview and object URL cleanup');
  failCv = true; button('Xem CV').click();
  await until(() => !!dialog.querySelector('[role=alert]'), 'CV error did not render');
  assert(dialog.textContent!.includes('Không tìm thấy CV đã gửi.'), 'PDF error responses must show server message');
  failCv = false; button('Thử tải lại CV').click();
  await until(() => !!dialog.querySelector('iframe'), 'CV retry did not recover');
  checks.push('CV load error and retry');
  button('Tiếp nhận thực tập OJT').click();
  assert(decision === 'ACCEPTED', 'Accept callback must use the selected candidate');
  const last = button('Tiếp nhận thực tập OJT'); last.focus();
  last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert(document.activeElement === dialog.querySelector('button'), 'Tab must stay inside the dialog');
  dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick();
  assert(closed && !document.querySelector('[role=dialog]') && document.body.style.overflow !== 'hidden', 'Escape must close dialog and unlock scroll');
  assert(document.activeElement?.id === 'opener', 'Closing must restore focus');
  checks.push('Decision callback, focus trap, Escape and focus restoration');
  closed = false;
  render({ ...candidate, id: 20, jobApplication: null, application: null, skills: [], canRespond: false }); await tick();
  assert(document.body.textContent!.includes('chưa có CV đính kèm') && document.body.textContent!.includes('Chưa có dữ liệu kỹ năng'), 'Older applications must show empty states');
  assert(!button('Tiếp nhận thực tập OJT') && !button('Từ chối'), 'Outside response window must not show decision actions');
  render(candidate, true); await tick();
  assert(button('Tiếp nhận thực tập OJT').disabled && button('Từ chối').disabled, 'Busy decisions must be disabled');
  document.querySelector('[role=dialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert(!closed, 'Busy dialog must stay open');
  checks.push('Missing CV/skills, expired response window and busy state');
  flushSync(() => root.render(null));
  (window as any).__candidateUiDone = { checks, width: innerWidth };
}
run().catch(error => { (window as any).__candidateUiDone = { error: String(error.stack || error), checks }; });
