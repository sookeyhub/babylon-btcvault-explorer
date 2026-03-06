'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusChartProps {
  data: { status: string; count: number; btc: number }[];
}

const COLORS: Record<string, string> = {
  Active: '#5a8a3c',
  Closed: 'rgba(56,112,133,0.3)',
  Pending: '#cd6332',
  Liquidated: '#c83232',
};

export default function StatusChart({ data }: StatusChartProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="h-[130px] w-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
              strokeWidth={2}
              stroke="#fff"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={COLORS[entry.status] ?? '#387085'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid rgba(205,99,50,0.2)',
                borderRadius: '0',
                fontSize: '11px',
                color: '#387085',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-none"
              style={{ backgroundColor: COLORS[d.status] ?? '#387085' }}
            />
            <span className="w-20 text-[rgba(56,112,133,0.6)]">{d.status}</span>
            <span className="font-semibold tabular-nums text-[#14140f]">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
