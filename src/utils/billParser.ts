import { BillLineItem, ParsedBill } from '../types';

export function parseTelecomBillText(text: string, fileName: string = 'uploaded_bill.txt'): ParsedBill {
  const lines = text.split(/\r?\n/);
  
  // Extract Metadata
  let carrier = 'Enterprise Telecom Provider';
  let accountNumber = 'ACC-' + Math.floor(10000000 + Math.random() * 90000000);
  let invoiceNumber = 'INV-' + Math.floor(1000000 + Math.random() * 9000000);
  let invoiceDate = new Date().toISOString().slice(0, 10);
  let billingPeriodStart = '2025-08-01';
  let billingPeriodEnd = '2025-08-31';
  let dueDate = '2025-09-25';

  // Pattern matching for metadata
  for (const line of lines) {
    if (/carrier|provider|telecom|networks|wireless/i.test(line) && line.length < 60) {
      carrier = line.replace(/(carrier|provider|bill from|telecom provider):/i, '').trim() || carrier;
    }
    const accMatch = line.match(/(?:account|acc(?:t)?(?:\s*no|\s*#)?|account\s*number)[\s:]*([A-Z0-9-]+)/i);
    if (accMatch && accMatch[1]) accountNumber = accMatch[1];

    const invMatch = line.match(/(?:invoice|inv(?:oice)?(?:\s*no|\s*#)?|bill\s*number)[\s:]*([A-Z0-9-]+)/i);
    if (invMatch && invMatch[1]) invoiceNumber = invMatch[1];

    const dateMatch = line.match(/(?:date|invoice\s*date|bill\s*date)[\s:]*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i);
    if (dateMatch && dateMatch[1]) invoiceDate = dateMatch[1];
  }

  const lineItems: BillLineItem[] = [];

  // Match phone number rows
  // Phone regex: matches e.g. +1 (555) 234-5678, 555-234-5678, 5552345678, +44 7911 123456
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10,12}\b/g;

  let itemCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const phones = line.match(phoneRegex);

    if (phones && phones.length > 0) {
      const rawPhone = phones[0];
      // Extract numbers/dollar amounts from this line
      const amounts = Array.from(line.matchAll(/(?:\$\s*)?(\d+\.\d{2})/g)).map(m => parseFloat(m[1]));
      
      let planFee = 60.0;
      let dataUsageGB = 10.0;
      let dataCharges = 0.0;
      let roamingCharges = 0.0;
      let voiceMinutes = 120;
      let voiceCharges = 0.0;
      let hardwareAndFees = 0.0;
      let total = 75.0;

      if (amounts.length >= 1) {
        total = amounts[amounts.length - 1]; // usually last is total
        if (amounts.length >= 2) planFee = amounts[0];
        if (amounts.length >= 3) {
          // Check for overages
          if (amounts.length === 3) {
            dataCharges = amounts[1];
          } else if (amounts.length >= 4) {
            voiceCharges = amounts[1];
            dataCharges = amounts[2];
            if (amounts.length >= 5) roamingCharges = amounts[3];
          }
        }
      }

      // Check if line mentions roaming
      if (/roam|intl|international/i.test(line) && roamingCharges === 0) {
        roamingCharges = Math.min(total * 0.4, 45.0);
      }

      // Check for user name or device tag
      const words = line.replace(rawPhone, '').replace(/\$[\d.]+/g, '').trim().split(/\s{2,}|,/);
      const userName = words.find(w => w.length > 2 && !/^\d+$/.test(w)) || `LINE USER ${itemCounter}`;

      const subtotal = planFee + voiceCharges + dataCharges + roamingCharges + hardwareAndFees;
      const tax = Number((subtotal * 0.1).toFixed(2));
      const finalTotal = total > 0 ? total : Number((subtotal + tax).toFixed(2));

      lineItems.push({
        id: `BI-${String(itemCounter).padStart(2, '0')}`,
        phoneNumber: rawPhone,
        userNameOnBill: userName.trim(),
        planFee,
        voiceUsageMinutes: voiceMinutes,
        voiceCharges,
        dataUsageGB,
        dataCharges,
        roamingCharges,
        smsCharges: 0,
        hardwareAndFees,
        discounts: 0,
        subtotal,
        tax,
        total: finalTotal,
      });

      itemCounter++;
    }
  }

  // If no lines were extracted via regex, synthesize standard line items or default
  if (lineItems.length === 0) {
    throw new Error('No valid phone line items were detected in the provided file. Please verify that the invoice contains phone numbers and charge breakdowns.');
  }

  // Calculate summaries
  const totalPlanFees = lineItems.reduce((acc, l) => acc + l.planFee, 0);
  const totalVoiceCharges = lineItems.reduce((acc, l) => acc + l.voiceCharges, 0);
  const totalDataCharges = lineItems.reduce((acc, l) => acc + l.dataCharges, 0);
  const totalRoamingCharges = lineItems.reduce((acc, l) => acc + l.roamingCharges, 0);
  const totalOtherFees = lineItems.reduce((acc, l) => acc + l.hardwareAndFees, 0);
  const totalTaxes = lineItems.reduce((acc, l) => acc + l.tax, 0);
  const totalDataUsedGB = Number(lineItems.reduce((acc, l) => acc + l.dataUsageGB, 0).toFixed(1));
  const totalAmount = Number(lineItems.reduce((acc, l) => acc + l.total, 0).toFixed(2));

  return {
    id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
    fileName,
    carrier,
    accountNumber,
    invoiceNumber,
    billingPeriodStart,
    billingPeriodEnd,
    invoiceDate,
    dueDate,
    totalAmount,
    totalLinesBilled: lineItems.length,
    lineItems,
    summary: {
      totalPlanFees: Number(totalPlanFees.toFixed(2)),
      totalVoiceCharges: Number(totalVoiceCharges.toFixed(2)),
      totalDataCharges: Number(totalDataCharges.toFixed(2)),
      totalRoamingCharges: Number(totalRoamingCharges.toFixed(2)),
      totalOtherFees: Number(totalOtherFees.toFixed(2)),
      totalTaxes: Number(totalTaxes.toFixed(2)),
      totalDataUsedGB,
    },
  };
}
