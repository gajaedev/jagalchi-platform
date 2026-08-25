import { useMutation } from '@tanstack/react-query';

import { verifyCode } from '@/api/auth';
import type { VerifyCodeRequest, VerifyEmailResponse } from '@/api/auth';

export function useVerifyCode() {
  return useMutation<VerifyEmailResponse, Error, VerifyCodeRequest>({
    mutationFn: verifyCode,
  });
}
