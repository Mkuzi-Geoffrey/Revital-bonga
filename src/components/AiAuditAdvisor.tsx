import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  CheckSquare,
  Square,
  Printer,
  Lightbulb,
  Banknote,
} from 'lucide-react';
import { AuditReport, ParsedBill } from '../types';
import { formatKsh, formatKshCompact } from '../utils/currency';

interface AiAuditAdvisorProps {
  report: AuditReport;
  bill: ParsedBill | null;
}

export const AiAuditAdvisor: React.FC<AiAuditAdvisorProps> = ({ report, bill }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());

  const fetchAiInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/audit-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditReport: report,
          carrierInfo: {
            carrier: bill?.carrier,
            accountNumber: bill?.accountNumber,
            invoiceNumber: bill?.invoiceNumber,
          },
        }),
      });
      const data = await res.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiInsights();
  }, [report.totalBilled, report.ghostLinesCount]);

  const toggleAction = (idx: number) => {
    const next = new Set(completedActions);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCompletedActions(next);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* AI Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Powered by Gemini Intelligence
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Telecom Expense Management (TEM) Cost Audit
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-xl mt-1">
              Automated anomaly detection, ghost-line remediation strategy, and rate plan restructuring playbook for {bill?.carrier || 'Enterprise Telecom Provider'}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAiInsights}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-Analyze Invoice
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Executive Brief
            </button>
          </div>
        </div>
      </div>

      {/* Savings Projection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-semibold uppercase truncate">Immediate Monthly Recovery</div>
            <div className="text-xl lg:text-2xl font-bold text-emerald-600 truncate">
              {formatKsh(report.potentialMonthlySavings)}
            </div>
            <div className="text-[11px] text-slate-400">By terminating ghost & suspended lines</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-semibold uppercase truncate">Annual Projected Savings</div>
            <div className="text-xl lg:text-2xl font-bold text-slate-900 truncate">
              {formatKsh(report.potentialMonthlySavings * 12, false)}
            </div>
            <div className="text-[11px] text-slate-400">Yearly bottom-line impact</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-semibold uppercase truncate">Carrier Dispute Amount</div>
            <div className="text-xl lg:text-2xl font-bold text-amber-600 truncate">
              {formatKsh(report.ghostLinesTotalCost + report.inactiveBilledTotalCost)}
            </div>
            <div className="text-[11px] text-slate-400">Refund request for current billing cycle</div>
          </div>
        </div>
      </div>

      {/* Strategic Playbook & Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              Executive Audit Insights & Remediation Playbook
            </h3>
            <p className="text-xs text-slate-500">
              Check off completed policy and carrier dispute milestones
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            {completedActions.size} of {insights.length || 4} Completed
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing billing records with Gemini AI...</span>
            </div>
          ) : (
            insights.map((insight, idx) => {
              const isDone = completedActions.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleAction(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isDone
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs text-slate-800'
                  }`}
                >
                  <button className="mt-0.5 text-indigo-600 shrink-0">
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                    )}
                  </button>
                  <div className="text-xs leading-relaxed flex-1">
                    <span className="font-semibold text-slate-900 mr-1.5">Action #{idx + 1}:</span>
                    {insight}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
