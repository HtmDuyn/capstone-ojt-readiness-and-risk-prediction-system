/**
 * @swagger
 * {
 *   "paths": {
 *     "/api/qhdn/registered-students": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Xem sinh viên đã đăng ký OJT",
 *         "description": "Admin/QHDN chỉ xem sinh viên đã có đăng ký OJT, kể cả chưa bàn giao. Mỗi sinh viên một dòng, các hồ sơ khớp bộ lọc nằm trong registrations; total và phân trang tính theo sinh viên. Không cấp quyền duyệt hoặc điều phối trước bàn giao.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "registrationId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "studentId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "ojtSemesterId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "academicPeriodId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             },
 *             "description": "Học kỳ liên kết với kỳ OJT."
 *           },
 *           {
 *             "in": "query",
 *             "name": "windowId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "SUBMITTED",
 *                 "APPROVED",
 *                 "REJECTED",
 *                 "HANDED_OFF"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "programId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "cohortId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "groupCode",
 *             "required": false,
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
 *             "in": "query",
 *             "name": "search",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "handoffStatus",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "NOT_HANDED_OFF",
 *                 "HANDED_OFF"
 *               ]
 *             },
 *             "description": "Lọc hồ sơ chưa bàn giao hoặc đã bàn giao."
 *           },
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "required": false,
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
 *             "description": "Danh sách sinh viên đã đăng ký; total là số sinh viên không trùng.",
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
 *                                 "type": "string"
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
 *                                 "nullable": true
 *                               },
 *                               "registrations": {
 *                                 "type": "array",
 *                                 "minItems": 1,
 *                                 "items": {
 *                                   "type": "object",
 *                                   "properties": {
 *                                     "id": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647
 *                                     },
 *                                     "registrationId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647
 *                                     },
 *                                     "studentId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647
 *                                     },
 *                                     "studentCode": {
 *                                       "type": "string"
 *                                     },
 *                                     "fullName": {
 *                                       "type": "string"
 *                                     },
 *                                     "email": {
 *                                       "type": "string"
 *                                     },
 *                                     "phone": {
 *                                       "type": "string",
 *                                       "nullable": true
 *                                     },
 *                                     "studentStatus": {
 *                                       "type": "string"
 *                                     },
 *                                     "accountStatus": {
 *                                       "type": "string"
 *                                     },
 *                                     "ojtSemesterId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647
 *                                     },
 *                                     "windowId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647,
 *                                       "nullable": true
 *                                     },
 *                                     "programId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647,
 *                                       "nullable": true
 *                                     },
 *                                     "currentProgramId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647,
 *                                       "nullable": true
 *                                     },
 *                                     "programCode": {
 *                                       "type": "string",
 *                                       "nullable": true
 *                                     },
 *                                     "programName": {
 *                                       "type": "string",
 *                                       "nullable": true
 *                                     },
 *                                     "cohortId": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647,
 *                                       "nullable": true
 *                                     },
 *                                     "cohortName": {
 *                                       "type": "string",
 *                                       "nullable": true
 *                                     },
 *                                     "groupCode": {
 *                                       "type": "string",
 *                                       "nullable": true
 *                                     },
 *                                     "status": {
 *                                       "type": "string",
 *                                       "enum": [
 *                                         "SUBMITTED",
 *                                         "APPROVED",
 *                                         "REJECTED",
 *                                         "HANDED_OFF"
 *                                       ]
 *                                     },
 *                                     "application": {
 *                                       "type": "object",
 *                                       "properties": {
 *                                         "contactPhone": {
 *                                           "type": "string",
 *                                           "nullable": true
 *                                         },
 *                                         "contactEmail": {
 *                                           "type": "string",
 *                                           "nullable": true
 *                                         },
 *                                         "cvUrl": {
 *                                           "type": "string",
 *                                           "format": "uri",
 *                                           "nullable": true
 *                                         },
 *                                         "note": {
 *                                           "type": "string",
 *                                           "nullable": true
 *                                         }
 *                                       }
 *                                     },
 *                                     "pathway": {
 *                                       "type": "object",
 *                                       "nullable": true,
 *                                       "additionalProperties": true
 *                                     },
 *                                     "registeredAt": {
 *                                       "type": "string",
 *                                       "format": "date-time"
 *                                     },
 *                                     "updatedAt": {
 *                                       "type": "string",
 *                                       "format": "date-time"
 *                                     },
 *                                     "submittedBy": {
 *                                       "type": "integer",
 *                                       "minimum": 1,
 *                                       "maximum": 2147483647,
 *                                       "nullable": true
 *                                     },
 *                                     "review": {
 *                                       "type": "object",
 *                                       "properties": {
 *                                         "decision": {
 *                                           "type": "string",
 *                                           "enum": [
 *                                             "APPROVE",
 *                                             "REJECT"
 *                                           ]
 *                                         },
 *                                         "checkId": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647,
 *                                           "nullable": true
 *                                         },
 *                                         "reviewedBy": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         },
 *                                         "reviewedAt": {
 *                                           "type": "string",
 *                                           "format": "date-time"
 *                                         },
 *                                         "reason": {
 *                                           "type": "string",
 *                                           "nullable": true
 *                                         }
 *                                       },
 *                                       "nullable": true
 *                                     },
 *                                     "handoff": {
 *                                       "type": "object",
 *                                       "properties": {
 *                                         "id": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         },
 *                                         "checkId": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         },
 *                                         "handedOffAt": {
 *                                           "type": "string",
 *                                           "format": "date-time"
 *                                         },
 *                                         "handedOffBy": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         }
 *                                       },
 *                                       "nullable": true
 *                                     },
 *                                     "handoffStatus": {
 *                                       "type": "string",
 *                                       "enum": [
 *                                         "NOT_HANDED_OFF",
 *                                         "HANDED_OFF"
 *                                       ]
 *                                     },
 *                                     "semester": {
 *                                       "type": "object",
 *                                       "properties": {
 *                                         "id": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         },
 *                                         "code": {
 *                                           "type": "string"
 *                                         },
 *                                         "name": {
 *                                           "type": "string"
 *                                         },
 *                                         "academicPeriodId": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647,
 *                                           "nullable": true
 *                                         }
 *                                       }
 *                                     },
 *                                     "academicPeriod": {
 *                                       "type": "object",
 *                                       "properties": {
 *                                         "id": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         },
 *                                         "code": {
 *                                           "type": "string"
 *                                         },
 *                                         "name": {
 *                                           "type": "string"
 *                                         },
 *                                         "kind": {
 *                                           "type": "string"
 *                                         }
 *                                       },
 *                                       "nullable": true
 *                                     },
 *                                     "window": {
 *                                       "type": "object",
 *                                       "properties": {
 *                                         "id": {
 *                                           "type": "integer",
 *                                           "minimum": 1,
 *                                           "maximum": 2147483647
 *                                         },
 *                                         "name": {
 *                                           "type": "string"
 *                                         },
 *                                         "status": {
 *                                           "type": "string"
 *                                         },
 *                                         "startsAt": {
 *                                           "type": "string",
 *                                           "format": "date-time"
 *                                         },
 *                                         "endsAt": {
 *                                           "type": "string",
 *                                           "format": "date-time"
 *                                         }
 *                                       },
 *                                       "nullable": true
 *                                     }
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
 *             "description": "Bộ lọc hoặc phân trang không hợp lệ"
 *           },
 *           "401": {
 *             "description": "Cần đăng nhập"
 *           },
 *           "403": {
 *             "description": "Chỉ Admin hoặc Phòng QHDN"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const registeredStudentsOpenApi=true;
