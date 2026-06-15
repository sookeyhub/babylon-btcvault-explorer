import type { Vault, VaultListParams, PaginatedResult } from './types';

/** Mock token prices (USD) — replace with live API in production */
export const TOKEN_PRICES: Record<string, number> = {
  sBTC: 104_820,
  BTC: 104_820,
  WBTC: 62_794,
  vaultBTC: 62_794,
  USDC: 1,
  USDT: 1,
  ETH: 2_510,
};

/** Convert a token amount to USD string, e.g. "$104,820" */
export function toUsd(amount: number, symbol: string = 'sBTC'): string {
  const price = TOKEN_PRICES[symbol] ?? 0;
  const usd = amount * price;
  if (usd < 0.01 && usd > 0) return '$<0.01';
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: usd >= 100 ? 0 : 2 })}`;
}

/** Format sBTC amount with proper precision */
export function formatBTC(amount: number): string {
  return `${amount.toFixed(8)} sBTC`;
}

/** Format large numbers with commas */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/** Truncate hash/address for display */
export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

/**
 * Age format — relative time
 * just now → secs → mins → hrs+mins → days+hrs → months → years
 */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);

  const totalSecs = Math.floor(diff / 1000);
  if (totalSecs < 5) return 'just now';
  if (totalSecs < 60) return `${totalSecs} ${totalSecs === 1 ? 'sec' : 'secs'} ago`;

  const totalMins = Math.floor(totalSecs / 60);
  if (totalMins < 60) return `${totalMins} ${totalMins === 1 ? 'min' : 'mins'} ago`;

  const totalHours = Math.floor(totalMins / 60);
  if (totalHours < 24) {
    const remMins = totalMins % 60;
    if (remMins === 0) return `${totalHours} ${totalHours === 1 ? 'hr' : 'hrs'} ago`;
    return `${totalHours} ${totalHours === 1 ? 'hr' : 'hrs'} ${remMins} ${remMins === 1 ? 'min' : 'mins'} ago`;
  }

  const totalDays = Math.floor(totalHours / 24);
  if (totalDays < 30) {
    const remHours = totalHours % 24;
    if (remHours === 0) return `${totalDays} ${totalDays === 1 ? 'day' : 'days'} ago`;
    return `${totalDays} ${totalDays === 1 ? 'day' : 'days'} ${remHours} ${remHours === 1 ? 'hr' : 'hrs'} ago`;
  }

  const totalMonths = Math.floor(totalDays / 30);
  if (totalMonths < 12) return `${totalMonths} ${totalMonths === 1 ? 'month' : 'months'} ago`;

  const totalYears = Math.floor(totalDays / 365);
  return `${totalYears} ${totalYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * DateTime format — absolute time
 * "YYYY/MM/DD HH:MM:SS UTC"
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  );
}

/**
 * Time-only format for activity lists — "HH:MM UTC"
 */
export function formatTimeUTC(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * Date-only format — "YYYY/MM/DD"
 */
export function formatDateOnly(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
}

/**
 * Combined format for detail pages / card type
 * "{age} ({datetime})"
 * e.g. "2 hrs 15 mins ago (2026/06/09 04:09:36 UTC)"
 */
export function formatAgeDateTime(iso: string): string {
  return `${formatRelativeTime(iso)} (${formatDateTime(iso)})`;
}

/** @deprecated Use formatDateOnly instead */
export function formatDate(iso: string | null): string {
  return formatDateOnly(iso);
}

/** Filter, sort, and paginate vaults */
export function queryVaults(
  vaults: Vault[],
  params: VaultListParams,
): PaginatedResult<Vault> {
  let filtered = [...vaults];

  // Search
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.id.toLowerCase().includes(q) ||
        v.btcAddress.toLowerCase().includes(q) ||
        v.depositorAddress?.toLowerCase().includes(q) ||
        v.dappName.toLowerCase().includes(q) ||
        v.providerName.toLowerCase().includes(q),
    );
  }

  // Status filter
  if (params.status !== 'All') {
    filtered = filtered.filter((v) => v.status === params.status);
  }

  // Sort
  switch (params.sortBy) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'size_desc':
      filtered.sort((a, b) => b.vaultSize - a.vaultSize);
      break;
    case 'size_asc':
      filtered.sort((a, b) => a.vaultSize - b.vaultSize);
      break;
  }

  // Paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);

  return { data, total, page, pageSize: params.pageSize, totalPages };
}

/** Status color mapping */
export function getStatusColor(status: Vault['status']): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'Available':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'Pending':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'Verified':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' };
    case 'Signature Collected':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' };
    case 'Redeemed':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' };
    case 'Expired':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' };
    case 'Liquidated':
      return { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' };
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' };
  }
}
