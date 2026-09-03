export type LineStatus = 'active' | 'suspended' | 'decommissioned';

export interface LineRegisterItem {
  id: string;
  phoneNumber: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  costCenter: string;
  planName: string;
  monthlyBudget: number;
  status: LineStatus;
  assignedDate: string;
  deviceModel?: string;
  notes?: string;
}

export interface BongaPointsStatement {
  openingBalance: number;
  earnedMonthly: number;
  earnedMpesa: number;
  redeemed: number;
  transferredIn: number;
  transferredOut: number;
  adjustment: number;
  expired: number;
  reset: number;
  closingBalance: number;
}

export interface BundleResource {
  name: string;
  resourceType: 'minutes' | 'data' | 'sms' | 'whatsapp' | 'other';
  rolledOver: string;
  allocated: string;
  used: string;
  closing: string;
  unit: 'Minute' | 'MB' | 'GB' | 'Item';
}

export interface ItemisedRecord {
  id: string;
  date: string;
  time: string;
  dialedNumberOrService: string;
  category:
    | 'voice_peak'
    | 'voice_offpeak'
    | 'voice_other'
    | 'voice_fixed'
    | 'sms_safaricom'
    | 'sms_other'
    | 'premium_sms'
    | 'data'
    | 'ussd'
    | 'international';
  durationOrVolume: string;
  rate: number;
  charge: number;
}

export interface SubscriberItemisedBill {
  subscriberNumber: string;
  customerNumber: string;
  invoiceNumber: string;
  tariffPlan: string;
  amountDue: number;
  period: string;
  statementDate: string;
  dueDate: string;
  totalCalls: number;
  totalCallDuration: string;
  totalCallCharges: number;
  totalFreeCalls: number;
  totalFreeCallDuration: string;
  totalInternetSessions: number;
  totalInternetVolumeMB: number;
  totalInternetCharges: number;
  totalUSSDSessions: number;
  totalUSSDCharges: number;
  premiumSmsCharges: number;
  internationalCallCharges: number;
  records: ItemisedRecord[];
}

export interface SubscriberStatement {
  subscriberNumber: string;
  customerNumber: string;
  invoiceNumber: string;
  customerName: string;
  tariffPlan: string;
  period: string;
  statementDate: string;
  dueDate: string;
  netAmount: number;
  vat: number;
  excise: number;
  amountDue: number;
  bongaPoints?: BongaPointsStatement;
  bundles: BundleResource[];
  itemisedBill: SubscriberItemisedBill;
}

export interface BillLineItem {
  id: string;
  phoneNumber: string;
  userNameOnBill?: string;
  invoiceNumber?: string;
  tariffPlan?: string;
  planFee: number;
  voiceUsageMinutes: number;
  voiceCharges: number;
  dataUsageGB: number;
  dataCharges: number;
  roamingCharges: number;
  smsCharges: number;
  hardwareAndFees: number;
  premiumSmsCharges?: number;
  discounts: number;
  subtotal: number;
  vat?: number;
  excise?: number;
  tax: number;
  total: number;
  bongaPoints?: BongaPointsStatement;
  bundles?: BundleResource[];
  itemisedBill?: SubscriberItemisedBill;
}

export interface ParsedBill {
  id: string;
  fileName: string;
  carrier: string;
  accountNumber: string;
  invoiceNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  totalLinesBilled: number;
  lineItems: BillLineItem[];
  summary: {
    totalPlanFees: number;
    totalVoiceCharges: number;
    totalDataCharges: number;
    totalRoamingCharges: number;
    totalOtherFees: number;
    totalTaxes: number;
    totalDataUsedGB: number;
  };
}

export type DiscrepancyType =
  | 'matched_ok'
  | 'over_budget'
  | 'ghost_line'
  | 'inactive_billed'
  | 'zero_usage_active'
  | 'unbilled_register_line';

export interface ReconciliationItem {
  id: string;
  phoneNumber: string;
  status: DiscrepancyType;
  lineRegisterData?: LineRegisterItem;
  billData?: BillLineItem;
  varianceAmount: number; // positive if over budget, negative if under
  discrepancyReasons: string[];
  recommendedAction: string;
}

export interface DepartmentSummary {
  department: string;
  costCenter: string;
  linesCount: number;
  totalSpend: number;
  totalBudget: number;
  variance: number;
  overBudgetLines: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface AuditReport {
  totalBilled: number;
  totalBudgeted: number;
  netVariance: number;
  matchedCount: number;
  ghostLinesCount: number;
  ghostLinesTotalCost: number;
  inactiveBilledCount: number;
  inactiveBilledTotalCost: number;
  overBudgetCount: number;
  overBudgetTotalExcess: number;
  zeroUsageCount: number;
  zeroUsageTotalCost: number;
  potentialMonthlySavings: number;
  departmentBreakdown: DepartmentSummary[];
  categoryBreakdown: CategorySummary[];
  reconciliationItems: ReconciliationItem[];
  aiInsights?: string[];
}
