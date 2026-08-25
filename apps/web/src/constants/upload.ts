export const ATTACHMENT_UPLOAD_ENDPOINT = '/uploads/attachments';

export const ATTACHMENT_UPLOAD_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ],
  accept:
    'image/jpeg,image/png,image/gif,image/webp,image/avif,application/pdf,text/plain,text/markdown',
} as const;
