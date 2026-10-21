const fs=require('node:fs');
const path=require('node:path');
const {jsonInputOperations}=require('../dist/config/swagger');
const lists=jsonInputOperations.filter(op=>op.path.endsWith('/list'));
const sample=(name,s)=>s.example??s.default??s.enum?.[0]??(s.type==='integer'||s.type==='number'?1:s.type==='boolean'?false:s.format==='date-time'?'2026-12-01T00:00:00+07:00':s.format==='date'?'2026-12-01':name==='search'?'demo':'...');
const escape=s=>String(s??'').replaceAll('|','/').replaceAll('\n',' ');
const lines=['# Rà soát đầu vào JSON của API danh sách','','Được xuất từ hợp đồng Swagger hiện hành. Tổng '+lists.length+' API danh sách.','','FE truyền ID/bộ lọc trong JSON body; không truyền query string. Các ID trong ví dụ chỉ minh họa, cần thay bằng ID có thật trong DB. JWT vẫn bắt buộc và dùng để xác thực, kiểm tra quyền. Không tự điền companyId/studentId còn thiếu.','','ID quan hệ không cần nhập lặp nếu đã truy ra được từ bản ghi được chọn. Các trường lọc tùy chọn có thể bỏ để xem toàn bộ phạm vi được phép. Phân trang page/limit không yêu cầu đọc toàn bộ DB trong một response.','','| API | Trường bắt buộc | Điều kiện vai trò | Các trường JSON |','|---|---|---|---|'];
for(const op of lists){
 const rules=op.scopeRules.map(r=>r.field+': '+(r.requiredForAll?'mọi vai trò':r.roles.join('/'))).join('; ');
 lines.push('| '+op.method.toUpperCase()+' '+op.path+' | '+(op.bodySchema.required.join(', ')||'Không có ID bắt buộc chung')+' | '+rules+' | '+Object.keys(op.bodySchema.properties).join(', ')+' |');
}
for(const op of lists){
 const schema=op.bodySchema;
 lines.push('','## '+op.method.toUpperCase()+' '+op.path,'',op.operation.summary??'','', '| Trường | Kiểu | Bắt buộc | Mục đích |','|---|---|---|---|');
 for(const [name,property] of Object.entries(schema.properties)){
  const rule=op.scopeRules.find(r=>r.field===name);
  const required=schema.required.includes(name)?'Có':rule?'Khi vai trò '+rule.roles.join('/'):'Không';
  lines.push('| '+name+' | '+(property.type??'object')+(property.enum?' ('+property.enum.join(', ')+')':'')+' | '+required+' | '+escape(property.description)+' |');
 }
 const example=Object.fromEntries(Object.entries(schema.properties).map(([name,s])=>[name,sample(name,s)]));
 lines.push('','Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):','','~~~json',JSON.stringify(example,null,2),'~~~');
 const response=op.operation.responses?.['200']?.content?.['application/json']?.schema;
 const item=response?.properties?.data?.properties?.items?.items??response?.properties?.items?.items??response?.properties?.data?.items;
 lines.push('','Trường response item: '+(Object.keys(item?.properties??{}).join(', ')||'Xem schema response trong Swagger')+'.');
}
fs.writeFileSync(path.join(__dirname,'../docs/api-list-input-audit.md'),lines.join('\n')+'\n');
console.log('List audit generated: '+lists.length+' list APIs.');
