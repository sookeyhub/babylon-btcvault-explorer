'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
        <div className="relative z-10 flex min-h-[380px] flex-col items-center justify-center px-8 py-10 text-center sm:min-h-[420px] sm:px-12 sm:py-14 lg:min-h-[460px]">
          <h1
            className={`hero-slide-up hero-delay-1 text-3xl font-bold leading-tight text-[#387085] sm:text-4xl lg:text-5xl ${mounted ? '' : 'opacity-0'}`}
          >
            Babylon Trustless<br />Bitcoin Vaults
          </h1>

          <p
            className={`hero-slide-up hero-delay-2 mx-auto mt-3 whitespace-nowrap text-sm text-[#387085]/60 sm:text-base ${mounted ? '' : 'opacity-0'}`}
          >
            Native Bitcoin-backed borrowing is live on Public Testnet with Aave v4.
          </p>

          <div className={`hero-slide-up hero-delay-3 mt-6 ${mounted ? '' : 'opacity-0'}`}>
            <Link
              href="https://app.babylon.example"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-[#14140f] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14140f]/80"
            >
              Deposit &amp; Borrow
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ KPI CARDS (matching other pages) ═══════ */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Total Value Locked (TVL) */}
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Total Value Locked (TVL)
            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <title>Total number of BTC that are locked in currently active vaults</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-[#14140f]">1.75 <span className="text-sm font-normal text-[#387085]/50">sBTC</span></p>
            <span className="text-xs text-green-600">+3.42% (24h)</span>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">$121,147</p>
        </div>
        {/* Card 2: Utilization */}
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Utilization
            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <title>Utilization = Total Borrowed / TVL * 100</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-[#14140f]">42.3%</p>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">$5,342.33 borrowed</p>
        </div>
        {/* Card 3: Active Borrowers */}
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Borrowers</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-[#14140f]">10</p>
            <span className="text-xs text-green-600">+0.45% (24h)</span>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">of 63</p>
        </div>
        {/* Card 4: Active Vaults */}
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Vaults</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-[#14140f]">100</p>
            <span className="text-xs text-green-600">+0.45% (24h)</span>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">of 344</p>
        </div>
      </div>
    </div>
  );
}
