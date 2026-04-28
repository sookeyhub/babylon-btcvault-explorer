'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SubMenuItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  submenu?: SubMenuItem[];
}

const EXPLORER_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/txs', label: 'Transactions' },
  { href: '/vaults', label: 'Vaults' },
  {
    href: '/providers',
    label: 'Accounts',
    submenu: [
      { href: '/providers', label: 'Providers' },
      { href: '/depositors', label: 'Depositors' },
    ],
  },
  { href: '/analytics', label: 'Analytics' },
];

export default function Header() {
  const pathname = usePathname();
  const isLending = pathname.startsWith('/lending');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
      {/* Top bar — Logo + Search + Wallet */}
      <div className="border-b border-[#387085]/10">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/babylon-lockup-orange.svg" alt="Babylon" width={120} height={36} className="h-[22px] w-auto" />
            <span className="hidden text-sm font-semibold tracking-tight text-[#14140f] sm:inline">
              BTCVault Explorer
            </span>
          </Link>

          {/* Center search bar */}
          <div className="mx-6 hidden max-w-xl flex-1 lg:block">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#387085]/40"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search by BTC/ETH address, Vault ID, or Transaction Hash"
                className="w-full rounded-none border border-[#387085]/15 bg-[#faf9f5] py-2 pl-10 pr-4 text-sm text-[#387085] placeholder-[#387085]/35 outline-none transition-colors focus:border-[#cd6332]/50"
              />
            </div>
          </div>

          {/* Lending */}
          <Link
            href="/lending"
            className={`flex items-center gap-1.5 rounded-none px-5 py-2 text-sm font-semibold transition-all ${
              isLending
                ? 'bg-[#cd6332] text-white'
                : 'border border-[#cd6332]/30 bg-white text-[#cd6332] hover:border-[#cd6332] hover:bg-[rgba(205,99,50,0.04)]'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
            Lend &amp; Borrow
          </Link>
        </div>
      </div>

      {/* Bottom bar — Explorer Nav */}
      <div className="border-b border-[#387085]/8 bg-[#faf9f5]">
        <div className="mx-auto flex max-w-[1200px] items-center px-4 sm:px-6">
          <nav className="flex items-center">
            {EXPLORER_NAV.map((item) => {
              // Determine if this nav item (or any of its submenu) is active
              const isActive = item.submenu
                ? item.submenu.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/'))
                : item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              // Items with submenu get a wrapper div for hover
              if (item.submenu) {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(item.label)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <Link
                      href={item.href}
                      className={`relative flex items-center gap-1 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'text-[#cd6332]'
                          : 'text-[#387085]/70 hover:text-[#cd6332]'
                      }`}
                    >
                      {item.label}
                      {/* Chevron icon */}
                      <svg
                        className={`h-3 w-3 transition-transform duration-200 ${
                          openMenu === item.label ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                      {isActive && (
                        <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#cd6332]" />
                      )}
                    </Link>

                    {/* Dropdown */}
                    {openMenu === item.label && (
                      <div className="absolute top-full left-0 z-50 w-52 border border-[#387085]/10 bg-white py-1 shadow-sm">
                        {item.submenu.map((sub) => {
                          const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setOpenMenu(null)}
                            >
                              <div
                                className={`px-4 py-2.5 transition-colors ${
                                  isSubActive
                                    ? 'border-l-2 border-[#cd6332] bg-[#faf9f5]'
                                    : 'border-l-2 border-transparent hover:bg-[#faf9f5]'
                                }`}
                              >
                                <p
                                  className={`text-[13px] font-medium ${
                                    isSubActive ? 'text-[#cd6332]' : 'text-[#14140f]'
                                  }`}
                                >
                                  {sub.label}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular nav items (no submenu)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-[#cd6332]'
                      : 'text-[#387085]/70 hover:text-[#cd6332]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#cd6332]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
