import { invalid } from '../students/student.validation';

export function rerankConfig() {
  if (process.env.COHERE_RERANK_ENABLED !== 'true') throw invalid('Chức năng gợi ý bằng Cohere chưa được bật.', 503, 'RERANK_DISABLED');
  const apiKey = process.env.COHERE_API_KEY?.trim(), model = process.env.COHERE_RERANK_MODEL?.trim();
  if (!apiKey || !model || !/^rerank-[a-zA-Z0-9._-]+$/.test(model)) throw invalid('Cần cấu hình COHERE_API_KEY và COHERE_RERANK_MODEL.', 503, 'RERANK_NOT_CONFIGURED');
  return { apiKey, model };
}
export async function rerankJobs(query: string, documents: string[], config: ReturnType<typeof rerankConfig>) {
  if (!documents.length || documents.length > 1000 || Buffer.byteLength(query) > 16000 || documents.some(d => Buffer.byteLength(d) > 24000))
    throw invalid('Dữ liệu matching vượt giới hạn xử lý. Cần thu gọn hồ sơ hoặc phạm vi tuyển dụng.', 422, 'RERANK_INPUT_TOO_LARGE');
  try {
    const response = await fetch('https://api.cohere.com/v2/rerank', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'X-Client-Name': 'ojt-student-matching' },
      body: JSON.stringify({ model: config.model, query, documents, top_n: Math.min(5, documents.length), max_tokens_per_doc: 4096 }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      const code = [401,403,498].includes(response.status) ? 'RERANK_AUTH_FAILED' : response.status === 429 ? 'RERANK_RATE_LIMITED'
        : response.status === 404 ? 'RERANK_MODEL_NOT_FOUND' : [400,422].includes(response.status) ? 'RERANK_REQUEST_REJECTED' : 'RERANK_PROVIDER_UNAVAILABLE';
      throw invalid('Cohere chưa xử lý được yêu cầu. Vui lòng thử lại hoặc liên hệ quản trị viên.', 502, code);
    }
    const reader = response.body?.getReader();
    if (!reader) throw invalid('Cohere trả phản hồi rỗng.', 502, 'RERANK_INVALID_RESPONSE');
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > 256000) { await reader.cancel(); throw invalid('Phản hồi Cohere vượt giới hạn.', 502, 'RERANK_INVALID_RESPONSE'); }
      chunks.push(part.value);
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw invalid('Phản hồi Cohere không hợp lệ.', 502, 'RERANK_INVALID_RESPONSE'); }
    if (!Array.isArray(body.results) || body.results.length !== Math.min(5, documents.length)) throw invalid('Cohere trả danh sách không hợp lệ.', 502, 'RERANK_INVALID_RESPONSE');
    const seen = new Set<number>();
    return body.results.map((r: { index: number; relevance_score: number }) => {
      if (!Number.isInteger(r.index) || r.index < 0 || r.index >= documents.length || seen.has(r.index)
        || typeof r.relevance_score !== 'number' || !Number.isFinite(r.relevance_score) || r.relevance_score < 0 || r.relevance_score > 1)
        throw invalid('Cohere trả chỉ số hoặc điểm không hợp lệ.', 502, 'RERANK_INVALID_RESPONSE');
      seen.add(r.index); return { index: r.index, score: r.relevance_score };
    }).sort((a: {index:number;score:number}, b: {index:number;score:number}) => b.score-a.score || a.index-b.index) as {index:number;score:number}[];
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw invalid('Không kết nối được Cohere. Vui lòng thử lại.', 502, ['AbortError','TimeoutError'].includes(error?.name) ? 'RERANK_TIMEOUT' : 'RERANK_NETWORK_ERROR');
  }
}
