'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AUTH_MESSAGES } from '@/constants/messages';

import { useVerificationCode } from '../../../hooks/use-verification-code';
import { registerStep1Schema, type RegisterStep1Schema } from '../../../schemas/auth.schema';
import { AppleAuthButton } from '../../atoms/AppleAuthButton';
import { GitHubAuthButton } from '../../atoms/GitHubAuthButton';
import { GoogleAuthButton } from '../../atoms/GoogleAuthButton';
import { PasswordInput } from '../../molecules/PasswordInput';
import { VerificationCodeInput } from '../../molecules/VerificationCodeInput';

interface RegisterStep1FormProps {
  onSubmit: (data: RegisterStep1Schema) => void;
  onGoogleRegister: () => void;
  onGitHubRegister?: () => void;
  onAppleRegister?: () => void;
  isVerifying?: boolean;
  verificationError?: string | null;
  activeOAuthProvider?: 'google' | 'github' | 'apple' | null;
}

export function RegisterStep1Form({
  onSubmit,
  onGoogleRegister,
  onGitHubRegister,
  onAppleRegister,
  isVerifying = false,
  verificationError,
  activeOAuthProvider = null,
}: RegisterStep1FormProps) {
  const {
    isCodeSent,
    handleSendCode,
    isSendingCode,
    sendCodeError,
    isCooldownActive,
    cooldownSeconds,
  } = useVerificationCode();

  const form = useForm<RegisterStep1Schema>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: {
      email: '',
      password: '',
      verificationCode: '',
    },
  });

  const handleResend = () => {
    handleSendCode(form.getValues('email'), () => {
      form.setValue('verificationCode', '');
    });
  };

  const isResendDisabled = isCooldownActive || isSendingCode;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-7">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{AUTH_MESSAGES.EMAIL_LABEL}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={AUTH_MESSAGES.EMAIL_PLACEHOLDER}
                  disabled={isCodeSent}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{AUTH_MESSAGES.PASSWORD_LABEL}</FormLabel>
              <FormControl>
                <PasswordInput placeholder={AUTH_MESSAGES.PASSWORD_SET_PLACEHOLDER} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verificationCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className={!isCodeSent ? 'text-muted-foreground' : ''}>
                  {AUTH_MESSAGES.VERIFICATION_CODE_LABEL}
                </FormLabel>
                {isCodeSent && (
                  <button
                    type="button"
                    aria-label={AUTH_MESSAGES.VERIFICATION_CODE_RESEND_ARIA}
                    disabled={isResendDisabled}
                    className="text-foreground hover:text-muted-foreground focus-visible:ring-ring disabled:text-muted-foreground/50 cursor-pointer rounded-sm text-sm tracking-[0.07px] underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:no-underline"
                    onClick={handleResend}
                  >
                    {isCooldownActive
                      ? `${cooldownSeconds}${AUTH_MESSAGES.VERIFICATION_CODE_RESEND_COOLDOWN}`
                      : AUTH_MESSAGES.VERIFICATION_CODE_RESEND}
                  </button>
                )}
              </div>
              <FormControl>
                <VerificationCodeInput isCodeSent={isCodeSent} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3">
          {isCodeSent ? (
            <Button
              type="submit"
              className="w-full"
              loading={isVerifying}
              loadingLabel="인증번호 확인 중…"
            >
              {AUTH_MESSAGES.NEXT}
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full"
              loading={isSendingCode}
              loadingLabel={AUTH_MESSAGES.VERIFICATION_CODE_SENDING}
              onClick={() => handleSendCode(form.getValues('email'))}
            >
              {AUTH_MESSAGES.VERIFICATION_CODE_SEND}
            </Button>
          )}
          {verificationError || sendCodeError ? (
            <p role="alert" className="text-error text-sm">
              {verificationError ?? sendCodeError?.message}
            </p>
          ) : null}
          <Separator className="my-2" />
          <GoogleAuthButton
            variant="register"
            onClick={onGoogleRegister}
            disabled={activeOAuthProvider !== null}
            loading={activeOAuthProvider === 'google'}
          />
          <GitHubAuthButton
            variant="register"
            onClick={onGitHubRegister}
            disabled={activeOAuthProvider !== null}
            loading={activeOAuthProvider === 'github'}
          />
          <AppleAuthButton
            variant="register"
            onClick={onAppleRegister}
            disabled={activeOAuthProvider !== null}
            loading={activeOAuthProvider === 'apple'}
          />
        </div>
      </form>
    </Form>
  );
}
