'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ExpensesChartProps {
  data: { month: string; total_amount: number }[]
}

export function ExpensesChart({ data }: ExpensesChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.month).toLocaleString('en-ZA', { month: 'short', year: '2-digit' }),
  }))

  if (formatted.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400">No expenses yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} barSize={24}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Expenses']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="total_amount" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
