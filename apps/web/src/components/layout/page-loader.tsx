'use client';

export function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09101b] text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-ember" />
          <span className="text-sm text-white/75">{label}</span>
        </div>
      </div>
    </div>
  );
}
