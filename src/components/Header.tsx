import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Sparkles,
  Download,
  RotateCcw,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { AuditReport, ParsedBill } from '../types';
import { formatKsh, formatKshCompact } from '../utils/currency';

interface HeaderProps {
  activeTab: 'reconciliation' | 'bill' | 'subscribers' | 'register' | 'ai';
  setActiveTab: (tab: 'reconciliation' | 'bill' | 'subscribers' | 'register' | 'ai') => void;
  report: AuditReport;
  bill: ParsedBill | null;
  onLoadSampleData: () => void;
  onResetData: () => void;
  onExportAuditCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  report,
  bill,
  onLoadSampleData,
  onResetData,
  onExportAuditCSV,
}) => {
  const hasIssues = report.ghostLinesCount > 0 || report.inactiveBilledCount > 0 || report.overBudgetCount > 0;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Telecom Bill Parser & Line Audit
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Safaricom Enterprise TEM
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {bill ? `${bill.carrier} • Account: ${bill.accountNumber} • ${bill.lineItems.length} Corporate Subscribers` : 'No active invoice loaded'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="load-sample-btn"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reload Full Safaricom Bill
            </button>
            <button
              id="export-audit-btn"
              onClick={onExportAuditCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audit CSV
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-none pt-1">
          <button
            id="tab-subscribers"
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'subscribers'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            Bonga Points & Bundles Extractor
            <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Extracted Data
            </span>
          </button>

          <button
            id="tab-reconciliation"
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reconciliation'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {hasIssues ? (
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            Audit & Reconciliation
            {hasIssues && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {report.ghostLinesCount + report.inactiveBilledCount + report.overBudgetCount}
              </span>
            )}
          </button>

          <button
            id="tab-bill"
            onClick={() => setActiveTab('bill')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bill'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Bill & Invoice Summary
            {bill && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {formatKsh(bill.totalAmount, false)}
              </span>
            )}
          </button>

          <button
            id="tab-register"
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Line Register Directory
          </button>

          <button
            id="tab-ai"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            AI Cost Optimization
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Gemini
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
