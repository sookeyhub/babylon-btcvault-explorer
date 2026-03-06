import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVaultById } from '@/lib/data';
import { formatBTC, formatDate, truncateAddress } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#cd6332]/10 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-44 shrink-0 text-[11px] font-medium uppercase tracking-wider text-[rgba(56,112,133,0.45)]">
        {label}
      </span>
      <span
        className={`text-sm text-[#14140f] break-all ${mono ? 'font-mono text-xs text-[#387085]' : ''}`}
      >
        {value || '—'}
      </span>
    </div>
  );
}

export default async function VaultDetailPage({ params }: Props) {
  const { id } = await params;
  const vault = await getVaultById(id);

  if (!vault) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[rgba(56,112,133,0.5)]">
        <Link href="/vaults" className="hover:text-[#387085]">
          Vaults
        </Link>
        <span>/</span>
        <span className="text-[#387085]">{vault.id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#14140f]">{vault.name}</h1>
          <StatusBadge status={vault.status} />
        </div>
        <p className="text-2xl font-bold tabular-nums text-[#cd6332]">
          {formatBTC(vault.vaultSize)}
        </p>
      </div>

      {/* Detail Card */}
      <div className="rounded-none border border-[#cd6332]/20 bg-white p-5 sm:p-6">
        <p className="mb-4 text-sm font-semibold text-[#14140f]">
          Vault Details
        </p>
        <div className="space-y-0">
          <DetailRow label="Vault ID" value={vault.id} />
          <DetailRow label="dApp" value={vault.dappName} />
          <DetailRow label="Provider" value={vault.providerName} />
          <DetailRow label="Provider Address" value={vault.providerAddress} mono />
          <DetailRow label="BTC Address" value={vault.btcAddress} mono />
          <DetailRow label="ETH Address" value={vault.ethAddress} mono />
          <DetailRow label="Created" value={formatDate(vault.createdAt)} />
          <DetailRow label="Closed" value={vault.closedAt ? formatDate(vault.closedAt) : '—'} />
        </div>
      </div>

      {/* Transaction Hashes */}
      <div className="rounded-none border border-[#cd6332]/20 bg-white p-5 sm:p-6">
        <p className="mb-4 text-sm font-semibold text-[#14140f]">
          Transactions
        </p>
        <div className="space-y-0">
          <DetailRow label="BTC Peg-in Tx" value={vault.btcPegInTxHash} mono />
          <DetailRow label="ETH Peg-in Tx" value={vault.ethPegInTxHash} mono />
        </div>
      </div>

      {/* Related Entities */}
      <div className="rounded-none border border-[#cd6332]/20 bg-white p-5 sm:p-6">
        <p className="mb-4 text-sm font-semibold text-[#14140f]">
          Related Entities
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-none border border-[#cd6332]/12 bg-[#faf9f5] p-4">
            <p className="text-[10px] font-medium uppercase text-[rgba(56,112,133,0.45)]">Operator</p>
            <p className="mt-1 text-sm font-medium text-[#14140f]">{vault.providerName}</p>
            <p className="mt-0.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
              {truncateAddress(vault.providerAddress)}
            </p>
          </div>
          <div className="rounded-none border border-[#cd6332]/12 bg-[#faf9f5] p-4">
            <p className="text-[10px] font-medium uppercase text-[rgba(56,112,133,0.45)]">dApp</p>
            <p className="mt-1 text-sm font-medium text-[#14140f]">{vault.dappName}</p>
            <p className="mt-0.5 text-[11px] text-[rgba(56,112,133,0.5)]">
              {vault.status === 'Active' ? 'Currently active' : `Status: ${vault.status}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
