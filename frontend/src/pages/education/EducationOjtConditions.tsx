import { getAllItems } from '@/service/educationApi';
import React from "react";

import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

import {
  OjtEligibilityApiError,
  ojtEligibilityService,
  type OjtRuleSet,
} from "@/service/ojtEligibility.service";
import {
  curriculumService,
  type CurriculumSummary,
} from "@/service/curriculum.service";

import { academicService, type OjtSemester } from "@/service/academic.service";

/* =========================================================
   FORM
   ========================================================= */

interface RuleFormData {
  name: string;
  minCredits: number;
  maxUnpassedCourses: number;
}

const EMPTY_FORM: RuleFormData = {
  name: "",
  minCredits: 70,
  maxUnpassedCourses: 2,
};

/* =========================================================
   TOAST
   ========================================================= */

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

/* =========================================================
   HELPERS
   ========================================================= */

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusLabel = (status: string) => {
  if (status === "DRAFT") {
    return "Bản nháp";
  }

  if (status === "PUBLISHED") {
    return "Đã ban hành";
  }

  return status;
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationOjtConditions: React.FC = () => {
  /* ===================== FILTERS ===================== */

  const [curricula, setCurricula] = React.useState<CurriculumSummary[]>([]);

  const [ojtSemesters, setOjtSemesters] = React.useState<OjtSemester[]>([]);

  const [selectedProgramId, setSelectedProgramId] = React.useState<
    number | null
  >(null);

  const [selectedOjtSemesterId, setSelectedOjtSemesterId] = React.useState<
    number | null
  >(null);

  const [filterLoading, setFilterLoading] = React.useState(true);
  /* ===================== DATA ===================== */

  const [rules, setRules] = React.useState<OjtRuleSet[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);

  const [publishingId, setPublishingId] = React.useState<number | null>(null);

  const [publishConfirmRule, setPublishConfirmRule] =
    React.useState<OjtRuleSet | null>(null);

  /* ===================== MODAL ===================== */

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [editingRule, setEditingRule] = React.useState<OjtRuleSet | null>(null);

  const [formData, setFormData] = React.useState<RuleFormData>(EMPTY_FORM);

  /* ===================== TOAST ===================== */

  const [toast, setToast] = React.useState<ToastState | null>(null);

  const toastTimeoutRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((type: ToastType, message: string) => {
    setToast({
      type,
      message,
    });

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);

      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);
  /* =====================================================
   LOAD FILTER OPTIONS
   ===================================================== */

  React.useEffect(() => {
    const loadFilterOptions = async () => {
      setFilterLoading(true);

      let loadedCurricula: CurriculumSummary[] = [];
      let loadedSemesters: OjtSemester[] = [];

      /* =========================
       1. LOAD CURRICULA
       ========================= */

      try {
        loadedCurricula = await getAllItems<CurriculumSummary>('/curricula');

        console.log("OJT curricula:", loadedCurricula);

        setCurricula(loadedCurricula);
      } catch (error) {
        console.error("Load curricula failed:", error);

        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách chương trình đào tạo.",
        );
      }

      /* =========================
       2. LOAD OJT SEMESTERS
       ========================= */

      try {
        loadedSemesters = await academicService.searchOjtSemesters({
          page: 1,
          limit: 100,
        });

        console.log("OJT semesters:", loadedSemesters);

        setOjtSemesters(loadedSemesters);
      } catch (error) {
        console.error("Load OJT semesters failed:", error);

        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách kỳ OJT.",
        );
      }

      /* =========================
       3. FIND CURRENT RULE
       ========================= */

      try {
        const existingRuleResponse = await ojtEligibilityService.searchRuleSets(
          {
            page: 1,
            limit: 100,
          },
        );

        const existingRules = existingRuleResponse.data.items ?? [];

        const preferredRule = [...existingRules].sort(
          (a, b) => b.version - a.version,
        )[0];

        console.log("Existing OJT rules:", existingRules);

        if (preferredRule) {
          setSelectedProgramId(preferredRule.programId);

          setSelectedOjtSemesterId(preferredRule.ojtSemesterId);
        } else {
          setSelectedProgramId(loadedCurricula[0]?.id ?? null);

          setSelectedOjtSemesterId(loadedSemesters[0]?.id ?? null);
        }
      } catch (error) {
        console.error("Load existing OJT rules failed:", error);

        /*
         * Rule search lỗi thì vẫn cho dropdown hoạt động.
         */
        setSelectedProgramId(loadedCurricula[0]?.id ?? null);

        setSelectedOjtSemesterId(loadedSemesters[0]?.id ?? null);
      }

      setFilterLoading(false);
    };

    void loadFilterOptions();
  }, [showToast]);
  /* =====================================================
       LOAD RULES
       ===================================================== */

  const loadRules = React.useCallback(async () => {
    if (selectedProgramId === null || selectedOjtSemesterId === null) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await ojtEligibilityService.searchRuleSets({
        programId: selectedProgramId,

        ojtSemesterId: selectedOjtSemesterId,

        page: 1,

        limit: 20,
      });

      const items = response.data.items ?? [];

      const sorted = [...items].sort((a, b) => b.version - a.version);

      setRules(sorted);
    } catch (error) {
      console.error("Load OJT rules failed:", error);

      if (error instanceof OjtEligibilityApiError) {
        showToast("error", error.message);
      } else {
        showToast("error", "Không thể tải danh sách điều kiện OJT.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProgramId, selectedOjtSemesterId, showToast]);

  React.useEffect(() => {
    void loadRules();
  }, [loadRules]);

  /* =====================================================
       DERIVED
       ===================================================== */

  const draftCount = rules.filter((rule) => rule.status === "DRAFT").length;
  const currentDraftRule =
    rules.find((rule) => rule.status === "DRAFT") ?? null;

  const publishedCount = rules.filter(
    (rule) => rule.status === "PUBLISHED",
  ).length;

  const activeRule =
    rules.find((rule) => rule.active) ??
    rules.find((rule) => rule.status === "PUBLISHED") ??
    null;

  const nextVersion =
    rules.length === 0 ? 1 : Math.max(...rules.map((rule) => rule.version)) + 1;

  const selectedCurriculum =
    curricula.find((curriculum) => curriculum.id === selectedProgramId) ?? null;

  const selectedOjtSemester =
    ojtSemesters.find((semester) => semester.id === selectedOjtSemesterId) ??
    null;
  /* =====================================================
       MODAL
       ===================================================== */

  const openCreateModal = () => {
    if (selectedProgramId === null || selectedOjtSemesterId === null) {
      showToast("error", "Vui lòng chọn chương trình đào tạo và kỳ OJT trước.");

      return;
    }

    if (currentDraftRule) {
      showToast(
        "error",
        "Phạm vi này đã có một bộ điều kiện ở trạng thái bản nháp. Vui lòng chỉnh sửa hoặc ban hành bản nháp hiện tại trước khi tạo phiên bản mới.",
      );

      return;
    }

    setEditingRule(null);

    setFormData({
      name: selectedOjtSemester
        ? `Điều kiện ${selectedOjtSemester.name}`
        : `Điều kiện OJT phiên bản ${nextVersion}`,
      minCredits: 70,
      maxUnpassedCourses: 2,
    });

    setIsModalOpen(true);
  };

  const openEditModal = (rule: OjtRuleSet) => {
    if (rule.status !== "DRAFT") {
      showToast(
        "error",
        "Chỉ có thể chỉnh sửa bộ quy tắc đang ở trạng thái bản nháp.",
      );

      return;
    }

    setEditingRule(rule);

    setFormData({
      name: rule.name,
      minCredits: rule.minCredits,
      maxUnpassedCourses: rule.maxUnpassedCourses,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setIsModalOpen(false);
    setEditingRule(null);

    setFormData(EMPTY_FORM);
  };

  /* =====================================================
       SAVE RULE
       ===================================================== */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = formData.name.trim();

    if (!name) {
      showToast("error", "Vui lòng nhập tên bộ điều kiện.");

      return;
    }

    if (!Number.isInteger(formData.minCredits) || formData.minCredits < 0) {
      showToast("error", "Tín chỉ tối thiểu phải là số nguyên không âm.");

      return;
    }

    if (
      !Number.isInteger(formData.maxUnpassedCourses) ||
      formData.maxUnpassedCourses < 0
    ) {
      showToast("error", "Số môn chưa đạt tối đa phải là số nguyên không âm.");

      return;
    }

    setSubmitting(true);

    try {
      if (editingRule) {
        await ojtEligibilityService.updateRuleSet({
          programId: editingRule.programId,

          ojtSemesterId: editingRule.ojtSemesterId,

          version: editingRule.version,

          name,

          minCredits: formData.minCredits,

          maxUnpassedCourses: formData.maxUnpassedCourses,

          debtBasis: "FAILED_ATTEMPTS",

          ruleSetId: editingRule.id,
        });

        showToast("success", "Đã cập nhật bộ điều kiện OJT.");
      } else {
        if (selectedProgramId === null || selectedOjtSemesterId === null) {
          showToast("error", "Vui lòng chọn chương trình đào tạo và kỳ OJT.");

          return;
        }

        await ojtEligibilityService.createRuleSet({
          programId: selectedProgramId,

          ojtSemesterId: selectedOjtSemesterId,

          version: nextVersion,

          name,

          minCredits: formData.minCredits,

          maxUnpassedCourses: formData.maxUnpassedCourses,

          debtBasis: "FAILED_ATTEMPTS",
        });

        showToast("success", "Đã tạo bộ điều kiện OJT mới.");
      }

      setIsModalOpen(false);
      setEditingRule(null);

      setFormData(EMPTY_FORM);

      await loadRules();
    } catch (error) {
      console.error("Save OJT rule failed:", error);

      if (error instanceof OjtEligibilityApiError) {
        showToast("error", error.message);
      } else {
        showToast("error", "Không thể lưu bộ điều kiện OJT.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
       PUBLISH
       ===================================================== */

  const openPublishConfirm = (rule: OjtRuleSet) => {
    if (rule.status !== "DRAFT") {
      return;
    }

    setPublishConfirmRule(rule);
  };

  const closePublishConfirm = () => {
    if (publishingId !== null) {
      return;
    }

    setPublishConfirmRule(null);
  };

  const handleConfirmPublish = async () => {
    if (!publishConfirmRule) {
      return;
    }

    const rule = publishConfirmRule;

    setPublishingId(rule.id);

    try {
      await ojtEligibilityService.publishRuleSet({
        ruleSetId: rule.id,
      });

      showToast("success", "Đã ban hành bộ điều kiện OJT.");

      setPublishConfirmRule(null);

      await loadRules();
    } catch (error) {
      console.error("Publish OJT rule failed:", error);

      if (error instanceof OjtEligibilityApiError) {
        if (error.errorCode === "CURRICULUM_NOT_PUBLISHED") {
          showToast(
            "error",
            "Chương trình đào tạo chưa được ban hành nên chưa thể ban hành điều kiện OJT.",
          );
        } else {
          showToast("error", error.message);
        }
      } else {
        showToast("error", "Không thể ban hành bộ điều kiện OJT.");
      }
    } finally {
      setPublishingId(null);
    }
  };

  /* =====================================================
       RENDER
       ===================================================== */

  return (
    <div className="space-y-6">
      {/* ================= TOAST ================= */}

      {toast && (
        <div className="fixed right-6 top-6 z-[9999] w-[420px] max-w-[calc(100vw-3rem)]">
          <div
            className={`rounded-2xl border bg-white p-4 shadow-2xl ${
              toast.type === "success" ? "border-emerald-200" : "border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === "success" ? (
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
              ) : (
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />
              )}

              <p className="text-sm leading-6 text-slate-700">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= BANNER ================= */}

      <PageBanner
        title="Quản lý Điều kiện OJT"
        description="Thiết lập, cập nhật và ban hành bộ quy tắc dùng để xác định sinh viên đủ điều kiện tham gia OJT."
        badge="Quản lý dữ liệu"
      />

      {/* ================= CONTEXT ================= */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <ShieldCheck size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Phạm vi áp dụng
              </p>

              <h2 className="mt-1 text-lg font-semibold text-blue-900">
                Chọn chương trình đào tạo và kỳ OJT
              </h2>

              <p className="mt-1 text-sm text-blue-700">
                Danh sách điều kiện bên dưới sẽ thay đổi theo phạm vi được chọn.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* CHƯƠNG TRÌNH ĐÀO TẠO */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Chương trình đào tạo
                </label>

                <select
                  value={selectedProgramId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    setSelectedProgramId(value ? Number(value) : null);
                  }}
                  disabled={filterLoading}
                  className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {filterLoading
                      ? "Đang tải chương trình..."
                      : "Chọn chương trình đào tạo"}
                  </option>

                  {[
                    "Trí tuệ nhân tạo",
                    "Kỹ thuật phần mềm",
                    "An toàn thông tin",
                    "Hệ thống thông tin",
                  ].map((majorName) => {
                    const majorCurricula = curricula.filter(
                      (curriculum) => curriculum.majorName === majorName,
                    );

                    if (majorCurricula.length === 0) {
                      return null;
                    }

                    return (
                      <optgroup key={majorName} label={majorName}>
                        {majorCurricula.map((curriculum) => (
                          <option key={curriculum.id} value={curriculum.id}>
                            {curriculum.version || curriculum.code}
                            {" • "}
                            {curriculum.effectiveYear
                              ? `Áp dụng ${curriculum.effectiveYear}`
                              : "Chưa có năm áp dụng"}
                            {" • "}
                            {curriculum.status === "PUBLISHED"
                              ? "Đã ban hành"
                              : "Bản nháp"}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* KỲ OJT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kỳ OJT
                </label>

                <select
                  value={selectedOjtSemesterId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    setSelectedOjtSemesterId(value ? Number(value) : null);
                  }}
                  disabled={filterLoading}
                  className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {filterLoading ? "Đang tải kỳ OJT..." : "Chọn kỳ OJT"}
                  </option>

                  {ojtSemesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                      {" • "}
                      {semester.semesterCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SUMMARY ================= */}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng phiên bản</p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {rules.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <FileCheck2 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Bản nháp</p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {draftCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Pencil size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Đã ban hành</p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {publishedCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= ACTIVE RULE ================= */}

      {activeRule && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Quy tắc đang áp dụng
              </p>

              <h2 className="mt-1 text-lg font-bold text-emerald-900">
                {activeRule.name}
              </h2>

              <p className="mt-2 text-sm text-emerald-800">
                Tối thiểu <strong>{activeRule.minCredits} tín chỉ</strong> và
                không quá{" "}
                <strong>{activeRule.maxUnpassedCourses} môn chưa đạt</strong>.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
              Phiên bản {activeRule.version}
            </span>
          </div>
        </section>
      )}

      {/* ================= LIST ================= */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Danh sách bộ điều kiện
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Bộ quy tắc ở trạng thái bản nháp có thể chỉnh sửa trước khi ban
              hành.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadRules()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={
                selectedProgramId === null ||
                selectedOjtSemesterId === null ||
                currentDraftRule !== null
              }
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Tạo bộ điều kiện
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-orange-500"
              />

              <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileCheck2 size={38} className="mx-auto text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-700">
              Chưa có bộ điều kiện
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Tạo bộ điều kiện OJT đầu tiên để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Phiên bản
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Tên bộ điều kiện
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Tín chỉ tối thiểu
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Môn chưa đạt tối đa
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Trạng thái
                  </th>

                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Thời gian
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-700">
                        v{rule.version}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {rule.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Phiên bản {rule.version} • Xét theo môn chưa đạt
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {rule.minCredits}
                      </span>{" "}
                      tín chỉ
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {rule.maxUnpassedCourses}
                      </span>{" "}
                      môn
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={
                            rule.status === "PUBLISHED"
                              ? "inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                          }
                        >
                          {getStatusLabel(rule.status)}
                        </span>

                        {rule.active && (
                          <span className="text-xs font-semibold text-emerald-600">
                            Đang áp dụng
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs leading-5 text-slate-500">
                      {rule.status === "PUBLISHED" ? (
                        <>
                          Ban hành:
                          <br />
                          {formatDateTime(rule.publishedAt)}
                        </>
                      ) : (
                        <>
                          Tạo:
                          <br />
                          {formatDateTime(rule.createdAt)}
                        </>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {rule.status === "DRAFT" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(rule)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                            >
                              <Pencil size={14} />
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => openPublishConfirm(rule)}
                              disabled={publishingId === rule.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {publishingId === rule.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              Ban hành
                            </button>
                          </>
                        )}

                        {rule.status !== "DRAFT" && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                            <CheckCircle2 size={14} />
                            Đã khóa
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================= BUSINESS NOTE ================= */}

      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-800">
              Điều kiện để ban hành
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              Bộ điều kiện OJT chỉ được ban hành khi chương trình đào tạo tương
              ứng đã được ban hành. Hiện backend đang yêu cầu hoàn thiện các môn
              lựa chọn của CTĐT trước khi cho phép publish.
            </p>
          </div>
        </div>
      </section>
      {/* ================= PUBLISH CONFIRM MODAL ================= */}

      {publishConfirmRule && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/45 px-4 py-8">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Send size={20} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Xác nhận ban hành
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Kiểm tra lại thông tin trước khi áp dụng bộ điều kiện OJT.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePublishConfirm}
                disabled={publishingId !== null}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="space-y-5 px-6 py-5">
              {/* PHẠM VI */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Phạm vi áp dụng
                </p>

                <p className="mt-2 font-semibold text-blue-900">
                  {selectedCurriculum?.majorName ?? "Chương trình đào tạo"}
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  {selectedCurriculum?.version ||
                    selectedCurriculum?.code ||
                    "—"}
                  {" • "}
                  {selectedOjtSemester?.name || "Kỳ OJT"}
                </p>
              </div>

              {/* RULE NAME */}

              <div>
                <p className="text-sm text-slate-500">Bộ điều kiện</p>

                <p className="mt-1 font-semibold text-slate-800">
                  {publishConfirmRule.name}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Phiên bản {publishConfirmRule.version}
                </p>
              </div>

              {/* CONDITIONS */}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Tín chỉ tối thiểu
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-800">
                    {publishConfirmRule.minCredits}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">tín chỉ</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Môn chưa đạt tối đa
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-800">
                    {publishConfirmRule.maxUnpassedCourses}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">môn</p>
                </div>
              </div>

              {/* WARNING */}

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Lưu ý trước khi ban hành
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    Sau khi ban hành, bộ điều kiện này sẽ được sử dụng để xét
                    điều kiện OJT cho sinh viên trong phạm vi đã chọn và không
                    còn chỉnh sửa như bản nháp.
                  </p>
                </div>
              </div>

              {selectedCurriculum?.status !== "PUBLISHED" && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Chương trình đào tạo chưa được ban hành
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      Backend sẽ chưa cho phép ban hành bộ điều kiện OJT cho đến
                      khi chương trình đào tạo này được ban hành.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closePublishConfirm}
                disabled={publishingId !== null}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => void handleConfirmPublish()}
                disabled={
                  publishingId !== null ||
                  selectedCurriculum?.status !== "PUBLISHED"
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishingId !== null ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}

                {publishingId !== null
                  ? "Đang ban hành..."
                  : selectedCurriculum?.status !== "PUBLISHED"
                    ? "Chưa thể ban hành"
                    : "Xác nhận ban hành"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL ================= */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingRule
                    ? "Chỉnh sửa bộ điều kiện"
                    : "Tạo bộ điều kiện OJT"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingRule
                    ? `Đang chỉnh sửa phiên bản ${editingRule.version}.`
                    : `Phiên bản mới sẽ là ${nextVersion}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-5">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Phạm vi áp dụng
                  </p>

                  <p className="mt-2 text-sm font-semibold text-blue-900">
                    {selectedCurriculum?.majorName ?? "Chưa chọn chương trình"}
                  </p>

                  <p className="mt-1 text-sm text-blue-700">
                    {selectedCurriculum?.version ||
                      selectedCurriculum?.code ||
                      "—"}
                    {" • "}
                    {selectedOjtSemester?.name || "Chưa chọn kỳ OJT"}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tên bộ điều kiện
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,

                        name: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Điều kiện OJT Fall 2026"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tín chỉ tối thiểu
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.minCredits}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,

                          minCredits: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Môn chưa đạt tối đa
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.maxUnpassedCourses}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,

                          maxUnpassedCourses: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Căn cứ tính môn chưa đạt
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-700">
                      Lần học không đạt
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      FAILED_ATTEMPTS
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-sm leading-6 text-blue-800">
                    Sinh viên đủ điều kiện khi có ít nhất{" "}
                    <strong>{formData.minCredits} tín chỉ</strong> và không quá{" "}
                    <strong>{formData.maxUnpassedCourses} môn chưa đạt</strong>.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}

                  {editingRule ? "Lưu thay đổi" : "Tạo bộ điều kiện"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationOjtConditions;
