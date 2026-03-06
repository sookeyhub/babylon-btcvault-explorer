interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}

export default function KPICard({ label, value, sub, accent, icon }: KPICardProps) {
  return (
    <div className="rounded-none border border-[#cd6332]/20 bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none ${accent ? 'bg-[rgba(205,99,50,0.1)] text-[#cd6332]' : 'bg-[rgba(56,112,133,0.08)] text-[#387085]'}`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-[11px] font-medium text-[rgba(56,112,133,0.5)]">
            {label}
          </p>
          <p className={`mt-0.5 text-xl font-bold tabular-nums ${accent ? 'text-[#cd6332]' : 'text-[#14140f]'}`}>
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-[11px] text-[rgba(56,112,133,0.5)]">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}
