type Schema = Record<string, any>;
const id = {type: 'integer', minimum: 1};
const text = {type: 'string'};
const nullableText = {...text, nullable: true};
const number = {type: 'number', nullable: true};
const time = {type: 'string', format: 'date-time', nullable: true};
const object = (properties: Schema): Schema => ({type: 'object', properties});
const array = (items: Schema): Schema => ({type: 'array', items});
const nullable = (schema: Schema): Schema => ({...schema, nullable: true});
const reference = (name: string) => ({$ref: '#/components/schemas/' + name});
const page = (items: Schema) => object({items: array(items), total: {type: 'integer', minimum: 0}, page: id, limit: {...id, maximum: 100}});
const envelope = (data: Schema) => ({description: 'Thông tin chi tiết trong phạm vi được phép xem.', content: {
  'application/json': {schema: {type: 'object', required: ['success', 'data'], properties: {success: {type: 'boolean'}, data}}},
}});

// This describes the actual REST routers; runtime handlers do not depend on Swagger.
export function describeStudentRest(spec: Schema): Schema {
  const data = (path: string) => spec.paths[path]?.get?.responses?.['200']?.content?.['application/json']?.schema?.properties?.data;
  const profile = data('/api/students/{id}');
  const courseResult = data('/api/students/{id}/course-results').properties.items.items;
  const window = data('/api/ojt-registration-windows').properties.items.items;
  const context = (name: string) => data('/api/internship-tasks').properties.items.items.properties[name];
  const publishedResult = data('/api/students/me/ojt-results').properties.items.items;
  Object.assign(publishedResult.properties, {
    source: {type: 'string', enum: ['ACADEMIC_CONFIRMATION']},
    templateId: nullable(id), scoreDetails: {type: 'object', nullable: true, additionalProperties: true},
    overallScore: number, evaluatedAt: time,
    template: nullable(object({id, code: text, name: text, version: id, criteria: array({type: 'object', additionalProperties: true})})),
  });
  const requirement = object({id, courseId: nullable(id), courseCode: text, name: text,
    kind: text, credits: number, required: {type: 'boolean', nullable: true}, completed: {type: 'boolean'},
    matchedCourseId: nullable(id), choices: array(id), learningStatus: {type: 'string', enum: ['FAILED', 'IN_PROGRESS', 'NOT_STUDIED']},
    course: nullable(courseResult.properties.course),
    courseChoices: array(courseResult.properties.course),
  });
  const progress = profile.properties.academicProgress;
  Object.assign(progress.properties, {gpaCredits: number, retakePolicy: {type: 'string', enum: ['LATEST']},
    computedAt: time, requirements: array(requirement), unmappedAchievements: array(id),
    gpaCourses: array(object({courseId: id, resultId: id, score: number, credits: number})),
  });
  const eligibility = {type: 'object', additionalProperties: true, properties: {
    status: {type: 'string', enum: ['ELIGIBLE', 'NOT_ELIGIBLE', 'REVIEW_REQUIRED']},
    earnedCredits: number, missingCredits: number, unpassedCourseCount: {type: 'integer'},
    reasons: array(text), academicIssues: array(text), isStale: {type: 'boolean'},
    rule: nullable(object({id, version: id, minCredits: number, maxUnpassedCourses: {type: 'integer'}, debtBasis: text})),
  }};
  const notification = object({id, title: text, content: nullableText, sentAt: time, isRead: {type: 'boolean', nullable: true},
    channel: nullableText, templateId: nullable(id), relatedEntityType: nullableText, relatedEntityId: nullable(id)});
  const notifications = page(notification);
  notifications.properties.unreadCount = {type: 'integer', minimum: 0};
  const academic = object({studentId: id, programId: nullable(id), ojtSemesterId: id,
    currentSemester: {type:'integer',minimum:0,maximum:9,nullable:true},
    earlyWarning: object({available:{type:'boolean'},status:{type:'string',enum:['PROGRESS_ONLY','NOT_AVAILABLE']},
      currentSemester:{type:'integer',minimum:0,maximum:9,nullable:true},reasons:array(text),
      riskLevel:{type:'string',nullable:true,enum:[null]},riskScore:{type:'number',nullable:true,enum:[null]},
      isAiPrediction:{type:'boolean',enum:[false]},message:text,recommendations:array(text)}),
    student: context('student'), program: profile.properties.program,
    semester: context('semester'), academicProgress: progress,
    earnedCredits: number, missingCredits: number, failedCourseCount: {type: 'integer'},
    failedCourses: array({type: 'object', additionalProperties: true}), outstandingCourses: array(requirement),
    inProgressCredits: number, currentEligibility: eligibility, officialEligibility: nullable(eligibility),
    scenario: object({assumption: {type: 'string', enum: ['ALL_CURRENT_COURSES_PASSED']}, potentialCredits: number, isAiPrediction: {type: 'boolean', enum: [false]}}),
    gpa: number, gpaScale: number, issues: array(text), computedAt: time,
    deadline: nullable(object({assessmentDeadline: time, assessmentAcademicPeriodId: nullable(id)})),
  });
  const assignment = nullable(object({id, studentId: id, enterpriseId: id, enterpriseName: text,
    positionId: id, title: text, ojtSemesterId: id, coordinationId: id, registrationId: id,
    enterpriseSupervisorName: nullableText, academicSupervisorId: nullable(id),
    academicSupervisor: nullable(object({id, fullName: text, email: nullableText, phone: nullableText})),
    company: context('company'), position: context('position'), semester: context('semester'), student: context('student'),
    registration: {type: 'object', nullable: true, additionalProperties: true},
    startDate: {type: 'string', format: 'date', nullable: true}, endDate: {type: 'string', format: 'date', nullable: true}, status: text,
  }));
  const curriculum = structuredClone(data('/api/curricula/{id}') ?? {type: 'object', additionalProperties: true});
  curriculum.properties ??= {};
  curriculum.properties.studentId = id;
  const supplementary = object({studentId: id, missingCredits: number, issues: array(text), items: array(object({
    requirementId: id, courseId: nullable(id), courseCode: text, name: text, credits: number,
    choices: array(id), courseChoices: array(courseResult.properties.course),
    reason: {type: 'string', enum: ['RETAKE', 'UNCOMPLETED_REQUIREMENT']},
    prerequisites: array(object({courseId: id, minimumPassed: {type: 'integer'}, courseIds: array(id), courses: array(courseResult.properties.course)})),
    availability: {type: 'string', enum: ['NOT_MANAGED']}, isAiRecommendation: {type: 'boolean', enum: [false]},
  }))});
  academic.properties.supplementaryCourses=reference('StudentSupplementaryCourses');
  const internship=object({studentId:id,ojtSemesterId:nullable(id),assignment:reference('StudentCurrentAssignment'),
    tasks:data('/api/internship-tasks'),results:page(publishedResult),result:nullable(publishedResult)});
  const dashboard = object({academic: reference('StudentAcademicSummary'), registrationWindows: page(window),
    comboWindows: page(window), internship:reference('StudentInternships'), notifications: reference('StudentNotifications'),
    jobApplications: data('/api/job-applications'),
  });
  Object.assign(spec.components.schemas, {StudentAcademicSummary: academic, StudentCurrentAssignment: assignment,
    StudentNotifications: notifications, StudentCurriculum: curriculum, StudentSupplementaryCourses: supplementary, StudentDashboard: dashboard,
    StudentInternships:internship});
  const set = (path: string, schema: Schema, method = 'get') => {
    const operation = spec.paths[path]?.[method];
    if (!operation) throw Error('Missing Student REST operation: ' + method + ' ' + path);
    operation.responses['200'] = envelope(schema);
  };
  set('/api/students/me/academic-summary', reference('StudentAcademicSummary'));
  set('/api/students/me/supplementary-course-options', reference('StudentSupplementaryCourses'));
  set('/api/students/me/curriculum', reference('StudentCurriculum'));
  set('/api/students/me/notifications', reference('StudentNotifications'));
  set('/api/students/me/notifications/{id}', object({...notification.properties, unreadCount: {type: 'integer', minimum: 0}}), 'patch');
  set('/api/students/me/assignments/current', reference('StudentCurrentAssignment'));
  set('/api/students/me/ojt-results/{id}', publishedResult);
  set('/api/students/me/dashboard', reference('StudentDashboard'));
  set('/api/students/me/roadmap-recommendations', object({modelVersion: text, recommendations: array(text), isAiRecommendation: {type: 'boolean', enum: [true]}}));
  profile.properties.courseResults.properties.items.items = courseResult;
  profile.properties.currentSemester = {type: 'integer', minimum: 0, maximum: 9, nullable: true};
  profile.properties.courseSemesterTag = {type: 'integer', minimum: 0, maximum: 9, nullable: true, description:'Tag kỳ: số kỳ lớn nhất của môn IN_PROGRESS trong khung chương trình được gán, gồm môn combo đã duyệt. Không có môn đang học thì null. Khác currentSemester theo lộ trình khóa.'};
  profile.properties.latestOjtCheck={type:'object',nullable:true,description:'Kết quả tính toán gần nhất cho kỳ OJT 6 theo lộ trình; riêng với kết quả xác nhận chính thức.',properties:{status:{type:'string',enum:['ELIGIBLE','NOT_ELIGIBLE','REVIEW_REQUIRED']},checkedAt:{type:'string',format:'date-time'},ojtSemesterId:{type:'integer'},isStale:{type:'boolean'}}};
  profile.properties.semester = context('semester');
  Object.assign(profile.properties, {eligibility: {type: 'object', additionalProperties: true},
    eligibilityChecks: page({type: 'object', additionalProperties: true}), comboHistory: page({type: 'object', additionalProperties: true}),
    academic:nullable(reference('StudentAcademicSummary')),curriculum:nullable(reference('StudentCurriculum')),curriculumStatus:nullableText});
  const profileOperation=spec.paths['/api/students/{id}'].get;
  profileOperation.description='Hồ sơ tổng hợp, thay các API riêng về bảng điểm, chương trình, tổng hợp học vụ, điều kiện/lịch sử xét và lịch sử combo. include chọn các phần cần tải; mặc định trả tất cả. academic=null khi chưa có kỳ OJT; curriculum=null khi chưa công bố/gán chương trình. Không trả điểm đánh giá chưa công bố cho Student.';
  profileOperation.parameters.push({in:'query',name:'include',schema:{type:'string'},description:'Danh sách phân cách bằng dấu phẩy: academicProgress,courseResults,comboSelections,ojtRegistrations,eligibility,eligibilityChecks,comboHistory,academic,curriculum. Không dùng cùng section.'},
    ...['checksPage','checksLimit','comboPage','comboLimit'].map(name=>({in:'query',name,schema:{...id,...(name.endsWith('Limit')?{maximum:100}:{})}})),
    ...['courseId','academicPeriodId'].map(name=>({in:'query',name,schema:id})),
    {in:'query',name:'courseStatus',schema:{type:'string',enum:['PASSED','FAILED','IN_PROGRESS','WITHDRAWN','RECOGNIZED']},description:'Lọc courseResults; dùng resultsPage/resultsLimit để phân trang.'});
  const retired=[
    '/api/students/me/academic-summary','/api/students/me/supplementary-course-options','/api/students/me/curriculum',
    '/api/students/{id}/course-results','/api/students/{id}/eligibility','/api/students/{id}/eligibility-checks','/api/students/{id}/combo-selections',
    '/api/students/me/assignments/current','/api/students/me/ojt-results','/api/students/me/ojt-results/{id}',
  ];
  for(const path of retired)delete spec.paths[path];
  const tasksOperation=spec.paths['/api/internship-tasks'].get;
  tasksOperation['x-roles']=tasksOperation['x-roles'].filter((role:string)=>role!=='STUDENT');
  tasksOperation.tags=tasksOperation.tags.filter((tag:string)=>tag!=='Sinh viên');
  spec.paths['/api/students/me/internships']={get:{tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],
    summary:'Hồ sơ thực tập: phân công, nhiệm vụ và kết quả đã công bố',
    description:'Gộp phân công hiện tại, nhiệm vụ và kết quả OJT. Bỏ bộ lọc kỳ: phân công đang hiệu lực mới nhất và lịch sử kết quả của mình. assignmentId chọn phân công lịch sử, resultId chọn kết quả CONFIRMED kèm đúng phân công. Không tìm thấy hoặc không thuộc mình trả 404. Các danh sách có phân trang độc lập.',
    parameters:['ojtSemesterId','assignmentId','resultId','tasksPage','tasksLimit','resultsPage','resultsLimit'].map(name=>({in:'query',name,schema:{...id,...(name.endsWith('Limit')?{maximum:100}:{}),...(name.endsWith('Page')?{default:1}:{})}})),
    responses:{200:envelope(reference('StudentInternships')),400:{description:'Sai bộ lọc hoặc phân trang'},401:{description:'Chưa đăng nhập'},403:{description:'Sai quyền'},404:{description:'Không có kỳ/phân công/kết quả được phép xem'}}}};

  for(const [endpoint,example,summary] of [
    ['course-impact',{courseCode:'SWR302'},'Ảnh hưởng trực tiếp/gián tiếp nếu chưa đạt một môn cụ thể'],
    ['study-simulation',{passedCourseCodes:['SWP391','SWR302']},'Mô phỏng tín chỉ, môn nợ và điều kiện OJT nếu đạt các môn đã chọn'],
  ] as const) {
    spec.paths['/api/students/me/'+endpoint]={post:{tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],summary,
      description:'Dữ liệu từ hồ sơ JWT. Không ghi DB, không gọi AI để tính số liệu. Chỉ nhận môn thuộc chương trình/lựa chọn đã xác nhận; không nhận ID sinh viên hoặc điểm từ client. Mô phỏng không cam kết hoàn thành trong cùng kỳ, không thay đổi kết quả chính thức. prerequisiteWarnings nêu điều kiện chưa đạt hiện tại; cần hoàn thành tiên quyết ở kỳ trước. Ảnh hưởng gián tiếp là đường liên hệ, không bảo đảm mọi môn bị chặn nếu có nhánh lựa chọn khác.',
      requestBody:{required:true,content:{'application/json':{example,schema:{type:'object',additionalProperties:false,
        required:[endpoint==='course-impact'?'courseCode':'passedCourseCodes'],properties:endpoint==='course-impact'?{courseCode:{type:'string',minLength:1,maxLength:20}}:{passedCourseCodes:{type:'array',minItems:1,maxItems:20,uniqueItems:true,items:{type:'string',maxLength:20}}}}}}},
      responses:{200:envelope({type:'object',additionalProperties:true}),400:{description:'Môn không thuộc chương trình, trùng/tương đương hoặc request không hợp lệ'},
        401:{description:'Chưa đăng nhập'},403:{description:'Không có quyền sinh viên'},409:{description:'Thiếu cấu hình hoặc chưa đủ điều kiện theo dõi/mô phỏng'}}}};
  }
  const coursePlanSchema=object({status:text,message:text,items:array(object({priority:id,courseId:id,courseCode:nullableText,name:nullableText,
    requirementId:id,credits:number,action:{type:'string',enum:['RETAKE','STUDY']},canPlan:{type:'boolean'},isAlternative:{type:'boolean'},
    explanation:text,availability:{type:'string',enum:['NOT_MANAGED']},directDependentCount:{type:'integer'},unlocksCount:{type:'integer'},downstreamCount:{type:'integer'},
    dependentCourses:array(object({courseId:id,courseCode:nullableText,name:nullableText,unlocksAfterPassing:{type:'boolean'},mandatory:{type:'boolean'}})),
    prerequisites:array(object({minimumPassed:{type:'integer'},passedCount:{type:'integer'},remainingRequired:{type:'integer'},satisfied:{type:'boolean'},
      courses:array(object({courseId:id,courseCode:nullableText,name:nullableText,passed:{type:'boolean'}}))}))}))});
  spec.paths['/api/students/me/course-advice']={post:{tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],
    summary:'Tư vấn môn học/học lại, ưu tiên môn tiên quyết đang chặn môn sau',
    description:'Gửi {}. Backend xếp ưu tiên từ chương trình đã công bố và kết quả học tập, phân biệt nhóm tiên quyết AND/OR. canPlan chỉ nói đã đáp ứng tiên quyết trên dữ liệu hiện tại, không xác nhận mở lớp hoặc quyền đăng ký; môn tiên quyết phải được hoàn thành trước kỳ học môn sau. Gemini chọn khuyến nghị chung; không tự tạo quan hệ môn. Cần đủ điều kiện theo dõi sớm từ kỳ 2.',
    requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false},example:{}}}},
    responses:{200:envelope(object({status:{type:'string',enum:['READY','NOT_AVAILABLE','DATA_INCOMPLETE']},message:text,coursePlan:nullable(coursePlanSchema),
      advice:{type:'object',nullable:true,additionalProperties:true},prioritySource:text,isAiPrediction:{type:'boolean',enum:[false]}})),
      400:{description:'Chỉ nhận JSON {}'},401:{description:'Chưa đăng nhập'},403:{description:'Không có quyền sinh viên'}}}};
  spec.paths['/api/students/me/academic-chat']={post:{tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],
    summary:'Hỏi đáp môn nợ, tín chỉ, GPA và điều kiện OJT của chính mình',
    description:'Hỏi đáp từng câu độc lập, chưa lưu lịch sử hội thoại. Số liệu lấy từ hồ sơ của tài khoản JWT; không nhận studentId hoặc số liệu do client cung cấp. Câu hỏi xin tư vấn dùng Gemini theo điều kiện theo dõi sớm. Câu hỏi ngoài học vụ trả OUT_OF_SCOPE. Không dự báo xác suất rủi ro.',
    requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:['message'],properties:{message:{type:'string',minLength:1,maxLength:1000}}},example:{message:'Mình còn nợ môn nào và thiếu bao nhiêu tín chỉ?'}}}},
    responses:{200:envelope(object({status:{type:'string',enum:['ANSWERED','DATA_INCOMPLETE','OUT_OF_SCOPE','NEED_COURSE_SELECTION']},topics:array(text),answer:text,
      facts:{type:'object',nullable:true,additionalProperties:true},source:{type:'string',enum:['ACADEMIC_RECORDS']},isAiPrediction:{type:'boolean',enum:[false]},
      recommendations:array(text),coursePlan:nullable(coursePlanSchema),adviceSource:nullableText,adviceStatus:nullableText,aiError:{type:'object',nullable:true,additionalProperties:true}})),
      400:{description:'message không hợp lệ hoặc trường không được hỗ trợ'},401:{description:'Chưa đăng nhập'},403:{description:'Không có quyền sinh viên'}}}};
  spec.paths['/api/students/me/ojt-readiness']={get:{tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],
    summary:'Tiến độ của chính sinh viên, tự xác định kỳ OJT theo hồ sơ',
    responses:{200:envelope(object({student:object({id,studentCode:text,fullName:text,currentSemester:{type:'integer',nullable:true},programName:nullableText}),
      ojtSemesterId:nullable(id),academic:nullable(reference('StudentAcademicSummary')),academicProgress:progress})),
      401:{description:'Chưa đăng nhập'},403:{description:'Không có quyền sinh viên'},404:{description:'Không có hồ sơ sinh viên'}}}};
  spec.paths['/api/students/me/ojt-advice']={post:{tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],
    summary:'Tạo tư vấn tiến độ OJT cho sinh viên đang đăng nhập',
    description:'Chỉ dùng dữ liệu backend. Trước kỳ 2, chưa có tín chỉ hoặc dữ liệu không hợp lệ trả NOT_AVAILABLE và không gọi Gemini. Mặc định AI tắt; thiếu cấu hình hoặc lỗi API trả FALLBACK. Không tạo xác suất rủi ro. Không lưu/cache tư vấn trong bước chuẩn bị này.',
    requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:['ojtSemesterId'],properties:{ojtSemesterId:id}}}}},
    responses:{200:envelope(object({status:{type:'string',enum:['NOT_AVAILABLE','FALLBACK','READY']},source:{type:'string',enum:['RULES','GEMINI']},
      academic:object({currentSemester:{type:'integer',nullable:true},earnedCredits:number,missingCredits:number,failedCourseCount:{type:'integer'},currentEligibilityStatus:text}),
      explanation:text,recommendations:array(text),modelVersion:nullableText,fallbackReason:nullableText,
      aiError:nullable(object({code:text,message:text,httpStatus:{type:'integer',nullable:true},phase:{type:'string',enum:['CONFIGURATION','REQUEST','READ_RESPONSE','VALIDATE_RESPONSE']},elapsedMs:{type:'integer'},timeoutMs:{type:'integer'}})),
      riskLevel:{type:'string',nullable:true,enum:[null]},riskScore:{type:'number',nullable:true,enum:[null]},isAiPrediction:{type:'boolean',enum:[false]}})),
      400:{description:'Dữ liệu không hợp lệ'},401:{description:'Chưa đăng nhập'},403:{description:'Không có quyền sinh viên'},404:{description:'Không tìm thấy hồ sơ hoặc kỳ OJT'}}}};
  for (const [path, item] of Object.entries(spec.paths) as [string, Schema][]) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = item[method];
      if (!op?.['x-roles']?.includes('STUDENT')) continue;
      if (method === 'get') {
        delete op.requestBody;
        op.description = [op.description, 'GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.'].filter(Boolean).join(' ');
      } else if (op.requestBody?.content?.['application/json']) {
        op.requestBody.content = {'application/json': op.requestBody.content['application/json']};
        op.responses['415'] = {description: 'Body phải là application/json.'};
      }
      if (path === '/api/students/me/notifications') {
        const unread = op.parameters?.find((p: Schema) => p.name === 'unread');
        if (unread) unread.schema = {type: 'boolean'};
      }
      if (path === '/api/internship-tasks') {
        const studentId = op.parameters?.find((p: Schema) => p.name === 'studentId');
        if (studentId) studentId.description = 'Bắt buộc với STUDENT: StudentID của chính tài khoản đang đăng nhập; không phải UserID.';
      }
    }
  }
  spec.info.description += ' Sinh viên dùng REST: GET đọc dữ liệu, POST tạo/gửi hồ sơ hoặc xem trước nghiệp vụ, PATCH cập nhật. Body nghiệp vụ dùng JSON; upload CV dùng multipart/form-data.';
  spec.paths['/api/auth/login'].post.responses['415'] = {description: 'Body đăng nhập phải là application/json.'};
  return spec;
}
