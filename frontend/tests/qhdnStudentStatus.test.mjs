import test from "node:test";
import assert from "node:assert/strict";
import {
  coordinationId,
  placementStatus,
  receptionNote,
  receptionStatus,
  studentMatches,
} from "../src/utils/qhdnStudentStatus.ts";

const student = {
  studentId: 1,
  studentCode: "SE001",
  fullName: "Nguyễn Minh Anh",
};
test("tiếp nhận chỉ có ba trạng thái và không gộp hồ sơ đã duyệt vào đã nộp", () => {
  const rows = [
    student,
    { ...student, registration: { id: 2, status: "SUBMITTED" } },
    { ...student, registration: { id: 3, status: "APPROVED" } },
  ];
  assert.deepEqual(rows.map(receptionStatus), [
    "NOT_REGISTERED",
    "SUBMITTED",
    "APPROVED",
  ]);
});
test("phản hồi doanh nghiệp không thay đổi trạng thái duyệt hồ sơ", () => {
  const s = {
    ...student,
    registrationId: 3,
    registrationStatus: "APPROVED",
    coordination: { id: 10, decision: "REJECTED" },
  };
  assert.equal(receptionStatus(s), "APPROVED");
  assert.equal(placementStatus(s), "REJECTED");
});
test("hồ sơ bị yêu cầu bổ sung không bị hiển thị thành đã duyệt hoặc chưa đăng ký", () => {
  const s = { ...student, registrationId: 3, registrationStatus: "REJECTED" };
  assert.equal(receptionStatus(s), "SUBMITTED");
  assert.match(receptionNote(s), /nộp lại/);
});
test("hồ sơ legacy được chú thích cần đối soát, không giả thành đã duyệt", () => {
  const s = {
    ...student,
    registrationId: 3,
    registrationStatus: "LEGACY_REVIEW_REQUIRED",
  };
  assert.equal(receptionStatus(s), "SUBMITTED");
  assert.match(receptionNote(s), /đối soát/);
});
test("đã duyệt nhưng chưa gửi vẫn thuộc danh sách cần điều phối", () => {
  assert.equal(
    placementStatus({
      ...student,
      registrationId: 3,
      registrationStatus: "APPROVED",
    }),
    "UNSENT",
  );
});
test("phân biệt chờ duyệt, tiếp nhận và từ chối từ lượt gửi gần nhất", () => {
  for (const decision of ["PENDING", "ACCEPTED", "REJECTED"])
    assert.equal(
      placementStatus({ ...student, coordination: { id: 2, decision } }),
      decision,
    );
});
test("hỗ trợ cả dữ liệu lồng và dữ liệu phẳng, ưu tiên phản hồi lồng hiện tại", () => {
  assert.equal(
    placementStatus({
      ...student,
      coordinationId: 3,
      enterpriseDecision: "REJECTED",
    }),
    "REJECTED",
  );
  const s = {
    ...student,
    coordinationId: 3,
    enterpriseDecision: "REJECTED",
    coordination: { id: 4, decision: "PENDING" },
  };
  assert.equal(coordinationId(s), 4);
  assert.equal(placementStatus(s), "PENDING");
});
test("tìm kiếm tên, MSSV và doanh nghiệp không phân biệt chữ hoa/thường", () => {
  assert.ok(studentMatches(student, "  nguyễn "));
  assert.ok(studentMatches(student, "se001"));
  assert.ok(
    studentMatches({ ...student, company: { name: "TechViet" } }, "TECHVIET"),
  );
  assert.equal(studentMatches(student, "SE999"), false);
});
