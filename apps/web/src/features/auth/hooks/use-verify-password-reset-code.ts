import { useMutation } from '@tanstack/react-query';

import { verifyPasswordResetCode } from '@/api/auth';
import type { VerifyCodeRequest, VerifyPasswordResetResponse } from '@/api/auth';

export function useVerifyPasswordResetCode() {
  return useMutation<VerifyPasswordResetResponse, Error, VerifyCodeRequest>({
    mutationFn: verifyPasswordResetCode,
  });
}
