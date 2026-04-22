'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/types';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#cd6332]/10 py-3.5 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-40 shrink-0 text-sm text-[rgba(56,112,133,0.6)]">
        {label}
      </span>
      <div className="text-sm text-[#14140f] break-all">
        {children}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded bg-[#cd6332] px-2.5 py-1 font-mono text-[10px] font-medium text-white">
      {children}
    </span>
  );
}

export default function MoreDetails({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(true);
  const gasUsedPct = ((tx.gasUsed / tx.gasLimit) * 100).toFixed(2);

  return (
    <div className="rounded-none border border-[#cd6332]/20 bg-white p-5 sm:p-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-[#14140f]"
      >
        <svg
          className={`h-4 w-4 text-[rgba(56,112,133,0.5)] transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
        More Details
      </button>

      {open && (
        <div className="mt-3 space-y-0">
          <DetailRow label="Gas Used (by Txn)">
            <span>
              {tx.gasUsed.toLocaleString()}{' '}
              <span className="text-[rgba(56,112,133,0.5)]">({gasUsedPct}%)</span>
            </span>
          </DetailRow>

          <DetailRow label="Gas Limit (by Txn)">
            {tx.gasLimit.toLocaleString()}
          </DetailRow>

          <DetailRow label="Gas Fees">
            <div className="flex flex-wrap gap-2">
              <Badge>Base: {tx.baseFee.toFixed(9)} Gwei</Badge>
              <Badge>Max: {tx.maxFeePerGas.toFixed(9)} Gwei</Badge>
              <Badge>Max Priority: {tx.maxPriorityFee.toFixed(3)} Gwei</Badge>
            </div>
          </DetailRow>

          <DetailRow label="Burnt Fees">
            {tx.burntFees} <span className="text-[rgba(56,112,133,0.5)]">ETH</span>
          </DetailRow>

          <DetailRow label="Other Attributes">
            <div className="flex flex-wrap gap-2">
              <Badge>Txn Type: {tx.txType}</Badge>
              <Badge>Nonce: {tx.nonce}</Badge>
              <Badge>Position in Block: {tx.positionInBlock}</Badge>
            </div>
          </DetailRow>

          <DetailRow label="Input Data">
            <div className="space-y-2">
              <div className="flex gap-1 text-[10px]">
                <span className="rounded border border-[#cd6332]/20 bg-[#faf9f5] px-2 py-0.5 text-[rgba(56,112,133,0.5)]">Default</span>
                <span className="rounded border border-[#cd6332]/20 bg-[#faf9f5] px-2 py-0.5 text-[rgba(56,112,133,0.5)]">UTF-8</span>
                <span className="rounded bg-[#cd6332] px-2 py-0.5 text-white">Original</span>
              </div>
              <div className="max-h-24 overflow-auto rounded border border-[#cd6332]/10 bg-[#faf9f5] p-3 font-mono text-[10px] leading-relaxed text-[rgba(56,112,133,0.6)]">
                {tx.inputData}
              </div>
            </div>
          </DetailRow>
        </div>
      )}
    </div>
  );
}
