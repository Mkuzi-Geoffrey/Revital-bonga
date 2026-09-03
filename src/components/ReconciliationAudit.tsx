import React, { useState } from 'react';
import {
  Search,
  Ghost,
  UserX,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Phone,
  Building,
  Zap,
} from 'lucide-react';
import { DiscrepancyType, ReconciliationItem } from '../types';
import { formatKsh } from '../utils/currency';

interface ReconciliationAuditProps {
  items: ReconciliationItem[];
  filter: string;
  setFilter: (filter: string) => void;
  onAddGhostToRegister: (item: ReconciliationItem) => void;
  onFlagCancellation: (item: ReconciliationItem) => void;
}

export const ReconciliationAudit: React.FC<ReconciliationAuditProps> = ({
  items,
  filter,
  setFilter,
  onAddGhostToRegister,
  onFlagCancellation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);

  // Counts for filter pills
  const totalCount = items.length;
  const ghostCount = items.filter((i) => i.status === 'ghost_line').length;
  const overBudgetCount = items.filter((i) => i.status === 'over_budget').length;
  const inactiveBilledCount = items.filter((i) => i.status === 'inactive_billed').length;
  const zeroUsageCount = items.filter((i) => i.status === 'zero_usage_active').length;
  const matchedCount = items.filter((i) => i.status === 'matched_ok').length;

  const filteredItems = items.filter((item) => {
    // Status Filter
    if (filter !== 'all' && item.status !== filter) {
      return false;
    }

    // Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const phone = item.phoneNumber.toLowerCase();
      const empName = item.lineRegisterData?.employeeName?.toLowerCase() || '';
      const billName = item.billData?.userNameOnBill?.toLowerCase() || '';
      const dept = item.lineRegisterData?.department?.toLowerCase() || '';
      const cc = item.lineRegisterData?.costCenter?.toLowerCase() || '';
      return (
        phone.includes(q) ||
        empName.includes(q) ||
        billName.includes(q) ||
        dept.includes(q) ||
        cc.includes(q)
      );
    }

    return true;
  });

  const getStatusBadge = (status: DiscrepancyType) => {
    switch (status) {
      case 'ghost_line':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Ghost className="w-3.5 h-3.5" /> Ghost Line
          </span>
        );
      case 'inactive_billed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <UserX className="w-3.5 h-3.5" /> Inactive Billed
          </span>
        );
      case 'over_budget':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <TrendingUp className="w-3.5 h-3.5" /> Over Budget
          </span>
        );
      case 'zero_usage_active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Zap className="w-3.5 h-3.5 text-slate-400" /> Zero Usage
          </span>
        );
      case 'unbilled_register_line':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <AlertCircle className="w-3.5 h-3.5" /> Unbilled in Carrier
          </span>
        );
      case 'matched_ok':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched OK
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Lines ({totalCount})
          </button>
          <button
            onClick={() => setFilter('ghost_line')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'ghost_line'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Ghost className="w-3 h-3" />
            Ghost Lines ({ghostCount})
          </button>
          <button
            onClick={() => setFilter('inactive_billed')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'inactive_billed'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <UserX className="w-3 h-3" />
            Inactive Billed ({inactiveBilledCount})
          </button>
          <button
            onClick={() => setFilter('over_budget')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'over_budget'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Over Budget ({overBudgetCount})
          </button>
          <button
            onClick={() => setFilter('zero_usage_active')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'zero_usage_active'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Zero Usage ({zeroUsageCount})
          </button>
          <button
            onClick={() => setFilter('matched_ok')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'matched_ok'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Matched OK ({matchedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search phone, employee, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Reconciliation Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Line & Phone Number</th>
                <th className="py-3.5 px-4">Assigned User / Department</th>
                <th className="py-3.5 px-4">Audit Status</th>
                <th className="py-3.5 px-4 text-right">Billed Amount</th>
                <th className="py-3.5 px-4 text-right">Budget Limit</th>
                <th className="py-3.5 px-4 text-right">Variance</th>
                <th className="py-3.5 px-4">Discrepancy & Action</th>
                <th className="py-3.5 px-4 text-center">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    No lines found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isGhost = item.status === 'ghost_line';
                  const isInactive = item.status === 'inactive_billed';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isGhost ? 'bg-rose-50/15' : isInactive ? 'bg-amber-50/15' : ''
                      }`}
                    >
                      {/* Phone Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {item.phoneNumber}
                        </div>
                        {item.billData?.userNameOnBill && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Bill tag: {item.billData.userNameOnBill}
                          </div>
                        )}
                      </td>

                      {/* User & Department */}
                      <td className="py-3.5 px-4">
                        {item.lineRegisterData ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {item.lineRegisterData.employeeName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {item.lineRegisterData.department} • {item.lineRegisterData.costCenter}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Unassigned (Not in Line Register)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                      {/* Billed Amount */}
                      <td className="py-3.5 px-4 text-right">
                        {item.billData ? (
                          <span className="font-bold text-slate-900">
                            {formatKsh(item.billData.total)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 text-right">
                        {item.lineRegisterData?.status === 'active' ? (
                          <span className="text-slate-600 font-medium">
                            {formatKsh(item.lineRegisterData.monthlyBudget)}
                          </span>
                        ) : item.lineRegisterData ? (
                          <span className="text-slate-400 italic">
                            KSh 0.00 ({item.lineRegisterData.status})
                          </span>
                        ) : (
                          <span className="text-slate-400">KSh 0.00</span>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="py-3.5 px-4 text-right">
                        {item.varianceAmount > 0.01 ? (
                          <span className="font-bold text-rose-600">
                            +{formatKsh(item.varianceAmount)}
                          </span>
                        ) : item.varianceAmount < -0.01 ? (
                          <span className="font-medium text-emerald-600">
                            -{formatKsh(Math.abs(item.varianceAmount))}
                          </span>
                        ) : (
                          <span className="text-slate-400">KSh 0.00</span>
                        )}
                      </td>

                      {/* Discrepancy Reasons */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          {item.discrepancyReasons.map((reason, idx) => (
                            <div key={idx} className="text-[11px] text-slate-600 leading-tight">
                              • {reason}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        {isGhost ? (
                          <button
                            onClick={() => onAddGhostToRegister(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Register
                          </button>
                        ) : isInactive ? (
                          <button
                            onClick={() => onFlagCancellation(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-xs transition-colors"
                          >
                            Flag Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Line Audit Details: {selectedItem.phoneNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedItem.lineRegisterData?.employeeName || 'Unassigned Line'}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-200/60">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Audit Status:</span>
                  <span>{getStatusBadge(selectedItem.status)}</span>
                </div>
                {selectedItem.billData && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Base Plan Fee:</span>
                      <span>{formatKsh(selectedItem.billData.planFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Data Usage & Charges:</span>
                      <span>
                        {selectedItem.billData.dataUsageGB} GB ({formatKsh(selectedItem.billData.dataCharges)})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Voice Usage & Charges:</span>
                      <span>
                        {selectedItem.billData.voiceUsageMinutes} mins ({formatKsh(selectedItem.billData.voiceCharges)})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Roaming Charges:</span>
                      <span className={selectedItem.billData.roamingCharges > 0 ? 'font-bold text-amber-600' : ''}>
                        {formatKsh(selectedItem.billData.roamingCharges)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Hardware & Fees:</span>
                      <span>{formatKsh(selectedItem.billData.hardwareAndFees)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Taxes & Surcharges:</span>
                      <span>{formatKsh(selectedItem.billData.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                      <span>Total Billed:</span>
                      <span>{formatKsh(selectedItem.billData.total)}</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Recommended Policy Action:</h4>
                <p className="text-slate-600 bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs">
                  {selectedItem.recommendedAction}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
