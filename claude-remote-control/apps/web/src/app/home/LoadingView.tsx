"use client";

export function LoadingView() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a10]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
        <p className="font-medium text-sm text-white/30">Loading...</p>
      </div>
    </main>
  );
}
