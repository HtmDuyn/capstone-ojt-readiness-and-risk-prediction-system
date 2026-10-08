const fs = require('node:fs');
const path = require('node:path');
const { swaggerSpec: spec, jsonInputOperations } = require('../dist/config/swagger');
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
  'FE nhập ID, bộ lọc và dữ liệu trong JSON body. Các API trước đây dùng path/query có cách gọi mới tại `/api/json/...`; API đọc có đầu vào chuyển sang POST. Các API vốn chỉ nhận JSON và API không có đầu vào giữ đường dẫn hiện tại. API cũ vẫn hoạt động để tương thích. Không cần gọi GET trước khi đã biết ID và không cần chạy lại chuỗi API trong cùng phiên. Token hợp lệ, quan hệ dữ liệu, version và trạng thái nghiệp vụ vẫn bắt buộc.','',
  'Bạn tự insert dữ liệu mẫu: dùng đúng bảng/ID, FK, trạng thái, snapshot và fingerprint nguồn theo schema. Ví dụ confirm eligibility hoặc điểm OJT sẽ trả 409 nếu dữ liệu mẫu thiếu liên kết, snapshot hoặc không còn khớp nguồn. Không chỉ đổi một cột Status để giả lập hoàn tất nghiệp vụ.','',
  '- Swagger: `/api-docs`. Nhấn Try it out rồi nhập tất cả trường trong Request body / Edit Value. Không nhập path/query cho cách gọi JSON. Schema hiển thị các trường và ràng buộc.','- OpenAPI JSON cho FE: `/api-docs/openapi.json`.','- `studentId` = StudentID; `programId` = ProgramID; `majorId` = SpecializationID; `courseId` = CourseID. Các loại ID không thay thế cho nhau.','- Mọi ID trong ví dụ là minh họa; thay bằng ID thực tế trong dữ liệu mẫu. Không tự gọi các API tạo dữ liệu từ ví dụ.','- Import commit nhận đủ JSON và tự kiểm tra, không bắt buộc chạy preview trước.','- Các thao tác mở/đóng/chốt/duyệt/xác nhận kiểm tra trạng thái đang lưu trong DB; không yêu cầu lịch sử gọi API của trình duyệt.','- Các ví dụ không tạo bản ghi mẫu, không thay đổi quy chế và không làm frontend tự gọi thêm API.',''
];
doc.push('## Ánh xạ cách gọi cũ sang JSON','','| API cũ | API nhập JSON | ID và bộ lọc trong JSON |','| --- | --- | --- |');
for(const entry of jsonInputOperations)doc.push('| '+[entry.sourceMethod.toUpperCase()+' '+entry.sourcePath,entry.method.toUpperCase()+' '+entry.path,[...new Set(entry.inputs.map(i=>i.name+(i.required?' (bắt buộc)':'')))].join(', ')].map(escape).join(' | ')+' |');
doc.push('');
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

