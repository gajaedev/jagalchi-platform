import { apiClient } from './client';

interface UploadApproval {
  id: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
}

interface CompletedUpload {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  status: 'READY';
  publicUrl: string | null;
}

export async function uploadProfileImage(file: File): Promise<string> {
  const approval = await apiClient.post<UploadApproval>('/uploads', {
    purpose: 'PROFILE_IMAGE',
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  const uploaded = await fetch(approval.uploadUrl, {
    method: approval.method,
    headers: approval.headers,
    body: file,
  });
  if (!uploaded.ok) throw new Error('프로필 이미지를 업로드하지 못했습니다.');
  const completed = await apiClient.post<CompletedUpload>(`/uploads/${approval.id}/complete`);
  if (!completed.publicUrl) throw new Error('프로필 이미지 주소를 만들지 못했습니다.');
  return completed.publicUrl;
}
