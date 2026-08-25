import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-dvh items-center justify-center px-4 py-20">
      <Link
        href="/"
        className="text-primary focus-visible:ring-ring absolute top-6 left-6 rounded-lg text-lg font-black tracking-[0.12em] outline-none focus-visible:ring-2 sm:top-8 sm:left-8"
        aria-label="Jagalchi 홈"
      >
        JAGALCHI
      </Link>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
