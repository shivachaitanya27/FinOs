import { prisma } from "./prisma";

export async function seedDemoData(targetBusinessId?: string, targetUserId?: string) {
  let business: any;
  let demoUser: any;

  if (targetBusinessId) {
    business = await prisma.business.findUnique({
      where: { id: targetBusinessId },
      include: { accounts: true },
    });
    if (!business) {
      throw new Error(`Business with ID ${targetBusinessId} not found`);
    }
    if (targetUserId) {
      demoUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    }
  } else {
    // 1. Clean existing demo data safely
    const existingBusiness = await prisma.business.findFirst({
      where: { taxId: "29AABCU9603R1ZM" },
    });

    if (existingBusiness) {
      // Delete in proper cascade order
      await prisma.chatMessage.deleteMany({ where: { conversation: { businessId: existingBusiness.id } } });
      await prisma.chatConversation.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.reconciliationRecord.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.riskAlert.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.aIRecommendation.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.forecast.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.auditLog.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.transaction.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.importedFile.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.financialAccount.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.businessMembership.deleteMany({ where: { businessId: existingBusiness.id } });
      await prisma.business.delete({ where: { id: existingBusiness.id } });
    }

    // Clean up orphaned duplicate test businesses from prior test runs
    const emptyTestBusinesses = await prisma.business.findMany({
      where: {
        accounts: { none: {} },
        memberships: { none: {} },
      },
    });
    for (const emptyBiz of emptyTestBusinesses) {
      try {
        await prisma.transaction.deleteMany({ where: { businessId: emptyBiz.id } });
        await prisma.business.delete({ where: { id: emptyBiz.id } });
      } catch (_) {}
    }

    // 2. Create Demo User
    demoUser = await prisma.user.findUnique({
      where: { email: "aarav.sharma@bharattech.in" },
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: "aarav.sharma@bharattech.in",
          name: "Aarav Sharma",
          role: "FOUNDER_CEO",
          passwordHash: "demo123", // Demo hash
        },
      });
    }

    // 3. Create Business
    business = await prisma.business.create({
      data: {
        name: "BharatTech Retail & Cloud Solutions Pvt Ltd",
        legalName: "BharatTech Enterprise Solutions India Private Limited",
        taxId: "29AABCU9603R1ZM",
        panNumber: "AABCU9603R",
        currency: "INR",
        industry: "B2B SaaS & Tech Logistics",
        fiscalYearStart: "APRIL",
        minimumCashBalance: 50000.0,
        memberships: {
          create: {
            userId: demoUser?.id || null,
            role: "OWNER",
          },
        },
      },
      include: { accounts: true },
    });
  }

  // 4. Ensure Financial Accounts exist for target business
  let hdfc = business.accounts?.find((a: any) => a.name.includes("HDFC") || a.isDefault);
  let icici = business.accounts?.find((a: any) => a.name.includes("ICICI"));
  let razorpay = business.accounts?.find((a: any) => a.name.includes("Razorpay") || a.accountType === "PAYMENT_GATEWAY");
  let pettyCash = business.accounts?.find((a: any) => a.name.includes("Petty") || a.accountType === "CASH");

  if (!hdfc) {
    hdfc = await prisma.financialAccount.create({
      data: {
        businessId: business.id,
        name: "HDFC Bank Corporate Current A/c",
        accountType: "BANK",
        accountNumber: "50200084912903",
        bankName: "HDFC Bank Ltd",
        ifscCode: "HDFC0001043",
        currentBalance: 2485000,
        isDefault: true,
      },
    });
  }

  if (!icici) {
    icici = await prisma.financialAccount.create({
      data: {
        businessId: business.id,
        name: "ICICI Bank Operating Account",
        accountType: "BANK",
        accountNumber: "002305018942",
        bankName: "ICICI Bank Ltd",
        ifscCode: "ICIC0000023",
        currentBalance: 780000,
        isDefault: false,
      },
    });
  }

  if (!razorpay) {
    razorpay = await prisma.financialAccount.create({
      data: {
        businessId: business.id,
        name: "Razorpay Settlement Gateway",
        accountType: "PAYMENT_GATEWAY",
        accountNumber: "rzp_live_92A109",
        bankName: "Razorpay Software Pvt Ltd",
        currentBalance: 345000,
        isDefault: false,
      },
    });
  }

  if (!pettyCash) {
    pettyCash = await prisma.financialAccount.create({
      data: {
        businessId: business.id,
        name: "Petty Cash & Expense Desk",
        accountType: "CASH",
        accountNumber: "PETTY-01",
        currentBalance: 45000,
        isDefault: false,
      },
    });
  }

  // If seeding specific target business, wipe prior demo records to avoid duplicates
  if (targetBusinessId) {
    await prisma.reconciliationRecord.deleteMany({ where: { businessId: business.id } });
    await prisma.riskAlert.deleteMany({ where: { businessId: business.id } });
    await prisma.aIRecommendation.deleteMany({ where: { businessId: business.id } });
    await prisma.forecast.deleteMany({ where: { businessId: business.id } });
    await prisma.transaction.deleteMany({ where: { businessId: business.id } });
  }

  // 5. Create Realistic Transactions spanning today, past 7 days, this month, last month, and 3 months ago
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  const rawTransactions = [
    // Today / Yesterday
    {
      date: daysAgo(0),
      description: "Razorpay Daily Merchant Batch Settlement - Retail Inflows",
      amount: 142500,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "NETBANKING",
      referenceNumber: "RZP-PAY-882019",
      counterparty: "Razorpay Gateway",
      accountId: razorpay.id,
    },
    {
      date: daysAgo(1),
      description: "Google Ads India Performance Max Campaign - October",
      amount: 45000,
      type: "EXPENSE",
      category: "Marketing & Growth",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "GOOG-ADS-9102",
      counterparty: "Google India Pvt Ltd",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(2),
      description: "Delhivery Logistics Freight & Express Courier Payout",
      amount: 28400,
      type: "EXPENSE",
      category: "Logistics",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "UTR2948102948",
      counterparty: "Delhivery Express",
      accountId: icici.id,
    },
    {
      date: daysAgo(3),
      description: "Tata Digital Enterprise Consulting - Milestone 2 Retainer",
      amount: 650000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "RTGS",
      referenceNumber: "RTGS-TATADIG-091",
      counterparty: "Tata Digital Limited",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(4),
      description: "WeWork Koramangala Bengaluru Monthly Office Rent",
      amount: 145000,
      type: "EXPENSE",
      category: "Office Rent",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "NEFT-WEWORK-104",
      counterparty: "WeWork India Management",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(5),
      description: "Singhania & Co CA Quarterly Audit & GST Filing Retainer",
      amount: 35000,
      type: "EXPENSE",
      category: "Legal & Accounting",
      status: "COMPLETED",
      paymentMethod: "UPI",
      referenceNumber: "UPI-SINGHANIA-39",
      counterparty: "Singhania & Co Chartered Accountants",
      accountId: icici.id,
    },
    // DUPLICATE TRANSACTION EXAMPLE
    {
      date: daysAgo(6),
      description: "Zoho One Annual Enterprise Renewal - 45 Seats",
      amount: 88000,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "ZOHO-INV-4412",
      counterparty: "Zoho Technologies Pvt Ltd",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(4), // Triggered 2 days later accidentally
      description: "Zoho One Annual Enterprise Renewal - 45 Seats (Duplicate Attempt)",
      amount: 88000,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "UNMATCHED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "ZOHO-INV-4412-DUP",
      counterparty: "Zoho Technologies Pvt Ltd",
      accountId: hdfc.id,
      isDuplicate: true,
      notes: "Flagged: Suspected duplicate transaction matching reference #ZOHO-INV-4412",
    },
    // UNUSUAL EXPENSE EXAMPLE
    {
      date: daysAgo(7),
      description: "AWS Cloud Data Transfer Out Egress Spike - Unusual Surge",
      amount: 295000,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "AWS-OCT-SPIKE-99",
      counterparty: "Amazon Web Services India",
      accountId: hdfc.id,
      isUnusual: true,
      notes: "Anomalous: 240% higher than average cloud monthly run-rate. Flagged for review.",
    },
    // Regular Cloud
    {
      date: daysAgo(10),
      description: "AWS Cloud Infrastructure Base Tier Services",
      amount: 118500,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "AWS-BASE-290",
      counterparty: "Amazon Web Services India",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(12),
      description: "Google Workspace & GitHub Enterprise Licences",
      amount: 34200,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "GITHUB-SUB-19",
      counterparty: "GitHub Inc / Google",
      accountId: icici.id,
    },
    // Outstanding Receivable (PENDING REVENUE)
    {
      date: daysAgo(8),
      description: "Mahindra Logistics Supply Chain Software Deployment Invoice",
      amount: 450000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "PENDING",
      paymentMethod: "RTGS",
      referenceNumber: "INV-MLOG-2024-08",
      counterparty: "Mahindra Logistics Ltd",
      accountId: hdfc.id,
      notes: "Outstanding Receivable - Due in 15 days",
    },
    // Outstanding Payable (PENDING EXPENSE)
    {
      date: daysAgo(9),
      description: "Dell India Edge Compute Server Hardware Lease",
      amount: 175000,
      type: "EXPENSE",
      category: "Miscellaneous",
      status: "PENDING",
      paymentMethod: "NEFT",
      referenceNumber: "PO-DELL-SERVERS-01",
      counterparty: "Dell Technologies India",
      accountId: hdfc.id,
      notes: "Outstanding Payable - Net 30 Terms",
    },
    // Taxes
    {
      date: daysAgo(15),
      description: "GST 3B Monthly Settlement Challan - State & Central",
      amount: 84200,
      type: "EXPENSE",
      category: "Taxes & Duties",
      status: "COMPLETED",
      paymentMethod: "NETBANKING",
      referenceNumber: "GSTIN-CHALLAN-29A-09",
      counterparty: "Goods and Services Tax Network",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(16),
      description: "TDS Challan 281 Payment - Salaries & Contractor 194J",
      amount: 42000,
      type: "EXPENSE",
      category: "Taxes & Duties",
      status: "COMPLETED",
      paymentMethod: "NETBANKING",
      referenceNumber: "IT-TDS-CHALLAN-281",
      counterparty: "Income Tax Department of India",
      accountId: hdfc.id,
    },
    // Payroll
    {
      date: daysAgo(18),
      description: "Monthly Employee Salaries & Stipends - Engineering & Sales",
      amount: 680000,
      type: "EXPENSE",
      category: "Payroll & Salaries",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "HDFC-CMS-SALARY-BATCH",
      counterparty: "BharatTech Payroll CMS",
      accountId: hdfc.id,
    },
    // UNMATCHED BANK DEBIT EXAMPLE
    {
      date: daysAgo(14),
      description: "Cheque Clearing #409218 - Unknown Beneficiary Unreconciled",
      amount: 45000,
      type: "EXPENSE",
      category: "Miscellaneous",
      status: "UNMATCHED",
      paymentMethod: "NETBANKING",
      referenceNumber: "CHQ-CLR-409218",
      counterparty: "Bank Clearing House",
      accountId: icici.id,
      notes: "Unmatched: Debit without corresponding invoice or approval voucher",
    },
    // Travel & Logistics
    {
      date: daysAgo(19),
      description: "Indigo Airlines Client Presentation Flight Tickets & Blusmart",
      amount: 26400,
      type: "EXPENSE",
      category: "Logistics",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "6E-TICKETS-018",
      counterparty: "InterGlobe Aviation Ltd",
      accountId: icici.id,
    },
    // Utilities
    {
      date: daysAgo(21),
      description: "BESCOM Commercial Power & Airtel Commercial High-Speed Fiber",
      amount: 18500,
      type: "EXPENSE",
      category: "Miscellaneous",
      status: "COMPLETED",
      paymentMethod: "UPI",
      referenceNumber: "UPI-BESCOM-AIRTEL",
      counterparty: "BESCOM & Bharti Airtel",
      accountId: pettyCash.id,
    },
    // Big Client Revenue Earlier This Month
    {
      date: daysAgo(22),
      description: "Infosys Tech Park Smart Campus Analytics SaaS Contract",
      amount: 385000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "RTGS",
      referenceNumber: "RTGS-INFY-29401",
      counterparty: "Infosys Limited",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(25),
      description: "Zomato Logistics Warehouse Micro-fulfillment API License",
      amount: 190000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "NEFT-ZOM-2024",
      counterparty: "Zomato Limited",
      accountId: hdfc.id,
    },
    // LAST MONTH (30 to 60 days ago)
    {
      date: daysAgo(35),
      description: "Swiggy Instamart Predictive Stocking Model Licensing",
      amount: 310000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "RTGS",
      referenceNumber: "RTGS-SWIGGY-110",
      counterparty: "Bundl Technologies Pvt Ltd",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(38),
      description: "Monthly Employee Salaries & Stipends - September",
      amount: 675000,
      type: "EXPENSE",
      category: "Payroll & Salaries",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "SALARY-SEP-CMS",
      counterparty: "BharatTech Payroll CMS",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(42),
      description: "WeWork Koramangala Bengaluru Monthly Rent - September",
      amount: 145000,
      type: "EXPENSE",
      category: "Office Rent",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "RENT-SEP-WW",
      counterparty: "WeWork India",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(45),
      description: "AWS Cloud Infrastructure - September Usage",
      amount: 112000,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "AWS-SEP-INV",
      counterparty: "Amazon Web Services India",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(48),
      description: "Reliance Retail Omnichannel Dashboard Integration",
      amount: 420000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "RTGS",
      referenceNumber: "RTGS-RELIANCE-981",
      counterparty: "Reliance Retail Ventures",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(52),
      description: "Meta Ads & LinkedIn B2B Thought Leadership Campaigns",
      amount: 52000,
      type: "EXPENSE",
      category: "Marketing & Growth",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "META-ADS-SEP",
      counterparty: "Meta Platforms Ireland",
      accountId: icici.id,
    },
    // 2-3 MONTHS AGO (60 to 90 days ago)
    {
      date: daysAgo(65),
      description: "Pune Auto Components Manufacturer ERP Integration",
      amount: 275000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "NEFT-PUNE-AUTO",
      counterparty: "Kalyani Precision Tech Ltd",
      accountId: icici.id,
    },
    {
      date: daysAgo(68),
      description: "Monthly Employee Salaries & Stipends - August",
      amount: 650000,
      type: "EXPENSE",
      category: "Payroll & Salaries",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "SALARY-AUG-CMS",
      counterparty: "BharatTech Payroll CMS",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(72),
      description: "WeWork Monthly Rent - August",
      amount: 145000,
      type: "EXPENSE",
      category: "Office Rent",
      status: "COMPLETED",
      paymentMethod: "NEFT",
      referenceNumber: "RENT-AUG-WW",
      counterparty: "WeWork India",
      accountId: hdfc.id,
    },
    {
      date: daysAgo(75),
      description: "Razorpay Inflow Subscriptions - August Batch",
      amount: 215000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "COMPLETED",
      paymentMethod: "NETBANKING",
      referenceNumber: "RZP-AUG-BATCH",
      counterparty: "Razorpay Gateway",
      accountId: razorpay.id,
    },
    {
      date: daysAgo(82),
      description: "AWS Cloud Infrastructure - August Usage",
      amount: 98000,
      type: "EXPENSE",
      category: "Cloud & Software",
      status: "COMPLETED",
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "AWS-AUG-INV",
      counterparty: "Amazon Web Services India",
      accountId: hdfc.id,
    },
    // Stage 4: Overdue Customer Payment & Scheduled Cash Flow Invoices
    {
      date: daysAgo(35),
      dueDate: daysAgo(10), // Overdue by 10 days!
      description: "Mahindra Logistics Enterprise Transport SaaS - Q2 Invoice",
      amount: 450000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "PENDING",
      paymentMethod: "NEFT",
      referenceNumber: "INV-MLOG-2024-08",
      counterparty: "Mahindra Logistics Limited",
      accountId: hdfc.id,
      notes: "Invoice overdue by 10 days. Follow up required.",
    },
    {
      date: daysAgo(5),
      dueDate: new Date(Date.now() + 15 * 86400000), // Due in 15 days
      description: "Titan Company Retail Cloud Integration Milestone 1",
      amount: 320000,
      type: "REVENUE",
      category: "Sales & Services",
      status: "PENDING",
      paymentMethod: "RTGS",
      referenceNumber: "INV-TITAN-001",
      counterparty: "Titan Company Limited",
      accountId: hdfc.id,
      notes: "Scheduled milestone payment due in 15 days.",
    },
    {
      date: daysAgo(2),
      dueDate: new Date(Date.now() + 8 * 86400000), // Due in 8 days
      description: "Advance Tax Q3 Statutory Installment",
      amount: 120000,
      type: "EXPENSE",
      category: "Taxes & Duties",
      status: "PENDING",
      paymentMethod: "NETBANKING",
      referenceNumber: "ADV-TAX-Q3",
      counterparty: "Income Tax Department",
      accountId: hdfc.id,
      notes: "Advance tax statutory liability due on 15th.",
    },
  ];

  // Insert all transactions
  const createdTransactions = [];
  for (const t of rawTransactions) {
    const item = await prisma.transaction.create({
      data: {
        businessId: business.id,
        accountId: t.accountId,
        date: t.date,
        dueDate: (t as any).dueDate || null,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        status: t.status,
        paymentMethod: t.paymentMethod,
        referenceNumber: t.referenceNumber,
        counterparty: t.counterparty,
        notes: (t as any).notes || null,
        isUnusual: (t as any).isUnusual || false,
        isDuplicate: (t as any).isDuplicate || false,
        isDemo: true,
      },
    });
    createdTransactions.push(item);
  }

  // 6. Create Reconciliation Records for matched & unmatched
  for (const tx of createdTransactions) {
    if (tx.status === "COMPLETED") {
      await prisma.reconciliationRecord.create({
        data: {
          businessId: business.id,
          transactionId: tx.id,
          bankStatementRef: `STMT-${tx.referenceNumber || tx.id.slice(-6)}`,
          matchConfidence: 0.98,
          matchStatus: "MATCHED",
          notes: "Auto-reconciled via direct Open Banking API match",
        },
      });
    } else if (tx.isDuplicate) {
      await prisma.reconciliationRecord.create({
        data: {
          businessId: business.id,
          transactionId: tx.id,
          bankStatementRef: `SUSPECT-${tx.id.slice(-6)}`,
          matchConfidence: 0.35,
          matchStatus: "DUPLICATE_SUSPECT",
          notes: "Duplicate payment detected. Pending vendor credit note or reversal.",
        },
      });
    } else if (tx.status === "UNMATCHED") {
      await prisma.reconciliationRecord.create({
        data: {
          businessId: business.id,
          transactionId: tx.id,
          bankStatementRef: `UNMATCHED-${tx.id.slice(-6)}`,
          matchConfidence: 0.2,
          matchStatus: "UNMATCHED",
          notes: "No corresponding counterparty invoice located in ERP.",
        },
      });
    }
  }

  // 7. Create Financial Risk Alerts
  await prisma.riskAlert.createMany({
    data: [
      {
        businessId: business.id,
        title: "Duplicate Payment Suspected",
        description: "Payment of ₹88,000 to Zoho Technologies appears twice within 48 hours with identical invoice references.",
        severity: "HIGH",
        category: "DUPLICATE_PAYMENT",
        status: "ACTIVE",
      },
      {
        businessId: business.id,
        title: "Unusual Cloud Expense Spike",
        description: "AWS Cloud Data Transfer surged by 240% (₹2,95,000) over normal baseline due to uncompressed cross-region replication.",
        severity: "HIGH",
        category: "UNUSUAL_EXPENSE",
        status: "ACTIVE",
      },
      {
        businessId: business.id,
        title: "Upcoming GST 3B Remittance",
        description: "Estimated ₹84,200 GST liability due on 20th. Ensure adequate liquidity in primary HDFC Current Account.",
        severity: "MEDIUM",
        category: "TAX_COMPLIANCE",
        status: "ACTIVE",
      },
      {
        businessId: business.id,
        title: "Unreconciled Bank Debit Tagging",
        description: "Cheque Clearing #409218 for ₹45,000 requires voucher attachment to avoid statutory compliance audit flags.",
        severity: "LOW",
        category: "VENDOR_ANOMALY",
        status: "ACTIVE",
      },
    ],
  });

  // 8. Create AI Recommendations
  await prisma.aIRecommendation.createMany({
    data: [
      {
        businessId: business.id,
        title: "Convert AWS Compute to 1-Yr Savings Plan",
        description: "Your 4 primary EC2 instances have maintained 99.4% uptime. Switching from On-Demand to a 1-year Compute Savings Plan will save ₹38,000/month.",
        category: "CASH_OPTIMIZATION",
        impact: "HIGH",
        estimatedSavings: 456000,
        actionType: "RENEGOTIATE",
        status: "PENDING",
      },
      {
        businessId: business.id,
        title: "Expedite Mahindra Logistics Receivables",
        description: "Invoice INV-MLOG-2024-08 for ₹4,50,000 is pending. Sending an automated GST E-invoice payment link via WhatsApp usually reduces DSO by 6.4 days.",
        category: "WORKING_CAPITAL",
        impact: "HIGH",
        estimatedSavings: 450000,
        actionType: "EXPEDITE_COLLECTION",
        status: "PENDING",
      },
      {
        businessId: business.id,
        title: "Audit Inactive Zoho Enterprise Licenses",
        description: "12 of 45 user licenses have been inactive for >60 days. Downgrading unused seats saves ₹23,400 annually.",
        category: "SUBSCRIPTION_AUDIT",
        impact: "MEDIUM",
        estimatedSavings: 23400,
        actionType: "CANCEL_SUB",
        status: "PENDING",
      },
      {
        businessId: business.id,
        title: "Claim Input Tax Credit (ITC) for ₹34,200",
        description: "3 supplier invoices lack valid GSTR-2B filing reflections. Follow up with vendors before the 11th to avoid ITC lapse under Section 16(4).",
        category: "TAX_SAVING",
        impact: "MEDIUM",
        estimatedSavings: 34200,
        actionType: "INVESTIGATE",
        status: "PENDING",
      },
    ],
  });

  // 9. Create Audit Log
  if (demoUser?.id) {
    await prisma.auditLog.create({
      data: {
        businessId: business.id,
        userId: demoUser?.id || null,
        action: "DEMO_DATA_LOAD",
        entityType: "BUSINESS",
        entityId: business.id,
        details: "Populated complete verified Indian enterprise financial dataset with transactions, risk alerts, and accounts.",
      },
    });
  }

  // 10. Create Forecast records for next 3 months
  const nextMonth1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth2 = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const nextMonth3 = new Date(now.getFullYear(), now.getMonth() + 3, 1);

  await prisma.forecast.createMany({
    data: [
      {
        businessId: business.id,
        forecastDate: nextMonth1,
        metric: "REVENUE",
        predictedValue: 1250000,
        lowerBound: 1100000,
        upperBound: 1420000,
        confidenceScore: 0.94,
      },
      {
        businessId: business.id,
        forecastDate: nextMonth2,
        metric: "REVENUE",
        predictedValue: 1380000,
        lowerBound: 1200000,
        upperBound: 1560000,
        confidenceScore: 0.91,
      },
      {
        businessId: business.id,
        forecastDate: nextMonth3,
        metric: "REVENUE",
        predictedValue: 1520000,
        lowerBound: 1310000,
        upperBound: 1750000,
        confidenceScore: 0.88,
      },
    ],
  });

  return {
    success: true,
    businessId: business.id,
    businessName: business.name,
    userId: demoUser?.id || null,
    transactionCount: rawTransactions.length,
    accountsCount: 4,
  };
}
