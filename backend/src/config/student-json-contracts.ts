type Spec = Record<string, any>;
const methods = ['get', 'post', 'put', 'patch', 'delete'];

function resolve(spec: Spec, schema: Spec): Spec {
  if (!schema.$ref) return structuredClone(schema);
  return structuredClone(schema.$ref.slice(2).split('/').reduce((v: Spec, key: string) => v[key], spec));
}

// One JSON input for every student operation, including IDs formerly in URLs.
// This metadata also drives the backend adapter, keeping Swagger executable.
export function describeStudentJsonOperations(spec: Spec): Spec {
  const additions: Spec = {};
  for (const [path, item] of Object.entries(spec.paths) as [string, Spec][]) {
    for (const method of methods) {
      const source = item[method];
      if (!source?.['x-roles']?.includes('STUDENT')) continue;
      if (source.requestBody?.content?.['multipart/form-data']) continue;
      const parameters = [...(item.parameters ?? []), ...(source.parameters ?? [])];
      const body = resolve(spec, source.requestBody?.content?.['application/json']?.schema ?? { type: 'object', properties: {} });
      const properties: Spec = { ...(body.properties ?? {}) };
      const required = new Set<string>(body.required ?? []);
      const bindings: Spec[] = [];
      const explicitStudent = [
        '/api/students/me/academic-summary', '/api/students/me/supplementary-course-options',
        '/api/students/me/curriculum', '/api/students/me/roadmap-recommendations',
        '/api/students/me/assignments/current', '/api/students/me/dashboard',
        '/api/students/me/opportunities', '/api/ojt-registration-windows', '/api/combo-registration-windows',
      ].includes(path);
      for (const parameter of parameters) {
        if (!['path', 'query'].includes(parameter.in)) throw Error('Unsupported student parameter: ' + parameter.in);
        let name = parameter.name;
        if (parameter.in === 'path' && name === 'id') {
          name = path.includes('/combo-registration-windows/') ? 'windowId'
            : path.includes('/notifications/') ? 'notificationId'
            : path.includes('/ojt-results/') ? 'resultId'
            : path.includes('/ojt-semesters/') ? 'ojtSemesterId' : 'studentId';
        }
        if (properties[name]) throw Error('Student JSON field collision: ' + path + ' ' + name);
        const schema = resolve(spec, parameter.schema ?? {});
        if (parameter.name === 'unread') { schema.type = 'boolean'; delete schema.enum; }
        properties[name] = { ...schema, ...(parameter.description ? { description: parameter.description } : {}) };
        // Original generated descriptions sometimes misidentify every path ID as a student.
        if (parameter.in === 'path') properties[name].description = name + ' của tài nguyên cần truy cập.';
        if (parameter.required) required.add(name);
        bindings.push({ name, source: parameter.in, originalName: parameter.name, schema });
      }
      if (explicitStudent) {
        const schema = { type: 'integer', minimum: 1, maximum: 2147483647 };
        properties.studentId = { ...schema, description: 'StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực.' };
        required.add('studentId');
        bindings.push({ name: 'studentId', source: 'student', originalName: 'studentId', schema });
      }
      let resource = path.replace(/^\/api\/(students\/me|students\/\{id\})/, '/api/student')
        .replace(/^\/api\/(?!student(?:\/|$))/, '/api/student/').replace(/\/\{[^}]+\}/g, '');
      if (resource === '/api/student') resource += '/profile';
      const action = method === 'get' ? (path.endsWith('/cv') ? 'download' : /\{[^}]+\}$/.test(path) ? 'detail' : 'search')
        : method === 'post' ? (/\/(preview|selections|change-password)$/.test(path) ? '' : 'create')
        : method === 'delete' ? 'delete' : 'update';
      const target = resource + (action ? '/' + action : '');
      const targetMethod = method === 'get' ? 'post' : method;
      if (additions[target]?.[targetMethod] || spec.paths[target]?.[targetMethod]) throw Error('Duplicate student JSON operation: ' + target);
      const operation = structuredClone(source);
      operation.parameters = [];
      operation.tags = ['Sinh viên'];
      operation['x-roles'] = ['STUDENT'];
      operation['x-student-handler'] = method.toUpperCase() + ' ' + path;
      operation['x-student-json'] = { bindings, bodyFields: Object.keys(body.properties ?? {}) };
      delete operation.operationId;
      operation.description = ('Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. ' + (source.description ?? '')).trim();
      operation.requestBody = { required: true, content: { 'application/json': { schema: {
        ...body, type: 'object', additionalProperties: false, properties, required: [...required],
      } } } };
      operation.responses['415'] = { description: 'Content-Type phải là application/json.' };
      additions[target] ??= {};
      additions[target][targetMethod] = operation;
      // Staff keep the original contracts; Student sees only the JSON version.
      if (source['x-roles'].length === 1) delete item[method];
      else {
        source['x-roles'] = source['x-roles'].filter((role: string) => role !== 'STUDENT');
        source.tags = source.tags.filter((tag: string) => tag !== 'Sinh viên');
      }
    }
    if (!methods.some(method => item[method])) delete spec.paths[path];
  }
  Object.assign(spec.paths, additions);
  spec.info.description += ' Nhóm Sinh viên dùng JSON body cho cả ID và bộ lọc; API đọc tương ứng dùng POST. Upload CV dùng multipart/form-data.';
  return spec;
}
