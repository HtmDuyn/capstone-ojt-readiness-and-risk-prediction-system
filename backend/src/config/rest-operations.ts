type Spec = Record<string, any>;

// Describe the actual routes: URL IDs, query filters, and JSON bodies for writes.
export function describeRestOperations(spec: Spec): Spec {
  const requiredQueries: Record<string, string[]> = {
    '/api/academic/alerts': ['ojtSemesterId', 'academicPeriodId', 'assessmentDeadline'],
    '/api/academic/course-demand': ['ojtSemesterId', 'academicPeriodId'],
    '/api/students/me/opportunities': ['ojtSemesterId'],
    '/api/recruitment/posts': ['companyId'],
    '/api/enterprise/candidates': ['companyId'],
    '/api/enterprise/internships': ['companyId'],
  };
  for (const [path, item] of Object.entries(spec.paths) as [string, Spec][]) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const operation = item[method];
      if (!operation) continue;
      if (method === 'get') {
        delete operation.requestBody;
        for (const name of requiredQueries[path] ?? []) {
          const parameter = [...(item.parameters ?? []), ...(operation.parameters ?? [])]
            .find(p => p.in === 'query' && p.name === name);
          if (!parameter) throw Error('Missing REST query parameter: ' + path + ' ' + name);
          parameter.required = true;
        }
      }
    }
  }
  const companyUpdate = spec.paths['/api/companies/{id}']?.patch;
  if (companyUpdate) {
    companyUpdate.parameters = [{name:'id',in:'path',required:true,
      description:'ID doanh nghiệp cần cập nhật; lấy từ danh sách doanh nghiệp.',
      schema:{type:'integer',minimum:1,maximum:2147483647}}];
    companyUpdate.requestBody.content['application/json'].examples = {
      qhdn:{summary:'Phòng QHDN',value:{name:'Doanh nghiệp công nghệ',reason:'Cập nhật tên doanh nghiệp'}},
      admin:{summary:'Admin',value:{name:'Doanh nghiệp công nghệ'}},
    };
  }
  spec.info.description = 'API quản lý học vụ, đăng ký và kết quả OJT. GET lấy dữ liệu; ID trong path, bộ lọc và phân trang trong query parameters. POST tạo mới hoặc thực hiện nghiệp vụ; PUT/PATCH cập nhật; DELETE xóa theo quyền và quy tắc nghiệp vụ. Không gửi request body cho GET.';
  return spec;
}
