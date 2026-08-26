'use client';

import Link from 'next/link';

interface ProofProfileErrorProps {
  reset: () => void;
}

export default function ProofProfileError({ reset }: ProofProfileErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center shadow-2xl shadow-black/20 sm:px-10">
        <p className="text-sm font-semibold text-sky-300">Proof Profile</p>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          프로필을 불러오지 못했습니다
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">잠시 후 다시 시도해주세요.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-400 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
          >
            자갈치 홈으로
          </Link>
        </div>
      </section>
    </main>
  );
}
