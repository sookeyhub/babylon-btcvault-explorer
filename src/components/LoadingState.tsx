export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 w-24 rounded bg-[rgba(56,112,133,0.08)]" />
          <div className="h-4 w-16 rounded bg-[rgba(56,112,133,0.06)]" />
          <div className="h-4 flex-1 rounded bg-[rgba(56,112,133,0.05)]" />
          <div className="h-4 w-20 rounded bg-[rgba(56,112,133,0.06)]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-none border border-dashed border-[#cd6332]/20">
      <svg
        className="h-8 w-8 text-[rgba(56,112,133,0.2)]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
      <p className="text-sm text-[rgba(56,112,133,0.4)]">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong' }: { message?: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-none border border-red-200 bg-red-50/50">
      <svg
        className="h-8 w-8 text-red-300"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}
