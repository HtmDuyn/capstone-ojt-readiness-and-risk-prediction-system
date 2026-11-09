import { inputObject, invalid, requiredText } from './student.validation';

export function validateCertificateLinks(value:unknown):{name:string;url:string}[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>5)throw invalid('Chỉ thêm tối đa 5 chứng chỉ.');
 return value.map(item=>{
  const row=inputObject(item,['name','url']);
  const name=requiredText(row.name,'certificate name',200);
  const url=requiredText(row.url,'certificate url',2000);
  let parsed:URL;
  try{parsed=new URL(url);}catch{throw invalid('Đường dẫn chứng chỉ không hợp lệ.');}
  if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)
   throw invalid('Đường dẫn chứng chỉ phải bắt đầu bằng https:// hoặc http:// và không chứa tài khoản/mật khẩu.');
  return {name,url};
 });
}
