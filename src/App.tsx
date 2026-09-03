import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { SpendingCharts } from './components/SpendingCharts';
import { ReconciliationAudit } from './components/ReconciliationAudit';
import { BillUploader } from './components/BillUploader';
import { LineRegisterView } from './components/LineRegisterView';
import { AiAuditAdvisor } from './components/AiAuditAdvisor';
import { SubscriberStatementsExtractor } from './components/SubscriberStatementsExtractor';
import { INITIAL_LINE_REGISTER, SAMPLE_BILL } from './data/sampleData';
import { SAFARICOM_SUBSCRIBERS_DATA } from './data/safaricomExtractedData';
import {
  exportAuditReportCSV,
  exportLineRegisterCSV,
  reconcileBillWithRegister,
} from './utils/reconciliation';
import { LineRegisterItem, ParsedBill, ReconciliationItem } from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'bill' | 'subscribers' | 'register' | 'ai'>('subscribers');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [lines, setLines] = useState<LineRegisterItem[]>(INITIAL_LINE_REGISTER);
  const [bill, setBill] = useState<ParsedBill | null>(SAMPLE_BILL);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync lines with server backend on startup if available
  useEffect(() => {
    fetch('/api/lines')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLines(res.data);
        }
      })
      .catch((err) => {
        console.warn('Using client-side line register store:', err);
      });
  }, []);

  // Compute live reconciliation audit report
  const auditReport = useMemo(() => {
    return reconcileBillWithRegister(bill, lines);
  }, [bill, lines]);

  // Handlers for Line Register
  const handleAddLine = async (newLineData: Omit<LineRegisterItem, 'id'>) => {
    const newItem: LineRegisterItem = {
      ...newLineData,
      id: `LR-${String(lines.length + 1).padStart(3, '0')}`,
    };

    setLines((prev) => [...prev, newItem]);
    showToast(`Registered new line ${newItem.phoneNumber} for ${newItem.employeeName}`);

    try {
      await fetch('/api/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.error('Server sync error:', err);
    }
  };

  const handleUpdateLine = async (updatedLine: LineRegisterItem) => {
    setLines((prev) => prev.map((l) => (l.id === updatedLine.id ? updatedLine : l)));
    showToast(`Updated line details for ${updatedLine.phoneNumber}`);

    try {
      await fetch(`/api/lines/${updatedLine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLine),
      });
    } catch (err) {
      console.error('Server sync error:', err);
    }
  };

  const handleDeleteLine = async (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    showToast('Line record removed from register');

    try {
      await fetch(`/api/lines/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Server sync error:', err);
    }
  };

  const handleImportLines = (imported: LineRegisterItem[]) => {
    setLines(imported);
    showToast(`Successfully imported ${imported.length} lines into register!`);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });

    fetch('/api/lines/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: imported, replace: true }),
    }).catch(console.error);
  };

  // Quick Action: Add Ghost Line to Register
  const handleAddGhostToRegister = (item: ReconciliationItem) => {
    const newLine: Omit<LineRegisterItem, 'id'> = {
      phoneNumber: item.phoneNumber,
      employeeName: item.billData?.userNameOnBill || 'Newly Identified Employee',
      employeeEmail: 'assigned.user@acmecorp.com',
      department: 'Operations',
      costCenter: 'CC-305',
      planName: 'Standard Enterprise 20GB',
      monthlyBudget: item.billData?.total ? Math.round(item.billData.total) : 75.0,
      status: 'active',
      assignedDate: new Date().toISOString().slice(0, 10),
      deviceModel: 'Corporate Line',
      notes: `Registered from bill audit #${bill?.invoiceNumber || 'INV'} on ${new Date().toLocaleDateString()}`,
    };

    handleAddLine(newLine);
    showToast(`Ghost line ${item.phoneNumber} registered into company database!`);
  };

  // Quick Action: Flag for Cancellation
  const handleFlagCancellation = (item: ReconciliationItem) => {
    if (item.lineRegisterData) {
      handleUpdateLine({
        ...item.lineRegisterData,
        status: 'decommissioned',
        notes: `[DISPUTE FLAGGED] Contact ${bill?.carrier || 'Carrier'} to cancel billing and request refund. (${new Date().toLocaleDateString()})`,
      });
      showToast(`Flagged ${item.phoneNumber} for carrier dispute & cancellation`);
    }
  };

  // Export handlers
  const handleExportAuditCSV = () => {
    const csvContent = exportAuditReportCSV(auditReport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telecom_audit_reconciliation_${bill?.invoiceNumber || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit reconciliation CSV report downloaded');
  };

  const handleExportLinesCSV = () => {
    const csvContent = exportLineRegisterCSV(lines);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'line_register_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Line register CSV exported');
  };

  const handleLoadSampleData = () => {
    setLines(INITIAL_LINE_REGISTER);
    setBill(SAMPLE_BILL);
    setAuditFilter('all');
    showToast('Reset to default Apex Telecom invoice & corporate register');
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleResetData = () => {
    setBill(null);
    setAuditFilter('all');
    showToast('Cleared invoice. Ready for new bill upload.');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header with Tab Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        report={auditReport}
        bill={bill}
        onLoadSampleData={handleLoadSampleData}
        onResetData={handleResetData}
        onExportAuditCSV={handleExportAuditCSV}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Always visible top metrics bar */}
        <DashboardMetrics
          report={auditReport}
          onFilterClick={(f) => {
            setActiveTab('reconciliation');
            setAuditFilter(f);
          }}
        />

        {/* Tab 0: Bonga Points, Bundles & Itemised Subscriber Extractor */}
        {activeTab === 'subscribers' && (
          <SubscriberStatementsExtractor subscribers={SAFARICOM_SUBSCRIBERS_DATA} />
        )}

        {/* Tab 1: Audit & Reconciliation View */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            {/* Visual Spending & Department Breakdown Charts */}
            <SpendingCharts report={auditReport} />

            {/* Reconciliation Data Grid Table */}
            <ReconciliationAudit
              items={auditReport.reconciliationItems}
              filter={auditFilter}
              setFilter={setAuditFilter}
              onAddGhostToRegister={handleAddGhostToRegister}
              onFlagCancellation={handleFlagCancellation}
            />
          </div>
        )}

        {/* Tab 2: Bill & Invoice Parser */}
        {activeTab === 'bill' && (
          <BillUploader
            bill={bill}
            onBillLoaded={(newBill) => {
              setBill(newBill);
              setActiveTab('reconciliation');
              showToast(`Invoice parsed: ${newBill.carrier} ($${newBill.totalAmount.toFixed(2)})`);
              confetti({ particleCount: 40, spread: 60 });
            }}
            onLoadSampleBill={() => {
              setBill(SAMPLE_BILL);
              setActiveTab('reconciliation');
              showToast('Loaded Apex Telecom sample invoice');
            }}
          />
        )}

        {/* Tab 3: Corporate Line Register Directory */}
        {activeTab === 'register' && (
          <LineRegisterView
            lines={lines}
            onAddLine={handleAddLine}
            onUpdateLine={handleUpdateLine}
            onDeleteLine={handleDeleteLine}
            onImportLines={handleImportLines}
            onExportCSV={handleExportLinesCSV}
          />
        )}

        {/* Tab 4: AI Cost Optimization Advisor */}
        {activeTab === 'ai' && (
          <AiAuditAdvisor report={auditReport} bill={bill} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Telecom Expense Management (TEM) Line Register & Audit Platform • Enterprise Edition
          </div>
          <div className="flex items-center gap-4">
            <span>Reconciliation Engine v2.4</span>
            <span>•</span>
            <span>Gemini AI Audit Grounded</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
