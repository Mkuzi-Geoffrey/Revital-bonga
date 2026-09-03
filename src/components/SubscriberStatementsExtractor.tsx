import React, { useState } from 'react';
import {
  Award,
  Database,
  FileText,
  Phone,
  Search,
  Download,
  AlertTriangle,
  Globe,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { SubscriberStatement, BundleResource, ItemisedRecord } from '../types';
import { SAFARICOM_SUBSCRIBERS_DATA } from '../data/safaricomExtractedData';
import { formatKsh } from '../utils/currency';

interface SubscriberStatementsExtractorProps {
  subscribers?: SubscriberStatement[];
}

export const SubscriberStatementsExtractor: React.FC<SubscriberStatementsExtractorProps> = ({
  subscribers = SAFARICOM_SUBSCRIBERS_DATA,
}) => {
  const [selectedSubNumber, setSelectedSubNumber] = useState<string>(subscribers[0]?.subscriberNumber || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'bonga' | 'bundles' | 'itemised'>('all');
  const [cdrFilter, setCdrFilter] = useState<string>('all');

  const filteredSubscribers = subscribers.filter((sub) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      sub.subscriberNumber.toLowerCase().includes(q) ||
      sub.customerName.toLowerCase().includes(q) ||
      sub.tariffPlan.toLowerCase().includes(q) ||
      sub.invoiceNumber.toLowerCase().includes(q)
    );
  });

  const currentSub = subscribers.find((s) => s.subscriberNumber === selectedSubNumber) || subscribers[0];

  // Helper for Exporting Subscriber Bonga & Bundles summary
  const handleExportBongaBundlesCSV = () => {
    const headers = [
      'Subscriber Number',
      'Invoice Number',
      'Tariff Plan',
      'Amount Due (KSh)',
      'Bonga Opening',
      'Bonga Earned Month',
      'Bonga M-Pesa',
      'Bonga Closing Balance',
      'Voice Minutes Allocated',
      'Voice Minutes Used',
      'Data Allocated (MB)',
      'Data Used (MB)',
      'Premium SMS (KSh)',
      'International Calls (KSh)',
    ];

    const rows = subscribers.map((sub) => {
      const minutesBundle = sub.bundles.find((b) => b.resourceType === 'minutes');
      const dataBundle = sub.bundles.find((b) => b.resourceType === 'data');
      return [
        `="${sub.subscriberNumber}"`,
        sub.invoiceNumber,
        `"${sub.tariffPlan}"`,
        sub.amountDue.toFixed(2),
        sub.bongaPoints?.openingBalance || 0,
        sub.bongaPoints?.earnedMonthly || 0,
        sub.bongaPoints?.earnedMpesa || 0,
        sub.bongaPoints?.closingBalance || 0,
        `"${minutesBundle?.allocated || 'N/A'}"`,
        `"${minutesBundle?.used || 'N/A'}"`,
        `"${dataBundle?.allocated || 'N/A'}"`,
        `"${dataBundle?.used || 'N/A'}"`,
        sub.itemisedBill?.premiumSmsCharges || 0,
        sub.itemisedBill?.internationalCallCharges || 0,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `safaricom_bonga_and_bundles_summary_${currentSub.statementDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Exporting Current Subscriber Itemised CDR
  const handleExportItemisedCDR = () => {
    if (!currentSub || !currentSub.itemisedBill) return;
    const headers = ['Date', 'Time', 'Dialed / APN / Service', 'Category', 'Duration / Volume', 'Rate (KSh)', 'Charge (KSh)'];
    const rows = currentSub.itemisedBill.records.map((r) => [
      r.date,
      r.time,
      `"${r.dialedNumberOrService}"`,
      r.category,
      `"${r.durationOrVolume}"`,
      r.rate.toFixed(2),
      r.charge.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `itemised_bill_${currentSub.subscriberNumber}_${currentSub.invoiceNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCdrRecords = currentSub?.itemisedBill?.records?.filter((r) => {
    if (cdrFilter === 'all') return true;
    if (cdrFilter === 'voice') return r.category.startsWith('voice');
    if (cdrFilter === 'data') return r.category === 'data';
    if (cdrFilter === 'premium') return r.category === 'premium_sms';
    if (cdrFilter === 'international') return r.category === 'international';
    if (cdrFilter === 'sms') return r.category.startsWith('sms');
    if (cdrFilter === 'ussd') return r.category === 'ussd';
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2.5">
              <Award className="w-3.5 h-3.5" /> Safaricom Extracted Intelligence
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Bonga Points, Bundles & Itemised Subscriber Statements
            </h2>
            <p className="text-xs text-emerald-200/80 max-w-2xl mt-1">
              Extracted from official Safaricom PostPay Bill (Account: {currentSub.customerNumber}, {subscribers.length} corporate lines). View Bonga loyalty balances, monthly bundle utilization, and full itemised call/data records.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportBongaBundlesCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export All Bonga & Bundles CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Statement
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Extraction Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Subscriber Selector Directory */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              Subscribers Directory ({subscribers.length})
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Click to inspect</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search line (e.g. 715946156, 714063833)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Subscriber List */}
          <div className="overflow-y-auto max-h-[620px] space-y-2 pr-1 divide-y divide-slate-100">
            {filteredSubscribers.map((sub) => {
              const isSelected = sub.subscriberNumber === selectedSubNumber;
              return (
                <div
                  key={sub.subscriberNumber}
                  onClick={() => setSelectedSubNumber(sub.subscriberNumber)}
                  className={`pt-2 p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Smartphone className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      0{sub.subscriberNumber}
                    </div>
                    <span className="font-bold text-xs text-slate-900">{formatKsh(sub.amountDue)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="truncate max-w-[160px]">{sub.tariffPlan}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <Award className="w-3 h-3" />
                      {sub.bongaPoints?.closingBalance ? `${sub.bongaPoints.closingBalance.toLocaleString()} pts` : '0 pts'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>Inv: {sub.invoiceNumber}</span>
                    {sub.itemisedBill?.premiumSmsCharges > 0 && (
                      <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> +{formatKsh(sub.itemisedBill.premiumSmsCharges)} VAS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Subscriber Extract (Bonga + Bundles + Itemised) */}
        <div className="lg:col-span-8 space-y-6">
          {currentSub ? (
            <>
              {/* Subscriber Overview Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Subscriber: 0{currentSub.subscriberNumber}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {currentSub.tariffPlan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentSub.customerName} • Invoice #{currentSub.invoiceNumber} • Period: {currentSub.period}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Billed Due</div>
                    <div className="text-xl font-bold text-slate-900">{formatKsh(currentSub.amountDue)}</div>
                  </div>
                </div>

                {/* Navigation Pills between Bonga, Bundles & Itemised */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    onClick={() => setActiveSection('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeSection === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Complete Extract View
                  </button>
                  <button
                    onClick={() => setActiveSection('bonga')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeSection === 'bonga'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Bonga Points Statement
                  </button>
                  <button
                    onClick={() => setActiveSection('bundles')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeSection === 'bundles'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Bundles Statement ({currentSub.bundles.length})
                  </button>
                  <button
                    onClick={() => setActiveSection('itemised')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeSection === 'itemised'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Itemised Bill ({currentSub.itemisedBill?.records?.length || 0} Records)
                  </button>
                </div>
              </div>

              {/* 1. Bonga Points Statement Component */}
              {(activeSection === 'all' || activeSection === 'bonga') && (
                <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-200" />
                      <div>
                        <h4 className="text-sm font-bold">BONGA POINTS MONTHLY STATEMENT</h4>
                        <p className="text-[11px] text-emerald-100">
                          Safaricom Loyalty Program Summary as of Statement Date {currentSub.statementDate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-200 uppercase font-semibold">Current Balance</span>
                      <div className="text-xl font-black text-white">
                        {currentSub.bongaPoints?.closingBalance?.toLocaleString() || '0'} PTS
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-[11px] text-slate-500 font-medium">Opening Balance (Aug)</div>
                        <div className="text-base font-bold text-slate-800">
                          {currentSub.bongaPoints?.openingBalance?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                        <div className="text-[11px] text-emerald-700 font-medium">Earned This Month</div>
                        <div className="text-base font-bold text-emerald-700">
                          +{currentSub.bongaPoints?.earnedMonthly?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-[11px] text-slate-500 font-medium">From M-PESA</div>
                        <div className="text-base font-bold text-slate-800">
                          {currentSub.bongaPoints?.earnedMpesa?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-[11px] text-slate-500 font-medium">Adjustments / Transfers</div>
                        <div className="text-base font-bold text-slate-800">
                          {currentSub.bongaPoints?.adjustment || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Bundles Statement Component */}
              {(activeSection === 'all' || activeSection === 'bundles') && (
                <div className="bg-white rounded-2xl border border-blue-200 shadow-xs overflow-hidden space-y-3">
                  <div className="bg-gradient-to-r from-blue-900 to-slate-800 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-300" />
                      <div>
                        <h4 className="text-sm font-bold">POSTPAY BUNDLES MONTHLY STATEMENT</h4>
                        <p className="text-[11px] text-blue-100">
                          Resource Allocations, Usage, Rollover and Balances for 0{currentSub.subscriberNumber}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      {currentSub.bundles.length} Active Bundles
                    </span>
                  </div>

                  <div className="p-4 pt-1 space-y-3">
                    {currentSub.bundles.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No active bundle allocations assigned to this fiber/data-only profile.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {currentSub.bundles.map((bundle, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{bundle.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                {bundle.resourceType.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-white p-2 rounded-lg border border-slate-100">
                                <div className="text-[10px] text-slate-400">Allocated</div>
                                <div className="font-bold text-slate-800 text-[11px] truncate">{bundle.allocated}</div>
                              </div>
                              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <div className="text-[10px] text-blue-600 font-medium">Used</div>
                                <div className="font-bold text-blue-800 text-[11px] truncate">{bundle.used}</div>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-100">
                                <div className="text-[10px] text-slate-400">Rolled-over</div>
                                <div className="font-semibold text-slate-700 text-[11px] truncate">{bundle.rolledOver}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                              <span>Closing Balance:</span>
                              <span className="font-bold text-slate-800">{bundle.closing}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Itemised Bill Component */}
              {(activeSection === 'all' || activeSection === 'itemised') && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Itemised Bill & Call Detail Records (CDR)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Full log of voice minutes, mobile internet sessions, SMS, and VAS content subscriptions
                      </p>
                    </div>

                    <button
                      onClick={handleExportItemisedCDR}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Export CDR CSV
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-400">Total Calls</div>
                      <div className="text-sm font-bold text-slate-800">
                        {currentSub.itemisedBill?.totalCalls || 0} ({currentSub.itemisedBill?.totalCallDuration || '00:00:00'})
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-400">Internet Volume</div>
                      <div className="text-sm font-bold text-slate-800">
                        {(currentSub.itemisedBill?.totalInternetVolumeMB || 0).toLocaleString()} MB
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-400">Premium Content (VAS)</div>
                      <div className="text-sm font-bold text-rose-600">
                        {formatKsh(currentSub.itemisedBill?.premiumSmsCharges || 0)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-400">International Calls</div>
                      <div className="text-sm font-bold text-amber-600">
                        {formatKsh(currentSub.itemisedBill?.internationalCallCharges || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Filter Chips for CDR */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-medium text-slate-500">Filter Records:</span>
                    {[
                      { id: 'all', label: 'All Activities' },
                      { id: 'voice', label: 'Voice Calls' },
                      { id: 'data', label: 'Data Sessions' },
                      { id: 'sms', label: 'SMS' },
                      { id: 'premium', label: 'Premium SMS (VAS)' },
                      { id: 'international', label: 'International' },
                      { id: 'ussd', label: 'USSD' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setCdrFilter(f.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          cdrFilter === f.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* CDR Records Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Dialed Number / APN / Service</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Duration / Volume</th>
                          <th className="py-2.5 px-3 text-right">Rate (KSh)</th>
                          <th className="py-2.5 px-3 text-right font-bold text-slate-900">Charge (KSh)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCdrRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No records found for the selected activity category.
                            </td>
                          </tr>
                        ) : (
                          filteredCdrRecords.map((rec) => (
                            <tr
                              key={rec.id}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                rec.category === 'premium_sms' ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                {rec.date} {rec.time}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                {rec.category === 'premium_sms' && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                )}
                                {rec.dialedNumberOrService}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    rec.category === 'premium_sms'
                                      ? 'bg-rose-100 text-rose-700'
                                      : rec.category === 'international'
                                      ? 'bg-amber-100 text-amber-800'
                                      : rec.category === 'data'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {rec.category.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-700 font-mono text-[11px]">
                                {rec.durationOrVolume}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-400">{formatKsh(rec.rate)}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {rec.charge > 0 ? (
                                  <span className="text-rose-600">+{formatKsh(rec.charge)}</span>
                                ) : (
                                  <span className="text-slate-400">KSh 0.00</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              Select a subscriber line from the left directory to view Bonga points, bundle balances, and itemised billing logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
