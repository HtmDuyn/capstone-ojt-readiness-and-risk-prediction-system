import { useEffect, useState } from "react";
import {
  listEligibleStudents,
  listStudentsInSemester,
} from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import { errorMessage } from "@/components/qhdn/QhdnUi";
import type {
  HandoffStudentItem,
} from "@/types/qhdn/qhdnTypes";
import { useQhdnAcademicPeriods } from "./useQhdnAcademicPeriods";

export function useQhdnSemesters(initialId = "") {
  return useQhdnAcademicPeriods(initialId);
}

export function useQhdnRoster(semesterId: string, source: "semester" | "eligible" = "semester") {
  const [students, setStudents] = useState<HandoffStudentItem[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setStudents([]);
    setError("");
    if (!semesterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchStudents = async () => {
      const loadSemesterStudents = () => loadAllPages((page) =>
        listStudentsInSemester(Number(semesterId), { page, limit: 100 }).then(
          (r) => r.data,
        ),
      );
      if (source === "semester") return loadSemesterStudents();

      const eligible = await loadAllPages((page) =>
        listEligibleStudents({ ojtSemesterId: Number(semesterId), page, limit: 100 })
          .then((r) => r.data),
      );
      if (!eligible.length || !active) return eligible;

      // Only the eligible endpoint determines who appears in reception.
      // The semester endpoint adds CV, application and latest coordination details.
      const details = new Map((await loadSemesterStudents()).map((s) => [s.studentId, s]));
      return eligible.map((student) => {
        const detail = details.get(student.studentId);
        return {
          ...detail,
          ...student,
          registration: student.registration
            ? { ...detail?.registration, ...student.registration }
            : student.registration,
        };
      });
    };
    fetchStudents()
      .then((items) => {
        if (active) setStudents(items);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [semesterId, source, revision]);
  return { students, loading, error, reload: () => setRevision((v) => v + 1) };
}
