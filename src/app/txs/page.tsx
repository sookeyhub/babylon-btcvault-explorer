'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Transaction, TxListParams, PaginatedResult } from '@/lib/types';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data';
import { truncateAddress, formatRelativeTime } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/LoadingState';

const PAGE_SIZE = 25;

function queryTransactions(
  txs: Transaction[],
  params: TxListParams,
): PaginatedResult<Transaction> {
  let filtered = [...txs];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.hash.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        String(t.blockNumber).includes(q),
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);

  return { data, total, page, pageSize: params.pageSize, totalPages };
}

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 inline-flex shrink-0 text-[rgba(56,112,133,0.3)] hover:text-[#387085]"
      title={copied ? 'Copied!' : 'Copy'}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        )}
      </svg>
    </button>
  );
}

export default function TransactionsPage() {
  const [params, setParams] = useState<TxListParams>({
    search: '',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [result, setResult] = useState<PaginatedResult<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTxs = useCallback(() => {
    setLoading(true);
    const res = queryTransactions(MOCK_TRANSACTIONS, params);
    setResult(res);
    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchTxs();
  }, [fetchTxs]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <h1 className="text-lg font-semibold text-[#14140f]">Transactions</h1>

      {/* Result count + Pagination top */}
      {result && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[rgba(56,112,133,0.5)]">
            Showing all <span className="font-semibold text-[#14140f]">{result.total}</span> results
          </p>
          <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
            <button
              onClick={() => setParams((p) => ({ ...p, page: 1 }))}
              disabled={result.page <= 1}
              className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
            >
              «
            </button>
            <button
              onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
              disabled={result.page <= 1}
              className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
            >
              ‹
            </button>
            <span className="px-2 text-[#14140f]">
              Page <span className="font-semibold">{result.page}</span> of <span className="font-semibold">{result.totalPages}</span>
            </span>
            <button
              onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
              disabled={result.page >= result.totalPages}
              className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
            >
              ›
            </button>
            <button
              onClick={() => setParams((p) => ({ ...p, page: result.totalPages }))}
              disabled={result.page >= result.totalPages}
              className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
            >
              »
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
        {loading ? (
          <div className="p-5">
            <LoadingSkeleton rows={10} />
          </div>
        ) : result ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Txn Hash</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Method</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Block</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Age</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">From</th>
                <th className="px-2 py-2.5 font-medium"></th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">To</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Txn Fee</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((tx) => (
                <tr
                  key={tx.hash}
                  className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                      >
                        {truncateAddress(tx.hash, 6, 4)}
                      </Link>
                      <CopyIcon text={tx.hash} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                      {tx.method}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="text-[#387085]">{tx.blockNumber}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                    {formatRelativeTime(tx.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <span className="font-mono text-[11px] text-[#387085]">
                        {truncateAddress(tx.from, 6, 4)}
                      </span>
                      <CopyIcon text={tx.from} />
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="text-[rgba(56,112,133,0.3)]">→</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <span className="font-mono text-[11px] text-[#387085]">
                        {truncateAddress(tx.to, 6, 4)}
                      </span>
                      <CopyIcon text={tx.to} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                    {tx.amount} ETH
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                    {tx.txFee.toFixed(10)} ETH
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
