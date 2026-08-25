import { describe, expect, it } from 'vitest';

import { ATTACHMENT_UPLOAD_CONSTRAINTS, validateAttachmentFile } from './upload';

describe('upload API helpers', () => {
  it('accepts supported attachment MIME types', () => {
    const file = new File(['hello'], 'lesson.pdf', { type: 'application/pdf' });

    expect(validateAttachmentFile(file)).toBeNull();
  });

  it('rejects empty files', () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' });

    expect(validateAttachmentFile(file)).toBe('EMPTY_FILE');
  });

  it('rejects unsupported MIME types', () => {
    const file = new File(['bad'], 'script.html', { type: 'text/html' });

    expect(validateAttachmentFile(file)).toBe('UNSUPPORTED_TYPE');
  });

  it('rejects files over the size limit', () => {
    const file = new File(
      [new Uint8Array(ATTACHMENT_UPLOAD_CONSTRAINTS.maxSizeBytes + 1)],
      'large.pdf',
      { type: 'application/pdf' },
    );

    expect(validateAttachmentFile(file)).toBe('FILE_TOO_LARGE');
  });
});
