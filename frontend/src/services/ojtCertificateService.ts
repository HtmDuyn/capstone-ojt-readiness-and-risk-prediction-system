import API from './apiService';
import { API as studentAPI, studentGet, studentQuery } from './studentService';
import { downloadFile } from '@/utils/shared/downloadFile';

export interface OjtCertificate {
  id: number;
  assignmentId: number;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedRole: 'ENTERPRISE' | 'OJT_COORD' | 'ADMIN';
  enterpriseName?: string;
  semesterCode?: string;
}
export async function getOjtCertificate(assignmentId: number, signal?: AbortSignal) {
  return (await API.get<{success:boolean;data:OjtCertificate|null}>(`/internships/${assignmentId}/certificate`, { signal })).data.data;
}
export async function uploadOjtCertificate(assignmentId: number, file: File) {
  if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024)
    throw new Error('Chọn file PDF, JPG hoặc PNG có dung lượng tối đa 10 MB.');
  const body = new FormData();
  body.append('certificate',file);
  return (await API.put<{success:boolean;data:OjtCertificate}>(`/internships/${assignmentId}/certificate`, body, {
    headers: {'Content-Type': undefined}, timeout: 60_000,
  })).data.data;
}
export const getStudentOjtCertificates = (semesterId: number, signal?: AbortSignal) =>
  studentGet<OjtCertificate[]>('/students/me/ojt-certificates' + studentQuery({ojtSemesterId:semesterId}),signal);
export const getOjtCertificateFile = async (certificate: OjtCertificate, student = false, signal?: AbortSignal) =>
  (await (student ? studentAPI : API).get<Blob>(`/ojt-certificates/${certificate.id}/file`, {responseType:'blob',signal})).data;
export const downloadOjtCertificate = (certificate: OjtCertificate, student = false) =>
  downloadFile(() => getOjtCertificateFile(certificate,student),certificate.fileName);
