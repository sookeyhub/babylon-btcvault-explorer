'use client';

import Link from 'next/link';
import CopyButton from '@/components/CopyButton';
import { truncateAddress } from '@/lib/utils';
import type { ProviderInfo } from '@/lib/types';

export default function ProviderDashboard({ provider }: { provider: ProviderInfo }) {
  const commissionPct = (provider.commission / 100).toFixed(2);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border border-[#387085]/10 bg-[#faf9f5] px-5 py-2.5 text-[12px] text-[#387085]/70">
      {/* Connected DApp */}
      <span className="text-[#387085]/40">Connected to</span>
      <Link
        href={`/accounts/${provider.appAddress}`}
        className="font-medium text-[#14140f] transition-colors hover:text-[#cd6332]"
      >
        {provider.appName}
      </Link>

      <span className="text-[#387085]/20">·</span>

      {/* Commission */}
      <span>
        <span className="font-semibold text-[#14140f]">{commissionPct}%</span>
        <span className="ml-1 text-[#387085]/40">commission</span>
      </span>

      <span className="text-[#387085]/20">·</span>

      {/* Operator Address */}
      <span className="flex items-center gap-1 text-[#387085]/40">
        Operator
        <span title={provider.address} className="ml-1 font-mono text-[11px] text-[#387085]/60 break-all">
          {provider.address}
        </span>
        <CopyButton text={provider.address} />
      </span>

      <span className="text-[#387085]/20">·</span>

      {/* DApp Address */}
      <span className="flex items-center gap-1 text-[#387085]/40">
        DApp
        <span title={provider.appAddress} className="ml-1 font-mono text-[11px] text-[#387085]/60 break-all">
          {provider.appAddress}
        </span>
        <CopyButton text={provider.appAddress} />
      </span>
    </div>
  );
}
