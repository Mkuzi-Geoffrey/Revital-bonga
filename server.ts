import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy init Gemini SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory store for Line Register and parsed bills (seeded with initial template data)
let lineRegisterStore = [
  {
    id: 'LR-001',
    phoneNumber: '+254 712 345 678',
    employeeName: 'Sarah Jenkins',
    employeeEmail: 's.jenkins@acmecorp.co.ke',
    department: 'Sales & BD',
    costCenter: 'CC-101',
    planName: 'Enterprise Unlimited Voice & Data',
    monthlyBudget: 15000.0,
    status: 'active',
    assignedDate: '2024-01-15',
    deviceModel: 'iPhone 15 Pro',
    notes: 'Frequently roams in EAC/UAE for regional client accounts.',
  },
  {
    id: 'LR-002',
    phoneNumber: '+254 722 456 789',
    employeeName: 'David Chen',
    employeeEmail: 'd.chen@acmecorp.co.ke',
    department: 'Engineering',
    costCenter: 'CC-204',
    planName: 'Data Heavy 50GB',
    monthlyBudget: 10000.0,
    status: 'active',
    assignedDate: '2024-02-01',
    deviceModel: 'Google Pixel 8 Pro',
    notes: 'Hotspot connectivity for remote test lab simulations.',
  },
  {
    id: 'LR-003',
    phoneNumber: '+254 733 567 890',
    employeeName: 'Elena Rostova',
    employeeEmail: 'e.rostova@acmecorp.co.ke',
    department: 'Executive',
    costCenter: 'CC-100',
    planName: 'Global Executive VIP Unlimited',
    monthlyBudget: 35000.0,
    status: 'active',
    assignedDate: '2023-06-10',
    deviceModel: 'iPhone 15 Pro Max',
    notes: 'Global travel roaming allowance enabled.',
  },
  {
    id: 'LR-004',
    phoneNumber: '+254 701 678 901',
    employeeName: 'Marcus Vance',
    employeeEmail: 'm.vance@acmecorp.co.ke',
    department: 'Field Operations',
    costCenter: 'CC-305',
    planName: 'Fleet Standard Voice + 10GB',
    monthlyBudget: 7500.0,
    status: 'active',
    assignedDate: '2024-03-12',
    deviceModel: 'Samsung Galaxy A54',
    notes: 'Nairobi depot & upcountry logistics line.',
  },
  {
    id: 'LR-005',
    phoneNumber: '+254 711 789 012',
    employeeName: 'Jessica Morales',
    employeeEmail: 'j.morales@acmecorp.co.ke',
    department: 'Customer Support',
    costCenter: 'CC-402',
    planName: 'Support Desk Unlimited Voice',
    monthlyBudget: 6000.0,
    status: 'active',
    assignedDate: '2024-04-05',
    deviceModel: 'VoIP Hybrid Softline',
    notes: 'Call center shift support line.',
  },
  {
    id: 'LR-006',
    phoneNumber: '+254 721 890 123',
    employeeName: 'Michael Brown (Former)',
    employeeEmail: 'm.brown@acmecorp.co.ke',
    department: 'Marketing',
    costCenter: 'CC-503',
    planName: 'Standard 20GB Plan',
    monthlyBudget: 9000.0,
    status: 'suspended',
    assignedDate: '2023-08-20',
    deviceModel: 'iPhone 13',
    notes: 'Departed company on Jan 30. Line should have been terminated with carrier.',
  },
  {
    id: 'LR-007',
    phoneNumber: '+254 734 901 234',
    employeeName: 'Liam O’Connor',
    employeeEmail: 'l.oconnor@acmecorp.co.ke',
    department: 'Sales & BD',
    costCenter: 'CC-101',
    planName: 'Enterprise Unlimited Voice & Data',
    monthlyBudget: 15000.0,
    status: 'active',
    assignedDate: '2024-05-18',
    deviceModel: 'Samsung Galaxy S24',
    notes: 'Coast & Western regional sales representative.',
  },
  {
    id: 'LR-008',
    phoneNumber: '+254 702 012 345',
    employeeName: 'Rachel Adams',
    employeeEmail: 'r.adams@acmecorp.co.ke',
    department: 'Human Resources',
    costCenter: 'CC-601',
    planName: 'Corporate Essential 15GB',
    monthlyBudget: 7000.0,
    status: 'active',
    assignedDate: '2024-06-01',
    deviceModel: 'iPhone 14',
    notes: 'Recruitment & talent acquisition contact line.',
  },
  {
    id: 'LR-009',
    phoneNumber: '+254 713 123 456',
    employeeName: 'Gregory House',
    employeeEmail: 'g.house@acmecorp.co.ke',
    department: 'Facilities',
    costCenter: 'CC-700',
    planName: 'Emergency Standby Line',
    monthlyBudget: 5000.0,
    status: 'active',
    assignedDate: '2023-11-10',
    deviceModel: 'Sonim Rugged Phone',
    notes: 'Backup on-call emergency line for facility night shifts.',
  },
  {
    id: 'LR-010',
    phoneNumber: '+254 723 234 567',
    employeeName: 'Chloe Bennett (Leave)',
    employeeEmail: 'c.bennett@acmecorp.co.ke',
    department: 'Engineering',
    costCenter: 'CC-204',
    planName: 'Data Heavy 50GB',
    monthlyBudget: 10000.0,
    status: 'decommissioned',
    assignedDate: '2023-01-10',
    deviceModel: 'Pixel 7',
    notes: 'Decommissioned last quarter. Verify billing cancellation.',
  },
];

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    linesCount: lineRegisterStore.length,
  });
});

// GET /api/lines - Retrieve all line register items
app.get('/api/lines', (req, res) => {
  res.json({ success: true, data: lineRegisterStore });
});

// POST /api/lines - Add line
app.post('/api/lines', (req, res) => {
  const body = req.body;
  const newLine = {
    id: `LR-${String(lineRegisterStore.length + 1).padStart(3, '0')}`,
    phoneNumber: body.phoneNumber || '',
    employeeName: body.employeeName || 'Unassigned User',
    employeeEmail: body.employeeEmail || '',
    department: body.department || 'General',
    costCenter: body.costCenter || 'CC-100',
    planName: body.planName || 'Standard Enterprise 20GB',
    monthlyBudget: Number(body.monthlyBudget) || 75.0,
    status: body.status || 'active',
    assignedDate: body.assignedDate || new Date().toISOString().slice(0, 10),
    deviceModel: body.deviceModel || 'Smartphone',
    notes: body.notes || '',
  };
  lineRegisterStore.push(newLine);
  res.status(201).json({ success: true, data: newLine });
});

// POST /api/lines/batch - Batch import lines
app.post('/api/lines/batch', (req, res) => {
  const { lines, replace } = req.body;
  if (!Array.isArray(lines)) {
    return res.status(400).json({ success: false, error: 'lines must be an array' });
  }

  if (replace) {
    lineRegisterStore = lines;
  } else {
    lines.forEach((l) => {
      const exists = lineRegisterStore.find((existing) => existing.phoneNumber === l.phoneNumber);
      if (!exists) {
        lineRegisterStore.push({
          ...l,
          id: l.id || `LR-${String(lineRegisterStore.length + 1).padStart(3, '0')}`,
        });
      }
    });
  }

  res.json({ success: true, count: lineRegisterStore.length, data: lineRegisterStore });
});

// PUT /api/lines/:id - Update line
app.put('/api/lines/:id', (req, res) => {
  const { id } = req.params;
  const index = lineRegisterStore.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Line not found' });
  }
  lineRegisterStore[index] = {
    ...lineRegisterStore[index],
    ...req.body,
    id,
  };
  res.json({ success: true, data: lineRegisterStore[index] });
});

// DELETE /api/lines/:id - Delete line
app.delete('/api/lines/:id', (req, res) => {
  const { id } = req.params;
  lineRegisterStore = lineRegisterStore.filter((l) => l.id !== id);
  res.json({ success: true, message: 'Line deleted' });
});

// POST /api/ai/audit-insights - Gemini Cost Optimization Advisor
app.post('/api/ai/audit-insights', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { auditReport, carrierInfo } = req.body;

    if (!ai) {
      // Fallback deterministic smart insights if API key is not yet set
      const savings = auditReport?.potentialMonthlySavings || 68500;
      return res.json({
        success: true,
        source: 'rule-engine',
        insights: [
          `Potential annual recovery of KSh ${((savings) * 12).toLocaleString('en-KE', { minimumFractionDigits: 2 })} identified across ${auditReport?.ghostLinesCount || 2} ghost lines and ${auditReport?.inactiveBilledCount || 1} suspended employee lines.`,
          `High-risk international roaming surcharges detected on executive and sales lines. Recommend locking ad-hoc roaming data or provisioning fixed-rate regional EAC/global roaming bundles (KSh 2,500/trip) instead of out-of-bundle rates.`,
          `Zero-usage standby lines (${auditReport?.zeroUsageCount || 1} lines) currently incur full monthly enterprise bundle fees (KSh 5,000+). Downgrading to dormant standby profiles will immediately yield savings.`,
          `Request formal carrier reconciliation credit from ${carrierInfo?.carrier || 'Telecom Provider'} for invoice #${carrierInfo?.invoiceNumber || 'INV-CURRENT'} for charges on unassigned/terminated lines.`,
        ],
      });
    }

    const prompt = `You are an elite Telecom Expense Management (TEM) auditor and CFO advisory AI in Kenya.
Analyze this corporate telecom billing audit report (all monetary figures are in Kenyan Shillings, KSh) and generate 4-5 concise, high-impact bullet points with specific action items, potential KSh savings, and telecom contract optimization recommendations.

Audit Report Data (amounts in KSh):
- Total Invoice Billed: KSh ${auditReport.totalBilled}
- Total Budget: KSh ${auditReport.totalBudgeted}
- Ghost Lines (Billed but not in company register): ${auditReport.ghostLinesCount} lines (Total cost: KSh ${auditReport.ghostLinesTotalCost})
- Inactive / Suspended Lines being billed: ${auditReport.inactiveBilledCount} lines (Total cost: KSh ${auditReport.inactiveBilledTotalCost})
- Over-budget Lines: ${auditReport.overBudgetCount} lines (Excess: KSh ${auditReport.overBudgetTotalExcess})
- Zero-Usage Active Lines: ${auditReport.zeroUsageCount} lines (KSh ${auditReport.zeroUsageTotalCost})
- Potential Monthly Savings: KSh ${auditReport.potentialMonthlySavings}
- Carrier: ${carrierInfo?.carrier || 'Telecom Provider'}
- Department Breakdown: ${JSON.stringify(auditReport.departmentBreakdown || [])}

Format your output strictly as a JSON array of 4 to 5 concise string bullet points citing figures in KSh.
Example: ["Bullet 1 with specific KSh savings", "Bullet 2 on roaming policies", ...]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let insights: string[] = [];
    try {
      insights = JSON.parse(response.text?.trim() || '[]');
    } catch {
      insights = [
        `Identified KSh ${Number(auditReport.potentialMonthlySavings || 0).toLocaleString('en-KE')}/month in recoverable telecom waste across ghost lines and idle plans.`,
        `Immediate carrier dispute recommended for ${auditReport.ghostLinesCount} unauthorized mobile numbers.`,
        `Restructure roaming packages for high-usage sales lines to eliminate variable overage spikes.`,
      ];
    }

    res.json({ success: true, source: 'gemini', insights });
  } catch (err: any) {
    console.error('Error generating AI audit insights:', err);
    res.json({
      success: true,
      source: 'fallback',
      insights: [
        'Ghost line audit identified unassigned phone numbers incurring recurring monthly fees in KSh.',
        'Suspended and decommissioned lines must be cancelled with the carrier to prevent recurring billing.',
        'Review international roaming spikes and enforce corporate travel data allowances.',
      ],
    });
  }
});

// START SERVER & VITE INTEGRATION
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telecom Bill Parser & Line Register Server running on port ${PORT}`);
  });
}

start();
