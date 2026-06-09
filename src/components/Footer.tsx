import Link from 'next/link';

function XangleLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Xangle logo"
    >
      <rect width="24" height="24" rx="4" fill="#111827" />
      <path
        d="M7 7L12 12M12 12L17 7M12 12L7 17M12 12L17 17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h16M10 2c2 2.5 3 5 3 8s-1 5.5-3 8c-2-2.5-3-5-3-8s1-5.5 3-8z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l5 6.5L4 16h1.5l4-4.5L13 16h3.5l-5.2-6.8L16 4h-1.5l-3.7 4.2L7.5 4H4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 5C6 5.5 5 6.5 4.5 7.5c0 0-.5 2-.5 3.5s.5 3.5.5 3.5c.5 1 1.5 2 3 2.5l.5-1c-.5-.2-1-.5-1.5-1l.3-.5c1.5.7 3.5.7 5.4 0l.3.5c-.5.5-1 .8-1.5 1l.5 1c1.5-.5 2.5-1.5 3-2.5 0 0 .5-2 .5-3.5s-.5-3.5-.5-3.5C14 5.5 13 5 12.5 5l-.3.7c-.7-.2-1.5-.2-2.2-.2s-1.5 0-2.2.2L7.5 5z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8.5" cy="11" r="1" fill="currentColor" />
      <circle cx="11.5" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9.5l14-5.5-3 13-5-3.5-3 2.5v-3.5L3 9.5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M8.5 12L14 6.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MediumIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="7" cy="10" rx="3.5" ry="4" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="13" cy="10" rx="1.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="16.5" y1="6.5" x2="16.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="7.5" r="1" fill="currentColor" />
      <line x1="7" y1="9.5" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9.5v4.5M10 11.5c0-1.5 1-2 2-2s2 .5 2 2v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { icon: WebsiteIcon, href: 'https://xangle.io', label: 'Website' },
  { icon: TwitterIcon, href: 'https://twitter.com/xaboratory', label: 'Twitter' },
  { icon: DiscordIcon, href: '#', label: 'Discord' },
  { icon: TelegramIcon, href: '#', label: 'Telegram' },
  { icon: MediumIcon, href: '#', label: 'Medium' },
  { icon: LinkedInIcon, href: '#', label: 'LinkedIn' },
];

const FOOTER_LINKS = [
  { href: '#', label: 'Send Feedback' },
  { href: '#', label: 'Terms of Service' },
  { href: '#', label: 'Disclaimer' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#e5e7eb] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        {/* Left side */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <XangleLogo />
            <span className="text-sm text-[#387085]">
              Powered by <span className="font-bold text-[#111827]">Xangle</span>
            </span>
          </div>
          <p className="max-w-[420px] text-xs leading-relaxed text-[#6b7f8a]">
            Xangle is Korea&apos;s leading Web3 research and explorer/validator service
            provider, empowering businesses in the evolving Web3 ecosystem.
          </p>
          <p className="text-xs text-[#9ca3af]">
            &copy; CrossAngle Pte. Ltd. All rights reserved.
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-start gap-4 md:items-end">
          {/* Social icons */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-[#387085] transition-colors hover:text-[#111827]"
              >
                <Icon />
              </a>
            ))}
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            {FOOTER_LINKS.map(({ href, label }, idx) => (
              <span key={label} className="flex items-center gap-4">
                {idx > 0 && (
                  <span className="text-[#d1d5db]">|</span>
                )}
                <Link
                  href={href}
                  className="text-xs text-[#387085] transition-colors hover:text-[#111827]"
                >
                  {label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
