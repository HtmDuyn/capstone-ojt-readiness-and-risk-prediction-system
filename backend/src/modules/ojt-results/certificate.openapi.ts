export function describeOjtCertificates(spec: Record<string, any>) {
  const id = {type:'integer',minimum:1};
  const certificate = {type:'object',properties:{
    id,assignmentId:id,fileName:{type:'string'},mimeType:{type:'string',enum:['application/pdf','image/jpeg','image/png']},
    size:{type:'integer',maximum:10485760},sha256:{type:'string'},uploadedAt:{type:'string',format:'date-time'},
    uploadedRole:{type:'string',enum:['ENTERPRISE','OJT_COORD','ADMIN']},enterpriseName:{type:'string'},semesterCode:{type:'string'},
  }};
  const response = (data: unknown) => ({description:'Thành công',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data}}}}});
  const base = {tags:['OJT certificates'],security:[{bearerAuth:[]}],responses:{401:{description:'Chưa đăng nhập'},403:{description:'Sai vai trò hoặc không có quyền với sinh viên'},404:{description:'Không tìm thấy'},409:{description:'Hồ sơ thực tập không hợp lệ'}}};
  const pathId = [{in:'path',name:'id',required:true,schema:id}];
  spec.paths['/api/internships/{id}/certificate'] = {
    get:{...base,summary:'DN/QHDN xem chứng chỉ của phân công thực tập',parameters:pathId,responses:{...base.responses,200:response({...certificate,nullable:true})}},
    put:{...base,summary:'DN/QHDN tải lên hoặc thay chứng chỉ hoàn thành OJT',description:'id là AssignmentID. DN chỉ thao tác với sinh viên thuộc DN. Mỗi phân công lưu một chứng chỉ hiện tại; tải lại cùng file không tạo bản mới. Sinh viên chỉ thấy sau khi QHDN công bố kết quả.',parameters:pathId,
      requestBody:{required:true,content:{'multipart/form-data':{schema:{type:'object',additionalProperties:false,required:['certificate'],properties:{certificate:{type:'string',format:'binary',description:'PDF, JPG hoặc PNG, tối đa 10 MB'}}}}}},
      responses:{...base.responses,200:response(certificate),400:{description:'File không hợp lệ'},413:{description:'Quá 10 MB'}}},
  };
  spec.paths['/api/students/me/ojt-certificates'] = {get:{...base,summary:'Sinh viên xem chứng chỉ của mình sau công bố',parameters:[{in:'query',name:'ojtSemesterId',required:true,schema:id}],responses:{...base.responses,200:response({type:'array',items:certificate})}}};
  spec.paths['/api/ojt-certificates/{id}/file'] = {get:{...base,summary:'Tải file chứng chỉ riêng tư',description:'Sinh viên chỉ tải chứng chỉ của mình khi kết quả đã công bố; DN chỉ tải chứng chỉ của sinh viên thuộc DN. QHDN và ADMIN được tải.',parameters:pathId,responses:{...base.responses,200:{description:'File đính kèm, Cache-Control: private, no-store',content:Object.fromEntries(['application/pdf','image/jpeg','image/png'].map(mime=>[mime,{schema:{type:'string',format:'binary'}}]))}}}};
  return spec;
}
