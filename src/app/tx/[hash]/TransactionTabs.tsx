'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/types';
import CopyButton from './CopyButton';
import MoreDetails from './MoreDetails';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#cd6332]/10 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-40 shrink-0 text-sm text-[rgba(56,112,133,0.6)]">
        {label}
      </span>
      <div className="text-sm text-[#14140f] break-all">
        {children}
      </div>
    </div>
  );
}

function LogEntry({ log, defaultOpen }: { log: Transaction['logs'][number]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-none border border-[#cd6332]/10 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-5 py-3 text-sm font-medium text-[#14140f] hover:bg-[rgba(56,112,133,0.02)]"
      >
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-[rgba(56,112,133,0.4)] transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        {log.logIndex}
      </button>

      {open && (
        <div className="space-y-0 border-t border-[#cd6332]/10 px-5 pb-4">
          <div className="flex flex-col gap-1 border-b border-[#cd6332]/10 py-3.5 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-28 shrink-0 text-sm text-[rgba(56,112,133,0.6)]">Address</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-[#387085]">{log.address}</span>
              <CopyButton text={log.address} />
            </div>
          </div>

          <div className="flex flex-col gap-1 border-b border-[#cd6332]/10 py-3.5 sm:flex-row sm:items-start sm:gap-4">
            <span className="w-28 shrink-0 text-sm text-[rgba(56,112,133,0.6)]">Name</span>
            <span className="break-all font-mono text-xs text-[#14140f]">{log.name}</span>
          </div>

          <div className="flex flex-col gap-1 border-b border-[#cd6332]/10 py-3.5 sm:flex-row sm:items-start sm:gap-4">
            <span className="w-28 shrink-0 text-sm text-[rgba(56,112,133,0.6)]">Topics</span>
            <div className="space-y-1.5">
              {log.topics.map((topic, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[rgba(56,112,133,0.08)] text-[10px] font-medium text-[rgba(56,112,133,0.5)]">
                    {i}
                  </span>
                  <span className="break-all font-mono text-xs text-[#14140f]">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-start sm:gap-4">
            <span className="w-28 shrink-0 text-sm text-[rgba(56,112,133,0.6)]">Data</span>
            <div className="w-full overflow-auto rounded border border-[#cd6332]/10 bg-[#faf9f5] p-3 font-mono text-[10px] leading-relaxed text-[rgba(56,112,133,0.6)]">
              {log.data}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionTabs({ tx }: { tx: Transaction }) {
  const [tab, setTab] = useState<'overview' | 'logs'>('overview');
  const [allExpanded, setAllExpanded] = useState(false);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#cd6332]/10">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2.5 text-sm ${tab === 'overview' ? 'border-b-2 border-[#cd6332] font-medium text-[#cd6332]' : 'text-[rgba(56,112,133,0.4)]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2.5 text-sm ${tab === 'logs' ? 'border-b-2 border-[#cd6332] font-medium text-[#cd6332]' : 'text-[rgba(56,112,133,0.4)]'}`}
        >
          Logs
        </button>
      </div>

      {tab === 'overview' ? (
        <>
          {/* Overview Card */}
          <div className="rounded-none border border-[#cd6332]/20 bg-white p-5 sm:p-6">
            <div className="space-y-0">
              <DetailRow label="Transaction Hash">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-[#387085]">{tx.hash}</span>
                  <CopyButton text={tx.hash} />
                </div>
              </DetailRow>

              <DetailRow label="Method">
                <span className="inline-block rounded bg-[#cd6332] px-2.5 py-1 font-mono text-[10px] font-medium text-white">
                  {tx.method}
                </span>
              </DetailRow>

              <DetailRow label="Block Height">
                <span className="text-[#387085]">{tx.blockNumber}</span>
              </DetailRow>

              <DetailRow label="From">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-[#387085]">{tx.from}</span>
                  <CopyButton text={tx.from} />
                </div>
              </DetailRow>

              <DetailRow label="To">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-[#387085]">{tx.to}</span>
                  <CopyButton text={tx.to} />
                </div>
              </DetailRow>

              <DetailRow label="Amount">
                <span>{tx.amount} <span className="text-[rgba(56,112,133,0.5)]">ETH</span></span>
              </DetailRow>

              <DetailRow label="Transaction Fee">
                <span>{tx.txFee.toFixed(10)} <span className="text-[rgba(56,112,133,0.5)]">ETH</span></span>
              </DetailRow>

              <DetailRow label="Gas Price">
                <span>{tx.gasPrice.toFixed(9)} <span className="text-[rgba(56,112,133,0.5)]">Gwei</span></span>
              </DetailRow>
            </div>
          </div>

          {/* More Details (collapsible) */}
          <MoreDetails tx={tx} />
        </>
      ) : (
        /* Logs Tab */
        <div className="space-y-3">
          {tx.logs.length > 0 && (
            <button
              onClick={() => setAllExpanded(!allExpanded)}
              className="flex items-center gap-1.5 text-sm text-[rgba(56,112,133,0.5)] hover:text-[#387085]"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${allExpanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          )}

          {tx.logs.length === 0 ? (
            <div className="rounded-none border border-[#cd6332]/20 bg-white p-8 text-center text-sm text-[rgba(56,112,133,0.4)]">
              No logs for this transaction.
            </div>
          ) : (
            tx.logs.map((log, i) => (
              <LogEntry key={i} log={log} defaultOpen={allExpanded} />
            ))
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
            <span className="rounded px-1.5 py-1 opacity-30">«</span>
            <span className="rounded px-1.5 py-1 opacity-30">‹</span>
            <span className="px-2 text-[#14140f]">
              Page <span className="font-semibold">1</span> of <span className="font-semibold">1</span>
            </span>
            <span className="rounded px-1.5 py-1 opacity-30">›</span>
            <span className="rounded px-1.5 py-1 opacity-30">»</span>
          </div>
        </div>
      )}
    </>
  );
}
