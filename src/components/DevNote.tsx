import React from 'react';

/**
 * Developer-facing design intent note.
 * Positioned in the right margin outside the main content container (xl+ screens only),
 * so it doesn't interfere with the actual UI layout.
 *
 * Usage: parent container should have `relative` class.
 * Only visible on screens >= xl (1280px).
 */
export default function DevNote({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="pointer-events-none absolute left-full top-0 ml-6 hidden h-full w-60 xl:block">
      <div className="pointer-events-auto sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto border border-dashed border-[#cd6332]/40 bg-[#cd6332]/5 p-3 text-xs leading-relaxed text-[#14140f]/80 shadow-sm">
        <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#cd6332]">
          <span>💡</span>
          <span>{title ?? '기획 의도 (개발자 참고)'}</span>
        </p>
        <div className="space-y-2">{children}</div>
      </div>
    </aside>
  );
}

export function DevNoteSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-dashed border-[#cd6332]/20 pt-3 first:mt-0 first:border-t-0 first:pt-0">
      <p className="mb-1.5 text-xs font-semibold text-[#cd6332]">
        {heading}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
