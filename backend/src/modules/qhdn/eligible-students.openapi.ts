/**
 * @swagger
 * {
 *   "paths": {
 *     "/api/qhdn/eligible-students": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Danh sách sinh viên đủ điều kiện OJT và chưa đạt OJT202 ở lần học mới nhất",
 *         "description": "Phòng QHDN xem tất cả sinh viên có kết quả đủ điều kiện và chưa đạt OJT202 ở lần học mới nhất. Danh sách không phụ thuộc RoundID hoặc việc sinh viên đã được gán đợt tuyển dụng.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "ojtSemesterId",
 *             "in": "query",
 *             "description": "Lọc theo kỳ OJT mục tiêu.",
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
 *             "description": "Danh sách sinh viên phù hợp với bộ lọc.",
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
 *                           "maximum": 2147483647,
 *                           "nullable": true
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
 *                               "ojtSemesterId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647,
 *                                 "nullable": true
 *                               },
 *                               "programId": {
 *                                 "type": "integer",
 *                                 "minimum": 1,
 *                                 "maximum": 2147483647,
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
 *                               "semesterName": {
 *                                 "description": "Tên kỳ OJT mục tiêu.",
 *                                 "type": "string",
 *                                 "nullable": true
 *                               },
 *                               "academicHistory": {
 *                                 "description": "Lịch sử môn học; các bản ghi OJT202 đã PASSED không được trả về.",
 *                                 "type": "array",
 *                                 "items": {
 *                                   "type": "object",
 *                                   "properties": {
 *                                     "resultId": { "type": "integer" },
 *                                     "courseCode": { "type": "string" },
 *                                     "courseName": { "type": "string" },
 *                                     "semesterTaken": { "type": "integer" },
 *                                     "periodName": { "type": "string", "nullable": true },
 *                                     "score": { "type": "number", "nullable": true },
 *                                     "grade": { "type": "string", "nullable": true },
 *                                     "status": { "type": "string" }
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
