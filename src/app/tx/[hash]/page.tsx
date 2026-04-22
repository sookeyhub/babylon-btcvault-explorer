import { notFound } from 'next/navigation';
import { getTransactionByHash } from '@/lib/data';
import { truncateAddress, formatRelativeTime } from '@/lib/utils';
import CopyButton from './CopyButton';
import TransactionTabs from './TransactionTabs';

export const revalidate = 60;

interface Props {
  params: Promise<{ hash: string }>;
}

export default async function TransactionDetailPage({ params }: Props) {
  const { hash } = await params;
  const tx = await getTransactionByHash(hash);

  if (!tx) {
    notFound();
  }

  const timestamp = new Date(tx.timestamp);
  const formattedTimestamp = `${timestamp.getUTCFullYear()}/${String(timestamp.getUTCMonth() + 1).padStart(2, '0')}/${String(timestamp.getUTCDate()).padStart(2, '0')} ${String(timestamp.getUTCHours()).padStart(2, '0')}:${String(timestamp.getUTCMinutes()).padStart(2, '0')}:${String(timestamp.getUTCSeconds()).padStart(2, '0')} + UTC`;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-[rgba(56,112,133,0.5)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span>Transaction</span>
        </div>
        <div className="flex items-center gap-2">
          {tx.status === 'SUCCESS' ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5a8a3c]">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c83232]">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <span className="font-mono text-lg font-semibold text-[#14140f]">
            {truncateAddress(tx.hash, 6, 4)}
          </span>
          <CopyButton text={tx.hash} />
        </div>
        <p className="text-xs text-[rgba(56,112,133,0.5)]">
          {formatRelativeTime(tx.timestamp)} ({formattedTimestamp})
        </p>
      </div>

      <TransactionTabs tx={tx} />
    </div>
  );
}
