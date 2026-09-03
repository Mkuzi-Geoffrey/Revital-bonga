import {
  AuditReport,
  BillLineItem,
  CategorySummary,
  DepartmentSummary,
  DiscrepancyType,
  LineRegisterItem,
  ParsedBill,
  ReconciliationItem,
} from '../types';

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters except leading '+'
  const cleaned = phone.replace(/[^\d+]/g, '');
  // If Kenyan format +254 7xx xxx xxx or 2547xxxxxxxx or 07xxxxxxxx
  if (cleaned.startsWith('+254') && cleaned.length === 13) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return '0' + cleaned.slice(3);
  }
  // If starts with +1 or 1 and has 11 digits, extract 10 digits
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return cleaned.slice(1);
  }
  if (cleaned.startsWith('+')) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export function formatPhoneNumberDisplay(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (norm.startsWith('07') && norm.length === 10) {
    return `+254 ${norm.slice(1, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  if (norm.length === 10) {
    return `(${norm.slice(0, 3)}) ${norm.slice(3, 6)}-${norm.slice(6)}`;
  }
  return phone;
}

export function reconcileBillWithRegister(
  bill: ParsedBill | null,
  register: LineRegisterItem[]
): AuditReport {
  if (!bill) {
    return {
      totalBilled: 0,
      totalBudgeted: register.reduce((acc, r) => acc + (r.status === 'active' ? r.monthlyBudget : 0), 0),
      netVariance: 0,
      matchedCount: 0,
      ghostLinesCount: 0,
      ghostLinesTotalCost: 0,
      inactiveBilledCount: 0,
      inactiveBilledTotalCost: 0,
      overBudgetCount: 0,
      overBudgetTotalExcess: 0,
      zeroUsageCount: 0,
      zeroUsageTotalCost: 0,
      potentialMonthlySavings: 0,
      departmentBreakdown: [],
      categoryBreakdown: [],
      reconciliationItems: [],
    };
  }

  // Create lookup maps by normalized phone number
  const registerMap = new Map<string, LineRegisterItem>();
  register.forEach((item) => {
    registerMap.set(normalizePhoneNumber(item.phoneNumber), item);
  });

  const billMap = new Map<string, BillLineItem>();
  bill.lineItems.forEach((item) => {
    billMap.set(normalizePhoneNumber(item.phoneNumber), item);
  });

  const reconciliationItems: ReconciliationItem[] = [];
  const processedRegisterNumbers = new Set<string>();

  // 1. Process all lines found in the bill
  bill.lineItems.forEach((billLine) => {
    const normPhone = normalizePhoneNumber(billLine.phoneNumber);
    const regLine = registerMap.get(normPhone);

    if (regLine) {
      processedRegisterNumbers.add(normPhone);
      const isOverBudget = billLine.total > regLine.monthlyBudget + 0.5;
      const isZeroUsage = (billLine.voiceUsageMinutes === 0 && billLine.dataUsageGB <= 0.05);

      if (regLine.status === 'suspended' || regLine.status === 'decommissioned') {
        // Inactive line incurring charges!
        reconciliationItems.push({
          id: `REC-${billLine.id}`,
          phoneNumber: billLine.phoneNumber,
          status: 'inactive_billed',
          lineRegisterData: regLine,
          billData: billLine,
          varianceAmount: billLine.total,
          discrepancyReasons: [
            `Line status in directory is "${regLine.status.toUpperCase()}" (${regLine.employeeName}), but carrier continues billing KSh ${billLine.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}/mo.`,
          ],
          recommendedAction: `Contact ${bill.carrier} to cancel billing subscription and request refund for past idle cycle.`,
        });
      } else if (isOverBudget) {
        const excess = billLine.total - regLine.monthlyBudget;
        const reasons: string[] = [];
        if (billLine.roamingCharges > 0) {
          reasons.push(`International Roaming: KSh ${billLine.roamingCharges.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`);
        }
        if (billLine.dataCharges > 0) {
          reasons.push(`Data Overage: KSh ${billLine.dataCharges.toLocaleString('en-KE', { minimumFractionDigits: 2 })} (${billLine.dataUsageGB} GB)`);
        }
        if (billLine.hardwareAndFees > 0) {
          reasons.push(`Hardware / Surcharge: KSh ${billLine.hardwareAndFees.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`);
        }
        if (reasons.length === 0) {
          reasons.push(`Total bill exceeds assigned budget (KSh ${regLine.monthlyBudget.toLocaleString('en-KE', { minimumFractionDigits: 2 })}) by KSh ${excess.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`);
        }

        reconciliationItems.push({
          id: `REC-${billLine.id}`,
          phoneNumber: billLine.phoneNumber,
          status: 'over_budget',
          lineRegisterData: regLine,
          billData: billLine,
          varianceAmount: excess,
          discrepancyReasons: reasons,
          recommendedAction: billLine.roamingCharges > 2000
            ? 'Add temporary regional EAC/global roaming bundle or review roaming travel policy.'
            : 'Upgrade to higher enterprise data tier or review hotspot tethering.',
        });
      } else if (isZeroUsage) {
        reconciliationItems.push({
          id: `REC-${billLine.id}`,
          phoneNumber: billLine.phoneNumber,
          status: 'zero_usage_active',
          lineRegisterData: regLine,
          billData: billLine,
          varianceAmount: billLine.total - regLine.monthlyBudget,
          discrepancyReasons: [
            `0 mins voice and ${billLine.dataUsageGB.toFixed(2)} GB data used. Monthly plan fee of KSh ${billLine.planFee.toLocaleString('en-KE', { minimumFractionDigits: 2 })} incurred with zero employee utilization.`,
          ],
          recommendedAction: 'Verify if device is still in use with employee or downgrade to dormant standby profile.',
        });
      } else {
        // Healthy match
        reconciliationItems.push({
          id: `REC-${billLine.id}`,
          phoneNumber: billLine.phoneNumber,
          status: 'matched_ok',
          lineRegisterData: regLine,
          billData: billLine,
          varianceAmount: billLine.total - regLine.monthlyBudget,
          discrepancyReasons: ['Active, authorized line within monthly budget limits.'],
          recommendedAction: 'No action needed. Within normal compliance thresholds.',
        });
      }
    } else {
      // GHOST LINE: In the bill, but NOT in company register!
      reconciliationItems.push({
        id: `REC-${billLine.id}`,
        phoneNumber: billLine.phoneNumber,
        status: 'ghost_line',
        billData: billLine,
        varianceAmount: billLine.total,
        discrepancyReasons: [
          `Phone number billed for KSh ${billLine.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })} is NOT registered in company line database! (${billLine.userNameOnBill || 'No tag'})`,
        ],
        recommendedAction: 'Investigate ownership or instruct carrier to immediately terminate and block service.',
      });
    }
  });

  // 2. Lines in register that did NOT appear on this bill
  register.forEach((regLine) => {
    const normPhone = normalizePhoneNumber(regLine.phoneNumber);
    if (!processedRegisterNumbers.has(normPhone) && regLine.status === 'active') {
      reconciliationItems.push({
        id: `REC-UNBILLED-${regLine.id}`,
        phoneNumber: regLine.phoneNumber,
        status: 'unbilled_register_line',
        lineRegisterData: regLine,
        varianceAmount: -regLine.monthlyBudget,
        discrepancyReasons: ['Line is active in company directory but omitted from this carrier invoice.'],
        recommendedAction: 'Check if line is billed under a different corporate account or sub-account.',
      });
    }
  });

  // Calculate Metrics
  const totalBilled = bill.totalAmount;
  const totalBudgeted = register
    .filter((r) => r.status === 'active')
    .reduce((acc, r) => acc + r.monthlyBudget, 0);
  const netVariance = totalBilled - totalBudgeted;

  const matchedItems = reconciliationItems.filter((i) => i.status === 'matched_ok');
  const ghostLines = reconciliationItems.filter((i) => i.status === 'ghost_line');
  const inactiveBilled = reconciliationItems.filter((i) => i.status === 'inactive_billed');
  const overBudget = reconciliationItems.filter((i) => i.status === 'over_budget');
  const zeroUsage = reconciliationItems.filter((i) => i.status === 'zero_usage_active');

  const ghostLinesTotalCost = ghostLines.reduce((acc, i) => acc + (i.billData?.total || 0), 0);
  const inactiveBilledTotalCost = inactiveBilled.reduce((acc, i) => acc + (i.billData?.total || 0), 0);
  const overBudgetTotalExcess = overBudget.reduce((acc, i) => acc + Math.max(0, i.varianceAmount), 0);
  const zeroUsageTotalCost = zeroUsage.reduce((acc, i) => acc + (i.billData?.total || 0), 0);

  // Potential monthly savings = ghost lines (100%) + inactive lines (100%) + zero usage line plan fees + over-budget excess
  const potentialMonthlySavings =
    ghostLinesTotalCost + inactiveBilledTotalCost + (zeroUsageTotalCost * 0.7) + (overBudgetTotalExcess * 0.5);

  // Department Breakdown
  const deptMap = new Map<
    string,
    { costCenter: string; linesCount: number; totalSpend: number; totalBudget: number; overBudgetLines: number }
  >();

  reconciliationItems.forEach((item) => {
    const dept = item.lineRegisterData?.department || (item.status === 'ghost_line' ? 'Unassigned (Ghost)' : 'General');
    const cc = item.lineRegisterData?.costCenter || (item.status === 'ghost_line' ? 'UNALLOCATED' : 'CC-000');
    const spend = item.billData?.total || 0;
    const budget = item.lineRegisterData?.status === 'active' ? item.lineRegisterData.monthlyBudget : 0;
    const isOver = item.status === 'over_budget' || (item.status === 'ghost_line' && spend > 0);

    const existing = deptMap.get(dept) || {
      costCenter: cc,
      linesCount: 0,
      totalSpend: 0,
      totalBudget: 0,
      overBudgetLines: 0,
    };

    existing.linesCount += 1;
    existing.totalSpend += spend;
    existing.totalBudget += budget;
    if (isOver) existing.overBudgetLines += 1;

    deptMap.set(dept, existing);
  });

  const departmentBreakdown: DepartmentSummary[] = Array.from(deptMap.entries()).map(([department, data]) => ({
    department,
    costCenter: data.costCenter,
    linesCount: data.linesCount,
    totalSpend: Number(data.totalSpend.toFixed(2)),
    totalBudget: Number(data.totalBudget.toFixed(2)),
    variance: Number((data.totalSpend - data.totalBudget).toFixed(2)),
    overBudgetLines: data.overBudgetLines,
  })).sort((a, b) => b.totalSpend - a.totalSpend);

  // Category Breakdown
  const totalPlan = bill.summary.totalPlanFees;
  const totalVoice = bill.summary.totalVoiceCharges;
  const totalData = bill.summary.totalDataCharges;
  const totalRoaming = bill.summary.totalRoamingCharges;
  const totalOther = bill.summary.totalOtherFees;
  const totalTaxes = bill.summary.totalTaxes;
  const sumCategories = totalPlan + totalVoice + totalData + totalRoaming + totalOther + totalTaxes || totalBilled || 1;

  const categoryBreakdown: CategorySummary[] = [
    { category: 'Base Plan Bundles', amount: totalPlan, percentage: Number(((totalPlan / sumCategories) * 100).toFixed(1)), color: '#3b82f6' },
    { category: 'Data Overages', amount: totalData, percentage: Number(((totalData / sumCategories) * 100).toFixed(1)), color: '#8b5cf6' },
    { category: 'Roaming & Travel', amount: totalRoaming, percentage: Number(((totalRoaming / sumCategories) * 100).toFixed(1)), color: '#f59e0b' },
    { category: 'Voice / SMS', amount: totalVoice, percentage: Number(((totalVoice / sumCategories) * 100).toFixed(1)), color: '#10b981' },
    { category: 'Hardware & Fees', amount: totalOther, percentage: Number(((totalOther / sumCategories) * 100).toFixed(1)), color: '#ec4899' },
    { category: 'Taxes & Regulatory', amount: totalTaxes, percentage: Number(((totalTaxes / sumCategories) * 100).toFixed(1)), color: '#64748b' },
  ].filter((c) => c.amount > 0);

  return {
    totalBilled: Number(totalBilled.toFixed(2)),
    totalBudgeted: Number(totalBudgeted.toFixed(2)),
    netVariance: Number(netVariance.toFixed(2)),
    matchedCount: matchedItems.length,
    ghostLinesCount: ghostLines.length,
    ghostLinesTotalCost: Number(ghostLinesTotalCost.toFixed(2)),
    inactiveBilledCount: inactiveBilled.length,
    inactiveBilledTotalCost: Number(inactiveBilledTotalCost.toFixed(2)),
    overBudgetCount: overBudget.length,
    overBudgetTotalExcess: Number(overBudgetTotalExcess.toFixed(2)),
    zeroUsageCount: zeroUsage.length,
    zeroUsageTotalCost: Number(zeroUsageTotalCost.toFixed(2)),
    potentialMonthlySavings: Number(potentialMonthlySavings.toFixed(2)),
    departmentBreakdown,
    categoryBreakdown,
    reconciliationItems,
  };
}

export function parseLineRegisterCSV(csvContent: string): LineRegisterItem[] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('number') || h.includes('msisdn'));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('employee') || h.includes('user'));
  const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
  const deptIdx = headers.findIndex((h) => h.includes('department') || h.includes('dept'));
  const ccIdx = headers.findIndex((h) => h.includes('cost') || h.includes('center') || h.includes('code'));
  const planIdx = headers.findIndex((h) => h.includes('plan') || h.includes('package') || h.includes('tier'));
  const budgetIdx = headers.findIndex((h) => h.includes('budget') || h.includes('allowance') || h.includes('limit') || h.includes('cost'));
  const statusIdx = headers.findIndex((h) => h.includes('status') || h.includes('state'));
  const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('assigned'));
  const deviceIdx = headers.findIndex((h) => h.includes('device') || h.includes('model') || h.includes('hardware'));
  const notesIdx = headers.findIndex((h) => h.includes('note') || h.includes('comment') || h.includes('description'));

  const results: LineRegisterItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Simple CSV parser handling quotes
    const values: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const phone = phoneIdx !== -1 && values[phoneIdx] ? values[phoneIdx] : values[0] || `+1 555-${100 + i}-0000`;
    const employeeName = nameIdx !== -1 && values[nameIdx] ? values[nameIdx] : values[1] || `Employee ${i}`;
    const employeeEmail = emailIdx !== -1 && values[emailIdx] ? values[emailIdx] : `${employeeName.toLowerCase().replace(/\s+/g, '.')}@company.com`;
    const department = deptIdx !== -1 && values[deptIdx] ? values[deptIdx] : 'Operations';
    const costCenter = ccIdx !== -1 && values[ccIdx] ? values[ccIdx] : 'CC-100';
    const planName = planIdx !== -1 && values[planIdx] ? values[planIdx] : 'Standard Enterprise 20GB';
    
    let budget = 75.0;
    if (budgetIdx !== -1 && values[budgetIdx]) {
      const parsedBudget = parseFloat(values[budgetIdx].replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedBudget)) budget = parsedBudget;
    }

    let status: 'active' | 'suspended' | 'decommissioned' = 'active';
    if (statusIdx !== -1 && values[statusIdx]) {
      const rawStatus = values[statusIdx].toLowerCase();
      if (rawStatus.includes('susp')) status = 'suspended';
      else if (rawStatus.includes('dec') || rawStatus.includes('term') || rawStatus.includes('inact')) status = 'decommissioned';
    }

    const assignedDate = dateIdx !== -1 && values[dateIdx] ? values[dateIdx] : '2024-01-01';
    const deviceModel = deviceIdx !== -1 && values[deviceIdx] ? values[deviceIdx] : 'Enterprise Smartphone';
    const notes = notesIdx !== -1 && values[notesIdx] ? values[notesIdx] : '';

    results.push({
      id: `LR-${String(results.length + 1).padStart(3, '0')}`,
      phoneNumber: phone,
      employeeName,
      employeeEmail,
      department,
      costCenter,
      planName,
      monthlyBudget: budget,
      status,
      assignedDate,
      deviceModel,
      notes,
    });
  }

  return results;
}

export function exportLineRegisterCSV(register: LineRegisterItem[]): string {
  const headers = [
    'phone_number',
    'employee_name',
    'employee_email',
    'department',
    'cost_center',
    'plan_name',
    'monthly_budget',
    'status',
    'assigned_date',
    'device_model',
    'notes',
  ];

  const rows = register.map((item) =>
    [
      `"${item.phoneNumber}"`,
      `"${item.employeeName}"`,
      `"${item.employeeEmail}"`,
      `"${item.department}"`,
      `"${item.costCenter}"`,
      `"${item.planName}"`,
      item.monthlyBudget.toFixed(2),
      item.status,
      `"${item.assignedDate}"`,
      `"${item.deviceModel || ''}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function exportAuditReportCSV(report: AuditReport): string {
  const headers = [
    'phone_number',
    'status',
    'employee_name',
    'department',
    'cost_center',
    'billed_amount',
    'monthly_budget',
    'variance',
    'data_usage_gb',
    'roaming_charges',
    'discrepancy_details',
    'recommended_action',
  ];

  const rows = report.reconciliationItems.map((item) => {
    const phone = item.phoneNumber;
    const status = item.status;
    const name = item.lineRegisterData?.employeeName || item.billData?.userNameOnBill || 'N/A';
    const dept = item.lineRegisterData?.department || 'Unassigned';
    const cc = item.lineRegisterData?.costCenter || 'N/A';
    const billed = item.billData?.total?.toFixed(2) || '0.00';
    const budget = item.lineRegisterData?.monthlyBudget?.toFixed(2) || '0.00';
    const variance = item.varianceAmount.toFixed(2);
    const dataGB = item.billData?.dataUsageGB?.toFixed(2) || '0.00';
    const roaming = item.billData?.roamingCharges?.toFixed(2) || '0.00';
    const details = item.discrepancyReasons.join(' | ').replace(/"/g, '""');
    const action = item.recommendedAction.replace(/"/g, '""');

    return [
      `"${phone}"`,
      `"${status}"`,
      `"${name}"`,
      `"${dept}"`,
      `"${cc}"`,
      billed,
      budget,
      variance,
      dataGB,
      roaming,
      `"${details}"`,
      `"${action}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
