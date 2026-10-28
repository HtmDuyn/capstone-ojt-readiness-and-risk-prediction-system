import { useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getAssignment, getTasks } from '@/services/student';
import {
  AssignmentCard,
  Card,
  dateText,
  Empty,
  inputClass,
  Pagination,
  ResourceState,
  statusText,
  StudentPage,
} from '@/components/student/PortalUI';

function ProgressContent() {
  const { profile, semesterId, revision } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const key = profile!.id + ':' + semesterId + ':' + revision;
  const assignment = useStudentResource('assignment:' + key, (signal) =>
    getAssignment(semesterId!, signal),
  );
  const tasks = useStudentResource('tasks:' + key + ':' + page, (signal) =>
    getTasks(semesterId!, page, signal),
  );
  const visible = tasks.data?.items.filter((task) =>
    (task.name + ' ' + (task.description ?? ''))
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <>
      <ResourceState
        loading={assignment.loading}
        error={assignment.error}
        retry={assignment.reload}
      />
      {assignment.data !== null && (
        <AssignmentCard assignment={assignment.data} />
      )}
      {!assignment.loading && !assignment.error && !assignment.data && (
        <AssignmentCard assignment={null} />
      )}
      <Card title="Nhiệm vụ thực tập">
        <ResourceState
          loading={tasks.loading}
          error={tasks.error}
          retry={tasks.reload}
        />
        <input
          className={inputClass}
          aria-label="Tìm nhiệm vụ trong trang"
          placeholder="Tìm nhiệm vụ trong trang hiện tại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tasks.data && (
          <>
            <div className="grid lg:grid-cols-3 gap-4">
              {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => {
                const items = visible?.filter((task) =>
                  status === 'DONE'
                    ? ['DONE', 'COMPLETED'].includes(task.status.toUpperCase())
                    : task.status.toUpperCase() === status,
                );
                return (
                  <section
                    className="rounded-2xl bg-slate-50 p-4 space-y-3"
                    key={status}
                  >
                    <h3 className="font-bold">
                      {statusText(status)} ({items?.length ?? 0})
                    </h3>
                    {items?.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-sm space-y-2"
                      >
                        <h4 className="font-bold">{task.name}</h4>
                        <p className="whitespace-pre-wrap">
                          {task.description}
                        </p>
                        <p className="text-slate-500">
                          Giao: {dateText(task.assignedDate)}
                        </p>
                        <p className="text-slate-500">
                          Hạn: {dateText(task.dueDate)}
                        </p>
                      </article>
                    ))}
                  </section>
                );
              })}
            </div>
            {visible
              ?.filter(
                (task) =>
                  !['TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED'].includes(
                    task.status.toUpperCase(),
                  ),
              )
              .map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border p-4 text-sm"
                >
                  <h3 className="font-bold">{task.name}</h3>
                  <p>{task.description}</p>
                  <p>
                    {statusText(task.status)} · Hạn: {dateText(task.dueDate)}
                  </p>
                </article>
              ))}
            {!visible?.length && (
              <Empty>Chưa có nhiệm vụ phù hợp trong trang này.</Empty>
            )}
            <Pagination
              page={page}
              total={tasks.data.total}
              onChange={setPage}
            />
          </>
        )}
        <p className="text-xs text-slate-500">
          Các cột hiển thị nhiệm vụ trong trang hiện tại. Trạng thái được đồng
          bộ từ doanh nghiệp; hệ thống chưa có API để sinh viên thay đổi trạng
          thái.
        </p>
      </Card>
      <Card title="Báo cáo thực tập hàng tuần">
        <Empty>
          Hệ thống chưa hỗ trợ API tải hoặc nộp báo cáo tuần. Vui lòng thực hiện
          theo hướng dẫn của doanh nghiệp và nhà trường.
        </Empty>
      </Card>
    </>
  );
}
export const StudentOJTProgress = () => {
  const { profile, semesterId, loading } = useStudentPortal();
  return (
    <StudentPage
      title="Theo dõi tiến độ thực tập OJT"
      description="Xem phân công, người hướng dẫn, thời gian thực tập và nhiệm vụ do doanh nghiệp giao."
    >
      {!loading && profile && semesterId && (
        <ProgressContent key={profile.id + ':' + semesterId} />
      )}
    </StudentPage>
  );
};
export default StudentOJTProgress;
