type Spec = Record<string, any>;

export function addEnterpriseOperations(spec: Spec) {
  const id = {type:'integer',minimum:1,maximum:2147483647};
  const parameters = (fields: Spec) => Object.entries(fields).map(([name,schema])=>({in:'query',name,schema}));
  const page = {page:{...id,default:1},limit:{...id,maximum:100,default:20},ojtSemesterId:id,positionId:id,search:{type:'string',maxLength:100}};
  const add = (method: string,path: string,summary: string,params: Spec[],body?: Spec) => {
    spec.paths[path] = {[method]:{
      tags:['Enterprise'],summary,
      description:'Chỉ dành cho ENTERPRISE. Doanh nghiệp được xác định từ JWT; không nhận companyId. candidateId là CoordinationID, internshipId là AssignmentID.',
      security:[{bearerAuth:[]}],parameters:params,
      ...(body ? {requestBody:structuredClone(body)} : {}),
      responses:{200:{description:'Thành công: {success:true,data:...}'},400:{description:'Dữ liệu không hợp lệ'},401:{description:'Cần đăng nhập'},403:{description:'Sai vai trò hoặc không thuộc doanh nghiệp'},404:{description:'Không tìm thấy hồ sơ'},409:{description:'Trạng thái không cho phép hoặc đánh giá đã bị khóa'}}
    }};
  };
  const candidateId = [{in:'path',name:'id',required:true,schema:id}];
  add('get','/api/enterprise/profile','Hồ sơ doanh nghiệp đang đăng nhập',[]);
  add('get','/api/enterprise/candidates','Sinh viên được giới thiệu, kèm vị trí và trạng thái tiếp nhận',parameters({...page,decision:{type:'string',enum:['PENDING','ACCEPTED','REJECTED']}}));
  add('get','/api/enterprise/candidates/{id}','Hồ sơ ứng viên, CV và thông tin vị trí',candidateId);
  add('patch','/api/enterprise/candidates/{id}/decision','Tiếp nhận hoặc từ chối ứng viên',candidateId,spec.paths['/api/ojt-coordinations/{id}/decision'].post.requestBody);
  add('get','/api/enterprise/internships','Sinh viên thực tập, kèm phân công, vị trí và đánh giá',parameters({...page,status:{type:'string',enum:['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED']}}));
  add('put','/api/enterprise/internships/{id}/evaluation','Gửi hoặc cập nhật đánh giá thực tập',candidateId,spec.paths['/api/assignments/{id}/internship-evaluation'].put.requestBody);
}
