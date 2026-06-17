import type { VaultStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: VaultStatus;
}

function getColors(status: VaultStatus) {
  switch (status) {
    case 'Available':
      return { bg: 'bg-[rgba(137,170,116,0.15)]', text: 'text-[#5a8a3c]', dot: 'bg-[#5a8a3c]' };
    case 'Pending':
      return { bg: 'bg-[rgba(205,99,50,0.1)]', text: 'text-[#cd6332]', dot: 'bg-[#cd6332]' };
    case 'Verified':
      return { bg: 'bg-[rgba(147,51,234,0.1)]', text: 'text-[#7c3aed]', dot: 'bg-[#7c3aed]' };
    case 'Signature Collected':
      return { bg: 'bg-[rgba(202,138,4,0.12)]', text: 'text-[#ca8a04]', dot: 'bg-[#ca8a04]' };
    case 'Redeemed':
      return { bg: 'bg-[rgba(37,99,235,0.1)]', text: 'text-[#2563eb]', dot: 'bg-[#2563eb]' };
    case 'Expired':
      return { bg: 'bg-[rgba(56,112,133,0.08)]', text: 'text-[rgba(56,112,133,0.7)]', dot: 'bg-[rgba(56,112,133,0.4)]' };
    case 'Liquidated':
      return { bg: 'bg-[rgba(200,50,50,0.1)]', text: 'text-[#c83232]', dot: 'bg-[#c83232]' };
    default:
      return { bg: 'bg-[rgba(56,112,133,0.08)]', text: 'text-[#387085]', dot: 'bg-[#387085]' };
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = getColors(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-none px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}
