const fs = require('node:fs');
const path = require('node:path');
const { swaggerSpec: spec } = require('../dist/config/swagger');
const methods = ['get', 'post', 'put', 'patch', 'delete'];
const escape = value => String(value ?? '').replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
function resolve(value) {
  if (!value?.$ref) return value;
  if (!value.$ref.startsWith('#/')) throw new Error('External schema reference is unsupported: ' + value.$ref);
  const found = value.$ref.slice(2).split('/').reduce((v, key) => v?.[key], spec);
  if (!found) throw new Error('Missing OpenAPI reference: ' + value.$ref);
  return found;
}
function constraints(schema) {
  return ['format','minimum','maximum','minLength','maxLength','minItems','maxItems','uniqueItems','pattern','nullable','default']
    .filter(key => schema[key] !== undefined)
    .map(key => key + '=' + JSON.stringify(schema[key])).join('; ');
}
function type(schema) {
  const s=resolve(schema) || {};
  return (s.type || (s.properties ? 'object' : 'schema')) + (s.items ? '<' + type(s.items) + '>' : '') +
    (s.enum ? ' ∈ ' + s.enum.map(v => JSON.stringify(v)).join(', ') : '');
}
function fieldRows(raw, prefix='', depth=0) {
  const s=resolve(raw);if (!s || depth>12) return [];
  const lines=[];
  for (const [name, value] of Object.entries(s.properties || {})) {
    const f=resolve(value), field=prefix + name;
    const conditional=(s.oneOf||[]).some(option=>option.required?.includes(name));
    const required=s.required?.includes(name) ? 'Có' : conditional ? 'Theo lựa chọn oneOf' : 'Không / theo điều kiện nghiệp vụ';
    lines.push('| ' + [field, type(f), required, constraints(f), f.description || ''].map(escape).join(' | ') + ' |');
    lines.push(...fieldRows(f,field+'.',depth+1));
    if(f.items)lines.push(...fieldRows(f.items,field+'[].',depth+1));
  }
  for(const kind of ['allOf','anyOf','oneOf'])for(const child of s[kind]||[]){
    const c=resolve(child);if(c.properties)lines.push(...fieldRows(c,prefix,depth+1));
  }
  return lines;
}
const doc=[
  '# Đầu vào API dành cho FE và test thủ công','',
  'Nguồn: OpenAPI hiện tại của backend. Tạo lại bằng `npm run docs:api` sau `npm run build`.','',
  'Tất cả nhóm dùng REST: GET đọc dữ liệu, ID trong path, bộ lọc/phân trang trong query; GET không có body. POST tạo/gửi hồ sơ hoặc xem trước nghiệp vụ, PUT/PATCH cập nhật. Body nghiệp vụ dùng application/json; upload CV dùng multipart/form-data. Sinh viên dùng các tài nguyên /students/:id, /students/me/* và các route dùng chung; các adapter /api/student/*/search, /detail, /create, /update đã gỡ. Token, quyền sở hữu và trạng thái nghiệp vụ vẫn bắt buộc.','',
  'Bạn tự insert dữ liệu mẫu: dùng đúng bảng/ID, FK, trạng thái, snapshot và fingerprint nguồn theo schema. Ví dụ confirm eligibility hoặc điểm OJT sẽ trả 409 nếu dữ liệu mẫu thiếu liên kết, snapshot hoặc không còn khớp nguồn. Không chỉ đổi một cột Status để giả lập hoàn tất nghiệp vụ.','',
  '- Swagger: `/api-docs`. Nhấn Try it out: GET nhập ID trong path và bộ lọc trong query; POST/PUT/PATCH sửa JSON request body khi cần. Upload dùng ô chọn file. GET không có body. Schema mô tả các trường và ràng buộc.','- OpenAPI JSON cho FE: `/api-docs/openapi.json`.','- `studentId` = StudentID; `programId` = ProgramID; `majorId` = SpecializationID; `courseId` = CourseID. Các loại ID không thay thế cho nhau.','- Mọi ID trong ví dụ là minh họa; thay bằng ID thực tế trong dữ liệu mẫu. Không tự gọi các API tạo dữ liệu từ ví dụ.','- Import commit nhận đủ JSON và tự kiểm tra, không bắt buộc chạy preview trước.','- Các thao tác mở/đóng/chốt/duyệt/xác nhận kiểm tra trạng thái đang lưu trong DB; không yêu cầu lịch sử gọi API của trình duyệt.','- Các ví dụ không tạo bản ghi mẫu, không thay đổi quy chế và không làm frontend tự gọi thêm API.',''
];
let operations=0,pathCount=0,queryCount=0,bodyCount=0;
for(const [url,item]of Object.entries(spec.paths).sort(([a],[b])=>a.localeCompare(b))){
  for(const method of methods){const op=item[method];if(!op)continue;operations++;
    doc.push('## '+method.toUpperCase()+' '+url,'',op.summary||'');
    if(op.description)doc.push('',op.description);
    doc.push('','Xác thực: '+(op.security?.length?'Bearer token; role/ownership theo chức năng.':'Không yêu cầu Bearer token trong OpenAPI.') ,'');
    const params=[...(item.parameters||[]),...(op.parameters||[])].map(resolve);
    const vars=[...url.matchAll(/\{([^}]+)\}/g)].map(m=>m[1]);
    for(const name of vars)if(!params.some(p=>p.in==='path'&&p.name===name&&p.required))throw Error('Missing path input: '+url+' '+name);
    if(params.length){doc.push('| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |','| --- | --- | --- | --- | --- | --- |');
      for(const p of params){if(p.in==='path')pathCount++;if(p.in==='query')queryCount++;
        doc.push('| '+[p.in,p.name,type(p.schema),p.required?'Có':'Không',constraints(resolve(p.schema)||{}),p.description||''].map(escape).join(' | ')+' |');}
      doc.push('');
    }else doc.push('Không có tham số URL/query.','');
    const body=resolve(op.requestBody);
    if(!body){doc.push('Không có request body.','');continue;}bodyCount++;
    for(const [media,content]of Object.entries(body.content||{})){
      const s=resolve(content.schema);if(!s)throw Error('Missing input schema: '+method+' '+url);
      doc.push('Body: '+media+(body.required?' — bắt buộc.':' — tùy chọn.'),'');
      if(s.description)doc.push(s.description,'');
      const fields=fieldRows(s);
      if(fields.length)doc.push('| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |','| --- | --- | --- | --- | --- |',...fields,'');
      else doc.push('Schema: '+type(s),'');
      const examples=content.examples?Object.entries(content.examples).map(([name,e])=>({name,value:e.value})):s.example?[{name:'Ví dụ',value:s.example}]:[];
      for(const e of examples)if(e.value!==undefined)doc.push(e.name+':','','```json',JSON.stringify(e.value,null,2),'```','');
    }
  }
}
doc.splice(3,0,'Phạm vi: '+operations+' operations; '+pathCount+' path parameters; '+queryCount+' query parameters; '+bodyCount+' request bodies.','');
fs.writeFileSync(path.resolve(__dirname,'../docs/api-input-reference.md'),doc.join('\n'));
console.log('Input reference generated: '+operations+' operations, '+bodyCount+' bodies.');

const inventory=Object.entries(spec.paths).flatMap(([url,item])=>methods.filter(method=>item[method]).map(method=>({url,method,operation:item[method]})));
const groupRows=spec.tags.map(tag=>'| '+escape(tag.name)+' | '+inventory.filter(row=>row.operation.tags?.includes(tag.name)).length+' |');
const grouped=['# Danh sách API theo nhóm Swagger','','Tạo từ OpenAPI hiện hành bằng `npm run docs:api` sau `npm run build`.','',
  'Tổng '+inventory.length+' API duy nhất. Nhóm hiển thị theo chức năng chính: API dùng chung với nhóm nghiệp vụ không lặp lại trong Admin. Quyền Admin vẫn giữ nguyên trong middleware/service và x-roles. Quyền nhập doanh nghiệp chỉ dành cho OJT_COORD; quyền nhập sinh viên dành cho ADMIN/ACADEMIC.','',
  '| Nhóm | Số API hiển thị |','|---|---:|',...groupRows,''];
for(const tag of spec.tags){
  grouped.push('## '+tag.name,'',tag.description,'','| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |','|---:|---|---|---|---|');
  let n=0;for(const {url,method,operation} of inventory.filter(row=>row.operation.tags?.includes(tag.name))){
    const source=operation['x-original-operation'];grouped.push('| '+[++n,method.toUpperCase(),'`'+url+'`',operation.summary,'`'+(source?source.method+' '+source.path:method.toUpperCase()+' '+url)+'`'].map(escape).join(' | ')+' |');
  }
  grouped.push('');
}
fs.writeFileSync(path.resolve(__dirname,'../docs/swagger-api-by-role.md'),grouped.join('\n'));
fs.writeFileSync(path.resolve(__dirname,'../docs/swagger-role-groups.md'),['# Nhóm API trên Swagger','','Swagger `/api-docs`; tài liệu máy đọc `/api-docs/openapi.json`.','',
  '| Nhóm | Số API hiển thị |','|---|---:|',...groupRows,'','Tổng '+inventory.length+' API duy nhất. Nhóm Admin chỉ hiển thị chức năng quản trị riêng; API nghiệp vụ đã có nhóm phụ trách không lặp lại trong Admin. Middleware/service và x-roles vẫn giữ nguyên quyền Admin. Tag không thay thế phân quyền và quyền sở hữu. Health công khai được đặt trong Admin.',
  '', '`src/config/swagger-role-groups.ts` kiểm tra thiếu/trùng/dư operation. Các API dùng route REST gốc; ID trên path, bộ lọc trên query. Xem `swagger-api-by-role.md` và `backend-workflow.md` để biết chức năng và luồng import/điểm chính thức.',''].join('\n'));

