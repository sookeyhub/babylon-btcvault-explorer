'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_PROVIDERS } from '@/lib/mock-data';
import { truncateAddress } from '@/lib/utils';
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

export default function ProvidersPage() {
  const [page, setPage] = useState(1);
  const providers = MOCK_PROVIDERS;
  const total = providers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = providers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
        <Link href="/" className="transition-colors hover:text-[#cd6332]">Home</Link>
        <span>/</span>
        <span className="font-medium text-[#14140f]">Providers</span>
      </nav>

      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-[#14140f]">Providers</h1>
        <p className="mt-1 text-sm text-[rgba(56,112,133,0.55)]">
          Vault infrastructure operators indexed from btcv_provider_events
        </p>
      </div>

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
        <DevNote title="Providers 기획 의도">
          <DevNoteSection heading="페이지 목적">
            <p>Vault를 운영하며 BTC 커스터디와 ZKP 서명을 담당하는 운영자 목록을 조회.</p>
            <p>누가 얼마의 자산을 관리하고 어떤 DApp과 연결되어 있는지 파악.</p>
          </DevNoteSection>

          <DevNoteSection heading="표시 대상">
            <p>프로토콜에 등록된 Provider만 포함.</p>
            <p>아직 vault를 배정받지 않은 신규 Provider도 포함.</p>
          </DevNoteSection>

          <DevNoteSection heading="컬럼 구성">
            <p>순위, 이름, 주소, 연결 DApp, 수수료율, 관리 Vault 수, Total BTC.</p>
            <p>수수료율은 사용자가 바로 이해할 수 있도록 % 단위로 변환해 표시.</p>
          </DevNoteSection>

          <DevNoteSection heading="정렬 / 이동">
            <p>Total BTC 내림차순으로 관리 규모가 큰 Provider를 상단 배치.</p>
            <p>이름 또는 주소 클릭 시 통합 Account 상세로 이동.</p>
          </DevNoteSection>
        </DevNote>
        <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
          <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium w-12">#</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Commission</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Managed Vaults</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Total BTC</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((p, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              return (
                <tr key={p.address} className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">{rank}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[#14140f]">{p.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link href={`/accounts/${p.address}`} className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]">
                        {truncateAddress(p.address, 6, 4)}
                      </Link>
                      <CopyIcon text={p.address} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link href={`/accounts/${p.appAddress}`} className="text-[#387085] hover:text-[#cd6332]">
                      {p.appName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {(p.commission / 100).toFixed(1)}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {p.vaultCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {p.totalBtc.toFixed(4)} <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
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
