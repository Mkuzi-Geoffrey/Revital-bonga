import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  RotateCcw,
  Search,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { ParsedBill } from '../types';
import { parseTelecomBillText } from '../utils/billParser';
import { formatKsh } from '../utils/currency';

interface BillUploaderProps {
  bill: ParsedBill | null;
  onBillLoaded: (bill: ParsedBill) => void;
  onLoadSampleBill: () => void;
}

export const BillUploader: React.FC<BillUploaderProps> = ({
  bill,
  onBillLoaded,
  onLoadSampleBill,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const text = await file.text();
      const parsed = parseTelecomBillText(text, file.name);
      onBillLoaded(parsed);
    } catch (err: any) {
      console.error('Bill parsing error:', err);
      setErrorMsg(
        err.message ||
          'Failed to parse bill text. Try loading the sample bill or uploading a text/csv telecom report.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const filteredLineItems = bill?.lineItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.phoneNumber.toLowerCase().includes(q) ||
      (item.userNameOnBill || '').toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Upload & Ingestion Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop Target */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-2 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50 shadow-xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.txt,.json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
            {isParsing ? (
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base font-bold text-slate-800">
            {isParsing ? 'Extracting & Parsing Bill Line Items...' : 'Upload Telecom Invoice or Carrier Bill'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Drag & drop PDF, CSV, or carrier billing text files (Safaricom Business, Airtel Kenya, Telkom, etc.)
          </p>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <span>Supported formats: .pdf, .csv, .txt</span>
            <span>•</span>
            <span>OCR & Line Reconciliation in KSh</span>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Quick Sample Bill Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex flex-col justify-between shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Sample Bill Dataset
            </div>
            <h4 className="text-lg font-bold text-white tracking-tight">
              Enterprise Telecom Monthly Bill
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Preloaded with 11 corporate lines including international/regional roaming spikes, data overages, inactive billed numbers, and 2 unregistered ghost lines.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {bill ? formatKsh(bill.totalAmount) : 'KSh 184,550.00'} Total
            </span>
            <button
              onClick={onLoadSampleBill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Load Sample Bill
            </button>
          </div>
        </div>
      </div>

      {/* Active Bill Overview Header */}
      {bill && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{bill.carrier}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Parsed Successfully
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice #{bill.invoiceNumber} • Account: {bill.accountNumber} • File: {bill.fileName}
              </p>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-xs text-slate-400">Billing Period</div>
                <div className="text-xs font-semibold text-slate-700">
                  {bill.billingPeriodStart} to {bill.billingPeriodEnd}
                </div>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <div className="text-xs text-slate-400">Total Billed</div>
                <div className="text-xl font-bold text-slate-900">{formatKsh(bill.totalAmount)}</div>
              </div>
            </div>
          </div>

          {/* Key Invoiced Breakdown Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">Plan Fees</div>
              <div className="text-sm font-bold text-slate-800">{formatKsh(bill.summary.totalPlanFees)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">Data Overages</div>
              <div className="text-sm font-bold text-purple-700">{formatKsh(bill.summary.totalDataCharges)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">Roaming</div>
              <div className="text-sm font-bold text-amber-700">{formatKsh(bill.summary.totalRoamingCharges)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">Voice / SMS</div>
              <div className="text-sm font-bold text-slate-800">{formatKsh(bill.summary.totalVoiceCharges)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">Hardware / Fees</div>
              <div className="text-sm font-bold text-slate-800">{formatKsh(bill.summary.totalOtherFees)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">Taxes & Surcharges</div>
              <div className="text-sm font-bold text-slate-800">{formatKsh(bill.summary.totalTaxes)}</div>
            </div>
          </div>

          {/* Itemized Lines Search & Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Itemized Line Breakdown ({bill.lineItems.length} lines)
              </h4>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search billed lines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Phone Number</th>
                    <th className="py-2.5 px-3">Carrier User Tag</th>
                    <th className="py-2.5 px-3 text-right">Plan Fee</th>
                    <th className="py-2.5 px-3 text-right">Voice (Mins)</th>
                    <th className="py-2.5 px-3 text-right">Data (GB)</th>
                    <th className="py-2.5 px-3 text-right">Roaming</th>
                    <th className="py-2.5 px-3 text-right">Hardware</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-800">Total Billed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.phoneNumber}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {item.userNameOnBill || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">{formatKsh(item.planFee)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {item.voiceUsageMinutes}m
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={item.dataCharges > 0 ? 'text-purple-700 font-bold' : 'text-slate-600'}>
                          {item.dataUsageGB} GB {item.dataCharges > 0 && `(+${formatKsh(item.dataCharges)})`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.roamingCharges > 0 ? (
                          <span className="font-bold text-amber-600">+{formatKsh(item.roamingCharges)}</span>
                        ) : (
                          <span className="text-slate-400">KSh 0.00</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatKsh(item.hardwareAndFees)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">{formatKsh(item.tax)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatKsh(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
