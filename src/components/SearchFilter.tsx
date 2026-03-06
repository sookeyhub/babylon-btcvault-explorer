'use client';

import type { VaultStatus } from '@/lib/types';

const STATUS_OPTIONS: (VaultStatus | 'All')[] = ['All', 'Active', 'Closed', 'Pending', 'Liquidated'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'size_desc', label: 'Size ↓' },
  { value: 'size_asc', label: 'Size ↑' },
] as const;

interface SearchFilterProps {
  search: string;
  status: VaultStatus | 'All';
  sortBy: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: VaultStatus | 'All') => void;
  onSortChange: (value: string) => void;
}

export default function SearchFilter({
  search,
  status,
  sortBy,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(56,112,133,0.35)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID, address, dApp..."
          className="w-full rounded-none border border-[#cd6332]/20 bg-white py-2 pl-9 pr-3 text-xs text-[#387085] placeholder-[rgba(56,112,133,0.35)] outline-none transition-colors focus:border-[#387085]"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Status filter */}
        <div className="flex items-center gap-0.5 rounded-none border border-[#cd6332]/15 bg-[#faf9f5] p-0.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`rounded-none px-2.5 py-1 text-[11px] font-medium transition-colors ${
                status === s
                  ? 'bg-white text-[#cd6332] shadow-sm'
                  : 'text-[rgba(56,112,133,0.5)] hover:text-[#387085]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-none border border-[#cd6332]/20 bg-white px-2.5 py-1.5 text-xs text-[#387085] outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
