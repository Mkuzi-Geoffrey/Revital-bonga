import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AuditReport } from '../types';
import { formatKsh, formatKshCompact } from '../utils/currency';

interface SpendingChartsProps {
  report: AuditReport;
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ report }) => {
  const deptData = report.departmentBreakdown.map((d) => ({
    name: d.department.length > 14 ? d.department.slice(0, 12) + '…' : d.department,
    fullName: d.department,
    Spend: d.totalSpend,
    Budget: d.totalBudget,
    Variance: d.variance,
  }));

  const categoryData = report.categoryBreakdown;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-100">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
              {entry.name}: {formatKsh(Number(entry.value))}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Department Spend vs Budget Bar Chart */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Department Spend vs. Budget
            </h3>
            <p className="text-xs text-slate-500">
              Allocated monthly budget vs actual telecom carrier invoice (KSh)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Actual Spend
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" /> Assigned Budget
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => formatKshCompact(val)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Spend" fill="#2563eb" radius={[4, 4, 0, 0]} name="Spend (KSh)" />
              <Bar dataKey="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Budget (KSh)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Spend Category Breakdown Donut Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Cost Category Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total billed breakdown by telecom service category
          </p>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatKsh(Number(value)), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Total Billed</span>
              <span className="text-xs font-bold text-slate-900">{formatKsh(report.totalBilled, false)}</span>
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
          {categoryData.map((item) => (
            <div key={item.category} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate pr-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.category}</span>
              </div>
              <span className="font-semibold text-slate-900 shrink-0">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
