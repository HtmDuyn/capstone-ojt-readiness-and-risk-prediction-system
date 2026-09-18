import React, { useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { Briefcase, Plus, Search, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { MOCK_ENTERPRISE_JOBS } from '@/data/enterprise/mockEnterpriseData';
import { OjtJobPosting } from '@/types/enterprise/enterpriseTypes';

export const EnterpriseJobs: React.FC = () => {
  const [jobs, setJobs] = useState<OjtJobPosting[]>(MOCK_ENTERPRISE_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newJob, setNewJob] = useState<Partial<OjtJobPosting>>({
    title: '',
    department: 'Software Development Unit',
    slotsTotal: 5,
    techStack: [],
    location: 'FPT Software Danang - FPT Complex',
    salaryAllowance: '5,000,000 VNĐ/tháng',
    status: 'OPEN',
  });
  const [techInput, setTechInput] = useState('');

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const created: OjtJobPosting = {
      id: `JOB-0${jobs.length + 1}`,
      title: newJob.title || 'Vị trí Thực tập Mới',
      department: newJob.department || 'Phòng Phát triển Phần mềm',
      slotsTotal: Number(newJob.slotsTotal) || 5,
      slotsFilled: 0,
      techStack: techInput ? techInput.split(',').map((t) => t.trim()) : ['ReactJS', 'NodeJS'],
      location: newJob.location || 'FPT Complex',
      salaryAllowance: newJob.salaryAllowance || 'Thỏa thuận',
      status: 'OPEN',
      createdDate: new Date().toISOString().split('T')[0],
    };

    setJobs([created, ...jobs]);
    setShowAddModal(false);
    setToastMessage('Đã đăng vị trí thực tập mới thành công!');
    setNewJob({ title: '', department: '', slotsTotal: 5, status: 'OPEN' });
    setTechInput('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleJobStatus = (id: string) => {
    setJobs(
      jobs.map((j) =>
        j.id === id ? { ...j, status: j.status === 'OPEN' ? 'CLOSED' : 'OPEN' } : j
      )
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Quản lý Vị trí Thực tập Doanh nghiệp"
        description="Đăng tin tuyển dụng thực tập OJT, quản lý số lượng chỉ tiêu và cập nhật thông tin yêu cầu kỹ thuật."
        badge="Tuyển dụng OJT"
        primaryAction={{
          label: "+ Đăng vị trí mới",
          onClick: () => setShowAddModal(true),
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên vị trí hoặc phòng ban..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredJobs.length}</strong> vị trí tuyển dụng
        </div>
      </div>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                    {job.id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-0.5 line-clamp-1">{job.title}</h3>
                </div>
                <button
                  onClick={() => toggleJobStatus(job.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                    job.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {job.status === 'OPEN' ? 'Đang mở' : 'Đóng đăng ký'}
                </button>
              </div>

              <p className="text-xs text-slate-500 font-medium">{job.department}</p>
              <p className="text-xs text-slate-600">{job.location}</p>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Chỉ tiêu tiếp nhận:</span>
                  <span className="font-bold text-slate-900">
                    {job.slotsFilled} / {job.slotsTotal} sinh viên
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(job.slotsFilled / job.slotsTotal) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Yêu cầu công nghệ:</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600">{job.salaryAllowance}</span>
              <div className="flex items-center space-x-2">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 text-orange-600">
                <Briefcase className="w-5 h-5" />
                <span>Đăng Vị trí Thực tập OJT Mới</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên vị trí tuyển dụng
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình viên Fullstack React/NodeJS Intern"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phòng ban trực thuộc
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Software Development Div 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng chỉ tiêu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={newJob.slotsTotal}
                    onChange={(e) => setNewJob({ ...newJob, slotsTotal: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Các công nghệ yêu cầu (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="React, NodeJS, TypeScript, PostgreSQL"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa điểm làm việc
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mức hỗ trợ phụ cấp
                  </label>
                  <input
                    type="text"
                    placeholder="5,000,000 VNĐ/tháng"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={newJob.salaryAllowance}
                    onChange={(e) => setNewJob({ ...newJob, salaryAllowance: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng vị trí mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseJobs;
