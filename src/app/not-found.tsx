import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-6xl font-bold text-[rgba(56,112,133,0.15)]">404</p>
      <p className="text-sm text-[rgba(56,112,133,0.5)]">Page not found</p>
      <Link
        href="/"
        className="rounded-none border border-[#cd6332]/20 px-4 py-2 text-xs text-[#387085] transition-colors hover:bg-[rgba(56,112,133,0.05)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
