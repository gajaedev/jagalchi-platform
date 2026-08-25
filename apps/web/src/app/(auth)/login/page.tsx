import Link from 'next/link';

import { AUTH_MESSAGES } from '@/constants/messages';
import { AuthCard, LoginForm } from '@/features/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
};

export default function LoginPage() {
  return (
    <AuthCard
      title={AUTH_MESSAGES.LOGIN_TITLE}
      description={AUTH_MESSAGES.LOGIN_DESCRIPTION}
      footer={
        <p className="w-full text-center text-sm">
          {AUTH_MESSAGES.LOGIN_NO_ACCOUNT}{' '}
          <Link
            href="/register"
            className="text-primary hover:text-primary-pressed focus-visible:ring-ring rounded-md font-bold underline underline-offset-4 transition-colors outline-none focus-visible:ring-2"
          >
            {AUTH_MESSAGES.LOGIN_REGISTER_LINK}
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
