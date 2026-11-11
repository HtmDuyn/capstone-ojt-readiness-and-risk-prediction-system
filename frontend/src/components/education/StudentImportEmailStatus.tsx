import { useEffect, useState } from 'react';
import { importService } from '@/services/import.service';
import type { ImportCommitResponse } from '@/types/education/import.types';

function statusText(student: NonNullable<ImportCommitResponse['students']>[number]) {
  if (student.action !== 'CREATED') return 'Tài khoản đã tồn tại: cập nhật hồ sơ, không gửi lại email cấp tài khoản.';
  if (student.emailLastError?.startsWith('EAUTH')) return 'Chưa gửi được: máy chủ email từ chối đăng nhập. Quản trị viên cần kiểm tra cấu hình gửi mail.';
  switch (student.emailStatus) {
    case 'SENT': return 'Đã được máy chủ email tiếp nhận. Sinh viên kiểm tra Hộp thư đến và Thư rác.';
    case 'PENDING': return 'Đang chờ gửi email cấp tài khoản.';
    case 'SENDING': return 'Đang gửi email cấp tài khoản.';
    case 'FAILED': return 'Gửi email thất bại. Liên hệ quản trị viên để kiểm tra và gửi lại.';
    case 'CANCELLED': return 'Email đã hủy hoặc thông tin đăng nhập tạm đã hết hạn. Liên hệ quản trị viên.';
    default: return 'Chưa có email trong hàng đợi. Liên hệ quản trị viên để kiểm tra.';
  }
}

export function StudentImportEmailStatus({ result }: { result: ImportCommitResponse }) {
  const [current, setCurrent] = useState(result);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => { setCurrent(result); setError(''); }, [result]);
  const pending = current.students?.some(s => s.action === 'CREATED' && ['PENDING', 'SENDING'].includes(s.emailStatus));
  useEffect(() => {
    if (!result.importId || !pending) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      importService.getStudentImport(result.importId!, controller.signal)
        .then(data => { setCurrent(data); setError(''); })
        .catch(() => { if (!controller.signal.aborted) setError('Chưa cập nhật được trạng thái email. Bấm cập nhật để thử lại.'); });
    }, 15000);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [result.importId, pending, current]);
  async function refresh() {
    if (!result.importId) return;
    setRefreshing(true);
    try { setCurrent(await importService.getStudentImport(result.importId)); setError(''); }
    catch { setError('Không tải được trạng thái email. Vui lòng thử lại.'); }
    finally { setRefreshing(false); }
  }
  return <div className="space-y-2 rounded-lg border border-green-200 bg-white p-3 text-slate-700">
    <p className="font-semibold">Email cấp tài khoản sinh viên</p>
    <p>Đã tạo mới {current.created} tài khoản, cập nhật {current.updated} hồ sơ. Import thành công không đồng nghĩa email đã gửi thành công.</p>
    {current.students?.length ? <ul className="space-y-2" aria-live="polite">
      {current.students.map(student => <li key={student.studentCode}>
        <span className="font-medium">{student.studentCode}{student.email ? ` — ${student.email}` : ''}: </span>{statusText(student)}
      </li>)}
    </ul> : <p>{current.created === 0 ? 'Các tài khoản đã tồn tại nên không tạo email cấp tài khoản mới.' : 'Chưa tải được chi tiết trạng thái gửi email.'}</p>}
    {error && <p role="alert" className="text-amber-800">{error}</p>}
    {result.importId && <button type="button" disabled={refreshing} onClick={() => void refresh()} className="font-semibold text-orange-700 hover:underline disabled:opacity-50">
      {refreshing ? 'Đang cập nhật…' : 'Cập nhật trạng thái email'}
    </button>}
  </div>;
}
