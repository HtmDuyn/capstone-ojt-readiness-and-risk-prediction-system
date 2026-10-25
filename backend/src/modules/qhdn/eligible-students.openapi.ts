/**
 * @swagger
 * {
 *   "paths": {
 *     "/api/qhdn/eligible-students": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Nhận danh sách sinh viên đủ điều kiện đã được Đào tạo bàn giao",
 *         "description": "ADMIN/OJT_COORD xem danh sách Đào tạo đã duyệt và gửi cho đúng kỳ OJT. Chỉ có kết quả ELIGIBLE đã xác nhận và bản ghi bàn giao thật mới xuất hiện; không yêu cầu có hồ sơ đăng ký. Mỗi sinh viên một dòng trong kỳ. eligibilityAtHandoff là kết quả tại thời điểm bàn giao, không kiểm tra lại hiệu lực hiện tại và không cấp quyền điều phối. Hồ sơ đã xóa mềm không hiển thị. API chỉ đọc; dữ liệu đăng ký/chương trình/khóa là hiện tại.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "ojtSemesterId",
 *             "in": "query",
 *             "required": true,
 *             "description": "Kỳ OJT mục tiêu đã được Đào tạo tạo và bàn giao danh sách; lấy ojtSemesterId từ GET /api/academic-periods?kind=SEMESTER.",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "name": "studentId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "name": "handoffId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "name": "programId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "name": "cohortId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "name": "groupCode",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "A",
 *                 "B",
 *                 "C",
 *                 "D"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "search",
 *             "in": "query",
 *             "description": "Tìm theo MSSV, họ tên hoặc email.",
 *             "schema": {
 *               "type": "string",
 *               "minLength": 1,
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "name": "registrationStatus",
 *             "in": "query",
 *             "description": "NOT_REGISTERED để xem sinh viên chưa đăng ký. Trạng thái HANDED_OFF cũ được trả thành LEGACY_REVIEW_REQUIRED.",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "NOT_REGISTERED",
 *                 "SUBMITTED",
 *                 "APPROVED",
 *                 "REJECTED",
 *                 "LEGACY_REVIEW_REQUIRED"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "name": "limit",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Danh sách đã bàn giao; items rỗng nếu chưa có sinh viên phù hợp.",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object",
 *                       "properties": {
 *                         "ojtSemesterId": {
 *                           "type": "integer",
 *                           "minimum": 1,
 *                           "maximum": 2147483647
 *                         },
 *                         "semester": {
 *                           "type": "object",
 *                           "properties": {
 *                             "id": {
 *                               "type": "integer",
 *                               "minimum": 1,
 *                               "maximum": 2147483647
 *                             },
 *                             "code": {
 *                               "type": "string"
 *                             },
 *                             "name": {
 *                               "type": "string"
 *                             },
 *                             "academicYearId": {
 *                               "type": "integer",
 *                               "minimum": 1,
 *                               "maximum": 2147483647
 *                             },
 *                             "academicPeriodId": {
 *                               "type": "integer",
 *                               "minimum": 1,
 *                               "maximum": 2147483647,
 *                               "nullable": true
 *                             },
 *                             "startDate": {
 *                               "type": "string",
 *                               "format": "date",
 *                               "nullable": true
 *                             },
 *                             "endDate": {
 *                               "type": "string",
 *                               "format": "date",
 *                               "nullable": true
 *                             },
 *                             "status": {
 *                               "type": "string"
 *                             }
 *                           }
 *                         },
 *                         "items": {
 *                           "type": "array",
 *                           "items": {
 *                             "type": "object",
 *                             "properties": {
 *                               "id": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647
 *                               },
 *                               "studentId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647
 *                               },
 *                               "studentCode": {
 *                                 "type": "string"
 *                               },
 *                               "fullName": {
 *                                 "type": "string"
 *                               },
 *                               "email": {
 *                                 "type": "string",
 *                                 "format": "email"
 *                               },
 *                               "phone": {
 *                                 "type": "string",
 *                                 "nullable": true
 *                               },
 *                               "studentStatus": {
 *                                 "type": "string"
 *                               },
 *                               "accountStatus": {
 *                                 "type": "string"
 *                               },
 *                               "ojtSemesterId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647
 *                               },
 *                               "programId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647,
 *                                 "nullable": true
 *                               },
 *                               "programCode": {
 *                                 "type": "string",
 *                                 "nullable": true
 *                               },
 *                               "programName": {
 *                                 "type": "string",
 *                                 "nullable": true
 *                               },
 *                               "cohortId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647,
 *                                 "nullable": true
 *                               },
 *                               "cohortName": {
 *                                 "type": "string",
 *                                 "nullable": true
 *                               },
 *                               "groupCode": {
 *                                 "type": "string",
 *                                 "enum": [
 *                                   "A",
 *                                   "B",
 *                                   "C",
 *                                   "D"
 *                                 ],
 *                                 "nullable": true
 *                               },
 *                               "handoffStatus": {
 *                                 "type": "string",
 *                                 "enum": [
 *                                   "HANDED_OFF"
 *                                 ]
 *                               },
 *                               "handoff": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "id": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647
 *                                   },
 *                                   "createdAt": {
 *                                     "type": "string",
 *                                     "format": "date-time"
 *                                   },
 *                                   "createdBy": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647
 *                                   },
 *                                   "createdByName": {
 *                                     "type": "string",
 *                                     "nullable": true
 *                                   },
 *                                   "reason": {
 *                                     "type": "string"
 *                                   }
 *                                 }
 *                               },
 *                               "eligibilityAtHandoff": {
 *                                 "type": "object",
 *                                 "description": "Kết quả đã được xác nhận dùng để bàn giao; không khẳng định hiệu lực hiện tại sau khi dữ liệu học vụ thay đổi.",
 *                                 "properties": {
 *                                   "checkId": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647
 *                                   },
 *                                   "status": {
 *                                     "type": "string",
 *                                     "enum": [
 *                                       "ELIGIBLE"
 *                                     ]
 *                                   },
 *                                   "checkedAt": {
 *                                     "type": "string",
 *                                     "format": "date-time"
 *                                   },
 *                                   "confirmedAt": {
 *                                     "type": "string",
 *                                     "format": "date-time"
 *                                   },
 *                                   "confirmedBy": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647
 *                                   },
 *                                   "ruleSetId": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647,
 *                                     "nullable": true
 *                                   },
 *                                   "earnedCredits": {
 *                                     "type": "number",
 *                                     "nullable": true
 *                                   },
 *                                   "missingCredits": {
 *                                     "type": "number",
 *                                     "nullable": true
 *                                   },
 *                                   "unpassedCourseCount": {
 *                                     "type": "integer",
 *                                     "nullable": true
 *                                   },
 *                                   "validity": {
 *                                     "type": "string",
 *                                     "enum": [
 *                                       "AT_HANDOFF"
 *                                     ]
 *                                   }
 *                                 }
 *                               },
 *                               "registrationId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647,
 *                                 "nullable": true
 *                               },
 *                               "registrationStatus": {
 *                                 "type": "string",
 *                                 "enum": [
 *                                   "NOT_REGISTERED",
 *                                   "SUBMITTED",
 *                                   "APPROVED",
 *                                   "REJECTED",
 *                                   "LEGACY_REVIEW_REQUIRED"
 *                                 ]
 *                               },
 *                               "registration": {
 *                                 "type": "object",
 *                                 "nullable": true,
 *                                 "properties": {
 *                                   "id": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647
 *                                   },
 *                                   "windowId": {
 *                                     "type": "integer",
 *                                     "minimum": 1,
 *                                     "maximum": 2147483647,
 *                                     "nullable": true
 *                                   },
 *                                   "registeredAt": {
 *                                     "type": "string",
 *                                     "format": "date-time"
 *                                   },
 *                                   "status": {
 *                                     "type": "string",
 *                                     "enum": [
 *                                       "SUBMITTED",
 *                                       "APPROVED",
 *                                       "REJECTED",
 *                                       "LEGACY_REVIEW_REQUIRED"
 *                                     ]
 *                                   }
 *                                 }
 *                               }
 *                             }
 *                           }
 *                         },
 *                         "total": {
 *                           "type": "integer",
 *                           "minimum": 0
 *                         },
 *                         "page": {
 *                           "type": "integer",
 *                           "minimum": 1,
 *                           "maximum": 2147483647
 *                         },
 *                         "limit": {
 *                           "type": "integer",
 *                           "minimum": 1,
 *                           "maximum": 100
 *                         }
 *                       }
 *                     }
 *                   }
 *                 },
 *                 "examples": {
 *                   "receivedRoster": {
 *                     "summary": "Sinh viên đã bàn giao, chưa đăng ký",
 *                     "value": {
 *                       "success": true,
 *                       "data": {
 *                         "ojtSemesterId": 1,
 *                         "semester": {
 *                           "id": 1,
 *                           "code": "OJT-2027-01",
 *                           "name": "OJT kỳ 2027-01",
 *                           "academicYearId": 1,
 *                           "academicPeriodId": 6,
 *                           "startDate": "2027-01-01",
 *                           "endDate": "2027-04-30",
 *                           "status": "PLANNED"
 *                         },
 *                         "items": [
 *                           {
 *                             "id": 12,
 *                             "studentId": 12,
 *                             "studentCode": "SE180012",
 *                             "fullName": "Nguyễn Văn An",
 *                             "email": "an@example.edu.vn",
 *                             "phone": null,
 *                             "studentStatus": "ACTIVE",
 *                             "accountStatus": "ACTIVE",
 *                             "ojtSemesterId": 1,
 *                             "programId": 3,
 *                             "programCode": "IS-K18",
 *                             "programName": "Hệ thống thông tin",
 *                             "cohortId": 2,
 *                             "cohortName": "K18",
 *                             "groupCode": "A",
 *                             "handoffStatus": "HANDED_OFF",
 *                             "handoff": {
 *                               "id": 5,
 *                               "createdAt": "2026-10-23T03:00:00Z",
 *                               "createdBy": 8,
 *                               "createdByName": "Cán bộ Đào tạo",
 *                               "reason": "Duyệt danh sách cuối kỳ"
 *                             },
 *                             "eligibilityAtHandoff": {
 *                               "checkId": 100,
 *                               "status": "ELIGIBLE",
 *                               "checkedAt": "2026-10-23T02:00:00Z",
 *                               "confirmedAt": "2026-10-23T02:30:00Z",
 *                               "confirmedBy": 8,
 *                               "ruleSetId": 1,
 *                               "earnedCredits": 72,
 *                               "missingCredits": 0,
 *                               "unpassedCourseCount": 1,
 *                               "validity": "AT_HANDOFF"
 *                             },
 *                             "registrationId": null,
 *                             "registrationStatus": "NOT_REGISTERED",
 *                             "registration": null
 *                           }
 *                         ],
 *                         "total": 1,
 *                         "page": 1,
 *                         "limit": 20
 *                       }
 *                     }
 *                   },
 *                   "emptyRoster": {
 *                     "summary": "Chưa có danh sách phù hợp",
 *                     "value": {
 *                       "success": true,
 *                       "data": {
 *                         "ojtSemesterId": 1,
 *                         "semester": {
 *                           "id": 1,
 *                           "code": "OJT-2027-01",
 *                           "name": "OJT kỳ 2027-01",
 *                           "academicYearId": 1,
 *                           "academicPeriodId": 6,
 *                           "startDate": "2027-01-01",
 *                           "endDate": "2027-04-30",
 *                           "status": "PLANNED"
 *                         },
 *                         "items": [],
 *                         "total": 0,
 *                         "page": 1,
 *                         "limit": 20
 *                       }
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Thiếu/sai ojtSemesterId, bộ lọc không hợp lệ hoặc phân trang vượt giới hạn."
 *           },
 *           "401": {
 *             "description": "Chưa đăng nhập hoặc token không hợp lệ."
 *           },
 *           "403": {
 *             "description": "Chỉ ADMIN/OJT_COORD được truy cập."
 *           },
 *           "404": {
 *             "description": "Không tìm thấy kỳ OJT (OJT_SEMESTER_NOT_FOUND)."
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */

