import Link from 'next/link';

export default function ProofProfileNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center shadow-2xl shadow-black/20 sm:px-10">
        <p className="text-sm font-semibold text-sky-300">Proof Profile</p>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          공개 프로필을 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          사용할 수 없거나 공개되지 않은 프로필입니다.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-400 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
        >
          자갈치 홈으로
        </Link>
      </section>
    </main>
  );
}
