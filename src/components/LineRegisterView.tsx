import React, { useState, useRef } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Edit2,
  Trash2,
  Phone,
  CheckCircle2,
  UserX,
  Smartphone,
} from 'lucide-react';
import { LineRegisterItem, LineStatus } from '../types';
import { LINE_REGISTER_CSV_TEMPLATE } from '../data/sampleData';
import { parseLineRegisterCSV } from '../utils/reconciliation';
import { formatKsh } from '../utils/currency';

interface LineRegisterViewProps {
  lines: LineRegisterItem[];
  onAddLine: (line: Omit<LineRegisterItem, 'id'>) => void;
  onUpdateLine: (line: LineRegisterItem) => void;
  onDeleteLine: (id: string) => void;
  onImportLines: (importedLines: LineRegisterItem[]) => void;
  onExportCSV: () => void;
}

export const LineRegisterView: React.FC<LineRegisterViewProps> = ({
  lines,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  onImportLines,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingLine, setEditingLine] = useState<LineRegisterItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    phoneNumber: '',
    employeeName: '',
    employeeEmail: '',
    department: 'Sales & BD',
    costCenter: 'CC-101',
    planName: 'Enterprise Unlimited Voice & Data',
    monthlyBudget: 15000.0,
    status: 'active' as LineStatus,
    assignedDate: new Date().toISOString().slice(0, 10),
    deviceModel: 'iPhone 15 Pro',
    notes: '',
  });

  // Unique departments for filter dropdown
  const departments = Array.from(new Set(lines.map((l) => l.department))).sort();

  const filteredLines = lines.filter((line) => {
    if (selectedDept !== 'all' && line.department !== selectedDept) return false;
    if (selectedStatus !== 'all' && line.status !== selectedStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        line.phoneNumber.toLowerCase().includes(q) ||
        line.employeeName.toLowerCase().includes(q) ||
        line.employeeEmail.toLowerCase().includes(q) ||
        line.costCenter.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setFormData({
      phoneNumber: '',
      employeeName: '',
      employeeEmail: '',
      department: 'Sales & BD',
      costCenter: 'CC-101',
      planName: 'Enterprise Unlimited Voice & Data',
      monthlyBudget: 15000.0,
      status: 'active',
      assignedDate: new Date().toISOString().slice(0, 10),
      deviceModel: 'iPhone 15 Pro',
      notes: '',
    });
    setEditingLine(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (line: LineRegisterItem) => {
    setFormData({
      phoneNumber: line.phoneNumber,
      employeeName: line.employeeName,
      employeeEmail: line.employeeEmail,
      department: line.department,
      costCenter: line.costCenter,
      planName: line.planName,
      monthlyBudget: line.monthlyBudget,
      status: line.status,
      assignedDate: line.assignedDate,
      deviceModel: line.deviceModel || '',
      notes: line.notes || '',
    });
    setEditingLine(line);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber.trim() || !formData.employeeName.trim()) return;

    if (editingLine) {
      onUpdateLine({
        ...editingLine,
        ...formData,
      });
    } else {
      onAddLine(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseLineRegisterCSV(text);
          if (parsed.length > 0) {
            onImportLines(parsed);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([LINE_REGISTER_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'line_register_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: LineStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <UserX className="w-3 h-3" /> Suspended
          </span>
        );
      case 'decommissioned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Decommissioned
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Filters & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, phone, cost center..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="decommissioned">Decommissioned Only</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV Template
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Import CSV
          </button>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line
          </button>
        </div>
      </div>

      {/* Line Register Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Line ID</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Department & Cost Center</th>
                <th className="py-3 px-4">Rate Plan & Device</th>
                <th className="py-3 px-4 text-right">Monthly Cap</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No phone lines found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">
                      {line.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {line.phoneNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Assigned: {line.assignedDate}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{line.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{line.employeeEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{line.department}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{line.costCenter}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{line.planName}</div>
                      {line.deviceModel && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          {line.deviceModel}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatKsh(line.monthlyBudget)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(line.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(line)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                          title="Edit Line"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete line ${line.phoneNumber}?`)) {
                              onDeleteLine(line.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Delete Line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Line Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingLine ? `Edit Line: ${editingLine.phoneNumber}` : 'Register New Corporate Phone Line'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+254 712 345 678"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Employee *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Employee Email</label>
                  <input
                    type="email"
                    placeholder="name@acmecorp.co.ke"
                    value={formData.employeeEmail}
                    onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales & BD, Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cost Center</label>
                  <input
                    type="text"
                    placeholder="CC-101"
                    value={formData.costCenter}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Monthly Cap (KSh)</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.monthlyBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Line Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LineStatus })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rate Plan Name</label>
                  <input
                    type="text"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Device Model</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 15 Pro"
                    value={formData.deviceModel}
                    onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Policy Details</label>
                <textarea
                  rows={2}
                  placeholder="Special travel allowances, regional roaming or assignment details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                >
                  {editingLine ? 'Save Changes' : 'Register Line'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
