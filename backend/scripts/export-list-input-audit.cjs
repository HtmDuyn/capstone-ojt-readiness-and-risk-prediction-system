const fs=require('node:fs');
const path=require('node:path');
const {swaggerSpec:spec}=require('../dist/config/swagger');
const escape=s=>String(s??'').replaceAll('|','/').replace(/\r?\n/g,' ');
const resolve=v=>v?.$ref?.startsWith('#/')?v.$ref.slice(2).split('/').reduce((x,k)=>x?.[k],spec):v;
const lists=Object.entries(spec.paths).filter(([url,item])=>{
 const root=resolve(item.get?.responses?.['200'])?.content?.['application/json']?.schema,data=resolve(root?.properties?.data);
 return item.get&&(root?.type==='array'||data?.type==='array'||data?.properties?.items||root?.properties?.items);
});
const lines=['# Đầu vào API GET danh sách','','GET dùng path/query parameters, không gửi request body. ID trong ví dụ phải thay bằng dữ liệu thật. JWT và quyền sở hữu vẫn được kiểm tra. Các route /api/json/ đã bị xóa.','','Tổng '+lists.length+' API danh sách.','','| API | Vị trí | Trường | Bắt buộc | Ý nghĩa |','|---|---|---|---|---|'];
for(const [url,item] of lists)for(const raw of [...(item.parameters??[]),...(item.get.parameters??[])]){
 const p=resolve(raw);lines.push('| '+['GET '+url,p.in,p.name,p.required?'Có':'Không',p.description??''].map(escape).join(' | ')+' |');
}
fs.writeFileSync(path.join(__dirname,'../docs/api-list-input-audit.md'),lines.join('\n')+'\n');
console.log('List audit generated: '+lists.length+' GET APIs.');
