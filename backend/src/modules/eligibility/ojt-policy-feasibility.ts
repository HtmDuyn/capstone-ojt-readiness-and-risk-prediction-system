import type { PoolClient } from 'pg';
import { detail } from '../curriculum/curriculum.repository';
import { publicationIssuesForData } from '../curriculum/curriculum.service';
import { validateComboCapacity } from '../curriculum/curriculum.structure';
import { createHash } from 'node:crypto';

type Row = Record<string, any>;
export type ProgramFeasibility = {
  programId: number; code: string; name: string; ojtSemester: number | null;
  minCredits: number | null; maxCredits: number | null; preOjtCourseCount: number | null; proposedCredits: number;
  difference: number | null; status: 'VALID' | 'WARNING' | 'INVALID' | 'INSUFFICIENT_DATA';
  reasons: string[]; sourceHash?: string;
};

// The published curriculum stores each combo subject against a concrete slot.
// A slot contributes its credit weight once; alternative subjects never add credits.
export function assessProgram(data: Row, threshold: number, publicationIssues: string[] = []): ProgramFeasibility {
  const reasons = publicationIssues.map(issue => `Khung chương trình cần đối soát: ${issue}`);
  const courses: Row[] = data.courses ?? [];
  const ojt = courses.filter(course => String(course.courseCode).toUpperCase() === 'OJT202' && course.entryKind === 'COURSE');
  const ojtSemester = ojt.length === 1 && Number.isInteger(ojt[0].semester) && ojt[0].semester > 0 ? ojt[0].semester : null;
  if (ojtSemester === null) reasons.push('Không xác định được duy nhất học kỳ OJT từ học phần OJT202 trong khung.');
  if (data.status !== 'PUBLISHED') reasons.push('Khung chương trình chưa được công bố.');
  if (ojtSemester !== null && !courses.some(course => course.semester < ojtSemester)) reasons.push('Không có học phần nào trước kỳ OJT.');

  const before = ojtSemester === null ? [] : courses.filter(course => course.semester < ojtSemester);
  const aliases = new Map<number, number>((data.equivalences ?? []).map((row: Row) => [row.sourceCourseId, row.targetCourseId]));
  const canonical = (id: number): number | null => {
    const seen = new Set<number>();
    while (aliases.has(id)) {
      if (seen.has(id)) return null;
      seen.add(id); id = aliases.get(id)!;
    }
    return id;
  };
  const seen = new Set<number>();
  let minimum = 0, maximum = 0, requiredCount = 0;
  for (const course of before) {
    if (!Number.isFinite(course.credits) || course.credits < 0 || course.isRequired === null || course.isRequired === undefined || !Number.isInteger(course.semester) || course.semester < 1) {
      reasons.push(`Học phần ${course.courseCode ?? course.id} thiếu tín chỉ, tính bắt buộc hoặc học kỳ hợp lệ.`);
      continue;
    }
    if (course.entryKind === 'COURSE') {
      const id = canonical(course.courseId);
      if (id === null) { reasons.push(`Quan hệ tương đương của ${course.courseCode} có vòng lặp.`); continue; }
      if (seen.has(id)) continue;
      seen.add(id);
    } else if (!['COMBO_SLOT', 'ELECTIVE_SLOT'].includes(course.entryKind)) {
      reasons.push(`Loại học phần ${course.courseCode} chưa được hỗ trợ.`);
      continue;
    }
    maximum += course.credits;
    if (course.isRequired === true) { minimum += course.credits; requiredCount++; }
  }

  if (ojtSemester !== null) {
    for (let term = 1; term < ojtSemester; term++) {
      const count = before.filter(course => course.semester === term && course.isRequired === true).length;
      if (count > 5) reasons.push(`Kỳ ${term} có ${count} học phần, vượt giới hạn 5 học phần.`);
    }
    const slots = before.filter(course => course.entryKind !== 'COURSE');
    const combos: Row[] = data.combos ?? [];
    const beforeSlotIds = new Set(slots.map(slot => slot.courseId));
    const relevantCombos = combos.filter(combo => (combo.courses ?? []).some((course: Row) => (course.slotCourseIds ?? []).some((id: number) => beforeSlotIds.has(id))));
    for (const slot of slots) {
      const options = combos.flatMap(combo => (combo.courses ?? []).filter((course: Row) => (course.slotCourseIds ?? []).includes(slot.courseId)));
      if (!options.length) reasons.push(`Ô lựa chọn ${slot.courseCode} chưa có môn thay thế được duyệt.`);
      if (options.some((course: Row) => course.semester !== slot.semester || Number(course.credits) !== slot.credits))
        reasons.push(`Phương án combo của ${slot.courseCode} không khớp học kỳ hoặc tín chỉ.`);
    }
    if (slots.length && relevantCombos.some(combo => !combo.coursesReviewed || !combo.selectionGroup || !(combo.choiceGroups ?? []).length))
      reasons.push('Chưa đủ dữ liệu nhóm lựa chọn hoặc xác nhận combo để kiểm tra mọi lộ trình.');
    // Variable choice-group cardinality can leave a required slot unfilled. The
    // current model does not identify which of those paths is mandatory.
    const slotGroups = new Map<number, Set<string>>();
    for (const combo of relevantCombos) for (const option of combo.courses ?? []) for (const id of option.slotCourseIds ?? []) {
      if (!beforeSlotIds.has(id)) continue;
      if (!slotGroups.has(id)) slotGroups.set(id, new Set());
      slotGroups.get(id)!.add(combo.selectionGroup ?? '');
    }
    for (const slot of slots) if (slotGroups.get(slot.courseId)?.size !== 1)
      reasons.push(`Không xác định được một nhóm combo duy nhất cho ô ${slot.courseCode}.`);
    for (const combo of relevantCombos) {
      const groupSlots = [...slotGroups].filter(([, groups]) => groups.has(combo.selectionGroup ?? '')).map(([id]) => id);
      const covered = new Set<number>((combo.courses ?? []).flatMap((course: Row) => course.slotCourseIds ?? []).filter((id: number) => beforeSlotIds.has(id)));
      if (groupSlots.some(id => !covered.has(id))) reasons.push(`Combo ${combo.code} không phủ đủ các ô của nhóm ${combo.selectionGroup}.`);
      const optionMap = new Map<number, Row>((combo.courses ?? []).map((option: Row) => [option.courseId, option]));
      let selectedCount = 0;
      for (const group of combo.choiceGroups ?? []) {
        const members = (group.courseIds ?? []).map((id: number) => optionMap.get(id)).filter(Boolean);
        const preCount = members.filter((option: Row) => (option.slotCourseIds ?? []).some((id: number) => beforeSlotIds.has(id))).length;
        if (preCount && preCount !== members.length) reasons.push(`Nhóm ${group.code} của combo ${combo.code} trộn môn trước và sau OJT; chưa xác định được mọi lộ trình.`);
        if (preCount) {
          if (group.minCourses !== group.maxCourses) reasons.push(`Nhóm ${group.code} của combo ${combo.code} có số môn lựa chọn thay đổi trước OJT.`);
          selectedCount += group.maxCourses;
        }
      }
      if (selectedCount !== covered.size) reasons.push(`Combo ${combo.code} chọn ${selectedCount} môn nhưng có ${covered.size} ô chương trình.`);
      try { validateComboCapacity(combo); } catch { reasons.push(`Combo ${combo.code} không thể ghép các môn lựa chọn vào các ô riêng biệt.`); }
    }
    for (const group of data.prerequisites ?? []) {
      const target = courses.find(course => course.courseId === group.courseId);
      if (!target || target.semester >= ojtSemester) continue;
      const available = (group.prerequisiteCourseIds ?? []).filter((id: number) => courses.some(course => course.courseId === id && course.semester < target.semester));
      if (available.length < group.minimumPassed) reasons.push(`Tiên quyết của ${target.courseCode} không thể hoàn thành trước kỳ dự kiến.`);
    }
  }
  const minCredits = reasons.length ? null : Math.round(minimum * 100) / 100;
  const maxCredits = reasons.length ? null : Math.round(maximum * 100) / 100;
  const difference = minCredits === null ? null : Math.round((minCredits - threshold) * 100) / 100;
  const status = reasons.length ? 'INSUFFICIENT_DATA' : threshold > minimum ? 'INVALID' : threshold === minimum ? 'WARNING' : 'VALID';
  if (status === 'INVALID') reasons.push(`Ngưỡng ${threshold} tín chỉ vượt mức ${minCredits} tín chỉ của ít nhất một lộ trình hợp lệ trước OJT.`);
  if (status === 'WARNING') reasons.push('Ngưỡng bằng đúng mức tín chỉ trước OJT; sinh viên phải hoàn thành toàn bộ phần tín chỉ bắt buộc trước kỳ này.');
  return { programId: data.id, code: data.code, name: data.name, ojtSemester, minCredits, maxCredits,
    preOjtCourseCount: status === 'INSUFFICIENT_DATA' ? null : requiredCount,
    proposedCredits: threshold, difference, status, reasons };
}

export async function assessPublishedPrograms(client: PoolClient, threshold: number): Promise<ProgramFeasibility[]> {
  const ids = (await client.query(`SELECT p."ProgramID" FROM "TrainingPrograms" p
    WHERE p."Status"='PUBLISHED' OR EXISTS (SELECT 1 FROM "Students" s WHERE s."ProgramID"=p."ProgramID" AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE')
    ORDER BY p."ProgramID"`)).rows;
  const rows: ProgramFeasibility[] = [];
  for (const { ProgramID } of ids) {
    const data = await detail(client, ProgramID);
    let issues: string[];
    try { issues = (await publicationIssuesForData(client, data)).issues; }
    catch (error) { issues = [error instanceof Error ? error.message : 'Không thể kiểm tra cấu trúc khung chương trình.']; }
    rows.push({ ...assessProgram(data, threshold, issues), sourceHash: createHash('sha256').update(JSON.stringify(data)).digest('hex') });
  }
  return rows;
}
