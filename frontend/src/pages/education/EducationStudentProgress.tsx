import { StudentProgressList } from '@/components/education/StudentProgressList';
import { useEducationStudentProgress } from '@/hooks/useEducationStudentProgress';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  GraduationCap,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import React from "react";

import { PageBanner } from "@/components/common/PageBanner";
import type { OjtEligibilityStatus, StudentProgress, SubjectStatus } from '@/types/education/studentProgress.types';

/* =========================================================
   TYPES
   ========================================================= */

/* =========================================================
   OJT RULE
   ========================================================= */

/*
 * Điều kiện OJT hiển thị theo kết quả API eligibility của backend.
 * Hai hằng số bên dưới chỉ dùng để giải thích ngưỡng trên giao diện;
 * frontend không tự quyết định trạng thái đủ/chưa đủ điều kiện.
 */

const OJT_MIN_CREDITS = 70;

const OJT_MAX_NOT_PASSED_SUBJECTS = 2;

const getNotPassedSubjectCount = (student: StudentProgress) => {
  return student.subjects.filter((subject) => subject.status === "Not Passed")
    .length;
};

const getOjtEligibilityStatus = (
  student: StudentProgress,
): OjtEligibilityStatus => student.eligibilityStatus;

/* =========================================================
   STYLES
   ========================================================= */

const SUBJECT_STATUS_STYLES: Record<SubjectStatus, string> = {
  Passed: "bg-emerald-50 text-emerald-700 border-emerald-200",

  "Not Passed": "bg-red-50 text-red-700 border-red-200",

  "Not Started": "bg-slate-100 text-slate-600 border-slate-200",

  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",

  "Chưa xác định": "bg-slate-100 text-slate-500 border-slate-200",
};

const SUBJECT_STATUS_LABELS: Partial<Record<SubjectStatus, string>> = {
  "Not Started": "Chưa học",
  "Not Passed": "Không đạt",
};

const OJT_ELIGIBILITY_STYLES: Record<OjtEligibilityStatus, string> = {
  "Đủ điều kiện": "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Chưa đủ điều kiện": "border-red-200 bg-red-50 text-red-700",

  "Chưa có kết quả": "border-slate-200 bg-slate-50 text-slate-500",
  "Cần đối soát": "border-amber-200 bg-amber-50 text-amber-700",
  "Cần xét lại": "border-amber-200 bg-amber-50 text-amber-700",
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationStudentProgress: React.FC = () => {
  const { students, loading, loadError, loadWarning, reload } = useEducationStudentProgress();

  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentProgress | null>(null);

  const handleCloseStudentDetail = () => setSelectedStudent(null);

  /* =======================================================
       SELECTED STUDENT DATA
       ======================================================= */

  const completedPercentage =
    selectedStudent &&
    selectedStudent.completedCredits !== null &&
    selectedStudent.totalCredits !== null &&
    selectedStudent.totalCredits > 0
      ? Math.min(
          100,
          Math.round(
            (selectedStudent.completedCredits / selectedStudent.totalCredits) *
              100,
          ),
        )
      : null;

  const unfinishedSubjects = selectedStudent
    ? selectedStudent.subjects.filter((subject) => subject.status !== "Passed")
    : [];

  const selectedNotPassedCount = selectedStudent
    ? getNotPassedSubjectCount(selectedStudent)
    : 0;

  const selectedOjtEligibility = selectedStudent
    ? getOjtEligibilityStatus(selectedStudent)
    : null;
  /* =======================================================
       RENDER
       ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Theo dõi Tiến độ Học tập"
        description="Tra cứu hồ sơ, tín chỉ tích lũy, kết quả môn học và trạng thái xét OJT của sinh viên."
        badge="Quản lý sinh viên"
      />

      <StudentProgressList students={students} loading={loading} error={loadError} warning={loadWarning} onSelect={setSelectedStudent} onReload={reload} />

      {selectedStudent && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-4"
          onClick={handleCloseStudentDetail}
        >
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[92dvh]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="min-w-0 pr-3">
                <h2 className="text-xl font-black text-slate-900">
                  Chi tiết Tiến độ Học tập & Điều kiện OJT
                </h2>

              </div>

              <button
                type="button"
                onClick={handleCloseStudentDetail}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto break-words px-4 py-6 sm:px-6">
              {selectedStudent.dataWarning && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{selectedStudent.dataWarning}</p>}
              <div className="space-y-4">
              {/* STUDENT INFO */}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 sm:h-12 sm:w-12">
                      <GraduationCap size={24} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                        {selectedStudent.fullName}
                      </h2>

                      <p className="mt-1 font-semibold text-orange-600">
                        {selectedStudent.studentCode}
                      </p>

                      <div className="mt-2 flex max-w-full flex-wrap gap-x-5 gap-y-1 text-sm">
                        <p className="min-w-0 break-words text-slate-700">
                          <span className="font-semibold text-slate-900">Khóa:</span>{' '}{selectedStudent.cohort}
                        </p>
                        <p className="min-w-0 break-words text-slate-700">
                          <span className="font-semibold text-slate-900">Khung chương trình:</span>{' '}{selectedStudent.curriculumCode}
                        </p>
                      </div>
                    </div>
                </div>
              </section>

              {/* SUMMARY */}

              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">GPA hiện tại</p>

                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {selectedStudent.gpa === null
                      ? "—"
                      : selectedStudent.gpa.toFixed(3)}
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Tín chỉ hoàn thành</p>

                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {selectedStudent.completedCredits ?? "—"}/
                    {selectedStudent.totalCredits ?? "—"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {completedPercentage ?? "—"}% chương trình
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">
                    Kỳ chương trình hiện tại
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {selectedStudent.currentCurriculumSemester === null
                      ? "—"
                      : `Kỳ ${selectedStudent.currentCurriculumSemester}`}
                  </p>
                  {selectedStudent.courseSemesterTag != null && (
                    <p className="mt-1 text-sm font-medium text-orange-700">
                      Tag môn đang học: Kỳ {selectedStudent.courseSemesterTag}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedStudent.currentTerm}
                  </p>
                </div>

              </section>
              </div>

              {/* =================================================
                    OJT ELIGIBILITY
                    ================================================= */}

              {selectedOjtEligibility && !selectedStudent.detailsUnavailable && (
                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        {selectedOjtEligibility === "Đủ điều kiện" ? (
                          <CheckCircle2
                            size={22}
                            className="text-emerald-500"
                          />
                        ) : selectedOjtEligibility === "Chưa có kết quả" ? (
                          <Circle size={22} className="text-slate-400" />
                        ) : (
                          <XCircle size={22} className="text-red-500" />
                        )}

                        <div>
                          <h3 className="font-semibold text-slate-800">
                            Kết quả điều kiện OJT đã lưu
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Sinh viên cần tích lũy ít nhất {OJT_MIN_CREDITS} tín
                            chỉ và có không quá {OJT_MAX_NOT_PASSED_SUBJECTS}{" "}
                            môn chưa đạt.
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{selectedStudent.eligibilitySource === 'FRONTEND' ? 'Kết quả FE đã tính và lưu; không thay thế quyết định OJT chính thức.' : selectedStudent.eligibilitySource === 'OFFICIAL' ? 'Theo quyết định OJT chính thức từ backend.' : 'Chưa có kết quả đã lưu.'}</p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                        OJT_ELIGIBILITY_STYLES[selectedOjtEligibility]
                      }`}
                    >
                      {selectedOjtEligibility === "Đủ điều kiện" ? (
                        <CheckCircle2 size={17} />
                      ) : selectedOjtEligibility === "Chưa có kết quả" ? (
                        <Circle size={17} />
                      ) : (
                        <XCircle size={17} />
                      )}

                      {selectedOjtEligibility}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* CREDIT CONDITION */}

                    <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Tín chỉ tích lũy
                          </p>

                          <p className="mt-1 text-2xl font-bold text-slate-800">
                            {selectedStudent.completedCredits ?? "—"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Yêu cầu tối thiểu: {OJT_MIN_CREDITS} tín chỉ
                          </p>
                        </div>

                        {selectedStudent.completedCredits === null ? (
                          <Circle
                            size={22}
                            className="shrink-0 text-slate-400"
                          />
                        ) : selectedStudent.completedCredits >=
                          OJT_MIN_CREDITS ? (
                          <CheckCircle2
                            size={22}
                            className="shrink-0 text-emerald-500"
                          />
                        ) : (
                          <XCircle
                            size={22}
                            className="shrink-0 text-red-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* NOT PASSED CONDITION */}

                    <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Số môn chưa đạt
                          </p>

                          <p className="mt-1 text-2xl font-bold text-slate-800">
                            {selectedStudent.subjects.length === 0
                              ? "—"
                              : selectedNotPassedCount}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Cho phép tối đa: {OJT_MAX_NOT_PASSED_SUBJECTS} môn
                          </p>
                        </div>

                        {selectedStudent.subjects.length === 0 ? (
                          <Circle
                            size={22}
                            className="shrink-0 text-slate-400"
                          />
                        ) : selectedNotPassedCount <=
                          OJT_MAX_NOT_PASSED_SUBJECTS ? (
                          <CheckCircle2
                            size={22}
                            className="shrink-0 text-emerald-500"
                          />
                        ) : (
                          <XCircle
                            size={22}
                            className="shrink-0 text-red-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* =================================================
                    PROGRESS
                    ================================================= */}

              <section>
                {/* CURRICULUM PROGRESS */}

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-orange-500" />

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Tiến độ theo khung chương trình
                      </h3>

                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-600">
                        Tín chỉ đã hoàn thành
                      </span>

                      <span className="font-semibold text-slate-800">
                        {completedPercentage}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{
                          width: `${completedPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* SEMESTERS */}

                  <div className="mt-5 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-5 md:grid-cols-10">
                    {Array.from(
                      {
                        length: 10,
                      },
                      (_, semester) => {
                        const semesterSubjects =
                          selectedStudent.subjects.filter(
                            (subject) =>
                              subject.curriculumSemester === semester,
                          );

                        const hasKnownSubjects = semesterSubjects.length > 0;

                        const allPassed =
                          hasKnownSubjects &&
                          semesterSubjects.every(
                            (subject) => subject.status === "Passed",
                          );

                        const hasNotPassed = semesterSubjects.some(
                          (subject) => subject.status === "Not Passed",
                        );

                        return (
                          <div key={semester} className="text-center">
                            <div
                              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                                allPassed
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : hasNotPassed
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : semester ===
                                        selectedStudent.currentCurriculumSemester
                                      ? "border-orange-200 bg-orange-50 text-orange-600"
                                      : "border-slate-200 bg-slate-50 text-slate-500"
                              }`}
                            >
                              {semester}
                            </div>

                            <p className="mt-1 text-[11px] text-slate-500">
                              Kỳ {semester}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

              </section>

              {/* =================================================
                    UNFINISHED SUBJECTS
                    ================================================= */}

              <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-orange-500" />

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Môn chưa hoàn thành
                    </h3>

                  </div>
                </div>

                {selectedStudent.subjects.length === 0 ? (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    API chưa trả về dữ liệu kết quả môn học cho sinh viên này.
                  </div>
                ) : unfinishedSubjects.length === 0 ? (
                  <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    Không có môn chưa hoàn thành trong dữ liệu hiện tại.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
                    {unfinishedSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="min-w-0 rounded-xl border border-[#E2E8F0] bg-white p-3.5 transition-colors duration-150 hover:bg-[#EAF2FF]"
                      >
                        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="break-all font-semibold text-slate-800">
                              {subject.code}
                            </p>

                            <p className="mt-0.5 break-words text-sm text-slate-500">
                              {subject.name}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              SUBJECT_STATUS_STYLES[subject.status]
                            }`}
                          >
                            {SUBJECT_STATUS_LABELS[subject.status] ?? subject.status}
                          </span>
                        </div>

                        {subject.prerequisite.length > 0 && (
                          <div className="mt-2 border-t border-slate-100 pt-2">
                            <p className="text-xs text-slate-400">
                              Môn tiên quyết
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {subject.prerequisite.map((prerequisite) => (
                                <span
                                  key={prerequisite}
                                  className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600"
                                >
                                  {prerequisite}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseStudentDetail}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationStudentProgress;
