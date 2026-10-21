/**
 * @swagger
 * {
 *   "paths": {
 *     "/api/qhdn/dashboard": {
 *       "get": {
 *         "tags": [
 *           "QHDN reports"
 *         ],
 *         "summary": "Tổng quan QHDN",
 *         "description": "ADMIN/OJT_COORD only. Handoff/student counters count registrations (one student per semester). Latest coordination is selected before applying company filter. Capacity excludes cancelled assignments but includes completed/failed. Available open capacity requires an active company.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "ojtSemesterId",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "OJT semester; omit to aggregate all semesters."
 *           },
 *           {
 *             "name": "companyId",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "EnterpriseID; omit for all partners. Dashboard cannot attribute students without coordination to a company."
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success",
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
 *                         "filters": {
 *                           "type": "object",
 *                           "properties": {
 *                             "ojtSemesterId": {
 *                               "type": "integer",
 *                               "minimum": 1,
 *                               "nullable": true
 *                             },
 *                             "companyId": {
 *                               "type": "integer",
 *                               "minimum": 1,
 *                               "nullable": true
 *                             }
 *                           }
 *                         },
 *                         "partners": {
 *                           "type": "object",
 *                           "properties": {
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "active": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "inactive": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         },
 *                         "positions": {
 *                           "type": "object",
 *                           "properties": {
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "open": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "totalCapacity": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "occupiedSlots": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "remainingSlots": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "openRemainingSlots": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         },
 *                         "students": {
 *                           "type": "object",
 *                           "properties": {
 *                             "handedOff": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "unallocated": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "notCoordinated": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "waitingForEnterprise": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "enterpriseRejected": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "acceptedAwaitingAssignment": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "assigned": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         },
 *                         "assignments": {
 *                           "type": "object",
 *                           "properties": {
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "assigned": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "active": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "completed": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "failed": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "cancelled": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         },
 *                         "results": {
 *                           "type": "object",
 *                           "properties": {
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "pending": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "revisionRequested": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "confirmed": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "passed": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "failed": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         }
 *                       }
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid or unknown filters; export/dashboard reject pagination"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role not permitted; ENTERPRISE/STUDENT/ACADEMIC cannot access QHDN reports"
 *           },
 *           "404": {
 *             "description": "Company or OJT semester not found"
 *           }
 *         }
 *       }
 *     },
 *     "/api/qhdn/reports/export": {
 *       "get": {
 *         "tags": [
 *           "QHDN reports"
 *         ],
 *         "summary": "Xuất báo cáo QHDN CSV/JSON",
 *         "description": "ADMIN/OJT_COORD only. Uses the exact queries and company/semester filters of the selected report. CSV default with UTF-8 BOM and formula escaping. No pagination; maximum 10000 aggregate rows.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "ojtSemesterId",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "OJT semester; omit to aggregate all semesters."
 *           },
 *           {
 *             "name": "companyId",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "EnterpriseID; omit for all partners. Dashboard cannot attribute students without coordination to a company."
 *           },
 *           {
 *             "name": "type",
 *             "in": "query",
 *             "required": true,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "acceptance",
 *                 "internships",
 *                 "enterprise-feedback"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "format",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "csv",
 *                 "json"
 *               ],
 *               "default": "csv"
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "oneOf": [
 *                         {
 *                           "type": "object",
 *                           "properties": {
 *                             "type": {
 *                               "type": "string",
 *                               "enum": [
 *                                 "acceptance"
 *                               ]
 *                             },
 *                             "filters": {
 *                               "type": "object",
 *                               "properties": {
 *                                 "ojtSemesterId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 },
 *                                 "companyId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 }
 *                               }
 *                             },
 *                             "items": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "ojtSemesterId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "semesterCode": {
 *                                     "type": "string"
 *                                   },
 *                                   "companyId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "companyName": {
 *                                     "type": "string"
 *                                   },
 *                                   "currentStudents": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "pending": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "accepted": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "rejected": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "acceptanceRate": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 100,
 *                                     "nullable": true
 *                                   },
 *                                   "coordinationAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "pendingAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "acceptedAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "rejectedAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   }
 *                                 }
 *                               }
 *                             },
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         },
 *                         {
 *                           "type": "object",
 *                           "properties": {
 *                             "type": {
 *                               "type": "string",
 *                               "enum": [
 *                                 "internships"
 *                               ]
 *                             },
 *                             "filters": {
 *                               "type": "object",
 *                               "properties": {
 *                                 "ojtSemesterId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 },
 *                                 "companyId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 }
 *                               }
 *                             },
 *                             "items": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "ojtSemesterId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "semesterCode": {
 *                                     "type": "string"
 *                                   },
 *                                   "companyId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "companyName": {
 *                                     "type": "string"
 *                                   },
 *                                   "totalAssignments": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "assigned": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "active": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "completed": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "failed": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "cancelled": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "assignedStudents": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "totalResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "pendingResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "revisionRequestedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "confirmedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "passedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "failedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "averageOfficialScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   }
 *                                 }
 *                               }
 *                             },
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         },
 *                         {
 *                           "type": "object",
 *                           "properties": {
 *                             "type": {
 *                               "type": "string",
 *                               "enum": [
 *                                 "enterprise-feedback"
 *                               ]
 *                             },
 *                             "filters": {
 *                               "type": "object",
 *                               "properties": {
 *                                 "ojtSemesterId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 },
 *                                 "companyId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 }
 *                               }
 *                             },
 *                             "items": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "ojtSemesterId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "semesterCode": {
 *                                     "type": "string"
 *                                   },
 *                                   "companyId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "companyName": {
 *                                     "type": "string"
 *                                   },
 *                                   "eligibleAssignments": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "evaluationCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "missingEvaluations": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "evaluationCoverageRate": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 100,
 *                                     "nullable": true
 *                                   },
 *                                   "averageCompletionScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "averageAttitudeScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "averageSkillScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "averageOverallScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "commentsCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "enterpriseSubmittedCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "staffEnteredCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "lastEvaluatedAt": {
 *                                     "type": "string",
 *                                     "format": "date-time",
 *                                     "nullable": true
 *                                   }
 *                                 }
 *                               }
 *                             },
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             }
 *                           }
 *                         }
 *                       ]
 *                     }
 *                   }
 *                 }
 *               },
 *               "text/csv": {
 *                 "schema": {
 *                   "type": "string"
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid or unknown filters; export/dashboard reject pagination"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role not permitted; ENTERPRISE/STUDENT/ACADEMIC cannot access QHDN reports"
 *           },
 *           "404": {
 *             "description": "Company or OJT semester not found"
 *           },
 *           "422": {
 *             "description": "Export exceeds 10000 aggregate rows"
 *           }
 *         }
 *       }
 *     },
 *     "/api/qhdn/reports": {
 *       "get": {
 *         "tags": [
 *           "QHDN reports"
 *         ],
 *         "summary": "Báo cáo QHDN theo loại",
 *         "description": "ADMIN/OJT_COORD only. One row per OJT semester/company. currentStudents/pending/accepted/rejected use the latest coordination across all companies. Attempts include reassignment history. acceptanceRate is accepted/(accepted+rejected)*100 for current students; null when no decision exists.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "ojtSemesterId",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "OJT semester; omit to aggregate all semesters."
 *           },
 *           {
 *             "name": "companyId",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "EnterpriseID; omit for all partners. Dashboard cannot attribute students without coordination to a company."
 *           },
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "name": "limit",
 *             "in": "query",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "type",
 *             "required": true,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "acceptance",
 *                 "internships",
 *                 "enterprise-feedback"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "oneOf": [
 *                     {
 *                       "type": "object",
 *                       "properties": {
 *                         "success": {
 *                           "type": "boolean"
 *                         },
 *                         "data": {
 *                           "type": "object",
 *                           "properties": {
 *                             "type": {
 *                               "type": "string",
 *                               "enum": [
 *                                 "acceptance"
 *                               ]
 *                             },
 *                             "filters": {
 *                               "type": "object",
 *                               "properties": {
 *                                 "ojtSemesterId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 },
 *                                 "companyId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 }
 *                               }
 *                             },
 *                             "items": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "ojtSemesterId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "semesterCode": {
 *                                     "type": "string"
 *                                   },
 *                                   "companyId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "companyName": {
 *                                     "type": "string"
 *                                   },
 *                                   "currentStudents": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "pending": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "accepted": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "rejected": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "acceptanceRate": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 100,
 *                                     "nullable": true
 *                                   },
 *                                   "coordinationAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "pendingAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "acceptedAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "rejectedAttempts": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   }
 *                                 }
 *                               }
 *                             },
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "page": {
 *                               "type": "integer",
 *                               "minimum": 1
 *                             },
 *                             "limit": {
 *                               "type": "integer",
 *                               "minimum": 1
 *                             }
 *                           }
 *                         }
 *                       }
 *                     },
 *                     {
 *                       "type": "object",
 *                       "properties": {
 *                         "success": {
 *                           "type": "boolean"
 *                         },
 *                         "data": {
 *                           "type": "object",
 *                           "properties": {
 *                             "type": {
 *                               "type": "string",
 *                               "enum": [
 *                                 "internships"
 *                               ]
 *                             },
 *                             "filters": {
 *                               "type": "object",
 *                               "properties": {
 *                                 "ojtSemesterId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 },
 *                                 "companyId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 }
 *                               }
 *                             },
 *                             "items": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "ojtSemesterId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "semesterCode": {
 *                                     "type": "string"
 *                                   },
 *                                   "companyId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "companyName": {
 *                                     "type": "string"
 *                                   },
 *                                   "totalAssignments": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "assigned": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "active": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "completed": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "failed": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "cancelled": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "assignedStudents": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "totalResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "pendingResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "revisionRequestedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "confirmedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "passedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "failedResults": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "averageOfficialScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   }
 *                                 }
 *                               }
 *                             },
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "page": {
 *                               "type": "integer",
 *                               "minimum": 1
 *                             },
 *                             "limit": {
 *                               "type": "integer",
 *                               "minimum": 1
 *                             }
 *                           }
 *                         }
 *                       }
 *                     },
 *                     {
 *                       "type": "object",
 *                       "properties": {
 *                         "success": {
 *                           "type": "boolean"
 *                         },
 *                         "data": {
 *                           "type": "object",
 *                           "properties": {
 *                             "type": {
 *                               "type": "string",
 *                               "enum": [
 *                                 "enterprise-feedback"
 *                               ]
 *                             },
 *                             "filters": {
 *                               "type": "object",
 *                               "properties": {
 *                                 "ojtSemesterId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 },
 *                                 "companyId": {
 *                                   "type": "integer",
 *                                   "minimum": 1,
 *                                   "nullable": true
 *                                 }
 *                               }
 *                             },
 *                             "items": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                   "ojtSemesterId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "semesterCode": {
 *                                     "type": "string"
 *                                   },
 *                                   "companyId": {
 *                                     "type": "integer",
 *                                     "minimum": 1
 *                                   },
 *                                   "companyName": {
 *                                     "type": "string"
 *                                   },
 *                                   "eligibleAssignments": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "evaluationCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "missingEvaluations": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "evaluationCoverageRate": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 100,
 *                                     "nullable": true
 *                                   },
 *                                   "averageCompletionScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "averageAttitudeScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "averageSkillScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "averageOverallScore": {
 *                                     "type": "number",
 *                                     "minimum": 0,
 *                                     "maximum": 10,
 *                                     "nullable": true
 *                                   },
 *                                   "commentsCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "enterpriseSubmittedCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "staffEnteredCount": {
 *                                     "type": "integer",
 *                                     "minimum": 0
 *                                   },
 *                                   "lastEvaluatedAt": {
 *                                     "type": "string",
 *                                     "format": "date-time",
 *                                     "nullable": true
 *                                   }
 *                                 }
 *                               }
 *                             },
 *                             "total": {
 *                               "type": "integer",
 *                               "minimum": 0
 *                             },
 *                             "page": {
 *                               "type": "integer",
 *                               "minimum": 1
 *                             },
 *                             "limit": {
 *                               "type": "integer",
 *                               "minimum": 1
 *                             }
 *                           }
 *                         }
 *                       }
 *                     }
 *                   ]
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid or unknown filters; export/dashboard reject pagination"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role not permitted; ENTERPRISE/STUDENT/ACADEMIC cannot access QHDN reports"
 *           },
 *           "404": {
 *             "description": "Company or OJT semester not found"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const qhdnReportOpenApi = true;
