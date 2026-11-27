type Spec = Record<string, any>;
const id = { type: 'integer', minimum: 1, maximum: 2147483647 };
const ref = (name: string) => ({ $ref: '#/components/schemas/' + name });
const page = (item: Spec) => ({ type: 'object', required: ['items','total','page','limit'], properties: {
  items: { type: 'array', items: item }, total: { type: 'integer', minimum: 0 }, page: id, limit: { ...id, maximum: 100 },
} });
const response = (data: Spec) => ({ description: 'Student-owned data.', content: { 'application/json': { schema: {
  type: 'object', required: ['success','data'], properties: { success: { type: 'boolean' }, data },
} } } });

export function addStudentTaskOperations(spec: Spec) {
  const query = ['page','limit'].map(name => ({ in: 'query', name, schema: { ...id, ...(name === 'limit' ? { maximum: 100 } : {}) } }));
  const taskId = { in: 'path', name: 'id', required: true, schema: id };
  const operation = (summary: string, parameters: Spec[], data: Spec, code = '200') => ({
    summary, tags: ['Sinh viên'], security: [{ bearerAuth: [] }], parameters,
    responses: { [code]: response(data), 400: { description: 'Invalid input.' }, 401: { description: 'Authentication required.' },
      403: { description: 'Student role, active profile and password change required.' },
      404: { description: 'Task does not exist or belongs to another student.' }, 409: { description: 'Task no longer accepts submissions.' } },
  });
  spec.paths['/api/students/me/tasks'] = { get: operation('Nhiệm vụ của mình theo kỳ OJT', [
    { in: 'query', name: 'ojtSemesterId', required: true, schema: id }, ...query,
  ], page(ref('StudentTask'))) };
  spec.paths['/api/students/me/tasks/{id}/submissions'] = {
    get: operation('Lịch sử nộp bài của mình', [taskId, ...query], page(ref('StudentTaskSubmission'))),
    post: { ...operation('Nộp nội dung, đường dẫn hoặc file bài làm', [taskId], {
      allOf: [ref('StudentTaskSubmission'), { type: 'object', properties: { replayed: { type: 'boolean' } } }],
    }, '201'), description: 'Submit content, one attachment, or both. Multipart accepts one PDF, Office document, ZIP, PNG, JPG or UTF-8 TXT file up to 10 MB. Saves content and file atomically with task DONE and PercentComplete 100. Latest identical content and file replay without duplicates. Late submissions are flagged while the internship remains active.',
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false,
        required: ['content'], properties: { content: { type: 'string', minLength: 1, maxLength: 10000 } } } },
        'multipart/form-data': { schema: { type: 'object', additionalProperties: false, properties: {
          content: { type: 'string', maxLength: 10000 }, attachment: { type: 'string', format: 'binary' },
        }, anyOf: [{ required: ['content'] }, { required: ['attachment'] }] } },
      } },
    },
  };
  spec.paths['/api/students/me/tasks/{id}/submissions'].post.responses[413] = { description: 'Attachment exceeds 10 MB.' };
  spec.paths['/api/internship-tasks/{id}/submissions'] = { get: {
    ...operation('Lịch sử bài nộp theo quyền sinh viên/doanh nghiệp/QHDN', [taskId, ...query], page(ref('StudentTaskSubmission'))),
    tags: ['Thực tập'], description: 'Students read their own task. Enterprises read only tasks assigned to their enterprise; OJT_COORD and ADMIN may also read.',
  } };
  spec.paths['/api/task-submissions/{id}/file'] = { get: {
    summary: 'Tải file bài nộp theo quyền sinh viên/doanh nghiệp/QHDN', tags: ['Thực tập'], security: [{ bearerAuth: [] }], parameters: [taskId],
    responses: {
      200: { description: 'Private attachment download.', headers: { 'Content-Disposition': { schema: { type: 'string' } } },
        content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
      401: { description: 'Authentication required.' }, 403: { description: 'Submission outside permitted scope.' },
      404: { description: 'Submission or attachment not found.' },
    },
  } };
}

// Called after the existing REST schema composition, without modifying staff/enterprise task schemas.
export function describeStudentTaskResponses(spec: Spec): Spec {
  const schemas = spec.components.schemas;
  schemas.StudentTaskSubmission = { type: 'object', required: ['id','taskId','studentId','content','submittedAt','isLate'], properties: {
    id, taskId: id, studentId: id, content: { type: 'string' }, percentComplete: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
    submittedAt: { type: 'string', format: 'date-time', nullable: true }, isLate: { type: 'boolean' },
    attachment: { type: 'object', nullable: true, properties: {
      fileName: { type: 'string' }, mimeType: { type: 'string' }, size: { type: 'integer', minimum: 1, maximum: 10485760 },
      sha256: { type: 'string', minLength: 64, maxLength: 64 },
    } },
  } };
  const tasks = schemas.StudentInternships.properties.tasks;
  const base = structuredClone(tasks.properties.items.items);
  schemas.StudentTask = { ...base, properties: { ...base.properties,
    percentComplete: { type: 'integer', minimum: 0, maximum: 100 }, canSubmit: { type: 'boolean' }, submissionCount: { type: 'integer', minimum: 0 },
    latestSubmission: { allOf: [ref('StudentTaskSubmission')], nullable: true },
  } };
  schemas.StudentTaskProgress = { type: 'object', properties: {
    totalTasks: { type: 'integer', minimum: 0 }, completedTasks: { type: 'integer', minimum: 0 },
    cancelledTasks: { type: 'integer', minimum: 0 }, percentComplete: { type: 'number', minimum: 0, maximum: 100 },
  } };
  schemas.StudentTasksPage = page(ref('StudentTask'));
  schemas.StudentTasksPage.properties.progress = ref('StudentTaskProgress');
  schemas.StudentInternships.properties.tasks = ref('StudentTasksPage');
  spec.paths['/api/students/me/tasks'].get.responses['200'] = response(ref('StudentTasksPage'));
  schemas.StudentAdmissionEligibility = { type: 'object', nullable: true, properties: {
    studentId: id, status: { type: 'string', enum: ['ELIGIBLE','NOT_ELIGIBLE','REVIEW_REQUIRED'] }, isStale: { type: 'boolean' },
    source: { type: 'string', enum: ['FRONTEND_HANDOFF','OFFICIAL_CHECK'] }, handoffId: id,
    batchId: id, checkId: { ...id, nullable: true }, handedOffAt: { type: 'string', format: 'date-time' },
    earnedCredits: { type: 'number', nullable: true }, missingCredits: { type: 'number', nullable: true },
    unpassedCourseCount: { type: 'integer', nullable: true },
    reasons: { type: 'array', items: { type: 'string' } }, academicIssues: { type: 'array', items: { type: 'string' } },
  } };
  schemas.StudentPortalAcademicSummary = { allOf: [ref('StudentAcademicSummary'), {
    type: 'object', properties: { admissionEligibility: ref('StudentAdmissionEligibility') },
  }] };
  schemas.StudentDashboard.properties.academic = ref('StudentPortalAcademicSummary');
  return spec;
}
