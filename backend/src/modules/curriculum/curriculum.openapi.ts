/**
 * @swagger
 * {
 *   "components": {
 *     "schemas": {
 *       "CurriculumCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "code": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 200
 *           },
 *           "version": {
 *             "type": "string",
 *             "maxLength": 10
 *           },
 *           "majorId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "totalCredits": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 9999.99,
 *             "exclusiveMinimum": true
 *           },
 *           "effectiveYear": {
 *             "type": "integer",
 *             "minimum": 1900,
 *             "maximum": 2200
 *           },
 *           "gpaScale": {
 *             "type": "integer",
 *             "enum": [
 *               4,
 *               10
 *             ]
 *           }
 *         },
 *         "required": [
 *           "code",
 *           "name",
 *           "version",
 *           "majorId",
 *           "totalCredits",
 *           "effectiveYear",
 *           "gpaScale"
 *         ]
 *       },
 *       "CurriculumPatch": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "code": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 200
 *           },
 *           "version": {
 *             "type": "string",
 *             "maxLength": 10
 *           },
 *           "majorId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "totalCredits": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 9999.99,
 *             "exclusiveMinimum": true
 *           },
 *           "effectiveYear": {
 *             "type": "integer",
 *             "minimum": 1900,
 *             "maximum": 2200
 *           },
 *           "gpaScale": {
 *             "type": "integer",
 *             "enum": [
 *               4,
 *               10
 *             ]
 *           }
 *         },
 *         "required": []
 *       },
 *       "MajorCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "code": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 200
 *           },
 *           "parentMajorId": {
 *             "type": "integer",
 *             "minimum": 1
 *           }
 *         },
 *         "required": [
 *           "code",
 *           "name",
 *           "parentMajorId"
 *         ]
 *       },
 *       "CourseCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "code": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 200
 *           },
 *           "defaultCredits": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 9999.99,
 *             "nullable": true
 *           },
 *           "isOjtPrerequisite": {
 *             "type": "boolean"
 *           }
 *         },
 *         "required": [
 *           "code",
 *           "name"
 *         ]
 *       },
 *       "CoursePatch": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "code": {
 *             "type": "string",
 *             "maxLength": 20
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 200
 *           },
 *           "defaultCredits": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 9999.99,
 *             "nullable": true
 *           },
 *           "isOjtPrerequisite": {
 *             "type": "boolean"
 *           }
 *         },
 *         "required": []
 *       },
 *       "CurriculumCourses": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "courses": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "courseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "courseCode": {
 *                   "type": "string",
 *                   "maxLength": 20
 *                 },
 *                 "credits": {
 *                   "type": "number",
 *                   "minimum": 0,
 *                   "maximum": 9999.99
 *                 },
 *                 "semester": {
 *                   "type": "integer",
 *                   "minimum": 0,
 *                   "maximum": 20
 *                 },
 *                 "isRequired": {
 *                   "type": "boolean"
 *                 },
 *                 "entryKind": {
 *                   "type": "string",
 *                   "enum": [
 *                     "COURSE",
 *                     "COMBO_SLOT",
 *                     "ELECTIVE_SLOT"
 *                   ],
 *                   "default": "COURSE"
 *                 },
 *                 "prerequisiteText": {
 *                   "type": "string",
 *                   "maxLength": 10000,
 *                   "nullable": true
 *                 }
 *               },
 *               "required": [
 *                 "credits",
 *                 "semester",
 *                 "isRequired"
 *               ],
 *               "description": "Provide exactly one of courseId or courseCode."
 *             },
 *             "maxItems": 500
 *           }
 *         },
 *         "required": [
 *           "courses"
 *         ]
 *       },
 *       "CurriculumPrerequisites": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "prerequisites": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "courseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "groupCode": {
 *                   "type": "string",
 *                   "maxLength": 50
 *                 },
 *                 "minimumPassed": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "prerequisiteCourseIds": {
 *                   "type": "array",
 *                   "items": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "maxItems": 500
 *                 }
 *               },
 *               "required": [
 *                 "courseId",
 *                 "groupCode",
 *                 "minimumPassed",
 *                 "prerequisiteCourseIds"
 *               ]
 *             },
 *             "maxItems": 1000
 *           }
 *         },
 *         "required": [
 *           "prerequisites"
 *         ]
 *       },
 *       "CurriculumEquivalences": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "equivalences": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "sourceCourseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "targetCourseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "reason": {
 *                   "type": "string",
 *                   "maxLength": 2000
 *                 }
 *               },
 *               "required": [
 *                 "sourceCourseId",
 *                 "targetCourseId",
 *                 "reason"
 *               ]
 *             },
 *             "maxItems": 500
 *           }
 *         },
 *         "required": [
 *           "equivalences"
 *         ]
 *       },
 *       "ComboCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "code": {
 *             "type": "string",
 *             "maxLength": 50
 *           },
 *           "name": {
 *             "type": "string",
 *             "maxLength": 200
 *           },
 *           "selectionGroup": {
 *             "type": "string",
 *             "maxLength": 50,
 *             "nullable": true
 *           },
 *           "note": {
 *             "type": "string",
 *             "maxLength": 2000,
 *             "nullable": true
 *           }
 *         },
 *         "required": [
 *           "code",
 *           "name"
 *         ]
 *       },
 *       "ComboCourses": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "courses": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "courseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "courseCode": {
 *                   "type": "string",
 *                   "maxLength": 20
 *                 },
 *                 "credits": {
 *                   "type": "number",
 *                   "minimum": 0,
 *                   "maximum": 9999.99
 *                 },
 *                 "semester": {
 *                   "type": "integer",
 *                   "minimum": 0,
 *                   "maximum": 20
 *                 },
 *                 "prerequisiteText": {
 *                   "type": "string",
 *                   "maxLength": 10000,
 *                   "nullable": true
 *                 },
 *                 "note": {
 *                   "type": "string",
 *                   "maxLength": 2000,
 *                   "nullable": true
 *                 },
 *                 "slotCourseIds": {
 *                   "type": "array",
 *                   "items": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "maxItems": 100
 *                 }
 *               },
 *               "required": [
 *                 "credits",
 *                 "semester",
 *                 "slotCourseIds"
 *               ],
 *               "description": "Provide exactly one of courseId or courseCode; slot IDs are global CourseIDs for placeholders in this curriculum."
 *             },
 *             "maxItems": 500
 *           },
 *           "choiceGroups": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "code": {
 *                   "type": "string",
 *                   "maxLength": 50
 *                 },
 *                 "minCourses": {
 *                   "type": "integer",
 *                   "minimum": 0
 *                 },
 *                 "maxCourses": {
 *                   "type": "integer",
 *                   "minimum": 0
 *                 },
 *                 "courseIds": {
 *                   "type": "array",
 *                   "items": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "maxItems": 500
 *                 }
 *               },
 *               "required": [
 *                 "code",
 *                 "minCourses",
 *                 "maxCourses",
 *                 "courseIds"
 *               ]
 *             },
 *             "maxItems": 500
 *           }
 *         },
 *         "required": [
 *           "courses",
 *           "choiceGroups"
 *         ]
 *       },
 *       "CurriculumPublish": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "reason"
 *         ]
 *       },
 *       "CurriculumImport": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "idempotencyKey": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "sourceName": {
 *             "type": "string",
 *             "maxLength": 150,
 *             "nullable": true
 *           },
 *           "curriculum": {
 *             "type": "object",
 *             "additionalProperties": false,
 *             "properties": {
 *               "code": {
 *                 "type": "string",
 *                 "maxLength": 100
 *               },
 *               "name": {
 *                 "type": "string",
 *                 "maxLength": 200
 *               },
 *               "version": {
 *                 "type": "string",
 *                 "maxLength": 10
 *               },
 *               "majorId": {
 *                 "type": "integer",
 *                 "minimum": 1
 *               },
 *               "totalCredits": {
 *                 "type": "number",
 *                 "minimum": 0,
 *                 "maximum": 9999.99,
 *                 "exclusiveMinimum": true
 *               },
 *               "effectiveYear": {
 *                 "type": "integer",
 *                 "minimum": 1900,
 *                 "maximum": 2200
 *               },
 *               "gpaScale": {
 *                 "type": "integer",
 *                 "enum": [
 *                   4,
 *                   10
 *                 ]
 *               }
 *             },
 *             "required": [
 *               "code",
 *               "name",
 *               "version",
 *               "majorId",
 *               "totalCredits",
 *               "effectiveYear",
 *               "gpaScale"
 *             ]
 *           },
 *           "courses": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "courseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "courseCode": {
 *                   "type": "string",
 *                   "maxLength": 20
 *                 },
 *                 "credits": {
 *                   "type": "number",
 *                   "minimum": 0,
 *                   "maximum": 9999.99
 *                 },
 *                 "semester": {
 *                   "type": "integer",
 *                   "minimum": 0,
 *                   "maximum": 20
 *                 },
 *                 "isRequired": {
 *                   "type": "boolean"
 *                 },
 *                 "entryKind": {
 *                   "type": "string",
 *                   "enum": [
 *                     "COURSE",
 *                     "COMBO_SLOT",
 *                     "ELECTIVE_SLOT"
 *                   ],
 *                   "default": "COURSE"
 *                 },
 *                 "prerequisiteText": {
 *                   "type": "string",
 *                   "maxLength": 10000,
 *                   "nullable": true
 *                 }
 *               },
 *               "required": [
 *                 "credits",
 *                 "semester",
 *                 "isRequired"
 *               ],
 *               "description": "Provide exactly one of courseId or courseCode."
 *             },
 *             "maxItems": 500
 *           },
 *           "prerequisites": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "courseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "groupCode": {
 *                   "type": "string",
 *                   "maxLength": 50
 *                 },
 *                 "minimumPassed": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "prerequisiteCourseIds": {
 *                   "type": "array",
 *                   "items": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "maxItems": 500
 *                 }
 *               },
 *               "required": [
 *                 "courseId",
 *                 "groupCode",
 *                 "minimumPassed",
 *                 "prerequisiteCourseIds"
 *               ]
 *             },
 *             "maxItems": 1000
 *           },
 *           "combos": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "code": {
 *                   "type": "string",
 *                   "maxLength": 50
 *                 },
 *                 "name": {
 *                   "type": "string",
 *                   "maxLength": 200
 *                 },
 *                 "selectionGroup": {
 *                   "type": "string",
 *                   "maxLength": 50,
 *                   "nullable": true
 *                 },
 *                 "note": {
 *                   "type": "string",
 *                   "maxLength": 2000,
 *                   "nullable": true
 *                 },
 *                 "courses": {
 *                   "type": "array",
 *                   "items": {
 *                     "type": "object",
 *                     "additionalProperties": false,
 *                     "properties": {
 *                       "courseId": {
 *                         "type": "integer",
 *                         "minimum": 1
 *                       },
 *                       "courseCode": {
 *                         "type": "string",
 *                         "maxLength": 20
 *                       },
 *                       "credits": {
 *                         "type": "number",
 *                         "minimum": 0,
 *                         "maximum": 9999.99
 *                       },
 *                       "semester": {
 *                         "type": "integer",
 *                         "minimum": 0,
 *                         "maximum": 20
 *                       },
 *                       "prerequisiteText": {
 *                         "type": "string",
 *                         "maxLength": 10000,
 *                         "nullable": true
 *                       },
 *                       "note": {
 *                         "type": "string",
 *                         "maxLength": 2000,
 *                         "nullable": true
 *                       },
 *                       "slotCourseIds": {
 *                         "type": "array",
 *                         "items": {
 *                           "type": "integer",
 *                           "minimum": 1
 *                         },
 *                         "maxItems": 100
 *                       }
 *                     },
 *                     "required": [
 *                       "credits",
 *                       "semester",
 *                       "slotCourseIds"
 *                     ],
 *                     "description": "Provide exactly one of courseId or courseCode; slot IDs are global CourseIDs for placeholders in this curriculum."
 *                   },
 *                   "maxItems": 500
 *                 },
 *                 "choiceGroups": {
 *                   "type": "array",
 *                   "items": {
 *                     "type": "object",
 *                     "additionalProperties": false,
 *                     "properties": {
 *                       "code": {
 *                         "type": "string",
 *                         "maxLength": 50
 *                       },
 *                       "minCourses": {
 *                         "type": "integer",
 *                         "minimum": 0
 *                       },
 *                       "maxCourses": {
 *                         "type": "integer",
 *                         "minimum": 0
 *                       },
 *                       "courseIds": {
 *                         "type": "array",
 *                         "items": {
 *                           "type": "integer",
 *                           "minimum": 1
 *                         },
 *                         "maxItems": 500
 *                       }
 *                     },
 *                     "required": [
 *                       "code",
 *                       "minCourses",
 *                       "maxCourses",
 *                       "courseIds"
 *                     ]
 *                   },
 *                   "maxItems": 500
 *                 }
 *               },
 *               "required": [
 *                 "code",
 *                 "name",
 *                 "courses",
 *                 "choiceGroups"
 *               ]
 *             },
 *             "maxItems": 100
 *           },
 *           "equivalences": {
 *             "type": "array",
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "sourceCourseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "targetCourseId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "reason": {
 *                   "type": "string",
 *                   "maxLength": 2000
 *                 }
 *               },
 *               "required": [
 *                 "sourceCourseId",
 *                 "targetCourseId",
 *                 "reason"
 *               ]
 *             },
 *             "maxItems": 500
 *           }
 *         },
 *         "required": [
 *           "idempotencyKey",
 *           "curriculum",
 *           "courses",
 *           "prerequisites",
 *           "combos",
 *           "equivalences"
 *         ]
 *       }
 *     }
 *   },
 *   "paths": {
 *     "/api/majors": {
 *       "get": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "List majors",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
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
 *           },
 *           {
 *             "name": "search",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "name": "parentMajorId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Create majors",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/MajorCreate"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/courses": {
 *       "get": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "List courses",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
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
 *           },
 *           {
 *             "name": "search",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Create courses",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CourseCreate"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula": {
 *       "get": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "List curricula",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
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
 *           },
 *           {
 *             "name": "search",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "name": "majorId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "status",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "DRAFT",
 *                 "PUBLISHED"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "version",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 10
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Create curricula",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumCreate"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/courses/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Update course catalog",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CoursePatch"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula/{id}": {
 *       "get": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Full curriculum with version, courses, prerequisites, combos, equivalences",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         }
 *       },
 *       "patch": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Edit unused draft metadata and GPA scale",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumPatch"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula/{id}/courses": {
 *       "put": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Replace curriculum courses with stable retained IDs",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumCourses"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula/{id}/prerequisites": {
 *       "put": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Set explicit AND groups / minimum passed members",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumPrerequisites"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula/{id}/course-equivalences": {
 *       "put": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Set approved directed course equivalences",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumEquivalences"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula/{id}/combos": {
 *       "get": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "List combos and slot mappings",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Create a curriculum-scoped combo",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboCreate"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/combos/{id}/courses": {
 *       "put": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Replace combo courses, choice groups and explicit slot mappings",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboCourses"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curricula/{id}/publish": {
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Validate and freeze curriculum version",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumPublish"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curriculum-imports/preview": {
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Validate full JSON frame without writes",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumImport"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/curriculum-imports/commit": {
 *       "post": {
 *         "tags": [
 *           "Curriculum management"
 *         ],
 *         "summary": "Import a new draft version atomically with history",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid JSON/reference/rule"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "ADMIN / ACADEMIC only"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Version conflict, published/in-use curriculum, or reference conflict"
 *           },
 *           "422": {
 *             "description": "Publication rejected; inspect data.issues"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CurriculumImport"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const curriculumApiDocumentation=true;
