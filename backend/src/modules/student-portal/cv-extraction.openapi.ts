import { cvProfileSchema } from './cv-profile.schema';
export function describeCvExtraction(spec:Record<string,any>) {
 const id={type:'integer',minimum:1},text={type:'string'};
 // Translate JSON Schema nullable unions into the OpenAPI 3.0 representation.
 const openapi=(v:any):any=>Array.isArray(v)?v.map(openapi):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).flatMap(([key,value])=>
  key==='type'&&Array.isArray(value)?[['type',value.find(t=>t!=='null')],['nullable',value.includes('null')]]:[[key,openapi(value)]])):v;
 const profile=openapi(cvProfileSchema);
 const analysis={type:'object',nullable:true,properties:{id,cvFileId:id,status:{type:'string',enum:['PROCESSING','NEEDS_REVIEW','CONFIRMED','FAILED']},revision:id,
  modelVersion:text,schemaVersion:text,profile:{...profile,nullable:true},extractedProfile:{...profile,nullable:true},
  confirmedAt:{type:'string',format:'date-time',nullable:true},error:{type:'object',nullable:true,additionalProperties:true},
  evidenceVerified:{type:'boolean',enum:[false]},confirmationRequired:{type:'boolean'},canRetry:{type:'boolean'}}};
 const response=(properties:any)=>({description:'Thành công; dữ liệu không có không được suy đoán.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties}}}}}});
 const base={tags:['Sinh viên'],'x-roles':['STUDENT'],security:[{bearerAuth:[]}],responses:{401:{description:'Chưa đăng nhập'},403:{description:'Không có quyền sinh viên'},409:{description:'File hoặc revision đã thay đổi'},503:{description:'Chưa bật/cấu hình Claude hoặc chưa chạy migration'}}};
 spec.paths['/api/students/me/cv/analyses']={post:{...base,
  summary:'Đọc CV PDF hiện tại bằng Claude và lưu kết quả chờ sinh viên kiểm tra',
  description:'Không upload lại file. cvFileId lấy từ POST /students/me/cv hoặc hồ sơ CV. consent=true đồng ý gửi file gốc đến Claude. Mỗi file/schema/model được tái sử dụng; không tự gọi lại khi đã có kết quả. Trả PROCESSING nếu có request đang chạy; FAILED có mã lỗi để thử lại. Request đọc Claude có timeout 60 giây. Không đọc JD hoặc matching.',
  requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:['cvFileId','consent'],properties:{cvFileId:id,consent:{type:'boolean',enum:[true]}}},example:{cvFileId:1,consent:true}}}},
  responses:{...base.responses,200:response({analysis,replayed:{type:'boolean'}}),400:{description:'Thiếu đồng ý hoặc request không hợp lệ'}}}};
 spec.paths['/api/students/me/matching-profile']={
  get:{...base,summary:'Xem kết quả đọc CV mới nhất và đối chiếu dữ liệu trường',description:'Chỉ hồ sơ của tài khoản đăng nhập. CV mới không kế thừa xác nhận của file cũ. usableForMatching=true chỉ khi phiên bản hiện tại đã được sinh viên xác nhận; chức năng matching chưa triển khai.',
   responses:{...base.responses,200:response({status:text,cv:{type:'object',nullable:true,additionalProperties:true},analysis,
    officialAcademic:{type:'object',additionalProperties:true},discrepancies:{type:'array',items:text},usableForMatching:{type:'boolean'},message:text})}},
  patch:{...base,summary:'Sửa hoặc xác nhận hồ sơ trích xuất từ CV',description:'Gửi toàn bộ profile từ GET cùng analysisId và revision. confirm=false lưu bản nháp; confirm=true sinh viên xác nhận nội dung. Nội dung AI gốc giữ trong extractedProfile. Phần sinh viên tự bổ sung có thể evidence=null. Không cập nhật GPA/ngành chính thức trong DB học vụ.',
   requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:['analysisId','revision','profile','confirm'],properties:{analysisId:id,revision:id,profile,confirm:{type:'boolean'}}}}}},
   responses:{...base.responses,200:response({analysis}),400:{description:'Hồ sơ sai cấu trúc'},404:{description:'Không có kết quả CV của bạn'}}},
 };
 return spec;
}
