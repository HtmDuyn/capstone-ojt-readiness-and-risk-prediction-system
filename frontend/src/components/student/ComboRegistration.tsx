import { useRef, useState, type FormEvent } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { studentPost } from '@/services/student';
import type {
  AcademicProgress,
  Eligibility,
  Window,
} from '@/types/student/portal';
import {
  Blockers,
  buttonClass,
  Card,
  dateText,
  Empty,
  inputClass,
  statusText,
} from './PortalUI';

interface Preview {
  preview: {
    current: AcademicProgress;
    proposed: AcademicProgress;
    eligibility: Eligibility;
    earnedCreditDelta: number;
  };
}
function ComboForm({ window }: { window: Window }) {
  const { refresh } = useStudentPortal();
  const previous = window.selection ?? window.confirmedSelection;
  const [comboId, setComboId] = useState(
    previous?.comboId ?? window.availableCombos?.[0]?.id ?? 0,
  );
  const [courseIds, setCourseIds] = useState<number[]>(
    previous?.courseIds ?? [],
  );
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const combo = window.availableCombos?.find((item) => item.id === comboId);
  const changed =
    !!previous &&
    (previous.comboId !== comboId ||
      [...previous.courseIds].sort().join(',') !==
        [...courseIds].sort().join(','));
  const valid =
    !!combo &&
    combo.choiceGroups.every((group) => {
      const count = courseIds.filter((id) =>
        group.courseIds.includes(id),
      ).length;
      return count >= group.minCourses && count <= group.maxCourses;
    }) &&
    courseIds.length > 0;
  const submit = async (isPreview: boolean) => {
    if (lock.current || !valid || !window.canSubmit) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await studentPost<Preview>(
        '/combo-registration-windows/' +
          window.id +
          (isPreview ? '/preview' : '/selections'),
        {
          comboId,
          courseIds,
          ...(!isPreview && reason.trim() ? { reason: reason.trim() } : {}),
        },
      );
      setPreview(result);
      if (!isPreview) {
        setMessage('Đã lưu lựa chọn combo.');
        refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không lưu được lựa chọn combo.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 p-4"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      <div>
        <h3 className="font-bold">{window.name}</h3>
        <p className="text-sm text-slate-500">
          {window.semester?.name} · {statusText(window.status)} · Hạn:{' '}
          {dateText(window.effectiveEndsAt ?? window.endsAt)}
        </p>
      </div>
      <Blockers
        values={
          window.blockingMessages?.length
            ? window.blockingMessages
            : window.blockingReasons
        }
      />
      {previous && (
        <p className="text-sm text-slate-600">
          Đã có lựa chọn combo #{previous.comboId}. Việc đổi lựa chọn cần lý do.
        </p>
      )}
      {!!window.availableCombos?.length && (
        <fieldset disabled={busy || !window.canSubmit} className="space-y-3">
          <label className="block text-sm">
            Combo
            <select
              className={inputClass}
              value={comboId}
              onChange={(e) => {
                setComboId(Number(e.target.value));
                setCourseIds([]);
                setPreview(null);
              }}
            >
              {window.availableCombos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </label>
          {combo?.choiceGroups.map((group) => (
            <p className="text-sm text-slate-500" key={group.code}>
              Nhóm {group.code}: chọn {group.minCourses}–{group.maxCourses} môn.
            </p>
          ))}
          <div className="grid sm:grid-cols-2 gap-2">
            {combo?.courses.map((course) => (
              <label
                className="flex items-start gap-2 text-sm rounded-xl bg-slate-50 p-3"
                key={course.courseId}
              >
                <input
                  type="checkbox"
                  checked={courseIds.includes(course.courseId)}
                  onChange={(e) => {
                    setCourseIds((ids) =>
                      e.target.checked
                        ? [...ids, course.courseId]
                        : ids.filter((id) => id !== course.courseId),
                    );
                    setPreview(null);
                  }}
                />
                <span>
                  {course.courseCode} · {course.name} ({course.credits ?? '—'}{' '}
                  tín chỉ)
                </span>
              </label>
            ))}
          </div>
          <label className="block text-sm">
            Lý do thay đổi
            <textarea
              className={inputClass}
              maxLength={2000}
              required={changed}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              className={buttonClass}
              disabled={!valid}
              onClick={() => void submit(true)}
            >
              Xem tác động trước khi lưu
            </button>
            <button
              type="submit"
              className={buttonClass}
              disabled={!valid || (changed && !reason.trim())}
            >
              Lưu lựa chọn
            </button>
          </div>
        </fieldset>
      )}
      {busy && <p role="status">Đang xử lý...</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      {preview && (
        <div className="rounded-xl bg-orange-50 p-4 text-sm space-y-2">
          <p>
            Tín chỉ hiện tại: {preview.preview.current.credits.earned} · Sau đổi
            combo: {preview.preview.proposed.credits.earned}
          </p>
          <p>
            Chênh lệch: {preview.preview.earnedCreditDelta} tín chỉ · Đối chiếu
            điều kiện: {statusText(preview.preview.eligibility.status)}
          </p>
          <Blockers values={preview.preview.eligibility.reasons} />
        </div>
      )}
    </form>
  );
}
export function ComboRegistration() {
  const { comboWindows, semesterId } = useStudentPortal();
  const windows = comboWindows.filter(
    (window) => !semesterId || window.ojtSemesterId === semesterId,
  );
  return (
    <Card title="Đăng ký / xác nhận combo">
      {windows.length ? (
        windows.map((window) => <ComboForm key={window.id} window={window} />)
      ) : (
        <Empty>Chưa có đợt đăng ký combo cho bạn trong đợt OJT đã chọn.</Empty>
      )}
    </Card>
  );
}
