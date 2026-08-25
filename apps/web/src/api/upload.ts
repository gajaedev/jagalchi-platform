import { ATTACHMENT_UPLOAD_CONSTRAINTS, ATTACHMENT_UPLOAD_ENDPOINT } from '@/constants/upload';

import { getAccessToken } from './client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
const CREDENTIALS = BASE_URL.startsWith('http') ? true : false;
const MOCK_CDN_ORIGIN = 'https://cdn.jagalchi.dev';
const MOCK_UPLOAD_DELAY_MS = 120;

export { ATTACHMENT_UPLOAD_CONSTRAINTS };

export type AttachmentUploadErrorCode =
  'EMPTY_FILE' | 'UNSUPPORTED_TYPE' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED' | 'ABORTED';

export interface AttachmentUploadResponse {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  thumbnailUrl?: string | null;
}

export interface UploadAttachmentOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export class AttachmentUploadError extends Error {
  code: AttachmentUploadErrorCode;
  status?: number;

  constructor(code: AttachmentUploadErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'AttachmentUploadError';
    this.code = code;
    this.status = status;
  }
}

export function validateAttachmentFile(file: File): AttachmentUploadErrorCode | null {
  if (file.size === 0) {
    return 'EMPTY_FILE';
  }

  if (file.size > ATTACHMENT_UPLOAD_CONSTRAINTS.maxSizeBytes) {
    return 'FILE_TOO_LARGE';
  }

  const allowedMimeTypes: readonly string[] = ATTACHMENT_UPLOAD_CONSTRAINTS.allowedMimeTypes;
  if (!allowedMimeTypes.includes(file.type)) {
    return 'UNSUPPORTED_TYPE';
  }

  return null;
}

async function getUploadCsrfToken(): Promise<string | null> {
  if (BASE_URL.startsWith('http')) return null;

  try {
    const response = await fetch('/api/csrf-token', { credentials: 'same-origin' });
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

function normalizeUploadResponse(payload: unknown, file: File): AttachmentUploadResponse {
  const data = payload as Partial<AttachmentUploadResponse> & {
    fileUrl?: string;
    thumbnail_url?: string | null;
  };
  const url = data.url ?? data.fileUrl;

  if (!url) {
    throw new AttachmentUploadError('UPLOAD_FAILED', 'Upload response is missing url');
  }

  return {
    url,
    filename: data.filename ?? file.name,
    contentType: data.contentType ?? file.type,
    size: data.size ?? file.size,
    thumbnailUrl: data.thumbnailUrl ?? data.thumbnail_url ?? null,
  };
}

function createMockUploadUrl(file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return `${MOCK_CDN_ORIGIN}/uploads/e2e/${Date.now()}-${safeName}`;
}

function isMockUploadEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_API_MOCKING === 'true' || process.env.NEXT_PUBLIC_E2E_MOCKING === 'true'
  );
}

async function uploadMockAttachment(
  file: File,
  options: UploadAttachmentOptions,
): Promise<AttachmentUploadResponse> {
  options.onProgress?.(20);

  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new AttachmentUploadError('ABORTED', 'Upload aborted'));
      return;
    }

    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(new AttachmentUploadError('ABORTED', 'Upload aborted'));
    };

    const timeoutId = window.setTimeout(() => {
      options.signal?.removeEventListener('abort', abortHandler);
      options.onProgress?.(100);
      resolve({
        url: createMockUploadUrl(file),
        filename: file.name,
        contentType: file.type,
        size: file.size,
        thumbnailUrl: file.type.startsWith('image/') ? createMockUploadUrl(file) : null,
      });
    }, MOCK_UPLOAD_DELAY_MS);

    options.signal?.addEventListener('abort', abortHandler, { once: true });
  });
}

export async function uploadAttachment(
  file: File,
  options: UploadAttachmentOptions = {},
): Promise<AttachmentUploadResponse> {
  const validationError = validateAttachmentFile(file);
  if (validationError) {
    throw new AttachmentUploadError(validationError, validationError);
  }

  if (isMockUploadEnabled()) {
    return uploadMockAttachment(file, options);
  }

  const csrfToken = await getUploadCsrfToken();
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new AttachmentUploadError('ABORTED', 'Upload aborted'));
      return;
    }

    const xhr = new XMLHttpRequest();
    const abortHandler = () => xhr.abort();

    const cleanup = () => {
      options.signal?.removeEventListener('abort', abortHandler);
    };

    xhr.open('POST', `${BASE_URL}${ATTACHMENT_UPLOAD_ENDPOINT}`);
    xhr.withCredentials = CREDENTIALS;

    const token = getAccessToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new AttachmentUploadError('UPLOAD_FAILED', xhr.statusText, xhr.status));
        return;
      }

      try {
        const payload = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        resolve(normalizeUploadResponse(payload, file));
      } catch (error) {
        reject(error);
      }
    };

    xhr.onerror = () => {
      cleanup();
      reject(new AttachmentUploadError('UPLOAD_FAILED', 'Upload failed', xhr.status));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new AttachmentUploadError('ABORTED', 'Upload aborted'));
    };

    options.signal?.addEventListener('abort', abortHandler, { once: true });
    xhr.send(formData);
  });
}
