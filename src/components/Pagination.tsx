'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between border-t border-[#cd6332]/10 px-5 py-3">
      <p className="text-xs text-[rgba(56,112,133,0.5)]">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-none px-2 py-1 text-xs text-[#387085] transition-colors hover:bg-[rgba(56,112,133,0.06)] disabled:opacity-30"
        >
          Prev
        </button>
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-[rgba(56,112,133,0.3)]">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] rounded-none px-2 py-1 text-xs transition-colors ${
                p === page
                  ? 'bg-[rgba(205,99,50,0.1)] font-medium text-[#cd6332]'
                  : 'text-[#387085] hover:bg-[rgba(56,112,133,0.06)]'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-none px-2 py-1 text-xs text-[#387085] transition-colors hover:bg-[rgba(56,112,133,0.06)] disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
