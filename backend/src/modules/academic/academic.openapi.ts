/**
 * @swagger
 * {
 *   "components": {
 *     "schemas": {
 *       "AcademicYearCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "yearCode": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "startDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "endDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           }
 *         },
 *         "required": [
 *           "yearCode",
 *           "startDate",
 *           "endDate"
 *         ],
 *         "example": {
 *           "yearCode": "2026-2027",
 *           "startDate": "2026-09-01",
 *           "endDate": "2027-08-31",
 *           "status": "PLANNED"
 *         }
 *       },
 *       "AcademicYearPatch": {
 *         "type": "object",
 *         "minProperties": 1,
 *         "additionalProperties": false,
 *         "properties": {
 *           "yearCode": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "startDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "endDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           }
 *         }
 *       },
 *       "AcademicPeriodCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "academicYearId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647
 *           },
 *           "periodCode": {
 *             "type": "string",
 *             "maxLength": 30
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "kind": {
 *             "type": "string",
 *             "enum": [
 *               "SEMESTER",
 *               "BLOCK3"
 *             ]
 *           },
 *           "parentPeriodId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647,
 *             "nullable": true,
 *             "description": "Required for BLOCK3; null for SEMESTER. Block 3 follows its parent in the same academic year."
 *           },
 *           "startDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "endDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           }
 *         },
 *         "required": [
 *           "academicYearId",
 *           "periodCode",
 *           "name",
 *           "kind",
 *           "startDate",
 *           "endDate"
 *         ],
 *         "example": {
 *           "academicYearId": 1,
 *           "periodCode": "FALL2026",
 *           "name": "Ky chuyen nganh Fall 2026",
 *           "kind": "SEMESTER",
 *           "startDate": "2026-09-01",
 *           "endDate": "2026-12-10",
 *           "status": "PLANNED"
 *         }
 *       },
 *       "AcademicPeriodPatch": {
 *         "type": "object",
 *         "minProperties": 1,
 *         "additionalProperties": false,
 *         "properties": {
 *           "academicYearId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647
 *           },
 *           "periodCode": {
 *             "type": "string",
 *             "maxLength": 30
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "kind": {
 *             "type": "string",
 *             "enum": [
 *               "SEMESTER",
 *               "BLOCK3"
 *             ]
 *           },
 *           "parentPeriodId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647,
 *             "nullable": true,
 *             "description": "Required for BLOCK3; null for SEMESTER. Block 3 follows its parent in the same academic year."
 *           },
 *           "startDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "endDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           }
 *         }
 *       },
 *       "OJTSemesterCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "academicYearId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647
 *           },
 *           "semesterCode": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "academicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647,
 *             "nullable": true
 *           },
 *           "startDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "endDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "regStartDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01",
 *             "nullable": true
 *           },
 *           "regEndDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01",
 *             "nullable": true
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           }
 *         },
 *         "required": [
 *           "academicYearId",
 *           "semesterCode",
 *           "name",
 *           "startDate",
 *           "endDate"
 *         ],
 *         "example": {
 *           "academicYearId": 1,
 *           "semesterCode": "OJT-FALL2026",
 *           "name": "OJT Fall 2026",
 *           "academicPeriodId": 1,
 *           "startDate": "2026-09-01",
 *           "endDate": "2026-12-10",
 *           "regStartDate": "2026-08-01",
 *           "regEndDate": "2026-08-25",
 *           "status": "PLANNED"
 *         }
 *       },
 *       "OJTSemesterPatch": {
 *         "type": "object",
 *         "minProperties": 1,
 *         "additionalProperties": false,
 *         "properties": {
 *           "academicYearId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647
 *           },
 *           "semesterCode": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "academicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647,
 *             "nullable": true
 *           },
 *           "startDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "endDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01"
 *           },
 *           "regStartDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01",
 *             "nullable": true
 *           },
 *           "regEndDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-09-01",
 *             "nullable": true
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           }
 *         }
 *       },
 *       "CohortCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "cohortCode": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "enrollmentYear": {
 *             "type": "integer",
 *             "minimum": 1900,
 *             "maximum": 2200
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           },
 *           "groups": {
 *             "type": "array",
 *             "minItems": 4,
 *             "maxItems": 4,
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "required": [
 *                 "groupCode",
 *                 "entryAcademicPeriodId"
 *               ],
 *               "properties": {
 *                 "groupCode": {
 *                   "type": "string",
 *                   "enum": [
 *                     "A",
 *                     "B",
 *                     "C",
 *                     "D"
 *                   ]
 *                 },
 *                 "entryAcademicPeriodId": {
 *                   "type": "integer",
 *                   "minimum": 1,
 *                   "maximum": 2147483647
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "required": [
 *           "cohortCode",
 *           "name",
 *           "enrollmentYear",
 *           "groups"
 *         ],
 *         "example": {
 *           "cohortCode": "K22",
 *           "name": "Khoa 22",
 *           "enrollmentYear": 2026,
 *           "status": "ACTIVE",
 *           "groups": [
 *             {
 *               "groupCode": "A",
 *               "entryAcademicPeriodId": 1
 *             },
 *             {
 *               "groupCode": "B",
 *               "entryAcademicPeriodId": 2
 *             },
 *             {
 *               "groupCode": "C",
 *               "entryAcademicPeriodId": 3
 *             },
 *             {
 *               "groupCode": "D",
 *               "entryAcademicPeriodId": 4
 *             }
 *           ]
 *         }
 *       },
 *       "CohortPatch": {
 *         "type": "object",
 *         "minProperties": 1,
 *         "additionalProperties": false,
 *         "properties": {
 *           "cohortCode": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "enrollmentYear": {
 *             "type": "integer",
 *             "minimum": 1900,
 *             "maximum": 2200
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PLANNED",
 *               "ACTIVE",
 *               "CLOSED",
 *               "ARCHIVED"
 *             ]
 *           },
 *           "groups": {
 *             "type": "array",
 *             "minItems": 1,
 *             "maxItems": 4,
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "required": [
 *                 "groupCode",
 *                 "entryAcademicPeriodId"
 *               ],
 *               "properties": {
 *                 "groupCode": {
 *                   "type": "string",
 *                   "enum": [
 *                     "A",
 *                     "B",
 *                     "C",
 *                     "D"
 *                   ]
 *                 },
 *                 "entryAcademicPeriodId": {
 *                   "type": "integer",
 *                   "minimum": 1,
 *                   "maximum": 2147483647
 *                 }
 *               }
 *             }
 *           }
 *         }
 *       },
 *       "AcademicPlacementPatch": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "required": [
 *           "reason"
 *         ],
 *         "properties": {
 *           "cohortId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647
 *           },
 *           "groupCode": {
 *             "type": "string",
 *             "enum": [
 *               "A",
 *               "B",
 *               "C",
 *               "D"
 *             ]
 *           },
 *           "entryAcademicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647,
 *             "description": "Optional actual entry override. New cohort/group defaults to its configured entry semester."
 *           },
 *           "currentAcademicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647,
 *             "description": "Required for first placement; a regular semester or its Block 3."
 *           },
 *           "programId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 2147483647
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 1000
 *           }
 *         },
 *         "example": {
 *           "cohortId": 1,
 *           "groupCode": "A",
 *           "currentAcademicPeriodId": 1,
 *           "reason": "Gan lo trinh dau nam hoc"
 *         }
 *       }
 *     }
 *   },
 *   "paths": {
 *     "/api/academic-years": {
 *       "get": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "List academic-years with pagination",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PLANNED",
 *                 "ACTIVE",
 *                 "CLOSED",
 *                 "ARCHIVED"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "success, items, page, limit, total"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Create AcademicYear",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AcademicYearCreate"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "201": {
 *             "description": "Created record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/academic-years/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Partially update AcademicYear",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AcademicYearPatch"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "200": {
 *             "description": "Updated record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/academic-periods": {
 *       "get": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "List academic-periods with pagination",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PLANNED",
 *                 "ACTIVE",
 *                 "CLOSED",
 *                 "ARCHIVED"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "academicYearId",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "kind",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "SEMESTER",
 *                 "BLOCK3"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "success, items, page, limit, total"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Create AcademicPeriod",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AcademicPeriodCreate"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "201": {
 *             "description": "Created record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/academic-periods/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Partially update AcademicPeriod",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AcademicPeriodPatch"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "200": {
 *             "description": "Updated record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/ojt-semesters": {
 *       "get": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "List ojt-semesters with pagination",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PLANNED",
 *                 "ACTIVE",
 *                 "CLOSED",
 *                 "ARCHIVED"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "academicYearId",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "success, items, page, limit, total"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Create OJTSemester",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/OJTSemesterCreate"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "201": {
 *             "description": "Created record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/ojt-semesters/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Partially update OJTSemester",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/OJTSemesterPatch"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "200": {
 *             "description": "Updated record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/cohorts": {
 *       "get": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "List cohorts with pagination",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PLANNED",
 *                 "ACTIVE",
 *                 "CLOSED",
 *                 "ARCHIVED"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "success, items, page, limit, total"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Create Cohort",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CohortCreate"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "201": {
 *             "description": "Created record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/cohorts/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Partially update Cohort",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CohortPatch"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "200": {
 *             "description": "Updated record in data"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/students/{id}/academic-placement": {
 *       "patch": {
 *         "tags": [
 *           "Academic Management"
 *         ],
 *         "summary": "Assign actual academic placement and compute specialized semester",
 *         "description": "First assignment requires cohortId, groupCode and currentAcademicPeriodId. SEMESTER periods are counted from actual entry to the current semester; Block 3 does not advance the count. Updates preserve existing actual entry unless group/cohort changes or an override is supplied. All changes are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 2147483647
 *             }
 *           }
 *         ],
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AcademicPlacementPatch"
 *               }
 *             }
 *           }
 *         },
 *         "responses": {
 *           "200": {
 *             "description": "Placement data includes studentId, cohortId, groupCode, entryAcademicPeriodId, currentAcademicPeriodId, currentSemester, enrollmentYear, programId and updatedAt"
 *           },
 *           "400": {
 *             "description": "Invalid JSON, date, identifier or enum"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN or ACADEMIC required; change temporary password first"
 *           },
 *           "404": {
 *             "description": "Record or referenced cohort/group not found"
 *           },
 *           "409": {
 *             "description": "Duplicate code, invalid calendar, or existing history conflict"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const academicOpenApi = true;
