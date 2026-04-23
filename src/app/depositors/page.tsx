'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_DEPOSITORS } from '@/lib/mock-data';
import { truncateAddress, formatDate } from '@/lib/utils';
import DevNote, { DevNoteSection } from '@/components/DevNote';

const PAGE_SIZE = 25;

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

export default function DepositorsPage() {
  const [page, setPage] = useState(1);
  const depositors = MOCK_DEPOSITORS;
  const total = depositors.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = depositors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      {/* Title */}
      <h1 className="text-lg font-semibold text-[#14140f]">Depositors</h1>

      {/* Results count + Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(56,112,133,0.5)]">
          Showing all <span className="font-semibold text-[#14140f]">{total}</span> results
        </p>
        <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
          <button onClick={() => setPage(1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">«</button>
          <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">‹</button>
          <span className="px-2 text-[#14140f]">Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span></span>
          <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
          <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <DevNote title="Depositors 기획 의도">
          <DevNoteSection heading="페이지 목적">
            <p>BTCVault에 BTC를 예치한 개별 사용자 전체를 조회.</p>
            <p>어떤 주소가 얼마나 예치했고, 현재 얼마가 활성 상태인지 파악.</p>
          </DevNoteSection>

          <DevNoteSection heading="표시 대상">
            <p>실제로 Vault를 만든 주소만 포함.</p>
            <p>활동 이력이 없는 일반 지갑 주소는 제외.</p>
          </DevNoteSection>

          <DevNoteSection heading="컬럼 구성">
            <p>순위, 주소, 총 Vault 수, 활성 Vault 수, Total BTC, 첫 예치일.</p>
            <p>활성 수는 현재 사용 중인 예치 규모를 시각적으로 구분하기 위해 녹색으로 표시.</p>
            <p>첫 예치일은 온보딩 시점을 추적하는 용도.</p>
          </DevNoteSection>

          <DevNoteSection heading="정렬 / 이동">
            <p>Total BTC 내림차순으로 규모가 큰 예치자를 상단 배치.</p>
            <p>주소 클릭 시 통합 Account 상세로 이동.</p>
          </DevNoteSection>
        </DevNote>
        <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
          <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium w-12">#</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Total Vaults</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Active Vaults</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Total BTC</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">First Deposit</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((d, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              return (
                <tr key={d.address} className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">{rank}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link href={`/accounts/${d.address}`} className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]">
                        {truncateAddress(d.address, 6, 4)}
                      </Link>
                      <CopyIcon text={d.address} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">{d.totalVaults}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#5a8a3c]">{d.activeVaults}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {d.totalBtc.toFixed(4)} <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[rgba(56,112,133,0.5)]">
                    {formatDate(d.firstDeposit)}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
