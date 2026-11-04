export type AdviceSnapshot = {
  currentSemester: number | null;
  earnedCredits: number;
  missingCredits: number | null;
  failedCourseCount: number;
  currentEligibility: {status: string};
  earlyWarning: {available: boolean; message: string; recommendations: string[]};
};

// Gemini selects relevant actions; all displayed facts and wording stay under backend control.
const actions = {
  FOLLOW_PATHWAY: 'Tiếp tục hoàn thành các môn theo lộ trình để tích lũy tín chỉ.',
  PLAN_RETAKES: 'Lập kế hoạch học lại các môn chưa đạt và kiểm tra điều kiện tiên quyết.',
  CHECK_DEADLINE: 'Kiểm tra thời hạn xét OJT với phòng đào tạo và theo dõi điểm mới.',
  CONTACT_ADVISOR: 'Trao đổi với cố vấn học tập để xây dựng kế hoạch phù hợp.',
};
type Action = keyof typeof actions;
type Config = {apiKey?: string; model?: string; enabled?: string};
const failureMessages:Record<string,string>={
  AI_DISABLED:'Gemini đang tắt.',AI_NOT_CONFIGURED:'Thiếu key/model hoặc mã model không hợp lệ.',
  AI_TIMEOUT:'Gemini không hoàn tất phản hồi trong 45 giây.',
  AI_NETWORK_ERROR:'Không thể kết nối hoặc đọc phản hồi từ Gemini; kiểm tra mạng, DNS, TLS hoặc proxy.',
  AI_AUTH_FAILED:'Google từ chối xác thực hoặc quyền truy cập; kiểm tra key và quyền của dự án.',
  AI_RATE_LIMITED:'Google trả HTTP 429; kiểm tra quota, giới hạn tốc độ và billing của dự án.',
  AI_MODEL_NOT_FOUND:'Không tìm thấy model hoặc model không hỗ trợ API đang gọi.',
  AI_INVALID_REQUEST:'Google từ chối cấu trúc request; kiểm tra model, JSON Schema và cấu hình generation.',
  AI_PROVIDER_UNAVAILABLE:'Dịch vụ Gemini đang gặp lỗi phía Google.',
  AI_OUTPUT_TRUNCATED:'Gemini dừng do hết ngân sách token trước khi hoàn tất JSON.',
  AI_CONTENT_BLOCKED:'Gemini chặn hoặc không thể cung cấp nội dung theo chính sách.',
  INVALID_AI_RESPONSE:'Phản hồi Gemini không đúng JSON hoặc danh sách hành động được phép.',
  AI_PROVIDER_FAILED:'Gemini trả lỗi chưa được phân loại.',
};

export async function generateOjtAdvice(snapshot: AdviceSnapshot, config: Config, request: typeof fetch = fetch) {
  const startedAt=Date.now();
  let httpStatus:number|null=null;
  let phase='CONFIGURATION';
  const base = {
    academic: {currentSemester:snapshot.currentSemester,earnedCredits:snapshot.earnedCredits,
      missingCredits:snapshot.missingCredits,failedCourseCount:snapshot.failedCourseCount,
      currentEligibilityStatus:snapshot.currentEligibility.status},
    explanation:snapshot.earlyWarning.message,
    riskLevel:null,riskScore:null,isAiPrediction:false,
    aiError:null,
  };
  if (!snapshot.earlyWarning.available) return {...base,status:'NOT_AVAILABLE',source:'RULES',modelVersion:null,recommendations:[],fallbackReason:null};
  const fallback = (reason:string) => ({...base,status:'FALLBACK',source:'RULES',modelVersion:null,
    recommendations:snapshot.earlyWarning.recommendations,fallbackReason:reason,
    aiError:{code:reason,message:failureMessages[reason],httpStatus,phase,elapsedMs:Date.now()-startedAt,timeoutMs:45000}});
  if (config.enabled !== 'true') return fallback('AI_DISABLED');
  if (!config.apiKey?.trim() || !config.model?.trim()) return fallback('AI_NOT_CONFIGURED');
  if (!/^gemini-[a-zA-Z0-9._-]+$/.test(config.model)) return fallback('AI_NOT_CONFIGURED');
  const allowed:Action[] = ['FOLLOW_PATHWAY','CHECK_DEADLINE','CONTACT_ADVISOR'];
  if (snapshot.failedCourseCount > 0) allowed.push('PLAN_RETAKES');
  try {
    phase='REQUEST';
    const response=await request(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(45000),
      headers:{'Content-Type':'application/json','x-goog-api-key':config.apiKey},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:'Select and order useful academic actions from allowedActions. Return only action codes. Do not predict risk or change eligibility. Missing credits in early semesters alone does not imply high risk.'}]},
        contents:[{role:'user',parts:[{text:JSON.stringify({academic:base.academic,allowedActions:allowed})}]}],
        generationConfig:{temperature:0,maxOutputTokens:2048,responseMimeType:'application/json',
          ...(config.model.startsWith('gemini-3')?{thinkingConfig:{thinkingLevel:'low'}}:{}),
          responseJsonSchema:{type:'object',additionalProperties:false,required:['actions'],properties:{actions:{type:'array',minItems:1,maxItems:4,items:{type:'string',enum:allowed}}}}},
      }),
    });
    httpStatus=response.status;
    if (!response.ok) {
      // Do not expose Google's raw error body, which may contain project details.
      await response.body?.cancel();
      const reason=response.status===429?'AI_RATE_LIMITED'
        :[401,403].includes(response.status)?'AI_AUTH_FAILED'
        :response.status===404?'AI_MODEL_NOT_FOUND'
        :response.status===400?'AI_INVALID_REQUEST'
        :[408,504].includes(response.status)?'AI_TIMEOUT'
        :response.status>=500?'AI_PROVIDER_UNAVAILABLE':'AI_PROVIDER_FAILED';
      return fallback(reason);
    }
    phase='READ_RESPONSE';
    const reader=response.body?.getReader();
    if(!reader) return fallback('INVALID_AI_RESPONSE');
    const chunks:Uint8Array[]=[];let size=0;
    for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
      if(size>65536){await reader.cancel();return fallback('INVALID_AI_RESPONSE');}chunks.push(part.value);}
    phase='VALIDATE_RESPONSE';
    const envelope=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const candidate=envelope.candidates?.[0];
    if(envelope.promptFeedback?.blockReason || ['SAFETY','RECITATION','BLOCKLIST','PROHIBITED_CONTENT','SPII'].includes(candidate?.finishReason))return fallback('AI_CONTENT_BLOCKED');
    if(candidate?.finishReason==='MAX_TOKENS')return fallback('AI_OUTPUT_TRUNCATED');
    if(candidate?.finishReason!=='STOP')return fallback('INVALID_AI_RESPONSE');
    const text=candidate.content?.parts?.filter((p:{thought?:boolean})=>!p.thought).map((p:{text?:string})=>p.text??'').join('');
    const result=JSON.parse(text);
    if(!result||Object.keys(result).length!==1||!Array.isArray(result.actions)||result.actions.length<1||result.actions.length>4||
      new Set(result.actions).size!==result.actions.length||result.actions.some((a:unknown)=>!allowed.includes(a as Action)))return fallback('INVALID_AI_RESPONSE');
    return {...base,status:'READY',source:'GEMINI',modelVersion:config.model,
      recommendations:result.actions.map((a:Action)=>actions[a]),fallbackReason:null};
  } catch(error) {
    const name=error instanceof Error?error.name:'';
    if(['TimeoutError','AbortError'].includes(name))return fallback('AI_TIMEOUT');
    if(error instanceof SyntaxError || phase==='VALIDATE_RESPONSE')return fallback('INVALID_AI_RESPONSE');
    return fallback('AI_NETWORK_ERROR');
  }
}
