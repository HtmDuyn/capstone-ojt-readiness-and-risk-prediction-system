import API from './apiService';
import type { Page, TaskSubmission } from '@/types/student/portal';
import { downloadFile } from '@/utils/shared/downloadFile';

export const taskAttachmentAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.txt';
export function validateTaskAttachment(file: File) {
  if (!/\.(pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|txt)$/i.test(file.name)) {
    throw new Error('Chọn file PDF, Word, Excel, PowerPoint, ZIP, PNG, JPG hoặc TXT.');
  }
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('File bài làm phải có dung lượng từ 1 byte đến 10 MB.');
}
export async function getEnterpriseTaskSubmissions(taskId: number, page: number, signal?: AbortSignal) {
  return (await API.get<{ success: boolean; data: Page<TaskSubmission> }>(`/internship-tasks/${taskId}/submissions`, {
    params: { page, limit: 20 }, signal,
  })).data.data;
}
export async function downloadTaskSubmissionAttachment(submission: TaskSubmission) {
  if (!submission.attachment) return;
  await downloadFile(async () => (await API.get<Blob>(`/task-submissions/${submission.id}/file`, {
    responseType: 'blob',
  })).data, submission.attachment.fileName);
}
