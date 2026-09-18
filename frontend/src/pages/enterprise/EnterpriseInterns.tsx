import React, { useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { CheckSquare, Plus, Search, Calendar, User, CheckCircle2, Clock } from 'lucide-react';
import { MOCK_ENTERPRISE_INTERNS, MOCK_INTERN_TASKS } from '@/data/enterprise/mockEnterpriseData';
import { EnterpriseIntern, InternTask } from '@/types/enterprise/enterpriseTypes';

export const EnterpriseInterns: React.FC = () => {
  const [interns, setInterns] = useState<EnterpriseIntern[]>(MOCK_ENTERPRISE_INTERNS);
  const [tasks, setTasks] = useState<InternTask[]>(MOCK_INTERN_TASKS);
  const [selectedIntern, setSelectedIntern] = useState<EnterpriseIntern | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<Partial<InternTask>>({
    title: '',
    description: '',
    deadline: '',
    status: 'TODO',
    assignedBy: 'Mentor Doanh Nghiệp',
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;

    const created: InternTask = {
      id: `TASK-${tasks.length + 101}`,
      internId: selectedIntern.id,
      internName: selectedIntern.fullName,
      title: newTask.title || 'Nhiệm vụ OJT',
      description: newTask.description || '',
      deadline: newTask.deadline || new Date().toISOString().split('T')[0],
      status: 'TODO',
      assignedBy: 'Nguyễn Anh Tuấn (Tech Lead)',
    };

    setTasks([created, ...tasks]);
    setShowAddTaskModal(false);
    setToastMessage(`Đã giao nhiệm vụ thành công cho sinh viên ${selectedIntern.fullName}!`);
    setNewTask({ title: '', description: '', deadline: '' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Giao Nhiệm vụ & Theo dõi Tiến độ Thực tập"
        description="Phân công công việc tuần, theo dõi tỷ lệ hoàn thành task, điểm danh làm việc và gán Mentor hướng dẫn."
        badge="Quản lý Interns"
        primaryAction={{
          label: "+ Giao nhiệm vụ OJT",
          onClick: () => {
            if (interns.length > 0) {
              setSelectedIntern(interns[0]);
              setShowAddTaskModal(true);
            }
          },
        }}
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Interns List & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Internship Students List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Danh sách Interns Đang Đón nhận</h3>
          <div className="space-y-3">
            {interns.map((intern) => (
              <div
                key={intern.id}
                onClick={() => setSelectedIntern(intern)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedIntern?.id === intern.id
                    ? 'bg-orange-50/60 border-orange-300 ring-2 ring-orange-400 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{intern.fullName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      intern.status === 'RISK'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {intern.status === 'RISK' ? 'Chậm tiến độ' : 'Bình thường'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1">{intern.position}</p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Mentor: <strong>{intern.mentorName}</strong></span>
                  <span className="font-semibold text-orange-600">{intern.progressPercent}%</span>
                </div>

                <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      intern.status === 'RISK' ? 'bg-rose-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${intern.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detail & Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIntern ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {selectedIntern.fullName} ({selectedIntern.studentCode})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedIntern.position} • Bắt đầu OJT: {selectedIntern.startDate}
                  </p>
                </div>

                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Giao task mới</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400">Tiến độ chung</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedIntern.progressPercent}%
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400">Số task hoàn thành</span>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">
                    {selectedIntern.completedTasks} / {selectedIntern.totalTasks}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400">Số ngày điểm danh</span>
                  <p className="text-lg font-bold text-blue-600 mt-0.5">
                    {selectedIntern.attendanceDays} ngày
                  </p>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Danh sách Nhiệm vụ OJT được giao</h4>

                {tasks.filter((t) => t.internId === selectedIntern.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có nhiệm vụ nào được giao cho sinh viên này.</p>
                ) : (
                  tasks
                    .filter((t) => t.internId === selectedIntern.id)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{task.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.status === 'DONE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {task.status === 'DONE'
                                ? 'Đã hoàn thành'
                                : task.status === 'IN_PROGRESS'
                                ? 'Đang thực hiện'
                                : 'Chưa bắt đầu'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{task.description}</p>
                          <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                            <span>Deadline: <strong>{task.deadline}</strong></span>
                            <span>Giao bởi: <strong>{task.assignedBy}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Chọn sinh viên bên danh sách để xem chi tiết tiến độ thực tập.
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && selectedIntern && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 text-orange-600">
                <CheckSquare className="w-5 h-5" />
                <span>Giao Nhiệm vụ Thực tập OJT Mới</span>
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Giao cho sinh viên: <strong className="text-slate-900">{selectedIntern.fullName}</strong> ({selectedIntern.studentCode})
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề nhiệm vụ / Task
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xây dựng Module Xử lý Thanh toán VNPAY"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả yêu cầu công việc
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết kết quả cần đạt được và tài liệu tham khảo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạn hoàn thành (Deadline)
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Xác nhận giao Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseInterns;
