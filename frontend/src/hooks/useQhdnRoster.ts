import { useEffect, useState } from "react";
import {
  listQhdnOjtSemesters,
  listStudentsInSemester,
} from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import { errorMessage } from "@/components/qhdn/QhdnUi";
import type {
  HandoffStudentItem,
  OjtSemesterItem,
} from "@/types/qhdn/qhdnTypes";

export function useQhdnSemesters(initialId = "") {
  const [semesters, setSemesters] = useState<OjtSemesterItem[]>([]),
    [semesterId, setSemesterId] = useState("");
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    listQhdnOjtSemesters()
      .then((r) => {
        if (!active) return;
        setSemesters(r.items);
        const initial =
          r.items.find((s) => String(s.id) === initialId) ??
          r.items.find((s) => s.status === "ACTIVE") ??
          r.items[0];
        setSemesterId(initial ? String(initial.id) : "");
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
  }, [initialId]);
  return { semesters, semesterId, setSemesterId, loading, error };
}

export function useQhdnRoster(semesterId: string) {
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
    // API theo kỳ đã trả lượt điều phối mới nhất; không đếm lại lịch sử cũ.
    loadAllPages((page) =>
      listStudentsInSemester(Number(semesterId), { page, limit: 100 }).then(
        (r) => r.data,
      ),
    )
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
  }, [semesterId, revision]);
  return { students, loading, error, reload: () => setRevision((v) => v + 1) };
}
