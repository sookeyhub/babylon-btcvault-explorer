'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SubMenuItem {
  href: string;
  label: string;
  desc?: string;
}

interface NavItem {
  href: string;
  label: string;
  submenu?: SubMenuItem[];
}

const EXPLORER_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/providers', label: 'Providers' },
  { href: '/depositors', label: 'Depositors' },
  { href: '/vaults', label: 'Vaults' },
  { href: '/lending-activity', label: 'Lending Activity' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Header() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
      {/* Top bar — Logo + Search + Network + Dark mode */}
      <div className="border-b border-[#387085]/10">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
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
                className="w-full rounded-none border border-[#387085]/15 bg-[#faf9f5] py-2 pl-10 pr-20 text-sm text-[#387085] placeholder-[#387085]/35 outline-none transition-colors focus:border-[#cd6332]/50"
              />
              {/* Cmd + K badge */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <kbd className="rounded border border-[#387085]/20 bg-[#387085]/5 px-1.5 py-0.5 font-mono text-[10px] text-[#387085]/50">Cmd</kbd>
                <span className="text-[10px] text-[#387085]/35">+</span>
                <kbd className="rounded border border-[#387085]/20 bg-[#387085]/5 px-1.5 py-0.5 font-mono text-[10px] text-[#387085]/50">K</kbd>
              </div>
            </div>
          </div>

          {/* Right: Network selector + Dark mode toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Network selector */}
            <button className="flex items-center gap-2 rounded-none border border-[#387085]/15 bg-white px-3 py-2 text-[12px] font-medium text-[#14140f] hover:border-[#387085]/30 transition-colors">
              {/* Ethereum icon */}
              <svg className="h-4 w-4 text-[#627EEA]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
              </svg>
              <span className="hidden sm:inline">Ethereum Sepolia (Testnet)</span>
              <svg className="h-3.5 w-3.5 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-none border border-[#cd6332]/30 text-[#cd6332] hover:border-[#cd6332] hover:bg-[rgba(205,99,50,0.04)] transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar — Explorer Nav */}
      <div className="border-b border-[#387085]/8 bg-[#faf9f5]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 sm:px-6">
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
                    {openMenu === item.label && (() => {
                      // Pick the most specific (longest) submenu href that matches
                      const activeSubHref = item.submenu.reduce<string | null>((best, sub) => {
                        const matches = pathname === sub.href || pathname.startsWith(sub.href + '/');
                        if (!matches) return best;
                        if (!best || sub.href.length > best.length) return sub.href;
                        return best;
                      }, null);
                      return (
                      <div className="absolute left-0 top-full z-50 w-52 border border-[#387085]/10 bg-white py-1 shadow-sm">
                        {item.submenu.map((sub) => {
                          const isSubActive = sub.href === activeSubHref;
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
                      );
                    })()}
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

          {/* Deposit & Borrow — external link button */}
          <a
            href="/lending"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-none border border-[#cd6332]/30 bg-white px-4 py-2 text-[12px] font-semibold text-[#cd6332] transition-all hover:border-[#cd6332] hover:bg-[rgba(205,99,50,0.04)]"
          >
            Deposit &amp; Borrow
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
