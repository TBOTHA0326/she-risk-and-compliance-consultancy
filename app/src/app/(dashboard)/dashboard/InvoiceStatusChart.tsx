'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS: Record<string, string> = {
  draft: '#9ca3af',
  sent: '#3b82f6',
  paid: '#10b981',
  overdue: '#ef4444',
  cancelled: '#d1d5db',
}

interface InvoiceStatusChartProps {
  data: Record<string, number>
}

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    status,
  }))

  if (chartData.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
