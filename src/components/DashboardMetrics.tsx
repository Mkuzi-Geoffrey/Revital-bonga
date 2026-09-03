import React from 'react';
import {
  Banknote,
  Ghost,
  UserX,
  TrendingUp,
  PiggyBank,
  CheckCircle,
} from 'lucide-react';
import { AuditReport } from '../types';
import { formatKsh, formatKshCompact } from '../utils/currency';

interface DashboardMetricsProps {
  report: AuditReport;
  onFilterClick?: (filter: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ report, onFilterClick }) => {
  const isOverSpend = report.netVariance > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Invoiced vs Budget */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Invoiced
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl lg:text-2xl font-bold text-slate-900 truncate">
            {formatKsh(report.totalBilled)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap">
            <span className="text-slate-500">Budget:</span>
            <span className="font-semibold text-slate-700">
              {formatKsh(report.totalBudgeted)}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-md font-semibold text-[11px] ${
                isOverSpend
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              {isOverSpend ? `+${formatKsh(report.netVariance)}` : `-${formatKsh(Math.abs(report.netVariance))}`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Ghost Lines (Urgent) */}
      <div
        onClick={() => onFilterClick && onFilterClick('ghost_line')}
        className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
          report.ghostLinesCount > 0
            ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:shadow-sm'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ghost Lines
          </span>
          <div
            className={`p-2 rounded-lg ${
              report.ghostLinesCount > 0
                ? 'bg-rose-100 text-rose-700 animate-pulse'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Ghost className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                report.ghostLinesCount > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {report.ghostLinesCount}
            </span>
            <span className="text-xs font-medium text-slate-500">unregistered</span>
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {report.ghostLinesCount > 0 ? (
              <span className="font-semibold text-rose-600">
                {formatKsh(report.ghostLinesTotalCost)}/mo billed
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> All numbers verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Inactive / Suspended Billed */}
      <div
        onClick={() => onFilterClick && onFilterClick('inactive_billed')}
        className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
          report.inactiveBilledCount > 0
            ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:shadow-sm'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Inactive Billed
          </span>
          <div
            className={`p-2 rounded-lg ${
              report.inactiveBilledCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <UserX className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                report.inactiveBilledCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {report.inactiveBilledCount}
            </span>
            <span className="text-xs font-medium text-slate-500">former/suspended</span>
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {report.inactiveBilledCount > 0 ? (
              <span className="font-semibold text-amber-600">
                {formatKsh(report.inactiveBilledTotalCost)}/mo leak
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> No inactive leaks
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Over Budget Lines */}
      <div
        onClick={() => onFilterClick && onFilterClick('over_budget')}
        className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
          report.overBudgetCount > 0
            ? 'border-orange-200 bg-orange-50/20 hover:border-orange-300 hover:shadow-sm'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Over Budget
          </span>
          <div
            className={`p-2 rounded-lg ${
              report.overBudgetCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                report.overBudgetCount > 0 ? 'text-orange-700' : 'text-slate-900'
              }`}
            >
              {report.overBudgetCount}
            </span>
            <span className="text-xs font-medium text-slate-500">lines</span>
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {report.overBudgetCount > 0 ? (
              <span className="font-semibold text-orange-600">
                +{formatKsh(report.overBudgetTotalExcess)} overage
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> All within cap
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Potential Monthly Recoverable Savings */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-xl shadow-md shadow-emerald-600/10 border border-emerald-500">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
            Recoverable Savings
          </span>
          <div className="p-2 bg-white/20 rounded-lg text-white">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl lg:text-2xl font-bold text-white truncate">
            {formatKsh(report.potentialMonthlySavings)}
            <span className="text-xs font-normal text-emerald-100"> /mo</span>
          </div>
          <div className="mt-1 text-xs text-emerald-100">
            Annual: {formatKsh(report.potentialMonthlySavings * 12, false)}/yr
          </div>
        </div>
      </div>
    </div>
  );
};
