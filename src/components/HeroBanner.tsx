'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export default function HeroBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [mounted, setMounted] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Mouse parallax via CSS custom props (zero re-renders) ── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = bannerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseRef.current = { x: x + 0.5, y: y + 0.5 };
    el.style.setProperty('--px', `${x}`);
    el.style.setProperty('--py', `${y}`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = bannerRef.current;
    if (!el) return;
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
  }, []);

  /* ── Click ripple ── */
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = bannerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [
      ...prev,
      { x: e.clientX - rect.left, y: e.clientY - rect.top, id },
    ]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 1200);
  }, []);

  /* ── Constellation particles — mouse-reactive network ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;

    function resize() {
      if (!canvas) return;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * 2;
      canvas.height = h * 2;
      ctx!.scale(2, 2);
    }
    resize();
    window.addEventListener('resize', resize);

    interface Pt {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
      p: number;
    }

    const pts: Pt[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.8 + 0.6,
      a: Math.random() * 0.18 + 0.04,
      p: Math.random() * Math.PI * 2,
    }));

    let t = 0;

    function draw() {
      if (!ctx) return;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x * w;
      const my = mouseRef.current.y * h;

      /* update & draw nodes */
      for (const n of pts) {
        // mouse repulsion
        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140 && d > 0) {
          const f = ((140 - d) / 140) * 0.35;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }

        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.985;
        n.vy *= 0.985;

        // gentle drift
        n.vx += Math.sin(t * 0.2 + n.p) * 0.003;
        n.vy += Math.cos(t * 0.15 + n.p) * 0.002;

        // wrap
        if (n.x < -30) n.x = w + 30;
        if (n.x > w + 30) n.x = -30;
        if (n.y < -30) n.y = h + 30;
        if (n.y > h + 30) n.y = -30;

        const op = n.a * (0.7 + Math.sin(t * 0.8 + n.p) * 0.3);

        ctx.save();
        ctx.globalAlpha = op;
        ctx.fillStyle = '#387085';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        // glow halo
        ctx.globalAlpha = op * 0.08;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* draw connections */
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - d / 100) * 0.035;
            ctx.strokeStyle = '#387085';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
      <div
        ref={bannerRef}
        className="banner-hero group relative overflow-hidden rounded-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ '--px': '0', '--py': '0' } as React.CSSProperties}
      >
        {/* Background image — opacity 80% */}
        <div className="absolute inset-0 opacity-80">
          <Image
            src="/banner-bg.svg"
            alt=""
            fill
            className="object-fill"
            priority
          />
        </div>

        {/* Canvas constellation particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* Click ripples */}
        {ripples.map((r) => (
          <div
            key={r.id}
            className="hero-ripple"
            style={{ left: r.x, top: r.y }}
          />
        ))}

        {/* ═══════ Decorative floating boxes (hidden on mobile) ═══════ */}
        <div className="pointer-events-none absolute inset-0 z-[5] hidden sm:block">
          {/* Teal boxes — vertical column, wave moving right */}
          <div className="deco-lr absolute left-[8%] top-[22%] h-[10px] w-[10px] bg-[#387085]" style={{ animationDelay: '0s' }} />
          <div className="deco-lr absolute left-[8%] top-[32%] h-[10px] w-[10px] bg-[#387085]" style={{ animationDelay: '0.3s' }} />
          <div className="deco-lr absolute left-[8%] top-[42%] h-[10px] w-[10px] bg-[#387085]" style={{ animationDelay: '0.6s' }} />
          <div className="deco-lr absolute left-[8%] top-[52%] h-[10px] w-[10px] bg-[#387085]" style={{ animationDelay: '0.9s' }} />

          {/* Orange boxes — each moves a different direction */}
          <div className="deco-orange-up absolute bottom-[38%] right-[3.5%] h-[10px] w-[10px] bg-[#cd6332]" />
          <div className="deco-orange-down absolute bottom-[34%] right-[8%] h-[10px] w-[10px] bg-[#cd6332]" />
        </div>

        {/* ═══════ CONTENT (centered) ═══════ */}
        <div className="relative z-10 flex min-h-[550px] flex-col items-center justify-center px-4 py-6 text-center sm:min-h-[520px] sm:px-6 sm:py-10 lg:min-h-[560px] lg:py-12 lg:px-10">
          {/* Logo + Title */}
          <div
            className={`hero-slide-up hero-delay-1 max-w-[280px] sm:max-w-none ${mounted ? '' : 'opacity-0'}`}
          >
            <Image
              src="/babylon-lockup-darkblue.svg"
              alt="Babylon"
              width={200}
              height={60}
              className="mx-auto mb-3 h-[30px] w-auto sm:h-[48px]"
            />
            <h1 className="text-2xl font-bold leading-tight text-[#387085] sm:text-5xl">
              BTCVault Explorer
            </h1>
          </div>

          {/* Subtitle */}
          <p
            className={`hero-slide-up hero-delay-2 mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-[#1a1a2e]/60 sm:mt-3 sm:max-w-md sm:text-base ${mounted ? '' : 'opacity-0'}`}
          >
            A Bitcoin-Charged Crypto Economy with Trustless Vaults
          </p>

          {/* Search */}
          <div
            className={`hero-slide-up hero-delay-3 mt-4 w-full max-w-[280px] sm:mt-6 sm:max-w-lg ${mounted ? '' : 'opacity-0'}`}
          >
            <div className="search-glow relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1a1a2e]/40 sm:left-4 sm:h-4 sm:w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by address, Vault ID, or Tx Hash"
                className="w-full rounded-none border border-[#1a1a2e]/15 bg-white/60 py-2.5 pl-9 pr-12 text-xs text-[#1a1a2e] placeholder-[#1a1a2e]/40 outline-none backdrop-blur-md transition-all duration-300 focus:border-[#cd6332]/40 focus:bg-white/80 sm:py-3 sm:pl-11 sm:pr-16 sm:text-sm"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[#1a1a2e]/15 bg-white/50 px-2 py-0.5 text-[10px] font-medium text-[#1a1a2e]/40 backdrop-blur-sm">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* ═══════ STATS (below search) ═══════ */}
          <div className="mt-5 w-full max-w-2xl sm:mt-8">
            {/* Mobile: 2×2 grid / Desktop: single row with dividers */}
            <div className="grid grid-cols-2 gap-y-4 sm:flex sm:items-center sm:justify-center sm:divide-x sm:divide-[#cd6332]/25">
              {[
                { label: 'Total BTC Locked', value: '24,847' },
                { label: 'Active Vaults', value: '3,847' },
                { label: 'Total Value (USD)', value: '$1.04B' },
                { label: 'Block Height', value: '#2,856,532' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`hero-slide-up hero-delay-${i + 2} px-5 py-2 text-center ${mounted ? '' : 'opacity-0'}`}
                >
                  <p className="text-sm font-bold tabular-nums leading-tight text-[#cd6332] sm:text-lg">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-medium tracking-wide text-[#cd6332]/60">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
