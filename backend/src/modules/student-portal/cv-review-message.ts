// Gemini receives section counts only, never PDF content or personal information.
export async function cvReviewMessage(profile:Record<string,unknown>, request:typeof fetch=fetch):Promise<string> {
 const fallback='Mình đã đọc xong CV. Bạn hãy kiểm tra từng nhóm thông tin, chỉnh lại những mục chưa đúng rồi xác nhận hồ sơ nhé.';
 const key=process.env.GEMINI_API_KEY?.trim(),model=process.env.GEMINI_MODEL?.trim();
 if(process.env.OJT_GEMINI_ENABLED!=='true'||!key||!model||!/^gemini-[a-zA-Z0-9._-]+$/.test(model))return fallback;
 try {
  const counts=Object.fromEntries(['skills','languages','projects','experience','education'].map(k=>[k,Array.isArray(profile[k])?(profile[k] as unknown[]).length:0]));
  const response=await request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({systemInstruction:{parts:[{text:'Write a friendly Vietnamese instruction for a student reviewing extracted CV fields. Two short sentences, plain text, no markdown. Ask them to check skills separately from human languages, edit mistakes and confirm. Do not evaluate ability, invent facts, mention scores or repeat counts.'}]},contents:[{role:'user',parts:[{text:JSON.stringify(counts)}]}],generationConfig:{temperature:0.3,maxOutputTokens:256}}),
  });
  if(!response.ok){await response.body?.cancel();return fallback;}
  const reader=response.body?.getReader();if(!reader)return fallback;
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16384){await reader.cancel();return fallback;}chunks.push(part.value);}
  const candidate=JSON.parse(Buffer.concat(chunks).toString('utf8')).candidates?.[0];
  const message=candidate?.content?.parts?.filter((p:{thought?:boolean})=>!p.thought).map((p:{text?:string})=>p.text??'').join('').trim();
  return candidate?.finishReason==='STOP'&&typeof message==='string'&&message.length>0&&message.length<=600?message:fallback;
 }catch{return fallback;}
}
